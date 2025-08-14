export interface GenerateAIRequest {
  subject: string;
  gradeLevel?: string;
  numQuestions?: number;
  difficulty?: "easy" | "medium" | "hard";
  questionType?: "multiple_choice" | "true_false";
  title?: string;
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

export async function generateAIQuestions(
  subject: string,
  gradeLevel: string,
  numQuestions: number = 4,
  difficulty: "easy" | "medium" | "hard" = "medium",
  questionType: "multiple_choice" | "true_false" = "multiple_choice",
  title?: string
) {
  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        gradeLevel,
        numQuestions,
        difficulty,
        questionType,
        title,
      }),
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
  subject: string,
  gradeLevel: string,
  numCards: number = 10,
  title?: string,
  difficulty: "easy" | "medium" | "hard" = "medium"
) {
  try {
    const response = await fetch("/api/ai/flashcards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        gradeLevel,
        numCards,
        title,
        difficulty,
      }),
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
