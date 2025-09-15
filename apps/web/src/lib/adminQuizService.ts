// adminQuizService.ts - Complete admin quiz service for MongoDB API
import { getApi } from "./api";
import type { AxiosInstance } from "axios";

// Types based on the database structure you provided
export interface AdminQuiz {
  id: string;
  _id?: string;
  tutor_id: string;
  title: string;
  description?: string;
  subject: string;
  grade_level?: string;
  time_limit_minutes: number;
  total_questions: number;
  total_points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tutor?: {
    id: string;
    full_name: string;
    email: string;
  };
  total_attempts?: number;
  avg_score?: number;
}

export interface QuizQuestion {
  id: string;
  _id?: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  points: number;
  question_order: number;
  is_ai_generated?: boolean;
  ai_status?: string;
  ai_metadata?: any;
  created_at: string;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  _id?: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  answer_order: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  _id?: string;
  quiz_id: string;
  student_id: string;
  started_at: string;
  completed_at?: string;
  score?: number;
  max_score?: number;
  status: string;
  correct_answers: number;
  total_questions: number;
  tutor_feedback?: string;
  created_at: string;
}

export interface QuizStats {
  total: number;
  active: number;
  inactive: number;
  total_attempts: number;
  by_subject: { [key: string]: number };
}

class AdminQuizServiceClass {
  private api: AxiosInstance;

  constructor(api?: AxiosInstance) {
    this.api = api ?? getApi();
  }

  async getAllQuizzes(): Promise<AdminQuiz[]> {
    try {
      const response = await this.api.get('/api/quizzes', {
        params: {
          sort: JSON.stringify({ created_at: -1 })
        }
      });

      const quizzes = response.data?.items || [];
      
      // For each quiz, get tutor information and attempt statistics
      const quizzesWithDetails = await Promise.all(
        quizzes.map(async (quiz: any) => {
          try {
            // Get tutor profile
            const tutorResponse = await this.api.get('/api/profiles', {
              params: {
                q: JSON.stringify({ user_id: quiz.tutor_id }),
                limit: 1
              }
            });
            const tutor = tutorResponse.data?.items?.[0] || null;

            // Get attempt statistics
            const attemptsResponse = await this.api.get('/api/quiz_attempts', {
              params: {
                q: JSON.stringify({ quiz_id: quiz.id }),
                limit: 1000
              }
            });
            const attempts = attemptsResponse.data?.items || [];
            
            const totalAttempts = attempts.length;
            const completedAttempts = attempts.filter((a: any) => a.status === 'completed' && a.score !== null);
            const avgScore = completedAttempts.length > 0 
              ? completedAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / completedAttempts.length
              : 0;

            return {
              ...quiz,
              time_limit_minutes: typeof quiz.time_limit_minutes === 'string' ? parseInt(quiz.time_limit_minutes) : quiz.time_limit_minutes,
              total_questions: typeof quiz.total_questions === 'string' ? parseInt(quiz.total_questions) : quiz.total_questions,
              total_points: typeof quiz.total_points === 'string' ? parseInt(quiz.total_points) : quiz.total_points,
              is_active: quiz.is_active === true || quiz.is_active === 't' || quiz.is_active === 'true',
              tutor: tutor ? {
                id: tutor.id,
                full_name: tutor.full_name || 'Unknown',
                email: tutor.email || 'No email'
              } : {
                id: quiz.tutor_id,
                full_name: 'Unknown Tutor',
                email: 'No email'
              },
              total_attempts: totalAttempts,
              avg_score: avgScore
            };
          } catch (error) {
            console.warn('Error fetching details for quiz:', quiz.id, error);
            return {
              ...quiz,
              time_limit_minutes: typeof quiz.time_limit_minutes === 'string' ? parseInt(quiz.time_limit_minutes) : quiz.time_limit_minutes,
              total_questions: typeof quiz.total_questions === 'string' ? parseInt(quiz.total_questions) : quiz.total_questions,
              total_points: typeof quiz.total_points === 'string' ? parseInt(quiz.total_points) : quiz.total_points,
              is_active: quiz.is_active === true || quiz.is_active === 't' || quiz.is_active === 'true',
              tutor: {
                id: quiz.tutor_id,
                full_name: 'Unknown Tutor',
                email: 'No email'
              },
              total_attempts: 0,
              avg_score: 0
            };
          }
        })
      );

      return quizzesWithDetails;
    } catch (error) {
      console.error('Error in getAllQuizzes:', error);
      throw error;
    }
  }

