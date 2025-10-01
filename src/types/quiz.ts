export interface Quiz {
  id: string;
  tutor_id: string;
  title: string;
  description?: string;
  subject: string;
  gradeLevelId?: {
    displayName: string;
  };
  time_limit_minutes: number;
  total_questions: number;
  total_points: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  tutor?: {
    id: string;
    full_name: string;
    email: string;
  };
  questions?: Question[];
  // Attempt status fields (added for student dashboard)
  attempt_status?: "in_progress" | "completed" | "abandoned" | "expired" | null;
  attempt_score?: number | null;
  attempt_max_score?: number | null;
  attempt_correct_answers?: number | null;
  attempt_total_questions?: number | null;
  attempt_id?: string | null;
  attempt_tutor_feedback?: string | null;
  attempt_expired?: boolean;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer";
  points: number;
  question_order: number;
  created_at: string;
  // AI augmentation fields (nullable to maintain backward compatibility)
  is_ai_generated?: boolean;
  ai_status?: "pending" | "approved" | "discarded" | null;
  ai_metadata?: Record<string, any> | null;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  answer_order: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  started_at: string;
  completed_at?: string;
  score?: number;
  max_score?: number;
  correct_answers?: number;
  total_questions?: number;
  status: "in_progress" | "completed" | "abandoned";
  created_at: string;
  // Optional tutor-written overall feedback for the attempt
  tutor_feedback?: string | null;
  quiz?: Quiz;
  student?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface StudentAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer_id?: string;
  answer_text?: string;
  is_correct?: boolean;
  points_earned: number;
  created_at: string;
  question?: Question;
  selected_answer?: Answer;
}

export interface CreateQuizData {
  title: string;
  description?: string;
  subject: string;
  gradeLevelId?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple_choice' | 'true_false' | 'mixed';
  timeLimit?: number;
  totalQuestions: number;
  isPublic?: boolean;
  instructions?: string;
  questions: CreateQuestionData[];
}

export type CreateQuestionData =
  | {
      question_text: string;
      question_type: "multiple_choice" | "true_false";
      points: number;
      question_order: number;
      // Optional AI augmentation flags when creating questions
      is_ai_generated?: boolean;
      ai_status?: "pending" | "approved" | "discarded";
      ai_metadata?: Record<string, any>;
      answers: CreateAnswerData[]; // required for MCQ/TF
    }
  | {
      question_text: string;
      question_type: "short_answer";
      points: number;
      question_order: number;
      // Optional AI augmentation flags when creating questions
      is_ai_generated?: boolean;
      ai_status?: "pending" | "approved" | "discarded";
      ai_metadata?: Record<string, any>;
      // For short-answer: either accept zero predefined answers (manual grading)
      // or allow a list of acceptable textual answers used for auto-grading.
      answers?: CreateAnswerData[];
    };

export interface CreateAnswerData {
  answer_text: string;
  is_correct: boolean;
  answer_order: number;
}

export interface UpdateQuizData {
  title?: string;
  description?: string;
  subject?: string;
  grade_level?: string;
  time_limit_minutes?: number;
  total_questions?: number;
  total_points?: number;
  is_active?: boolean;
}

export interface QuizStats {
  total_quizzes: number;
  active_quizzes: number;
  total_attempts: number;
  average_score: number;
  total_students: number;
}
