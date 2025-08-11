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
  req: GenerateAIRequest
): Promise<GeneratedAIQuestion[]> {
  const resp = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI generation failed: ${text}`);
  }
  const data = await resp.json();
  return data.questions as GeneratedAIQuestion[];
}
