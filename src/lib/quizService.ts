import apiClient from "./apiClient";
import type {
  Quiz,
  Question,
  Answer,
  QuizAttempt,
  StudentAnswer,
  CreateQuizData,
  CreateQuestionData,
  CreateAnswerData,
  UpdateQuizData,
  QuizStats,
} from "@/types/quiz";

// Note: Supabase operations have been migrated to backend API calls
// The remaining supabase references are for tutor/admin operations that need backend endpoints

export const quizService = {
  // Quiz operations
  quizzes: {
    create: async (
      tutorId: string,
      quizData: CreateQuizData
    ): Promise<Quiz> => {
      const payload = {
        tutorId,
        ...quizData,
      };

      const quiz = await apiClient.post<Quiz>('/api/quizzes', payload);
      return quiz;
    },

    getById: async (quizId: string): Promise<Quiz> => {
      const quiz = await apiClient.get<Quiz>(`/api/quizzes/${quizId}`);
      return quiz;
    },

    getByTutorId: async (tutorId: string): Promise<Quiz[]> => {
      const quizzes = await apiClient.get<Quiz[]>(`/api/quizzes?tutorId=${tutorId}`);
      return quizzes;
    },

    update: async (
      quizId: string,
      updateData: UpdateQuizData
    ): Promise<Quiz> => {
      const quiz = await apiClient.put<Quiz>(`/api/quizzes/${quizId}`, updateData);
      return quiz;
    },

    delete: async (quizId: string): Promise<void> => {
      await apiClient.delete(`/api/quizzes/${quizId}`);
    },

    getAll: async (): Promise<Quiz[]> => {
      const quizzes = await apiClient.get<Quiz[]>('/api/quizzes');
      return quizzes;
    },

    getAttempts: async (quizId: string): Promise<any[]> => {
      const attempts = await apiClient.get<any[]>(`/api/quizzes/${quizId}/attempts`);
      return attempts;
    },

    togglePublish: async (quizId: string): Promise<Quiz> => {
      const response = await apiClient.post<Quiz>(`/api/quizzes/${quizId}/toggle-publish`);
      return response;
    },
  },

  // Question operations (Tutor/Admin - migrated to backend endpoints)
  questions: {
    create: async (
      quizId: string,
      questionData: CreateQuestionData
    ): Promise<Question> => {
      // Transform frontend format to backend format
      const backendData = {
        questionText: questionData.question_text,
        questionType: questionData.question_type,
        points: questionData.points,
        answers: questionData.answers?.map((answer, index) => ({
          answerText: answer.answer_text,
          isCorrect: answer.is_correct,
          order: answer.answer_order || index,
        })),
        order: questionData.question_order,
        isAiGenerated: questionData.is_ai_generated,
        aiStatus: questionData.ai_status,
        aiMetadata: questionData.ai_metadata,
      };

      const question = await apiClient.post<Question>(`/api/quizzes/${quizId}/questions`, backendData);
      return question;
    },

    getByQuizId: async (quizId: string): Promise<Question[]> => {
      const questions = await apiClient.get<any[]>(`/api/quizzes/${quizId}/questions`);

      // Transform backend camelCase format to frontend snake_case format
      return questions.map((question: any) => ({
        id: question._id?.toString(),
        quiz_id: question.quizId?.toString(),
        question_text: question.questionText,
        question_type: question.questionType,
        points: question.points,
        answers: question.answers?.map((answer: any) => ({
          id: answer._id?.toString(),
          question_id: answer.questionId?.toString(),
          answer_text: answer.answerText,
          is_correct: answer.isCorrect,
          explanation: answer.explanation,
          answer_order: answer.order,
        })),
        explanation: question.explanation,
        hint: question.hint,
        difficulty: question.difficulty,
        tags: question.tags,
        question_order: question.order,
        is_active: question.isActive,
        is_ai_generated: question.isAiGenerated,
        ai_status: question.aiStatus,
        ai_metadata: question.aiMetadata,
        created_at: question.createdAt,
        updated_at: question.updatedAt,
      }));
    },

    update: async (
      _questionId: string,
      _updateData: Partial<CreateQuestionData>
    ): Promise<Question> => {
      // Need to find the quizId from the question or pass it as a parameter
      // For now, assume we need to get it from somewhere - this might need adjustment
      throw new Error("Question update needs quizId parameter or endpoint restructuring");
    },

    delete: async (_questionId: string): Promise<void> => {
      // Need to find the quizId from the question or pass it as a parameter
      throw new Error("Question deletion needs quizId parameter or endpoint restructuring");
    },
  },

  // Answer operations (Tutor/Admin - answers are handled via question endpoints)
  answers: {
    create: async (
      _questionId: string,
      _answerData: CreateAnswerData
    ): Promise<Answer> => {
      // Answers are created/updated as part of questions, not individually
      throw new Error("Answers should be created via question endpoints");
    },

    getByQuestionId: async (_questionId: string): Promise<Answer[]> => {
      // Answers are fetched as part of questions
      // For now, return empty array as answers come with questions
      return [];
    },

    update: async (
      _answerId: string,
      _updateData: Partial<Answer>
    ): Promise<Answer> => {
      // Answers are updated as part of questions
      throw new Error("Answers should be updated via question endpoints");
    },

    delete: async (_answerId: string): Promise<void> => {
      // Answers are deleted as part of questions
      throw new Error("Answers should be deleted via question endpoints");
    },
  },

  // Quiz attempts operations (Tutor/Admin - partially implemented)
  attempts: {
    create: async (quizId: string): Promise<QuizAttempt> => {
      // For now, create attempt via student quiz endpoint
      return quizService.studentQuizzes.startQuizAttempt(quizId);
    },

    getById: async (attemptId: string): Promise<QuizAttempt> => {
      // Get attempt details from student endpoint
      const attempts = await quizService.studentQuizzes.getStudentAttempts('current-user-id');
      const attempt = attempts.find(a => a.id === attemptId);
      if (!attempt) {
        throw new Error('Quiz attempt not found');
      }
      return attempt;
    },

    // Update overall tutor feedback on an attempt
    saveTutorFeedback: async (
      attemptId: string,
      feedback: string
    ): Promise<void> => {
      await apiClient.post(`/api/quizzes/student/attempts/${attemptId}/feedback`, {
        feedback,
      });
    },

    getByStudentId: async (studentId: string): Promise<QuizAttempt[]> => {
      // This is used by student operations, so we can redirect to the student endpoint
      return quizService.studentQuizzes.getStudentAttempts(studentId);
    },

    complete: async (
      _attemptId: string,
      score: number,
      maxScore: number
    ): Promise<QuizAttempt> => {
      // This would need a backend endpoint for completing attempts
      // For now, return a completed attempt
      const attempt = await quizService.attempts.getById(_attemptId);
      return {
        ...attempt,
        status: 'completed',
        score,
        max_score: maxScore,
        completed_at: new Date().toISOString(),
      };
    },
  },

  // Student answers operations (Tutor/Admin - need backend endpoints)
  studentAnswers: {
    create: async (
      attemptId: string,
      questionId: string,
      answerData: {
        selected_answer_id?: string;
        answer_text?: string;
        is_correct?: boolean;
        points_earned: number;
      }
    ): Promise<StudentAnswer> => {
      // This would need a backend endpoint for creating student answers
      // For now, return a mock student answer
      return {
        id: `answer_${Date.now()}`,
        attempt_id: attemptId,
        question_id: questionId,
        selected_answer_id: answerData.selected_answer_id,
        answer_text: answerData.answer_text,
        is_correct: answerData.is_correct,
        points_earned: answerData.points_earned,
        created_at: new Date().toISOString(),
      };
    },

    getByAttemptId: async (_attemptId: string): Promise<StudentAnswer[]> => {
      // This would need a backend endpoint for fetching student answers
      // For now, return empty array
      return [];
    },
  },

  // Stats operations (Tutor/Admin - migrated to backend endpoints)
  stats: {
    getTutorStats: async (tutorId: string): Promise<QuizStats> => {
      const stats = await apiClient.get<QuizStats>(`/api/quizzes/tutor/stats/${tutorId}`);
      return stats;
    },
  },

  // Student quiz operations
  studentQuizzes: {
    // Get quizzes available to a student
    getAvailableQuizzes: async (
      studentId: string,
      subjectFilter?: string
    ): Promise<Quiz[]> => {
      const params = subjectFilter ? `?subject=${encodeURIComponent(subjectFilter)}` : '';
      const quizzes = await apiClient.get<Quiz[]>(`/api/quizzes/student/available/${studentId}${params}`);
      return quizzes;
    },

    // Get recent quizzes that the student has attempted or completed
    getRecentQuizzes: async (studentId: string): Promise<Quiz[]> => {
      const quizzes = await apiClient.get<Quiz[]>(`/api/quizzes/student/recent/${studentId}`);
      return quizzes;
    },

    // Get quiz with questions and answers for taking
    getQuizForTaking: async (quizId: string): Promise<Quiz> => {
      const quiz = await apiClient.get<Quiz>(`/api/quizzes/${quizId}`);
      return quiz;
    },

    // Start a quiz attempt
    startQuizAttempt: async (quizId: string): Promise<QuizAttempt> => {
      const response = await apiClient.post<QuizAttempt>('/api/quizzes/student/attempts/start', {
        quizId,
      });
      return response;
    },

    // Submit quiz answers and calculate score
    submitQuizAttempt: async (
      attemptId: string,
      answers: {
        questionId: string;
        selectedAnswerId?: string;
        answerText?: string;
      }[]
    ): Promise<{
      score: number;
      maxScore: number;
      percentage: number;
      correctAnswers: number;
      totalQuestions: number;
    }> => {
      const response = await apiClient.post<{
        score: number;
        maxScore: number;
        percentage: number;
        correctAnswers: number;
        totalQuestions: number;
      }>('/api/quizzes/student/attempts/submit', {
        attemptId,
        answers
      });
      return response;
    },

    // Get student's quiz attempts
    getStudentAttempts: async (studentId: string): Promise<QuizAttempt[]> => {
      const attempts = await apiClient.get<QuizAttempt[]>(`/api/quizzes/students/${studentId}/attempts`);
      return attempts;
    },

    // Delete a quiz attempt
    deleteQuizAttempt: async (attemptId: string): Promise<void> => {
      await apiClient.delete(`/api/quizzes/students/attempts/${attemptId}`);
    },

    // Get attempt details with answers
    getAttemptDetails: async (
      attemptId: string
    ): Promise<{
      attempt: QuizAttempt;
      studentAnswers: StudentAnswer[];
      questions: Question[];
    }> => {
      // Get attempt data
      const attempt = await apiClient.get<{
        id: string;
        quiz_id: string | {
          _id: string;
          title: string;
          subject: string;
          createdBy: {
            firstName: string;
            lastName: string;
            fullName: string;
          };
        };
        student_id: string;
        status: string;
        score?: number;
        max_score?: number;
        correct_answers?: number;
        total_questions?: number;
        started_at: string;
        completed_at?: string;
        tutor_feedback?: string;
        created_at: string;
      }>(`/api/quizzes/student/attempts/${attemptId}`);

      // Transform backend format to frontend format
      const transformedAttempt: QuizAttempt = {
        id: attempt.id,
        quiz_id: typeof attempt.quiz_id === 'object'
          ? (attempt.quiz_id as any)._id?.toString() || (attempt.quiz_id as any).toString()
          : attempt.quiz_id?.toString() || '',
        student_id: attempt.student_id,
        status: attempt.status as any,
        score: attempt.score,
        max_score: attempt.max_score,
        correct_answers: attempt.correct_answers,
        total_questions: attempt.total_questions,
        started_at: attempt.started_at,
        completed_at: attempt.completed_at,
        tutor_feedback: attempt.tutor_feedback,
        created_at: attempt.created_at,
        quiz: typeof attempt.quiz_id === 'object' && attempt.quiz_id ? {
          id: (attempt.quiz_id as any)._id?.toString() || '',
          tutor_id: '',
          title: (attempt.quiz_id as any).title || '',
          description: '',
          subject: (attempt.quiz_id as any).subject || '',
          time_limit_minutes: 0,
          total_questions: 0,
          total_points: 0,
          isPublic: false,
          createdAt: '',
          updatedAt: '',
          tutor: (attempt.quiz_id as any).createdBy ? {
            id: '',
            full_name: (attempt.quiz_id as any).createdBy.fullName || '',
            email: '',
          } : undefined,
        } : undefined,
      };

      // Get student answers with question data
      const answersResponse = await apiClient.get<{
        id: string;
        attempt_id: string;
        question_id: string;
        selected_answer_id?: string;
        answer_text?: string;
        is_correct: boolean;
        points_earned: number;
        created_at: string;
        updated_at: string;
        question?: {
          id: string;
          question_text: string;
          question_type: string;
          points: number;
          answers?: {
            id: string;
            answer_text: string;
            is_correct: boolean;
            explanation?: string;
            answer_order: number;
          }[];
          explanation?: string;
          hint?: string;
          difficulty?: string;
          tags?: string[];
          question_order: number;
          is_active: boolean;
        };
      }[]>(`/api/quizzes/student/attempts/${attemptId}/answers`);

      // Transform student answers to frontend format
      const studentAnswers: StudentAnswer[] = answersResponse.map(answer => ({
        id: answer.id,
        attempt_id: answer.attempt_id,
        question_id: answer.question_id,
        selected_answer_id: answer.selected_answer_id,
        answer_text: answer.answer_text,
        is_correct: answer.is_correct,
        points_earned: answer.points_earned,
        created_at: answer.created_at,
        updated_at: answer.updated_at,
      }));

      // Extract unique questions from answers
      const questionsMap = new Map<string, Question>();
      answersResponse.forEach(answer => {
        if (answer.question) {
          questionsMap.set(answer.question.id, {
            id: answer.question.id,
            quiz_id: attempt.quiz_id.toString(),
            question_text: answer.question.question_text,
            question_type: answer.question.question_type as any,
            points: answer.question.points,
            answers: answer.question.answers?.map(a => ({
              id: a.id,
              question_id: answer.question!.id,
              answer_text: a.answer_text,
              is_correct: a.is_correct,
              explanation: a.explanation,
              answer_order: a.answer_order,
              created_at: '',
              updated_at: '',
            })),
            question_order: answer.question.question_order,
            created_at: '',
            is_ai_generated: false,
            ai_status: 'approved',
          });
        }
      });

      const questions = Array.from(questionsMap.values()).sort((a, b) => (a.question_order || 0) - (b.question_order || 0));

      return {
        attempt: transformedAttempt,
        studentAnswers,
        questions,
      };
    },
  },
};
