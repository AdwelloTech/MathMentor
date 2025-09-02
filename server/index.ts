import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import katex from "katex";
import * as math from "mathjs";

// Ultra-aggressive LaTeX to plain text conversion function
function convertLatexToText(latexString: string): string {
  try {
    console.log("🔄 Converting LaTeX:", latexString);

    // First, try to render with KaTeX and extract text
    try {
      const rendered = katex.renderToString(latexString, {
        throwOnError: false,
        output: "html",
      });

      // Convert HTML to plain text
      const textContent = rendered
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
        .replace(/&amp;/g, "&") // Replace HTML entities
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      if (textContent.trim()) {
        console.log("✅ KaTeX conversion successful:", textContent.trim());
        return textContent.trim();
      }
    } catch (katexError) {
      console.log(
        "⚠️ KaTeX rendering failed, trying manual conversion:",
        katexError.message
      );
    }

    // Ultra-aggressive manual LaTeX to text conversion
    let converted = latexString
      // Replace common LaTeX commands with plain text equivalents
      .replace(/\\\(/g, "(") // Inline math delimiters
      .replace(/\\\)/g, ")")
      .replace(/\\\[/g, "[") // Display math delimiters
      .replace(/\\\]/g, "]")

      // Replace matrix environments with better handling
      .replace(
        /\\begin\{matrix\}([\s\S]*?)\\end\{matrix\}/g,
        (match, content) => {
          return content.replace(/&/g, " ").replace(/\\\\/g, "; ").trim();
        }
      )
      .replace(
        /\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g,
        (match, content) => {
          return (
            "(" + content.replace(/&/g, " ").replace(/\\\\/g, "; ").trim() + ")"
          );
        }
      )
      .replace(
        /\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g,
        (match, content) => {
          return (
            "[" + content.replace(/&/g, " ").replace(/\\\\/g, "; ").trim() + "]"
          );
        }
      )
      .replace(
        /\\begin\{vmatrix\}([\s\S]*?)\\end\{vmatrix\}/g,
        (match, content) => {
          return (
            "|" + content.replace(/&/g, " ").replace(/\\\\/g, "; ").trim() + "|"
          );
        }
      )
      .replace(
        /\\begin\{array\}([\s\S]*?)\\end\{array\}/g,
        (match, content) => {
          return content.replace(/&/g, " ").replace(/\\\\/g, "; ").trim();
        }
      )

      // Replace fractions with better handling
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)")
      .replace(/\\dfrac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)")
      .replace(/\\tfrac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)")

      // Replace square roots with better handling
      .replace(/\\sqrt\{([^}]*)\}/g, "square root of $1")
      .replace(/\\sqrt\[([^\]]*)\]\{([^}]*)\}/g, "root[$1] of $2")

      // Replace Greek letters (case insensitive)
      .replace(/\\alpha/gi, "alpha")
      .replace(/\\beta/gi, "beta")
      .replace(/\\gamma/gi, "gamma")
      .replace(/\\delta/gi, "delta")
      .replace(/\\epsilon/gi, "epsilon")
      .replace(/\\varepsilon/gi, "epsilon")
      .replace(/\\zeta/gi, "zeta")
      .replace(/\\eta/gi, "eta")
      .replace(/\\theta/gi, "theta")
      .replace(/\\vartheta/gi, "theta")
      .replace(/\\iota/gi, "iota")
      .replace(/\\kappa/gi, "kappa")
      .replace(/\\lambda/gi, "lambda")
      .replace(/\\mu/gi, "mu")
      .replace(/\\nu/gi, "nu")
      .replace(/\\xi/gi, "xi")
      .replace(/\\pi/gi, "pi")
      .replace(/\\rho/gi, "rho")
      .replace(/\\sigma/gi, "sigma")
      .replace(/\\tau/gi, "tau")
      .replace(/\\upsilon/gi, "upsilon")
      .replace(/\\phi/gi, "phi")
      .replace(/\\varphi/gi, "phi")
      .replace(/\\chi/gi, "chi")
      .replace(/\\psi/gi, "psi")
      .replace(/\\omega/gi, "omega")

      // Replace other common symbols
      .replace(/\\infty/gi, "infinity")
      .replace(/\\partial/gi, "partial")
      .replace(/\\nabla/gi, "nabla")
      .replace(/\\sum/gi, "sum")
      .replace(/\\prod/gi, "product")
      .replace(/\\int/gi, "integral")
      .replace(/\\oint/gi, "contour integral")
      .replace(/\\pm/gi, "plus or minus")
      .replace(/\\mp/gi, "minus or plus")
      .replace(/\\times/gi, "times")
      .replace(/\\div/gi, "divided by")
      .replace(/\\leq/gi, "less than or equal to")
      .replace(/\\geq/gi, "greater than or equal to")
      .replace(/\\neq/gi, "not equal to")
      .replace(/\\approx/gi, "approximately equal to")
      .replace(/\\equiv/gi, "equivalent to")
      .replace(/\\propto/gi, "proportional to")
      .replace(/\\perp/gi, "perpendicular to")
      .replace(/\\parallel/gi, "parallel to")
      .replace(/\\angle/gi, "angle")
      .replace(/\\degree/gi, "degrees")
      .replace(/\\circ/gi, "degrees")
      .replace(/\\prime/gi, "prime")
      .replace(/\\doubleprime/gi, "double prime")
      .replace(/\\tripleprime/gi, "triple prime")

      // Replace subscripts and superscripts with better handling
      .replace(/\^\{([^}]*)\}/g, "^($1)")
      .replace(/\^([a-zA-Z0-9])/g, "^$1")
      .replace(/_\{([^}]*)\}/g, "_($1)")
      .replace(/_([a-zA-Z0-9])/g, "_$1")

      // Replace common functions with better handling
      .replace(/\\sin/gi, "sin")
      .replace(/\\cos/gi, "cos")
      .replace(/\\tan/gi, "tan")
      .replace(/\\sec/gi, "sec")
      .replace(/\\csc/gi, "csc")
      .replace(/\\cot/gi, "cot")
      .replace(/\\arcsin/gi, "arcsin")
      .replace(/\\arccos/gi, "arccos")
      .replace(/\\arctan/gi, "arctan")
      .replace(/\\sinh/gi, "sinh")
      .replace(/\\cosh/gi, "cosh")
      .replace(/\\tanh/gi, "tanh")
      .replace(/\\log/gi, "log")
      .replace(/\\ln/gi, "ln")
      .replace(/\\exp/gi, "exp")
      .replace(/\\abs/gi, "absolute value of")
      .replace(/\\mod/gi, "modulo")
      .replace(/\\gcd/gi, "greatest common divisor of")
      .replace(/\\lcm/gi, "least common multiple of")

      // Replace spacing commands
      .replace(/\\,/g, " ")
      .replace(/\\;/g, "  ")
      .replace(/\\!/g, "")
      .replace(/\\:/g, " ")
      .replace(/\\quad/g, "    ")
      .replace(/\\qquad/g, "        ")
      .replace(/\\hspace\{([^}]*)\}/g, " ")
      .replace(/\\vspace\{([^}]*)\}/g, " ")

      // Replace text commands
      .replace(/\\text\{([^}]*)\}/g, "$1")
      .replace(/\\mathrm\{([^}]*)\}/g, "$1")
      .replace(/\\mathbf\{([^}]*)\}/g, "$1")
      .replace(/\\mathit\{([^}]*)\}/g, "$1")
      .replace(/\\mathcal\{([^}]*)\}/g, "$1")
      .replace(/\\mathbb\{([^}]*)\}/g, "$1")
      .replace(/\\mathfrak\{([^}]*)\}/g, "$1")
      .replace(/\\mathscr\{([^}]*)\}/g, "$1")

      // Replace brackets and parentheses
      .replace(/\\left\(/g, "(")
      .replace(/\\right\)/g, ")")
      .replace(/\\left\[/g, "[")
      .replace(/\\right\]/g, "]")
      .replace(/\\left\\{/g, "{")
      .replace(/\\right\\}/g, "}")
      .replace(/\\left\\|/g, "|")
      .replace(/\\right\\|/g, "|")
      .replace(/\\left\\langle/g, "<")
      .replace(/\\right\\rangle/g, ">")

      // Replace arrows
      .replace(/\\rightarrow/gi, "arrow right")
      .replace(/\\leftarrow/gi, "arrow left")
      .replace(/\\leftrightarrow/gi, "arrow left and right")
      .replace(/\\Rightarrow/gi, "double arrow right")
      .replace(/\\Leftarrow/gi, "double arrow left")
      .replace(/\\Leftrightarrow/gi, "double arrow left and right")
      .replace(/\\mapsto/gi, "maps to")
      .replace(/\\to/gi, "to")

      // Replace set notation
      .replace(/\\in/gi, "is an element of")
      .replace(/\\notin/gi, "is not an element of")
      .replace(/\\subset/gi, "is a subset of")
      .replace(/\\supset/gi, "is a superset of")
      .replace(/\\subseteq/gi, "is a subset of or equal to")
      .replace(/\\supseteq/gi, "is a superset of or equal to")
      .replace(/\\cup/gi, "union")
      .replace(/\\cap/gi, "intersection")
      .replace(/\\emptyset/gi, "empty set")
      .replace(/\\varnothing/gi, "empty set")
      .replace(/\\mathbb\{R\}/gi, "real numbers")
      .replace(/\\mathbb\{Z\}/gi, "integers")
      .replace(/\\mathbb\{N\}/gi, "natural numbers")
      .replace(/\\mathbb\{Q\}/gi, "rational numbers")
      .replace(/\\mathbb\{C\}/gi, "complex numbers")

      // Replace logic symbols
      .replace(/\\forall/gi, "for all")
      .replace(/\\exists/gi, "there exists")
      .replace(/\\nexists/gi, "there does not exist")
      .replace(/\\land/gi, "and")
      .replace(/\\lor/gi, "or")
      .replace(/\\lnot/gi, "not")
      .replace(/\\implies/gi, "implies")
      .replace(/\\iff/gi, "if and only if")

      // Replace calculus symbols
      .replace(/\\lim/gi, "limit")
      .replace(/\\limsup/gi, "limit superior")
      .replace(/\\liminf/gi, "limit inferior")
      .replace(/\\sup/gi, "supremum")
      .replace(/\\inf/gi, "infimum")
      .replace(/\\max/gi, "maximum")
      .replace(/\\min/gi, "minimum")
      .replace(/\\arg/gi, "argument of")

      // Replace remaining LaTeX commands with their content
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
      .replace(/\\[a-zA-Z]+/g, "")

      // Handle any remaining sqrt expressions that might have been converted
      .replace(/sqrt\(([^)]*)\)/g, "square root of $1")
      .replace(/(\d+)sqrt\(([^)]*)\)/g, "$1 times square root of $2")

      // Handle specific problematic patterns from the user's example
      .replace(/\[\[([^\]]+)\],\s*\[([^\]]+)\]\]/g, "matrix [$1; $2]")
      .replace(/sqrt\(3\)/g, "square root of 3")
      .replace(/sqrt\(3\)\/2/g, "square root of 3 divided by 2")
      .replace(/2sqrt\(3\)/g, "2 times square root of 3")

      // Clean up any remaining backslashes
      .replace(/\\/g, "")

      // Clean up extra spaces and normalize
      .replace(/\s+/g, " ")
      .trim();

    // Try to use mathjs to further normalize and validate the mathematical expression
    try {
      console.log("🔄 Attempting mathjs parsing for:", converted);

      // Parse the converted string with mathjs
      const mathExpression = math.parse(converted);

      // Convert back to string for final output
      const mathjsResult = mathExpression.toString();

      if (mathjsResult && mathjsResult !== converted) {
        console.log("✅ mathjs normalization successful:", mathjsResult);
        return mathjsResult;
      } else {
        console.log("✅ mathjs parsing successful, no changes needed");
        return converted;
      }
    } catch (mathjsError) {
      console.log(
        "⚠️ mathjs parsing failed, using regex result:",
        mathjsError.message
      );
      return converted;
    }
  } catch (error) {
    console.error("❌ LaTeX conversion error:", error);
    // Return original string if conversion fails
    return latexString;
  }
}

