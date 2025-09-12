// adminQuizService.ts - Axios version for MongoDB API
import type { AxiosInstance } from "axios";
import { getApi, ListResp, q, sort } from "./api";

export type Quiz = { id?: string; _id?: any; title?: string; subject?: string; is_active?: boolean; created_at?: string | Date };
export type QuizQuestion = { id?: string; _id?: any; quiz_id?: string; text?: string; options?: any[]; correct_answer?: any };
export type QuizAttempt = { id?: string; _id?: any; quiz_id?: string; user_id?: string; email?: string; score?: number; created_at?: string | Date };

class AdminQuizService {
  private api: AxiosInstance;
  constructor(api?: AxiosInstance) { this.api = api ?? getApi(); }

  async listQuizzes(params?: { query?: any; limit?: number; offset?: number; sortBy?: any }): Promise<ListResp<Quiz>> {
    const { query, limit=100, offset=0, sortBy } = params || {};
    const res = await this.api.get("/api/quizzes", { params: { q: q(query), limit, offset, sort: sort(sortBy || { createdAt: -1 }) } });
    return res.data as ListResp<Quiz>;
  }

  async listQuestions(quizId: string, limit=500): Promise<ListResp<QuizQuestion>> {
    const res = await this.api.get("/api/quiz_questions", { params: { q: q({ quiz_id: quizId }), limit, sort: sort({ createdAt: 1 }) } });
    return res.data as ListResp<QuizQuestion>;
  }

  async listAttempts(quizId?: string, userIdOrEmail?: string, limit=100): Promise<ListResp<QuizAttempt>> {
    const or: any[] = [];
    if (quizId) or.push({ quiz_id: quizId });
    if (userIdOrEmail) or.push({ user_id: userIdOrEmail }, { email: userIdOrEmail });
    const query = or.length ? { $or: or } : {};
    const res = await this.api.get("/api/quiz_attempts", { params: { q: q(query), limit, sort: sort({ createdAt: -1 }) } });
    return res.data as ListResp<QuizAttempt>;
  }

  private notSupported(name: string): never {
    throw new Error(`${name} is not supported by the current API (read-only). Add server routes for writes.`);
  }
  async createQuiz(_input: Partial<Quiz>): Promise<Quiz> { return this.notSupported("createQuiz"); }
  async updateQuiz(_id: string, _updates: Partial<Quiz>): Promise<Quiz> { return this.notSupported("updateQuiz"); }
  async deleteQuiz(_id: string): Promise<void> { return this.notSupported("deleteQuiz"); }

  async createQuestion(_input: Partial<QuizQuestion>): Promise<QuizQuestion> { return this.notSupported("createQuestion"); }
  async updateQuestion(_id: string, _updates: Partial<QuizQuestion>): Promise<QuizQuestion> { return this.notSupported("updateQuestion"); }
  async deleteQuestion(_id: string): Promise<void> { return this.notSupported("deleteQuestion"); }
}

export const adminQuizService = new AdminQuizService();
