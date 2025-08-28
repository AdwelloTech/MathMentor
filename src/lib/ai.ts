export interface GenerateAIRequest {
  subject: string;
  gradeLevel?: string;
  numQuestions?: number;
  difficulty?: "easy" | "medium" | "hard";
  questionType?: "multiple_choice" | "true_false";
  title?: string;
  pdfText?: string;
  pdfs?: Array<{ pdfBase64: string; fileName: string; fileSize: number }>;
}

export interface GeneratedAIAnswer {
  answer_text: string;
  is_correct: boolean;
}

export interface GeneratedAIQuestion {
  question_text: string;
  question_type: "multiple_choice" | "true_false";
  points: number;
  answers: GeneratedAIAnswer[];
  is_ai_generated: boolean;
  ai_status: "pending" | "approved" | "discarded";
  ai_metadata?: Record<string, any>;
}

// Flexible signature: supports either an object or positional params
export async function generateAIQuestions(
  argsOrSubject: GenerateAIRequest | string,
  gradeLevel?: string,
  numQuestions: number = 4,
  difficulty: "easy" | "medium" | "hard" = "medium",
  questionType: "multiple_choice" | "true_false" = "multiple_choice",
  title?: string,
  pdfText?: string,
  pdfs?: Array<{ pdfBase64: string; fileName: string; fileSize: number }>
) {
  try {
    const payload: GenerateAIRequest =
      typeof argsOrSubject === "string"
        ? {
            subject: argsOrSubject,
            gradeLevel,
            numQuestions,
            difficulty,
            questionType,
            title,
            pdfText,
            pdfs,
          }
        : argsOrSubject;

    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to generate questions");
    }

    const data = await response.json();
    return data.questions;
  } catch (error) {
    console.error("Error generating AI questions:", error);
    throw error;
  }
}

export async function generateAIFlashcards(
  subjectOrArgs:
    | {
        subject: string;
        gradeLevel: string;
        numCards?: number;
        title?: string;
        difficulty?: "easy" | "medium" | "hard";
        pdfText?: string;
        pdfs?: Array<{ pdfBase64: string; fileName: string; fileSize: number }>;
      }
    | string,
  gradeLevel?: string,
  numCards: number = 10,
  title?: string,
  difficulty: "easy" | "medium" | "hard" = "medium",
  pdfText?: string,
  pdfs?: Array<{ pdfBase64: string; fileName: string; fileSize: number }>
) {
  try {
    const payload =
      typeof subjectOrArgs === "string"
        ? {
            subject: subjectOrArgs,
            gradeLevel,
            numCards,
            title,
            difficulty,
            pdfText,
            pdfs,
          }
        : subjectOrArgs;

    console.log("🧠 AI Flashcards payload:", {
      subject: payload.subject,
      gradeLevel: payload.gradeLevel,
      numCards: payload.numCards,
      pdfs: payload.pdfs ? `${payload.pdfs.length} PDFs` : "No PDFs",
      pdfsData: payload.pdfs,
    });

    const response = await fetch("/api/ai/flashcards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to generate flashcards");
    }

    const data = await response.json();
    return data.cards;
  } catch (error) {
    console.error("Error generating AI flashcards:", error);
    throw error;
  }
}

// Extract text from PDFs for AI processing
export async function extractTextFromPdf(files: File | File[]): Promise<{
  pdfs: Array<{ pdfText: string; fileName: string; fileSize: number }>;
  totalFiles: number;
}> {
  const form = new FormData();

  if (Array.isArray(files)) {
    // Handle multiple files
    if (files.length > 10) {
      throw new Error("Maximum 10 PDF files allowed");
    }
    files.forEach((file) => {
      console.log(
        "📄 Appending file to form:",
        file.name,
        file.type,
        file.size
      );
      form.append("files", file);
    });
  } else {
    // Handle single file (backward compatibility)
    console.log(
      "📄 Appending single file to form:",
      files.name,
      files.type,
      files.size
    );
    form.append("files", files);
  }

  console.log("📄 FormData entries:");
  for (let [key, value] of form.entries()) {
    console.log("📄 Form key:", key, "value type:", typeof value);
  }

  const res = await fetch("/api/ai/pdf/extract-text", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any));
    console.error("📄 Text extraction failed:", err);
    throw new Error(err?.error || "Failed to extract text from PDFs");
  }
  return res.json();
}

// Upload PDFs and get base64 for AI processing (legacy function)
export async function uploadPdfForAI(files: File | File[]): Promise<{
  pdfs: Array<{ pdfBase64: string; fileName: string; fileSize: number }>;
  totalFiles: number;
}> {
  const form = new FormData();

  if (Array.isArray(files)) {
    // Handle multiple files
    if (files.length > 10) {
      throw new Error("Maximum 10 PDF files allowed");
    }
    files.forEach((file) => {
      console.log(
        "📄 Appending file to form:",
        file.name,
        file.type,
        file.size
      );
      form.append("files", file);
    });
  } else {
    // Handle single file (backward compatibility)
    console.log(
      "📄 Appending single file to form:",
      files.name,
      files.type,
      files.size
    );
    form.append("files", files);
  }

  console.log("📄 FormData entries:");
  for (let [key, value] of form.entries()) {
    console.log("📄 Form key:", key, "value type:", typeof value);
  }

  const res = await fetch("/api/ai/pdf/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any));
    console.error("📄 Upload failed:", err);
    throw new Error(err?.error || "Failed to upload PDFs");
  }
  return res.json();
}