// PDF text extraction using pdf.js-extract (Node.js optimized)
async function extractPdfTextFromBase64(
  pdfBase64: string
): Promise<{ text: string; truncated: boolean }> {
  try {
    console.log("🔍 Starting PDF text extraction...");

    // Validate input
    if (!pdfBase64 || typeof pdfBase64 !== "string") {
      console.error("❌ Invalid PDF base64 input:", typeof pdfBase64);
      return { text: "", truncated: false };
    }

    const buffer = Buffer.from(pdfBase64, "base64");
    console.log("🔍 PDF buffer created, size:", buffer.length, "bytes");

    // Validate buffer
    if (buffer.length === 0) {
      console.error("❌ Empty PDF buffer");
      return { text: "", truncated: false };
    }

    // Check if it's a valid PDF (should start with %PDF)
    const header = buffer.toString("ascii", 0, 4);
    if (!header.startsWith("%PDF")) {
      console.error("❌ Invalid PDF header:", header);
      return { text: "", truncated: false };
    }

    console.log("🔍 Valid PDF header detected:", header);

    // Dynamic import of pdf.js-extract
    console.log("🔍 Importing pdf.js-extract...");
    const { PDFExtract } = await import("pdf.js-extract");
    console.log("🔍 PDFExtract imported successfully");

    const pdfExtract = new PDFExtract();
    console.log("🔍 PDFExtract instance created");

    // Set extraction options for better text extraction
    const options = {
      normalizeWhitespace: true,
      disableCombineTextItems: false,
    };
    console.log("🔍 Using extraction options:", options);

    // Extract text directly from PDF buffer
    console.log("🔍 Extracting text from PDF buffer...");
    const data = await pdfExtract.extractBuffer(buffer, options);
    console.log(
      "🔍 Text extraction completed, pages found:",
      data.pages?.length || 0
    );

    // Debug: Log the structure of the extracted data
    console.log("🔍 PDF data structure keys:", Object.keys(data));
    if (data.pages && data.pages.length > 0) {
      console.log("🔍 First page structure:", {
        hasContent: !!data.pages[0].content,
        contentType: typeof data.pages[0].content,
        contentLength: Array.isArray(data.pages[0].content)
          ? data.pages[0].content.length
          : "not array",
      });

      if (
        data.pages[0].content &&
        Array.isArray(data.pages[0].content) &&
        data.pages[0].content.length > 0
      ) {
        console.log("🔍 First content item structure:", {
          keys: Object.keys(data.pages[0].content[0]),
          hasStr: "str" in data.pages[0].content[0],
          strType: typeof data.pages[0].content[0].str,
        });
      }
    }

    let extractedText = "";

    // Combine text from all pages
    if (data.pages && data.pages.length > 0) {
      console.log("🔍 Processing", data.pages.length, "pages...");

      extractedText = data.pages
        .map((page: any, pageIndex: number) => {
          console.log(`🔍 Page ${pageIndex + 1}:`, {
            hasContent: !!page.content,
            contentLength: page.content?.length || 0,
          });

          if (page.content && page.content.length > 0) {
            const pageText = page.content
              .map((item: any) => {
                if (item && typeof item.str === "string") {
                  return item.str;
                }
                return "";
              })
              .filter((text) => text.trim().length > 0)
              .join(" ");

            console.log(
              `🔍 Page ${pageIndex + 1} text length:`,
              pageText.length
            );
            return pageText;
          }
          return "";
        })
        .filter((pageText) => pageText.trim().length > 0)
        .join("\n");

      console.log(
        "🔍 Text extracted from pages, total length:",
        extractedText.length
      );
    } else {
      console.log("⚠️ No pages found in PDF data");
      console.log("⚠️ PDF data structure:", JSON.stringify(data, null, 2));
    }

    // Normalize whitespace and remove odd characters
    extractedText = extractedText
      .replace(/\u0000/g, " ")
      .replace(/[\t\r]+/g, " ");

    // No character limit - use full PDF content
    const text = extractedText;
    console.log("🔍 Final extracted text length:", text.trim().length);

    // If we got some text, return it
    if (text.trim().length > 0) {
      return { text: text.trim(), truncated: false };
    }

    // Fallback: try to extract any text-like content from the PDF data
    console.log("🔍 No text extracted, trying fallback method...");
    try {
      const fallbackText = JSON.stringify(data)
        .replace(/[{}"\[\]]/g, " ")
        .replace(/[a-zA-Z]+:/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (fallbackText.length > 10) {
        console.log("🔍 Fallback text extracted, length:", fallbackText.length);
        return { text: fallbackText, truncated: false };
      }
    } catch (fallbackErr) {
      console.log("🔍 Fallback method also failed:", fallbackErr.message);
    }

    return { text: "", truncated: false };
  } catch (err) {
    console.error("❌ PDF text extraction failed:", err);
    console.error("❌ Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });

    // Try to provide more specific error information
    if (err.message && err.message.includes("password")) {
      console.error("❌ PDF appears to be password protected");
    } else if (err.message && err.message.includes("corrupt")) {
      console.error("❌ PDF appears to be corrupted");
    } else if (err.message && err.message.includes("invalid")) {
      console.error("❌ PDF format appears to be invalid");
    }

    // Try alternative extraction method using pdfjs-dist
    console.log("🔍 Trying alternative PDF extraction with pdfjs-dist...");
    try {
      const pdfjs = await import("pdfjs-dist");
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;
      console.log("🔍 Alternative PDF loaded, pages:", pdf.numPages);

      let alternativeText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || "")
          .join(" ");
        alternativeText += pageText + "\n";
        console.log(
          `🔍 Alternative extraction page ${i} text length:`,
          pageText.length
        );
      }

      if (alternativeText.trim().length > 0) {
        console.log(
          "✅ Alternative PDF extraction succeeded, length:",
          alternativeText.trim().length
        );
        return { text: alternativeText.trim(), truncated: false };
      }
    } catch (altErr) {
      console.error("❌ Alternative PDF extraction also failed:", altErr);
    }

    return { text: "", truncated: false };
  }
}

// Types
interface GenerateAIRequest {
  subject: string;
  gradeLevel?: string;
  numQuestions?: number;
  difficulty?: "easy" | "medium" | "hard";
  questionType?: "multiple_choice" | "true_false";
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
    console.log("- PDF text length:", effectivePdfText?.length || 0);
    if (effectivePdfText && effectivePdfText.length > 0) {
      const preview = effectivePdfText.replace(/\s+/g, " ").slice(0, 300);
      console.log("- PDF text preview (first 300 chars):", preview);
    }
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
      userPrompt = `You are an assistant that generates clear, unambiguous ${questionType} quiz questions with exactly 4 options and one correct answer.

Return ONLY valid JSON matching exactly this format:
{"questions":[{"question_text":"question text","question_type":"multiple_choice","points":10,"answers":[{"answer_text":"answer text","is_correct":true},{"answer_text":"answer text","is_correct":false},{"answer_text":"answer text","is_correct":false},{"answer_text":"answer text","is_correct":false}]}]}

CRITICAL REQUIREMENTS: 
- Return ONLY the JSON object, no other text before or after
- Use double quotes for all strings
- Ensure proper JSON syntax with no trailing commas
- Each question must have exactly "question_text", "question_type", "points", and "answers" fields
- Each answer must have exactly "answer_text" and "is_correct" fields
- All answer options must be meaningful and complete
- Do NOT use placeholder values like "undefined", "empty", "option 1", "answer 1", or similar generic text
- Each answer should be a proper, substantive response to the question

MATHEMATICAL NOTATION RULES (STRICTLY ENFORCED):
- NEVER use LaTeX commands like \\frac{}, \\sqrt{}, \\begin{}, \\end{}, \\alpha, \\beta, etc.
- NEVER use backslashes (\\\) in your text
- NEVER use mathematical functions like sqrt(), sin(), cos(), etc.
- Use simple text notation for all mathematical expressions:
  * Fractions: "1/2" or "one half" (NOT "\\frac{1}{2}")
  * Square roots: "square root of 4" or "root of 4" (NOT "\\sqrt{4}" or "sqrt(4)")
  * Greek letters: "alpha", "beta", "pi" (NOT "\\alpha", "\\beta", "\\pi")
  * Matrices: "matrix [1,2;3,4]" (NOT "\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}")
  * Subscripts: "x1" or "x_1" (NOT "x_1")
  * Superscripts: "x2" or "x^2" (NOT "x^2")
  * Functions: "sine of x", "cosine of x", "logarithm of x" (NOT "\\sin(x)", "\\cos(x)", "\\log(x)" or "sin(x)", "cos(x)", "log(x)")
  * Combined expressions: "2 times square root of 3" (NOT "2sqrt(3)" or "2*sqrt(3)")

Context:
- Subject: ${subject}
- Grade: ${gradeLevel}
- Difficulty: ${difficulty}
${contextLine}${pdfContext}

Requirements:
- Generate exactly ${numQuestions} ${difficulty} ${questionType} questions for ${subject}
- Ensure exactly one correct answer per question
- Set points to 10 by default
- Focus on mathematical concepts, formulas, definitions, problem-solving steps, and key mathematical facts
- Use age-appropriate language for ${gradeLevel} students
- Use ONLY plain text mathematical notation - NO LaTeX whatsoever`;
    } else if (questionType === "true_false") {
      userPrompt = `You are an assistant that generates clear, unambiguous ${questionType} quiz questions with exactly 2 options (True and False) and one correct answer.

Return ONLY valid JSON matching exactly this format:
{"questions":[{"question_text":"question text","question_type":"true_false","points":10,"answers":[{"answer_text":"True","is_correct":true},{"answer_text":"False","is_correct":false}]}]}

CRITICAL REQUIREMENTS: 
- Return ONLY the JSON object, no other text before or after
- Use double quotes for all strings
- Ensure proper JSON syntax with no trailing commas
- Each question must have exactly "question_text", "question_type", "points", and "answers" fields
- Each answer must have exactly "answer_text" and "is_correct" fields
- First answer must be "True", second must be "False"

MATHEMATICAL NOTATION RULES (STRICTLY ENFORCED):
- NEVER use LaTeX commands like \\frac{}, \\sqrt{}, \\begin{}, \\end{}, \\alpha, \\beta, etc.
- NEVER use backslashes (\\\) in your text
- NEVER use mathematical functions like sqrt(), sin(), cos(), etc.
- Use simple text notation for all mathematical expressions:
  * Fractions: "1/2" or "one half" (NOT "\\frac{1}{2}")
  * Square roots: "square root of 4" or "root of 4" (NOT "\\sqrt{4}" or "sqrt(4)")
  * Greek letters: "alpha", "beta", "pi" (NOT "\\alpha", "\\beta", "\\pi")
  * Matrices: "matrix [1,2;3,4]" (NOT "\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}")
  * Subscripts: "x1" or "x_1" (NOT "x_1")
  * Superscripts: "x2" or "x^2" (NOT "x^2")
  * Functions: "sine of x", "cosine of x", "logarithm of x" (NOT "\\sin(x)", "\\cos(x)", "\\log(x)" or "sin(x)", "cos(x)", "log(x)")
  * Combined expressions: "2 times square root of 3" (NOT "2sqrt(3)" or "2*sqrt(3)")

Context:
- Subject: ${subject}
- Grade: ${gradeLevel}
- Difficulty: ${difficulty}
${contextLine}${pdfContext}

Requirements:
- Generate exactly ${numQuestions} ${difficulty} ${questionType} questions for ${subject}
- Ensure exactly one correct answer per question
- Set points to 10 by default
- Focus on mathematical concepts, formulas, definitions, problem-solving steps, and key mathematical facts
- Use age-appropriate language for ${gradeLevel} students
- Use ONLY plain text mathematical notation - NO LaTeX whatsoever`;
    } else {
      userPrompt = `You are an assistant that generates clear, unambiguous multiple choice quiz questions with exactly 4 options and one correct answer.

Return ONLY valid JSON matching exactly this format:
{"questions":[{"question_text":"question text","question_type":"multiple_choice","points":10,"answers":[{"answer_text":"answer text","is_correct":true},{"answer_text":"answer text","is_correct":false},{"answer_text":"answer text","is_correct":false},{"answer_text":"answer text","is_correct":false}]}]}

CRITICAL REQUIREMENTS: 
- Return ONLY the JSON object, no other text before or after
- Use double quotes for all strings
- Ensure proper JSON syntax with no trailing commas
- Each question must have exactly "question_text", "question_type", "points", and "answers" fields
- Each answer must have exactly "answer_text" and "is_correct" fields
- All answer options must be meaningful and complete
- Do NOT use placeholder values like "undefined", "empty", "option 1", "answer 1", or similar generic text
- Each answer should be a proper, substantive response to the question

MATHEMATICAL NOTATION RULES (STRICTLY ENFORCED):
- NEVER use LaTeX commands like \\frac{}, \\sqrt{}, \\begin{}, \\end{}, \\alpha, \\beta, etc.
- NEVER use backslashes (\\\) in your text
- NEVER use mathematical functions like sqrt(), sin(), cos(), etc.
- Use simple text notation for all mathematical expressions:
  * Fractions: "1/2" or "one half" (NOT "\\frac{1}{2}")
  * Square roots: "square root of 4" or "root of 4" (NOT "\\sqrt{4}" or "sqrt(4)")
  * Greek letters: "alpha", "beta", "pi" (NOT "\\alpha", "\\beta", "\\pi")
  * Matrices: "matrix [1,2;3,4]" (NOT "\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}")
  * Subscripts: "x1" or "x_1" (NOT "x_1")
  * Superscripts: "x2" or "x^2" (NOT "x^2")
  * Functions: "sine of x", "cosine of x", "logarithm of x" (NOT "\\sin(x)", "\\cos(x)", "\\log(x)" or "sin(x)", "cos(x)", "log(x)")
  * Combined expressions: "2 times square root of 3" (NOT "2sqrt(3)" or "2*sqrt(3)")

Context:
- Subject: ${subject}
- Grade: ${gradeLevel}
- Difficulty: ${difficulty}
${contextLine}${pdfContext}

Requirements:
- Generate exactly ${numQuestions} ${difficulty} multiple choice questions for ${subject}
- Ensure exactly one correct answer per question
- Set points to 10 by default
- Focus on mathematical concepts, formulas, definitions, problem-solving steps, and key mathematical facts
- Use age-appropriate language for ${gradeLevel} students
- Use ONLY plain text mathematical notation - NO LaTeX whatsoever`;
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
    let parsed: AIResponse | undefined;

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
          // Try to fix common JSON issues including LaTeX expressions
          let fixedContent = contentForParse
            // Fix LaTeX expressions by escaping backslashes properly
            .replace(/\\\(/g, "\\\\(") // Escape opening LaTeX delimiters
            .replace(/\\\)/g, "\\\\)") // Escape closing LaTeX delimiters
            .replace(/\\begin\{/g, "\\\\begin{") // Escape begin commands
            .replace(/\\end\{/g, "\\\\end{") // Escape end commands
            .replace(/\\frac\{/g, "\\\\frac{") // Escape fraction commands
            .replace(/\\sqrt\{/g, "\\\\sqrt{") // Escape sqrt commands
            .replace(/\\alpha/g, "\\\\alpha") // Escape Greek letters
            .replace(/\\beta/g, "\\\\beta")
            .replace(/\\gamma/g, "\\\\gamma")
            .replace(/\\delta/g, "\\\\delta")
            .replace(/\\theta/g, "\\\\theta")
            .replace(/\\pi/g, "\\\\pi")
            .replace(/\\infty/g, "\\\\infty")
            // Fix other common JSON issues
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

          // Try LaTeX conversion approach
          try {
            console.log("🔄 Attempting LaTeX conversion...");

            // Ultra-aggressive LaTeX conversion and cleaning
            let latexConvertedContent = contentForParse;

            // Step 1: Convert LaTeX content within quoted strings
            latexConvertedContent = latexConvertedContent.replace(
              /"([^"]*\\[^"]*)"/g,
              (match, content) => {
                const converted = convertLatexToText(content);
                console.log(
                  `🔄 Converted quoted content: "${content}" → "${converted}"`
                );
                return `"${converted}"`;
              }
            );

            // Step 2: Convert any remaining LaTeX commands in the entire string
            latexConvertedContent = latexConvertedContent.replace(
              /\\[a-zA-Z]+(\{[^}]*\})?/g,
              (match) => {
                const converted = convertLatexToText(match);
                console.log(
                  `🔄 Converted remaining LaTeX: "${match}" → "${converted}"`
                );
                return converted;
              }
            );

            // Step 3: Aggressive cleanup of any remaining problematic characters
            latexConvertedContent = latexConvertedContent
              // Remove any remaining backslashes that might break JSON
              .replace(/\\/g, "")
              // Clean up any malformed quotes
              .replace(/"+/g, '"')
              // Fix common JSON syntax issues
              .replace(/,\s*]/g, "]")
              .replace(/,\s*}/g, "}")
              .replace(/}\s*,\s*]/g, "}]")
              .replace(/}\s*,\s*}/g, "}}")
              .replace(/]\s*,\s*}/g, "]}")
              .replace(/]\s*,\s*]/g, "]]")
              .replace(/}\s*,\s*{/g, "},{")
              .replace(/]\s*,\s*{/g, "},{")
              .replace(/}\s*,\s*\[/g, "},[");

            console.log(
              "🔄 Final cleaned content for JSON parsing:",
              latexConvertedContent
            );

            parsed = JSON.parse(latexConvertedContent);
            console.log("✅ JSON parsing succeeded after LaTeX conversion");
          } catch (latexError) {
            console.error("LaTeX conversion attempt failed:", latexError);

            // Final fallback - return predefined questions
            console.log(
              "🔄 Returning fallback questions due to parsing failure"
            );
            const fallbackQuestions: GeneratedQuestion[] = [
              {
                question_text: "What is a variable in mathematics?",
                question_type: questionType,
                points: 10,
                answers:
                  questionType === "multiple_choice"
                    ? [
                        {
                          answer_text:
                            "A symbol that represents an unknown value",
                          is_correct: true,
                        },
                        { answer_text: "A fixed number", is_correct: false },
                        {
                          answer_text: "A mathematical operation",
                          is_correct: false,
                        },
                        { answer_text: "A geometric shape", is_correct: false },
                      ]
                    : [
                        { answer_text: "True", is_correct: true },
                        { answer_text: "False", is_correct: false },
                      ],
                is_ai_generated: true,
                ai_status: "pending",
                ai_metadata: {
                  subject,
                  gradeLevel,
                  difficulty,
                  provider: "openrouter",
                  model: modelId,
                },
              },
              {
                question_text: "What is an equation?",
                question_type: questionType,
                points: 10,
                answers:
                  questionType === "multiple_choice"
                    ? [
                        {
                          answer_text:
                            "A mathematical statement showing two expressions are equal",
                          is_correct: true,
                        },
                        {
                          answer_text: "A geometric figure",
                          is_correct: false,
                        },
                        {
                          answer_text: "A type of fraction",
                          is_correct: false,
                        },
                        {
                          answer_text: "A measurement unit",
                          is_correct: false,
                        },
                      ]
                    : [
                        { answer_text: "True", is_correct: true },
                        { answer_text: "False", is_correct: false },
                      ],
                is_ai_generated: true,
                ai_status: "pending",
                ai_metadata: {
                  subject,
                  gradeLevel,
                  difficulty,
                  provider: "openrouter",
                  model: modelId,
                },
              },
              {
                question_text: "What is the order of operations?",
                question_type: questionType,
                points: 10,
                answers:
                  questionType === "multiple_choice"
                    ? [
                        {
                          answer_text:
                            "PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction)",
                          is_correct: true,
                        },
                        {
                          answer_text: "Addition first, then multiplication",
                          is_correct: false,
                        },
                        {
                          answer_text: "Left to right order",
                          is_correct: false,
                        },
                        { answer_text: "Random order", is_correct: false },
                      ]
                    : [
                        { answer_text: "True", is_correct: true },
                        { answer_text: "False", is_correct: false },
                      ],
                is_ai_generated: true,
                ai_status: "pending",
                ai_metadata: {
                  subject,
                  gradeLevel,
                  difficulty,
                  provider: "openrouter",
                  model: modelId,
                },
              },
            ];

            return res.json({
              questions: fallbackQuestions.slice(
                0,
                Math.min(numQuestions, fallbackQuestions.length)
              ),
              note: "AI response was malformed, showing fallback questions",
            });
          }
        }
      }
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
      console.error("Malformed AI response - missing questions array:", parsed);
      console.error("Raw content:", content);

      // Return a fallback response instead of error
      const fallbackQuestions: GeneratedQuestion[] = [
        {
          question_text: "What is a variable in mathematics?",
          question_type: questionType,
          points: 10,
          answers:
            questionType === "multiple_choice"
              ? [
                  {
                    answer_text: "A symbol that represents an unknown value",
                    is_correct: true,
                  },
                  { answer_text: "A fixed number", is_correct: false },
                  {
                    answer_text: "A mathematical operation",
                    is_correct: false,
                  },
                  { answer_text: "A geometric shape", is_correct: false },
                ]
              : [
                  { answer_text: "True", is_correct: true },
                  { answer_text: "False", is_correct: false },
                ],
          is_ai_generated: true,
          ai_status: "pending",
          ai_metadata: {
            subject,
            gradeLevel,
            difficulty,
            provider: "openrouter",
            model: modelId,
          },
        },
        {
          question_text: "What is an equation?",
          question_type: questionType,
          points: 10,
          answers:
            questionType === "multiple_choice"
              ? [
                  {
                    answer_text:
                      "A mathematical statement showing two expressions are equal",
                    is_correct: true,
                  },
                  { answer_text: "A geometric figure", is_correct: false },
                  { answer_text: "A type of fraction", is_correct: false },
                  { answer_text: "A measurement unit", is_correct: false },
                ]
              : [
                  { answer_text: "True", is_correct: true },
                  { answer_text: "False", is_correct: false },
                ],
          is_ai_generated: true,
          ai_status: "pending",
          ai_metadata: {
            subject,
            gradeLevel,
            difficulty,
            provider: "openrouter",
            model: modelId,
          },
        },
        {
          question_text: "What is the order of operations?",
          question_type: questionType,
          points: 10,
          answers:
            questionType === "multiple_choice"
              ? [
                  {
                    answer_text:
                      "PEMDAS (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction)",
                    is_correct: true,
                  },
                  {
                    answer_text: "Addition first, then multiplication",
                    is_correct: false,
                  },
                  { answer_text: "Left to right order", is_correct: false },
                  { answer_text: "Random order", is_correct: false },
                ]
              : [
                  { answer_text: "True", is_correct: true },
                  { answer_text: "False", is_correct: false },
                ],
          is_ai_generated: true,
          ai_status: "pending",
          ai_metadata: {
            subject,
            gradeLevel,
            difficulty,
            provider: "openrouter",
            model: modelId,
          },
        },
      ];

      return res.json({
        questions: fallbackQuestions.slice(
          0,
          Math.min(numQuestions, fallbackQuestions.length)
        ),
        note: "AI response was malformed, showing fallback questions",
      });
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

    // Debug: Log received request data
    console.log("🧠 Server: Received flashcard generation request:", {
      subject,
      gradeLevel,
      numCards,
      title,
      difficulty,
      hasPdfText: !!pdfText,
      pdfTextLength: pdfText?.length || 0,
      pdfTextPreview: pdfText?.substring(0, 200) + "..." || "none",
      hasPdfBase64: !!pdfBase64,
      hasPdfs: !!pdfs && pdfs.length > 0,
    });

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
    console.log("- PDF text length:", effectivePdfText?.length || 0);
    if (effectivePdfText && effectivePdfText.length > 0) {
      const preview = effectivePdfText.replace(/\s+/g, " ").slice(0, 300);
      console.log("- PDF text preview (first 300 chars):", preview);
    }
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
      if (openFence)
        contentForParse = contentForParse.slice(openFence[0].length);
      // Remove trailing closing fence ``` (last occurrence)
      const lastFenceIdx = contentForParse.lastIndexOf("```");
      if (lastFenceIdx !== -1)
        contentForParse = contentForParse.slice(0, lastFenceIdx);
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

