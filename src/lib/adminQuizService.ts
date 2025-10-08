import apiClient from "./apiClient";

export interface AdminAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  answer_order: number;
  created_at: string;
}

export interface AdminQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer";
  points: number;
  question_order: number;
  created_at: string;
  answers?: AdminAnswer[];
}

export interface AdminQuiz {
  _id: string;
  id: string;
  title: string;
  description?: string;
  subject: string;
  tutor_id: string;
  time_limit_minutes?: number;
  total_questions: number;
  total_attempts: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  gradeLevelId?: string | { displayName: string };
  total_points?: number;
  avg_score?: number;
  createdAt: string;
  tutor: {
    id: string;
    full_name: string;
    email: string;
  };
  questions?: AdminQuestion[];
}

export interface QuizStats {
  total: number;
  active: number;
  inactive: number;
  total_attempts: number;
  by_subject?: Record<string, number>;
}

// Stub service - backend API integration needed
export class AdminQuizService {
  static async getAllQuizzes(): Promise<any[]> {
    try {
      const data = await apiClient.get<any[]>("/api/quizzes");
      return data || [];
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      return [];
    }
  }

  static async getQuizStats(): Promise<any> {
    try {
      // This would need a specific backend endpoint
      const quizzes = await this.getAllQuizzes();
      return {
        total: quizzes.length,
        active: quizzes.filter((q: any) => q.isActive).length,
        inactive: quizzes.filter((q: any) => !q.isActive).length,
        total_attempts: quizzes.reduce((sum, q: any) => sum + (q.totalAttempts || 0), 0),
      };
    } catch (error) {
      console.error("Error getting quiz stats:", error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        total_attempts: 0,
      };
    }
  }

  static async deleteQuiz(quizId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/quizzes/${quizId}`);
      return true;
    } catch (error) {
      console.error("Error deleting quiz:", error);
      throw error;
    }
  }

  static async getQuizDetails(quizId: string): Promise<AdminQuiz | null> {
    try {
      const data = await apiClient.get<any>(`/api/quizzes/${quizId}`);
      if (!data) return null;

      return {
        _id: data._id,
        id: data._id,
        title: data.title,
        description: data.description,
        subject: data.subject,
        tutor_id: data.tutorId,
        time_limit_minutes: data.timeLimitMinutes,
        total_questions: data.totalQuestions || 0,
        total_attempts: data.totalAttempts || 0,
        is_active: data.isActive,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        createdAt: data.createdAt,
        gradeLevelId: data.gradeLevelId,
        total_points: data.totalPoints,
        avg_score: data.avgScore,
        tutor: data.tutor || {
          id: data.tutorId,
          full_name: 'Unknown',
          email: ''
        },
        questions: data.questions || []
      };
    } catch (error) {
      console.error("Error getting quiz details:", error);
      return null;
    }
  }
}
