import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
// PDF processing temporarily simplified
import multer from "multer";

// PDF text extraction using pdf.js-extract (Node.js optimized)
async function extractPdfTextFromBase64(
  pdfBase64: string
): Promise<{ text: string; truncated: boolean }> {
  try {
    const buffer = Buffer.from(pdfBase64, "base64");

    // Dynamic import of pdf.js-extract
    const { PDFExtract } = await import("pdf.js-extract");
    const pdfExtract = new PDFExtract();

    // Extract text directly from PDF buffer
    const data = await pdfExtract.extractBuffer(buffer);
    let extractedText = "";

    // Combine text from all pages
    if (data.pages && data.pages.length > 0) {
      extractedText = data.pages
        .map(
          (page: any) =>
            page.content?.map((item: any) => item.str).join(" ") || ""
        )
        .join("\n");
    }

    // Normalize whitespace and remove odd characters
    extractedText = extractedText
      .replace(/\u0000/g, " ")
      .replace(/[\t\r]+/g, " ");

    // No character limit - use full PDF content
    const text = extractedText;

    return { text: text.trim(), truncated: false };
  } catch (err) {
    console.error("PDF text extraction failed:", err);
    return { text: "", truncated: false };
  }
}

// Types
interface GenerateAIRequest {
  subject: string;
  gradeLevel?: string;
  numQuestions?: number;
  difficulty?: "easy" | "medium" | "hard";
  questionType?: "multiple_choice" | "true_false" | "short_answer";
  title?: string;
  pdfText?: string;
}

interface GenerateAIFlashcardsRequest {
  subject: string;
  gradeLevel: string;
  numCards?: number;
  title?: string;
  difficulty?: "easy" | "medium" | "hard";
  pdfText?: string;
}

interface AIAnswer {
  answer_text: string;
  is_correct: boolean;
}

interface AIQuestion {
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer";
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
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));

// File upload (PDF) - in memory, support up to 10 files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10, // Allow up to 10 files
  },
});

// Health
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Extract text from uploaded PDFs (used as AI context)
console.log("📄 Registering PDF upload route with multer middleware");

app.post(
  "/api/ai/pdf/upload",
  upload.array("files", 10), // Allow up to 10 files
  async (req: Request, res: Response) => {
    console.log("📄 PDF upload request received");
    console.log("📄 Request headers:", req.headers);
    console.log("📄 Request files:", req.files);

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Missing PDF files" });
      }

      const files = req.files as Express.Multer.File[];

      if (files.length > 10) {
        return res.status(400).json({ error: "Maximum 10 PDF files allowed" });
      }

      const pdfData = [];

      for (const file of files) {
        console.log("📄 PDF Upload Details:");
        console.log("- File name:", file.originalname);
        console.log("- File size:", file.size, "bytes");
        console.log("- MIME type:", file.mimetype);

        // Convert PDF to base64 for sending directly to DeepSeek R1
        const pdfBase64 = file.buffer.toString("base64");

        console.log("📄 PDF prepared for AI model:");
        console.log("- Base64 length:", pdfBase64.length, "characters");

        pdfData.push({
          pdfBase64,
          fileName: file.originalname,
          fileSize: file.size,
        });
      }

      res.json({
        pdfs: pdfData,
        totalFiles: pdfData.length,
      });
    } catch (err) {
      console.error("PDF extract error", err);
      res.status(500).json({ error: "Failed to extract PDF text" });
    }
  }
);

