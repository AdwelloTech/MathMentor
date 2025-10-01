import apiClient from "@/lib/apiClient";

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

export interface AIFlashcard {
  front_text: string;
  back_text: string;
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

    const data = await apiClient.post<{ questions: GeneratedAIQuestion[] }>("/api/ai/generate", payload);
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

    const data = await apiClient.post<{ cards: AIFlashcard[] }>("/api/ai/flashcards", payload);
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

  // Custom implementation for file uploads since ApiClient doesn't handle FormData
  const headers: Record<string, string> = {};

  // Add authorization header if token exists
  if (apiClient.isAuthenticated()) {
    // We need to access the private accessToken, but since we can't, we'll need to get it from localStorage
    try {
      const tokens = localStorage.getItem('mathmentor_tokens');
      if (tokens) {
        const parsed = JSON.parse(tokens);
        headers['Authorization'] = `Bearer ${parsed.accessToken}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token for PDF upload:', error);
    }
  }

  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const res = await fetch(`${baseURL}/api/ai/pdf/extract-text`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any));
    console.error("📄 Text extraction failed:", err);
    throw new Error(err?.error || "Failed to extract text from PDFs");
  }

  const responseData = await res.json();
  // The backend returns { success: true, data: { pdfs: [...], totalFiles: number } }
  return responseData.data;
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

  // Custom implementation for file uploads since ApiClient doesn't handle FormData
  const headers: Record<string, string> = {};

  // Add authorization header if token exists
  if (apiClient.isAuthenticated()) {
    // We need to access the private accessToken, but since we can't, we'll need to get it from localStorage
    try {
      const tokens = localStorage.getItem('mathmentor_tokens');
      if (tokens) {
        const parsed = JSON.parse(tokens);
        headers['Authorization'] = `Bearer ${parsed.accessToken}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token for PDF upload:', error);
    }
  }

  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const res = await fetch(`${baseURL}/api/ai/pdf/upload`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any));
    console.error("📄 Upload failed:", err);
    throw new Error(err?.error || "Failed to upload PDFs");
  }

  const responseData = await res.json();
  // The backend returns { success: true, data: { pdfs: [...], totalFiles: number } }
  return responseData.data;
}