  async getQuizDetails(quizId: string): Promise<AdminQuiz | null> {
    try {
      // Get quiz details from the list (since individual endpoint doesn't exist)
      // Try by id first
      let quizResponse = await this.api.get('/api/quizzes', {
        params: {
          q: JSON.stringify({ id: quizId }),
          limit: 1
        }
      });
      let quiz = quizResponse.data?.items?.[0];

      // If not found by id, try by _id
      if (!quiz) {
        quizResponse = await this.api.get('/api/quizzes', {
          params: {
            q: JSON.stringify({ _id: quizId }),
            limit: 1
          }
        });
        quiz = quizResponse.data?.items?.[0];
      }

      if (!quiz) return null;

      // Get tutor information
      const tutorResponse = await this.api.get('/api/profiles', {
        params: {
          q: JSON.stringify({ user_id: quiz.tutor_id }),
          limit: 1
        }
      });
      const tutor = tutorResponse.data?.items?.[0] || null;

      // Get questions with answers
      const questionsResponse = await this.api.get('/api/quiz_questions', {
        params: {
          q: JSON.stringify({ quiz_id: quizId }),
          sort: JSON.stringify({ question_order: 1 })
        }
      });
      const questions = questionsResponse.data?.items || [];

      // Get answers for each question
      const questionsWithAnswers = await Promise.all(
        questions.map(async (question: any) => {
          try {
            const answersResponse = await this.api.get('/api/quiz_answers', {
              params: {
                q: JSON.stringify({ question_id: question.id }),
                sort: JSON.stringify({ answer_order: 1 })
              }
            });
            return {
              ...question,
              answers: answersResponse.data?.items || []
            };
          } catch (error) {
            console.warn('Error fetching answers for question:', question.id, error);
            return { ...question, answers: [] };
          }
        })
      );

      // Get attempt statistics
      const attemptsResponse = await this.api.get('/api/quiz_attempts', {
        params: {
          q: JSON.stringify({ quiz_id: quizId }),
          limit: 1000
        }
      });
      const attempts = attemptsResponse.data?.items || [];
      
      const totalAttempts = attempts.length;
      const completedAttempts = attempts.filter((a: any) => a.status === 'completed' && a.score !== null);
      const avgScore = completedAttempts.length > 0 
        ? completedAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / completedAttempts.length
        : 0;

      return {
        ...quiz,
        time_limit_minutes: typeof quiz.time_limit_minutes === 'string' ? parseInt(quiz.time_limit_minutes) : quiz.time_limit_minutes,
        total_questions: typeof quiz.total_questions === 'string' ? parseInt(quiz.total_questions) : quiz.total_questions,
        total_points: typeof quiz.total_points === 'string' ? parseInt(quiz.total_points) : quiz.total_points,
        is_active: quiz.is_active === true || quiz.is_active === 't' || quiz.is_active === 'true',
        tutor: tutor ? {
          id: tutor.id,
          full_name: tutor.full_name || 'Unknown',
          email: tutor.email || 'No email'
        } : {
          id: quiz.tutor_id,
          full_name: 'Unknown Tutor',
          email: 'No email'
        },
        questions: questionsWithAnswers,
        total_attempts: totalAttempts,
        avg_score: avgScore
      };
    } catch (error) {
      console.error('Error in getQuizDetails:', error);
      throw error;
    }
  }

