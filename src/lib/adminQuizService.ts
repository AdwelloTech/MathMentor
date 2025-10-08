import apiClient from "./apiClient";

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
      };
    } catch (error) {
      console.error("Error getting quiz stats:", error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
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
}
