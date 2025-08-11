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

app.listen(PORT, () => {
  console.log(`AI server listening on http://localhost:${PORT}`);
});