  async getQuizStats(): Promise<QuizStats> {
    try {
      // Get all quizzes
      const quizzesResponse = await this.api.get('/api/quizzes');
      const quizzes = quizzesResponse.data?.items || [];

      // Get all attempts
      const attemptsResponse = await this.api.get('/api/quiz_attempts');
      const attempts = attemptsResponse.data?.items || [];

      const total = quizzes.length;
      const active = quizzes.filter((q: any) => q.is_active === true || q.is_active === 't' || q.is_active === 'true').length;
      const inactive = total - active;
      const total_attempts = attempts.length;

      // Calculate by subject
      const by_subject: { [key: string]: number } = {};
      quizzes.forEach((quiz: any) => {
        const subject = quiz.subject || 'Unknown';
        by_subject[subject] = (by_subject[subject] || 0) + 1;
      });

      return {
        total,
        active,
        inactive,
        total_attempts,
        by_subject
      };
    } catch (error) {
      console.error('Error in getQuizStats:', error);
      throw error;
    }
  }

  async deleteQuiz(quizId: string): Promise<void> {
    try {
      // Delete quiz attempts first
      const attemptsResponse = await this.api.get('/api/quiz_attempts', {
        params: {
          q: JSON.stringify({ quiz_id: quizId })
        }
      });
      const attempts = attemptsResponse.data?.items || [];
      
      for (const attempt of attempts) {
        // Delete student answers for this attempt
        const studentAnswersResponse = await this.api.get('/api/student_answers', {
          params: {
            q: JSON.stringify({ attempt_id: attempt.id })
          }
        });
        const studentAnswers = studentAnswersResponse.data?.items || [];
        
        for (const answer of studentAnswers) {
          await this.api.delete(`/api/student_answers/${answer.id}`);
        }
        // Delete the attempt
        await this.api.delete(`/api/quiz_attempts/${attempt.id}`);
      }

      // Delete quiz questions and their answers
      const questionsResponse = await this.api.get('/api/quiz_questions', {
        params: {
          q: JSON.stringify({ quiz_id: quizId })
        }
      });
      const questions = questionsResponse.data?.items || [];
      
      for (const question of questions) {
        // Delete answers for this question
        const answersResponse = await this.api.get('/api/quiz_answers', {
          params: {
            q: JSON.stringify({ question_id: question.id })
          }
        });
        const answers = answersResponse.data?.items || [];
        
        for (const answer of answers) {
          await this.api.delete(`/api/quiz_answers/${answer.id}`);
        }
        // Delete the question
        await this.api.delete(`/api/quiz_questions/${question.id}`);
      }

      // Finally delete the quiz
      await this.api.delete(`/api/quizzes/${quizId}`);
    } catch (error) {
      console.error('Error in deleteQuiz:', error);
      throw error;
    }
  }

  async updateQuiz(quizId: string, updates: Partial<AdminQuiz>): Promise<AdminQuiz> {
    try {
      // Since individual PATCH endpoint might not exist, we'll use PUT with the full object
      // First get the current quiz
      let quizResponse = await this.api.get('/api/quizzes', {
        params: {
          q: JSON.stringify({ id: quizId }),
          limit: 1
        }
      });
      let currentQuiz = quizResponse.data?.items?.[0];

      // If not found by id, try by _id
      if (!currentQuiz) {
        quizResponse = await this.api.get('/api/quizzes', {
          params: {
            q: JSON.stringify({ _id: quizId }),
            limit: 1
          }
        });
        currentQuiz = quizResponse.data?.items?.[0];
      }
      
      if (!currentQuiz) {
        throw new Error('Quiz not found');
      }
      
      // Update the quiz with new data
      const updatedQuiz = { ...currentQuiz, ...updates };
      const response = await this.api.put(`/api/quizzes/${quizId}`, updatedQuiz);
      return response.data;
    } catch (error) {
      console.error('Error in updateQuiz:', error);
      throw error;
    }
  }

  async createQuiz(quizData: Partial<AdminQuiz>): Promise<AdminQuiz> {
    try {
      const response = await this.api.post('/api/quizzes', quizData);
      return response.data;
    } catch (error) {
      console.error('Error in createQuiz:', error);
      throw error;
    }
  }
}

export const AdminQuizService = new AdminQuizServiceClass();
export default AdminQuizService;