// PDF text extraction endpoint
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

app.post(
  "/api/ai/pdf/extract-text",
  pdfUpload.array("files", 10),
  async (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No PDF files provided" });
      }

      const results = [];

      for (const file of req.files as Express.Multer.File[]) {
        try {
          console.log(
            `📄 Processing PDF: ${file.originalname} (${file.size} bytes)`
          );

          // Convert buffer to base64
          const pdfBase64 = file.buffer.toString("base64");

          // Extract text using existing function
          const { text, truncated } = await extractPdfTextFromBase64(pdfBase64);

          results.push({
            fileName: file.originalname,
            fileSize: file.size,
            pdfText: text,
            truncated,
          });

          console.log(
            `📄 Extracted ${text.length} characters from ${file.originalname}`
          );
        } catch (fileError) {
          console.error(`❌ Error processing ${file.originalname}:`, fileError);
          results.push({
            fileName: file.originalname,
            fileSize: file.size,
            pdfText: "",
            truncated: false,
            error: "Failed to extract text from this PDF",
          });
        }
      }

      res.status(200).json({
        pdfs: results,
        totalFiles: results.length,
      });
    } catch (error) {
      console.error("❌ PDF extraction endpoint error:", error);
      res.status(500).json({
        error: "Failed to extract text from PDFs",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

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