// Generate AI questions via OpenRouter (DeepSeek R1)
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
      pdfText,
      pdfBase64,
      pdfs,
    }: GenerateAIRequest & {
      pdfBase64?: string;
      pdfs?: Array<{ pdfBase64: string; fileName: string; fileSize: number }>;
    } = req.body || {};

    if (!subject) {
      return res.status(400).json({ error: "subject is required" });
    }

    // Build context lines inline (single user message)
    const contextLine = title ? `Quiz title: ${title}.` : "";
    // If we only have base64, extract text on the server
    let effectivePdfText: string | undefined = pdfText;
    let allPdfTexts: string[] = [];

    // Handle single PDF (backward compatibility)
    if (!effectivePdfText && pdfBase64) {
      const extracted = await extractPdfTextFromBase64(pdfBase64);
      effectivePdfText = extracted.text || undefined;
      if (effectivePdfText) {
        allPdfTexts.push(effectivePdfText);
      }
    }

    // Handle multiple PDFs
    if (pdfs && pdfs.length > 0) {
      console.log(`🔍 Processing ${pdfs.length} PDFs for text extraction...`);
      for (const pdf of pdfs) {
        try {
          console.log(`🔍 Extracting text from ${pdf.fileName}...`);
          const extracted = await extractPdfTextFromBase64(pdf.pdfBase64);
          console.log(`🔍 Extraction result for ${pdf.fileName}:`, {
            success: !!extracted.text,
            textLength: extracted.text?.length || 0,
            truncated: extracted.truncated,
          });
          if (extracted.text) {
            allPdfTexts.push(extracted.text);
            console.log(
              `✅ Extracted PDF text from ${pdf.fileName}, length:`,
              extracted.text.length
            );
          } else {
            console.log(`❌ No text extracted from ${pdf.fileName}`);
          }
        } catch (err) {
          console.error(`❌ Failed to extract text from ${pdf.fileName}:`, err);
        }
      }
    }

    // Combine all PDF texts
    if (allPdfTexts.length > 0) {
      effectivePdfText = allPdfTexts.join("\n\n---\n\n");
      console.log(
        "- Total extracted PDF text length:",
        effectivePdfText.length
      );
      if (effectivePdfText) {
        const preview = effectivePdfText.replace(/\s+/g, " ").slice(0, 200);
        console.log("- Combined PDF text preview (first 200 chars):", preview);
      }
    }

    const pdfContext =
      effectivePdfText && effectivePdfText.trim()
        ? `\n\nContext - Syllabus Excerpts:\n"""\n${effectivePdfText.trim()}\n"""\nUse this context to align style, terminology, and scope. Prefer this context over generic knowledge when possible.`
        : "";

    // Log what context is being used
    console.log("🧠 AI Quiz Generation Request:");
    console.log("- Subject:", subject);
    console.log("- Grade Level:", gradeLevel);
    console.log("- Number of Questions:", numQuestions);
    console.log("- Difficulty:", difficulty);
    console.log("- Question Type:", questionType);
    console.log("- Single PDF Base64 provided:", !!pdfBase64);
    console.log("- Multiple PDFs provided:", pdfs ? pdfs.length : 0);
    console.log("- PDF text used as context:", !!effectivePdfText);
    if (pdfBase64)
      console.log(
        "- Single PDF Base64 length:",
        pdfBase64.length,
        "characters"
      );
    if (pdfs && pdfs.length > 0) {
      console.log(
        `- Multiple PDFs total size: ${pdfs.reduce(
          (sum, pdf) => sum + pdf.pdfBase64.length,
          0
        )} characters`
      );
    }

    let userPrompt: string;
    if (questionType === "multiple_choice") {
      userPrompt = `You are an assistant that generates clear, unambiguous ${questionType} quiz questions with exactly 4 options and one correct answer. Return ONLY valid JSON that matches the schema: {"questions":[{"question_text":string,"question_type":"multiple_choice","points":number,"answers":[{"answer_text":string,"is_correct":boolean},{...4 total}]}]}. Do not include any prose before or after the JSON.

IMPORTANT: All answer options must be meaningful and complete. Do NOT use placeholder values like "undefined", "empty", "option 1", "answer 1", or similar generic text. Each answer should be a proper, substantive response to the question.

${contextLine} Create ${numQuestions} ${difficulty} ${questionType} questions for subject: ${subject}${
        gradeLevel ? `, grade: ${gradeLevel}` : ""
      }. Ensure exactly one correct answer per question, and set points to 10 by default.${pdfContext}`;
    } else if (questionType === "true_false") {
      userPrompt = `You are an assistant that generates clear, unambiguous ${questionType} quiz questions with exactly 2 options (True and False) and one correct answer. Return ONLY valid JSON that matches the schema: {"questions":[{"question_text":string,"question_type":"true_false","points":number,"answers":[{"answer_text":"True","is_correct":boolean},{"answer_text":"False","is_correct":boolean}]}]}. Do not include any prose before or after the JSON.

${contextLine} Create ${numQuestions} ${difficulty} ${questionType} questions for subject: ${subject}${
        gradeLevel ? `, grade: ${gradeLevel}` : ""
      }. Ensure exactly one correct answer per question, and set points to 10 by default.${pdfContext}`;
    } else {
      userPrompt = `You are an assistant that generates clear, unambiguous multiple choice quiz questions with exactly 4 options and one correct answer. Return ONLY valid JSON that matches the schema: {"questions":[{"question_text":string,"question_type":"multiple_choice","points":number,"answers":[{"answer_text":string,"is_correct":boolean},{...4 total}]}]}. Do not include any prose before or after the JSON.

IMPORTANT: All answer options must be meaningful and complete. Do NOT use placeholder values like "undefined", "empty", "option 1", "answer 1", or similar generic text. Each answer should be a proper, substantive response to the question.

${contextLine} Create ${numQuestions} ${difficulty} multiple choice questions for subject: ${subject}${
        gradeLevel ? `, grade: ${gradeLevel}` : ""
      }. Ensure exactly one correct answer per question, and set points to 10 by default.${pdfContext}`;
    }

    const hostValue = String(
      (req.headers["x-forwarded-host"] as string | string[] | undefined) ??
        req.headers.host ??
        "localhost:3000"
    );
    const httpReferer = hostValue.startsWith("http")
      ? hostValue
      : `http://${hostValue}`;

    // Always use DeepSeek R1 and pass extracted PDF text as context
    const modelId = "deepseek/deepseek-r1:free";
    console.log("- Using model:", modelId, "(text-only, PDF text as context)");

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": httpReferer,
        "X-Title": "MathMentor",
      },
      body: JSON.stringify({
        model: modelId,
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
    const rawContent = data?.choices?.[0]?.message?.content || "";
    const content = String(rawContent)
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();

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
        } else if (questionType === "short_answer") {
          // Short answer questions don't have predefined options
          answers = [];
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
            model: modelId,
          },
        };
      });

    res.json({ questions });
  } catch (err) {
    console.error("AI generate error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Generate AI flashcards via OpenRouter (DeepSeek R1)
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
      pdfText,
      pdfBase64,
      pdfs,
    }: GenerateAIFlashcardsRequest & {
      pdfBase64?: string;
      pdfs?: Array<{ pdfBase64: string; fileName: string; fileSize: number }>;
    } = req.body || {};

    if (!subject) {
      return res.status(400).json({ error: "subject is required" });
    }

    if (!gradeLevel) {
      return res.status(400).json({ error: "gradeLevel is required" });
    }

    const contextLine = title ? `Set title: ${title}.` : "";
    // If we only have base64, extract text on the server
    let effectivePdfText: string | undefined = pdfText;
    let allPdfTexts: string[] = [];

    // Handle single PDF (backward compatibility)
    if (!effectivePdfText && pdfBase64) {
      const extracted = await extractPdfTextFromBase64(pdfBase64);
      effectivePdfText = extracted.text || undefined;
      if (effectivePdfText) {
        allPdfTexts.push(effectivePdfText);
      }
    }

    // Handle multiple PDFs
    if (pdfs && pdfs.length > 0) {
      console.log(`🔍 Processing ${pdfs.length} PDFs for text extraction...`);
      for (const pdf of pdfs) {
        try {
          console.log(`🔍 Extracting text from ${pdf.fileName}...`);
          const extracted = await extractPdfTextFromBase64(pdf.pdfBase64);
          console.log(`🔍 Extraction result for ${pdf.fileName}:`, {
            success: !!extracted.text,
            textLength: extracted.text?.length || 0,
            truncated: extracted.truncated,
          });
          if (extracted.text) {
            allPdfTexts.push(extracted.text);
            console.log(
              `✅ Extracted PDF text from ${pdf.fileName}, length:`,
              extracted.text.length
            );
          } else {
            console.log(`❌ No text extracted from ${pdf.fileName}`);
          }
        } catch (err) {
          console.error(`❌ Failed to extract text from ${pdf.fileName}:`, err);
        }
      }
    }

    // Combine all PDF texts
    if (allPdfTexts.length > 0) {
      effectivePdfText = allPdfTexts.join("\n\n---\n\n");
      console.log(
        "- Total extracted PDF text length:",
        effectivePdfText.length
      );
      if (effectivePdfText) {
        const preview = effectivePdfText.replace(/\s+/g, " ").slice(0, 200);
        console.log("- Combined PDF text preview (first 200 chars):", preview);
      }
    }

    const pdfContext =
      effectivePdfText && effectivePdfText.trim()
        ? `\n\nContext - Syllabus Excerpts:\n"""\n${effectivePdfText.trim()}\n"""\nUse this context to align style, terminology, and scope. Prefer this context over generic knowledge when possible.`
        : "";

    // Log what context is being used
    console.log("🧠 AI Flashcard Generation Request:");
    console.log("- Subject:", subject);
    console.log("- Grade Level:", gradeLevel);
    console.log("- Number of Cards:", numCards);
    console.log("- Difficulty:", difficulty);
    console.log("- Single PDF Base64 provided:", !!pdfBase64);
    console.log("- Multiple PDFs provided:", pdfs ? pdfs.length : 0);
    console.log("- PDF text used as context:", !!effectivePdfText);
    if (pdfBase64)
      console.log(
        "- Single PDF Base64 length:",
        pdfBase64.length,
        "characters"
      );
    if (pdfs && pdfs.length > 0) {
      console.log(
        `- Multiple PDFs total size: ${pdfs.reduce(
          (sum, pdf) => sum + pdf.pdfBase64.length,
          0
        )} characters`
      );
    }

    const userPrompt = `You are an assistant that generates concise, high‑quality study flashcards as term–definition pairs.

Return ONLY valid JSON matching exactly this format:
{"cards":[{"front_text":"term or question","back_text":"definition or answer"}]}

IMPORTANT: 
- Return ONLY the JSON object, no other text before or after
- Use double quotes for all strings
- Ensure proper JSON syntax with no trailing commas
- Each card must have exactly "front_text" and "back_text" fields

Context:
- Subject: ${subject}
- Grade: ${gradeLevel}
- Difficulty: ${difficulty}
${contextLine}${pdfContext}

 Requirements:
 - Generate exactly ${numCards} ${subject} flashcards.
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
    const hostValue = String(
      (req.headers["x-forwarded-host"] as string | string[] | undefined) ??
        req.headers.host ??
        "localhost:3000"
    );
    const httpReferer = hostValue.startsWith("http")
      ? hostValue
      : `http://${hostValue}`;

    // Always use DeepSeek R1 and pass extracted PDF text as context
    const modelId = "deepseek/deepseek-r1:free";
    console.log("- Using model:", modelId, "(text-only, PDF text as context)");

    try {
      const resp = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": httpReferer,
            "X-Title": "MathMentor",
          },
          body: JSON.stringify({
            model: modelId,
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
      const rawContent = data?.choices?.[0]?.message?.content || "";
      content = String(rawContent)
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .trim();

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
    let cards: AIFlashcard[] = parsed.cards
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

    // If model returned fewer than requested, top-up with a follow-up call
    if (cards.length < numCards) {
      const remaining = numCards - cards.length;
      try {
        const avoidList = cards
          .map((c) => c.front_text)
          .slice(0, 50)
          .join(", ");
        const followUpPrompt = `${userPrompt}\n\nGenerate exactly ${remaining} additional cards. Avoid duplicates of these terms: [${avoidList}]`;

        const followResp = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": httpReferer,
              "X-Title": "MathMentor",
            },
            body: JSON.stringify({
              model: modelId,
              messages: pdfBase64
                ? [
                    {
                      role: "user",
                      content: [
                        { type: "text", text: followUpPrompt },
                        {
                          type: "image_url",
                          image_url: {
                            url: `data:application/pdf;base64,${pdfBase64}`,
                          },
                        },
                      ],
                    },
                  ]
                : [{ role: "user", content: followUpPrompt }],
              temperature: 0.4,
            }),
          }
        );

        if (followResp.ok) {
          const followData = await followResp.json();
          let followContent = String(
            followData?.choices?.[0]?.message?.content || ""
          )
            .replace(/<think>[\s\S]*?<\/think>/g, "")
            .trim();

          if (followContent.startsWith("```")) {
            const openFence = followContent.match(/^```[a-zA-Z]*\s*\n?/);
            if (openFence)
              followContent = followContent.slice(openFence[0].length);
            const lastFenceIdx = followContent.lastIndexOf("```");
            if (lastFenceIdx !== -1)
              followContent = followContent.slice(0, lastFenceIdx);
            followContent = followContent.trim();
          }

          let followParsed: AIFlashcardsResponse | undefined;
          try {
            followParsed = JSON.parse(followContent);
          } catch {
            const m = followContent.match(/\{[\s\S]*\}/);
            if (m) {
              try {
                followParsed = JSON.parse(m[0]);
              } catch {}
            }
          }

          if (followParsed && Array.isArray(followParsed.cards)) {
            const extra = followParsed.cards
              .map((card, idx) => ({
                front_text: String(card.front_text || `Extra Term ${idx + 1}`),
                back_text: String(
                  card.back_text || `Extra Definition ${idx + 1}`
                ),
              }))
              .filter(
                (card) =>
                  card.front_text.trim() &&
                  card.back_text.trim() &&
                  !card.front_text.includes("undefined") &&
                  !card.back_text.includes("undefined") &&
                  !cards.some((c) => c.front_text === card.front_text)
              );
            cards = cards.concat(extra).slice(0, numCards);
          }
        }
      } catch (topUpErr) {
        console.warn("Top-up generation failed:", topUpErr);
      }
    }

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

// Global error handler (handles multer errors and others)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);

  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "PDF too large. Max 10MB." });
  }

  if (err && err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      error: "Unexpected file field. Please use 'files' field for PDF uploads.",
    });
  }

  if (err && err.code === "LIMIT_FILE_COUNT") {
    return res
      .status(400)
      .json({ error: "Too many files. Maximum 10 PDFs allowed." });
  }

  res.status(500).json({ error: "Server error" });
});
