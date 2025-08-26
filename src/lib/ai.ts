export interface GenerateAIRequest {
  subject: string;
  gradeLevel?: string;
  numQuestions?: number;
  difficulty?: "easy" | "medium" | "hard";
  questionType?: "multiple_choice" | "true_false" | "short_answer";
  title?: string;
  pdfText?: string;
  pdfBase64?: string;
}

export interface GeneratedAIAnswer {
  answer_text: string;
  is_correct: boolean;
}

export interface GeneratedAIQuestion {
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer";
  points: number;
  answers?: GeneratedAIAnswer[];
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
  questionType:
    | "multiple_choice"
    | "true_false"
    | "short_answer" = "multiple_choice",
  title?: string,
  pdfText?: string,
  pdfBase64?: string
): Promise<GeneratedAIQuestion[]> {
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
            pdfBase64,
          }
        : argsOrSubject;

    // Back-compat shim: some callers still send { pdfs: [{ pdfBase64, ... }] }
    // If present and no explicit pdfBase64 provided, pick the first one.
    const maybeOld = (typeof argsOrSubject === "object" &&
      argsOrSubject) as any;
    if (
      !payload.pdfBase64 &&
      Array.isArray(maybeOld?.pdfs) &&
      maybeOld.pdfs.length > 0
    ) {
      payload.pdfBase64 = maybeOld.pdfs[0].pdfBase64;
    }

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
    const raw = Array.isArray(data?.questions) ? data.questions : [];
    return raw.map((q: any) => {
      const isShort = q.question_type === "short_answer";
      return {
        ...q,
        // Always give non–short-answer types an array
        ...(isShort
          ? {}
          : { answers: Array.isArray(q.answers) ? q.answers : [] }),
      };
    });
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

// Upload one or many PDFs and get base64 blobs for AI processing
export async function uploadPdfForAI(
  files: File | File[]
): Promise<{
  pdfs: Array<{ pdfBase64: string; fileName: string; fileSize: number }>;
}> {
  const arr = Array.isArray(files) ? files : [files];
  // Basic client-side validation; server must still enforce limits
  const maxBytes = 10 * 1024 * 1024; // 10MB
  if (arr.length === 0) {
    throw new Error("No files provided");
  }
  if (arr.length > 10) {
    throw new Error("Maximum 10 PDF files allowed");
  }
  for (const f of arr) {
    if (f.size > maxBytes) {
      throw new Error(`"${f.name}" exceeds 10MB limit`);
    }
    if (f.type !== "application/pdf") {
      throw new Error(`"${f.name}" is not a PDF`);
    }
  }

  const form = new FormData();
  for (const f of arr) {
    form.append("files", f);
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
  const json = await res.json();
  if (!Array.isArray(json?.pdfs)) {
    throw new Error("Upload response malformed (missing pdfs array)");
  }
  return json;
}
