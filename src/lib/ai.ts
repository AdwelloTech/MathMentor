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
  pdfText?: string
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
      }
    | string,
  gradeLevel?: string,
  numCards: number = 10,
  title?: string,
  difficulty: "easy" | "medium" | "hard" = "medium",
  pdfText?: string
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
          }
        : subjectOrArgs;

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

// Upload a PDF and get base64 for AI processing
export async function uploadPdfForAI(
  file: File
): Promise<{ pdfBase64: string; fileName: string; fileSize: number }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/ai/pdf/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any));
    throw new Error(err?.error || "Failed to upload PDF");
  }
  return res.json();
}
