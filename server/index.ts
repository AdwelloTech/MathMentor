import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";

// Types
interface GenerateAIRequest {
  subject: string;
  gradeLevel?: string;
  numQuestions?: number;
  difficulty?: "easy" | "medium" | "hard";
  questionType?: "multiple_choice" | "true_false";
  title?: string;
}

interface GenerateAIFlashcardsRequest {
  subject: string;
  gradeLevel: string;
  numCards?: number;
  title?: string;
  difficulty?: "easy" | "medium" | "hard";
}

interface AIAnswer {
  answer_text: string;
  is_correct: boolean;
}

interface AIQuestion {
  question_text: string;
  question_type: "multiple_choice" | "true_false";
  points: number;
  answers: AIAnswer[];
}

interface AIResponse {
  questions: AIQuestion[];
}

interface AIFlashcard {
  front_text: string;
  back_text: string;
}

interface AIFlashcardsResponse {
  cards: AIFlashcard[];
}

interface GeneratedQuestion extends AIQuestion {
  is_ai_generated: true;
  ai_status: "pending";
  ai_metadata: {
    subject: string;
    gradeLevel?: string;
    difficulty: string;
    provider: string;
    model: string;
  };
}

// Load .env.local first if present, otherwise fallback to .env
try {
  const root = process.cwd();
  const localPath = path.join(root, ".env.local");
  const envPath = path.join(root, ".env");
  if (fs.existsSync(localPath)) {
    dotenv.config({ path: localPath });
  } else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }
} catch {}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Generate AI questions via OpenRouter Gemma 3n 2B
app.post("/api/ai/generate", async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
    }

    const {
      subject,
      gradeLevel,
      numQuestions = 4,
      difficulty = "medium",
      questionType = "multiple_choice",
      title,
    }: GenerateAIRequest = req.body || {};

    if (!subject) {
      return res.status(400).json({ error: "subject is required" });
    }

    // Some providers for Gemma free disallow system/developer messages.
    // Use a single user message with all instructions inline.
    const contextLine = title ? `Quiz title: ${title}.` : "";

    // Generate different prompts based on question type
    let userPrompt: string;
    if (questionType === "multiple_choice") {
      userPrompt = `You are an assistant that generates clear, unambiguous ${questionType} quiz questions with exactly 4 options and one correct answer. Return ONLY valid JSON that matches the schema: {"questions":[{"question_text":string,"question_type":"multiple_choice","points":number,"answers":[{"answer_text":string,"is_correct":boolean},{...4 total}]}]}. Do not include any prose before or after the JSON.

IMPORTANT: All answer options must be meaningful and complete. Do NOT use placeholder values like "undefined", "empty", "option 1", "answer 1", or similar generic text. Each answer should be a proper, substantive response to the question.

${contextLine} Create ${numQuestions} ${difficulty} ${questionType} questions for subject: ${subject}${
        gradeLevel ? `, grade: ${gradeLevel}` : ""
      }. Ensure exactly one correct answer per question, and set points to 10 by default.`;
    } else if (questionType === "true_false") {
      userPrompt = `You are an assistant that generates clear, unambiguous ${questionType} quiz questions with exactly 2 options (True and False) and one correct answer. Return ONLY valid JSON that matches the schema: {"questions":[{"question_text":string,"question_type":"true_false","points":number,"answers":[{"answer_text":"True","is_correct":boolean},{"answer_text":"False","is_correct":boolean}]}]}. Do not include any prose before or after the JSON.

${contextLine} Create ${numQuestions} ${difficulty} ${questionType} questions for subject: ${subject}${
        gradeLevel ? `, grade: ${gradeLevel}` : ""
      }. Ensure exactly one correct answer per question, and set points to 10 by default.`;
    } else {
      userPrompt = `You are an assistant that generates clear, unambiguous multiple choice quiz questions with exactly 4 options and one correct answer. Return ONLY valid JSON that matches the schema: {"questions":[{"question_text":string,"question_type":"multiple_choice","points":number,"answers":[{"answer_text":string,"is_correct":boolean},{...4 total}]}]}. Do not include any prose before or after the JSON.

IMPORTANT: All answer options must be meaningful and complete. Do NOT use placeholder values like "undefined", "empty", "option 1", "answer 1", or similar generic text. Each answer should be a proper, substantive response to the question.

${contextLine} Create ${numQuestions} ${difficulty} multiple choice questions for subject: ${subject}${
        gradeLevel ? `, grade: ${gradeLevel}` : ""
      }. Ensure exactly one correct answer per question, and set points to 10 by default.`;
    }

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          req.headers["x-forwarded-host"] || req.headers.host || "localhost",
        "X-Title": "MathMentor",
      },
      body: JSON.stringify({
        model: "google/gemma-3n-e2b-it:free",
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.4,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return res
        .status(resp.status || 502)
        .json({ error: "OpenRouter error", details: errText });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || "";

    // Attempt to parse JSON from the model output
    let parsed: AIResponse;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON block if wrapped in code fences
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse JSON from AI response");
      }
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
      return res
        .status(500)
        .json({ error: "Malformed AI response", raw: content });
    }

    // Sanitize shape and enforce correct answer structure based on question type
    const questions: GeneratedQuestion[] = parsed.questions
      .slice(0, numQuestions)
      .map((q, idx) => {
        let answers = Array.isArray(q.answers) ? q.answers : [];

        if (questionType === "multiple_choice") {
          // Ensure exactly 4 options by padding with plausible distractors
          while (answers.length < 4) {
            answers.push({
              answer_text: `Option ${answers.length + 1}`,
              is_correct: false,
            });
          }
          // Ensure one correct answer
          if (!answers.some((a) => a.is_correct)) {
            answers[0].is_correct = true;
          } else {
            // If multiple marked correct, keep the first correct only
            let found = false;
            for (const a of answers) {
              if (a.is_correct) {
                if (found) a.is_correct = false;
                else found = true;
              }
            }
          }
        } else if (questionType === "true_false") {
          // Ensure exactly 2 options: True and False
          if (answers.length === 0) {
            answers = [
              { answer_text: "True", is_correct: true },
              { answer_text: "False", is_correct: false },
            ];
          } else if (answers.length === 1) {
            const firstAnswer = answers[0];
            if (firstAnswer.answer_text.toLowerCase().includes("true")) {
              answers = [
                { answer_text: "True", is_correct: firstAnswer.is_correct },
                { answer_text: "False", is_correct: !firstAnswer.is_correct },
              ];
            } else {
              answers = [
                { answer_text: "True", is_correct: !firstAnswer.is_correct },
                { answer_text: "False", is_correct: firstAnswer.is_correct },
              ];
            }
          } else {
            // Ensure exactly 2 options and one correct answer
            answers = answers.slice(0, 2);
            if (!answers.some((a) => a.is_correct)) {
              answers[0].is_correct = true;
            }
          }
        }

        return {
          question_text: String(q.question_text || `Question ${idx + 1}`),
          question_type: questionType,
          points: Number.isFinite(q.points) ? Number(q.points) : 10,
          answers: answers.map((a, i) => ({
            answer_text: String(a.answer_text || `Option ${i + 1}`),
            is_correct: Boolean(a.is_correct),
          })),
          is_ai_generated: true,
          ai_status: "pending",
          ai_metadata: {
            subject,
            gradeLevel,
            difficulty,
            provider: "openrouter",
            model: "google/gemma-3n-e2b-it:free",
          },
        };
      });

    res.json({ questions });
  } catch (err) {
    console.error("AI generate error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Generate AI flashcards via OpenRouter Gemma 3n 2B
app.post("/api/ai/flashcards", async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
    }

    const {
      subject,
      gradeLevel,
      numCards = 10,
      title,
      difficulty = "medium",
    }: GenerateAIFlashcardsRequest = req.body || {};

    if (!subject) {
      return res.status(400).json({ error: "subject is required" });
    }

    if (!gradeLevel) {
      return res.status(400).json({ error: "gradeLevel is required" });
    }

    const contextLine = title ? `Set title: ${title}.` : "";

    const userPrompt = `You are an assistant that generates concise, high‑quality study flashcards for mathematics as term–definition pairs.

Return ONLY valid JSON matching exactly this format:
{"cards":[{"front_text":"term or question","back_text":"definition or answer"}]}

IMPORTANT: 
- Return ONLY the JSON object, no other text before or after
- Use double quotes for all strings
- Ensure proper JSON syntax with no trailing commas
- Each card must have exactly "front_text" and "back_text" fields

Context:
- Subject: Mathematics
- Grade: ${gradeLevel}
- Difficulty: ${difficulty}
${contextLine}

Requirements:
- Generate exactly ${numCards} mathematics flashcards.
- front_text: a short mathematical term, concept, or question (5–12 words) at a(n) ${difficulty} difficulty level.
- back_text: a clear, complete definition, formula, or solution with explanation and answer separated.
- Format back_text as: "Explanation: [step-by-step explanation] Answer: [final answer]"
- For formulas: "Formula: [formula] Use: [when to use it]"
- For definitions: "Definition: [clear definition] Example: [simple example]"
- No placeholders or generic text like "term 1", "definition 1", "undefined".
- Use age-appropriate language for ${gradeLevel} students.
- Focus on mathematical concepts, formulas, definitions, problem-solving steps, and key mathematical facts.
- Include: formulas, definitions, mathematical terms, problem-solving strategies, geometric concepts, algebraic rules, arithmetic operations, measurement units, and mathematical properties.
- Ensure accuracy and educational value for mathematics learning.`;

    let content = "";
    try {
      const resp = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer":
              req.headers["x-forwarded-host"] ||
              req.headers.host ||
              "localhost",
            "X-Title": "MathMentor",
          },
          body: JSON.stringify({
            model: "google/gemma-3n-e2b-it:free",
            messages: [{ role: "user", content: userPrompt }],
            temperature: 0.4,
          }),
        }
      );

      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        console.error("OpenRouter API error:", resp.status, errText);
        throw new Error(`OpenRouter API error: ${resp.status}`);
      }

      const data = await resp.json();
      content = data?.choices?.[0]?.message?.content || "";

      if (!content) {
        throw new Error("Empty response from AI model");
      }
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      // Return fallback cards instead of crashing
      const fallbackCards: AIFlashcard[] = [
        {
          front_text: "What is a variable?",
          back_text:
            "Definition: A symbol that represents an unknown value. Example: In x + 5 = 10, x is a variable.",
        },
        {
          front_text: "What is an equation?",
          back_text:
            "Definition: A mathematical statement showing two expressions are equal. Example: 2x + 3 = 7",
        },
        {
          front_text: "What is the order of operations?",
          back_text:
            "Formula: PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction). Use: When solving multi-step math problems.",
        },
        {
          front_text: "What is a fraction?",
          back_text:
            "Definition: A number representing parts of a whole. Example: 3/4 means 3 parts out of 4 total parts.",
        },
        {
          front_text: "What is a decimal?",
          back_text:
            "Definition: A number with a decimal point showing parts of a whole. Example: 0.5 represents half.",
        },
      ];

      return res.json({
        cards: fallbackCards.slice(0, Math.min(numCards, fallbackCards.length)),
        note: "AI service unavailable, showing fallback cards",
      });
    }

    // Attempt to parse JSON from the model output
    let parsed: AIFlashcardsResponse | undefined;

    // Clean up common wrappers (markdown code fences)
    let contentForParse = (content || "").trim();
    if (contentForParse.startsWith("```")) {
      // Remove opening fence like ```json or ```
      const openFence = contentForParse.match(/^```[a-zA-Z]*\s*\n?/);
      if (openFence) {
        contentForParse = contentForParse.slice(openFence[0].length);
      }
      // Remove trailing closing fence ``` (last occurrence)
      const lastFenceIdx = contentForParse.lastIndexOf("```");
      if (lastFenceIdx !== -1) {
        contentForParse = contentForParse.slice(0, lastFenceIdx);
      }
      contentForParse = contentForParse.trim();
    }

    try {
      parsed = JSON.parse(contentForParse);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw AI response:", content);

      // Try to extract JSON object if not parsed yet
      if (!parsed) {
        const jsonMatch = contentForParse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (jsonMatchError) {
            console.error("JSON match parse error:", jsonMatchError);
          }
        }
      }

      // If still no valid JSON, try to fix common issues
      if (!parsed) {
        try {
          // Try to fix common JSON issues
          let fixedContent = contentForParse
            .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
            .replace(/,\s*}/g, "}") // Remove trailing commas in objects
            .replace(/}\s*,\s*]/g, "}]") // Fix array ending
            .replace(/}\s*,\s*}/g, "}}") // Fix object ending
            .replace(/]\s*,\s*}/g, "]}") // Fix object ending after array
            .replace(/]\s*,\s*]/g, "]]") // Fix array ending after array
            .replace(/}\s*,\s*{/g, "},{") // Fix object separation
            .replace(/]\s*,\s*{/g, "},{") // Fix object after array
            .replace(/}\s*,\s*\[/g, "},["); // Fix array after object

          parsed = JSON.parse(fixedContent);
        } catch (fixError) {
          console.error("JSON fix attempt failed:", fixError);
          // Return fallback instead of throwing
          const fallbackCards: AIFlashcard[] = [
            {
              front_text: "What is a variable?",
              back_text:
                "Definition: A symbol that represents an unknown value. Example: In x + 5 = 10, x is a variable.",
            },
            {
              front_text: "What is an equation?",
              back_text:
                "Definition: A mathematical statement showing two expressions are equal. Example: 2x + 3 = 7",
            },
            {
              front_text: "What is the order of operations?",
              back_text:
                "Formula: PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction). Use: When solving multi-step math problems.",
            },
            {
              front_text: "What is a fraction?",
              back_text:
                "Definition: A number representing parts of a whole. Example: 3/4 means 3 parts out of 4 total parts.",
            },
            {
              front_text: "What is a decimal?",
              back_text:
                "Definition: A number with a decimal point showing parts of a whole. Example: 0.5 represents half.",
            },
          ];

          return res.json({
            cards: fallbackCards.slice(
              0,
              Math.min(numCards, fallbackCards.length)
            ),
            note: "AI response was malformed, showing fallback cards",
          });
        }
      }
    }

    if (!parsed || !Array.isArray(parsed.cards)) {
      console.error("Malformed AI response - missing cards array:", parsed);
      console.error("Raw content:", content);

      // Return a fallback response instead of error
      const fallbackCards: AIFlashcard[] = [
        {
          front_text: "What is a variable?",
          back_text:
            "Definition: A symbol that represents an unknown value. Example: In x + 5 = 10, x is a variable.",
        },
        {
          front_text: "What is an equation?",
          back_text:
            "Definition: A mathematical statement showing two expressions are equal. Example: 2x + 3 = 7",
        },
        {
          front_text: "What is the order of operations?",
          back_text:
            "Formula: PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction). Use: When solving multi-step math problems.",
        },
        {
          front_text: "What is a fraction?",
          back_text:
            "Definition: A number representing parts of a whole. Example: 3/4 means 3 parts out of 4 total parts.",
        },
        {
          front_text: "What is a decimal?",
          back_text:
            "Definition: A number with a decimal point showing parts of a whole. Example: 0.5 represents half.",
        },
      ];

      return res.json({
        cards: fallbackCards.slice(0, Math.min(numCards, fallbackCards.length)),
        note: "AI response was malformed, showing fallback cards",
      });
    }

    // Sanitize and validate flashcards
    const cards: AIFlashcard[] = parsed.cards
      .slice(0, numCards)
      .map((card, idx) => ({
        front_text: String(card.front_text || `Term ${idx + 1}`),
        back_text: String(card.back_text || `Definition ${idx + 1}`),
      }))
      .filter(
        (card) =>
          card.front_text.trim() &&
          card.back_text.trim() &&
          !card.front_text.includes("undefined") &&
          !card.back_text.includes("undefined")
      );

    res.json({ cards });
  } catch (err) {
    console.error("AI flashcards error:", err);
    console.error("Request body:", req.body);

    // Always return a response, never let the server crash
    const fallbackCards: AIFlashcard[] = [
      {
        front_text: "What is a variable?",
        back_text:
          "Definition: A symbol that represents an unknown value. Example: In x + 5 = 10, x is a variable.",
      },
      {
        front_text: "What is an equation?",
        back_text:
          "Definition: A mathematical statement showing two expressions are equal. Example: 2x + 3 = 7",
      },
      {
        front_text: "What is the order of operations?",
        back_text:
          "Formula: PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction). Use: When solving multi-step math problems.",
      },
      {
        front_text: "What is a fraction?",
        back_text:
          "Definition: A number representing parts of a whole. Example: 3/4 means 3 parts out of 4 total parts.",
      },
      {
        front_text: "What is a decimal?",
        back_text:
          "Definition: A number with a decimal point showing parts of a whole. Example: 0.5 represents half.",
      },
    ];

    res.status(200).json({
      cards: fallbackCards.slice(0, 5),
      note: "Server error occurred, showing fallback cards",
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI server listening on http://localhost:${PORT}`);
});
