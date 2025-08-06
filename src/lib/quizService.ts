import { supabase } from './supabase';
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
  QuizStats
} from '@/types/quiz';

export const quizService = {
  // Quiz operations
  quizzes: {
    create: async (tutorId: string, quizData: CreateQuizData): Promise<Quiz> => {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          tutor_id: tutorId,
          title: quizData.title,
          description: quizData.description,
          subject: quizData.subject,
          grade_level: quizData.grade_level,
          time_limit_minutes: quizData.time_limit_minutes,
          total_questions: quizData.total_questions,
          total_points: quizData.total_points
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions and answers
      for (const questionData of quizData.questions) {
        const { data: question, error: questionError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quiz.id,
            question_text: questionData.question_text,
            question_type: questionData.question_type,
            points: questionData.points,
            question_order: questionData.question_order
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create answers for this question
        for (const answerData of questionData.answers) {
          const { error: answerError } = await supabase
            .from('quiz_answers')
            .insert({
              question_id: question.id,
              answer_text: answerData.answer_text,
              is_correct: answerData.is_correct,
              answer_order: answerData.answer_order
            });

          if (answerError) throw answerError;
        }
      }

      return quiz;
    },

    getById: async (quizId: string): Promise<Quiz> => {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          tutor:profiles(id, full_name, email),
          questions:quiz_questions(
            *,
            answers:quiz_answers(*)
          )
        `)
        .eq('id', quizId)
        .single();

      if (error) throw error;
      return data;
    },

    getByTutorId: async (tutorId: string): Promise<Quiz[]> => {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          tutor:profiles(id, full_name, email)
        `)
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    update: async (quizId: string, updateData: UpdateQuizData): Promise<Quiz> => {
      const { data, error } = await supabase
        .from('quizzes')
        .update(updateData)
        .eq('id', quizId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (quizId: string): Promise<void> => {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;
    },

    getAll: async (): Promise<Quiz[]> => {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          tutor:profiles(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  },

  // Question operations
  questions: {
    create: async (quizId: string, questionData: CreateQuestionData): Promise<Question> => {
      const { data: question, error: questionError } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: quizId,
          question_text: questionData.question_text,
          question_type: questionData.question_type,
          points: questionData.points,
          question_order: questionData.question_order
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Create answers for this question
      for (const answerData of questionData.answers) {
        const { error: answerError } = await supabase
          .from('quiz_answers')
          .insert({
            question_id: question.id,
            answer_text: answerData.answer_text,
            is_correct: answerData.is_correct,
            answer_order: answerData.answer_order
          });

        if (answerError) throw answerError;
      }

      return question;
    },

    getByQuizId: async (quizId: string): Promise<Question[]> => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select(`
          *,
          answers:quiz_answers(*)
        `)
        .eq('quiz_id', quizId)
        .order('question_order', { ascending: true });

      if (error) throw error;
      return data;
    },

    update: async (questionId: string, updateData: Partial<Question>): Promise<Question> => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .update(updateData)
        .eq('id', questionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (questionId: string): Promise<void> => {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
    }
  },

  // Answer operations
  answers: {
    create: async (questionId: string, answerData: CreateAnswerData): Promise<Answer> => {
      const { data, error } = await supabase
        .from('quiz_answers')
        .insert({
          question_id: questionId,
          answer_text: answerData.answer_text,
          is_correct: answerData.is_correct,
          answer_order: answerData.answer_order
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByQuestionId: async (questionId: string): Promise<Answer[]> => {
      const { data, error } = await supabase
        .from('quiz_answers')
        .select('*')
        .eq('question_id', questionId)
        .order('answer_order', { ascending: true });

      if (error) throw error;
      return data;
    },

    update: async (answerId: string, updateData: Partial<Answer>): Promise<Answer> => {
      const { data, error } = await supabase
        .from('quiz_answers')
        .update(updateData)
        .eq('id', answerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (answerId: string): Promise<void> => {
      const { error } = await supabase
        .from('quiz_answers')
        .delete()
        .eq('id', answerId);

      if (error) throw error;
    }
  },

  // Quiz attempts operations
  attempts: {
    create: async (quizId: string, studentId: string): Promise<QuizAttempt> => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          student_id: studentId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getById: async (attemptId: string): Promise<QuizAttempt> => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes(*),
          student:profiles(id, full_name, email)
        `)
        .eq('id', attemptId)
        .single();

      if (error) throw error;
      return data;
    },

    getByStudentId: async (studentId: string): Promise<QuizAttempt[]> => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quiz:quizzes(*)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    complete: async (attemptId: string, score: number, maxScore: number): Promise<QuizAttempt> => {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .update({
          completed_at: new Date().toISOString(),
          score: score,
          max_score: maxScore,
          status: 'completed'
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Student answers operations
  studentAnswers: {
    create: async (attemptId: string, questionId: string, answerData: {
      selected_answer_id?: string;
      answer_text?: string;
      is_correct?: boolean;
      points_earned: number;
    }): Promise<StudentAnswer> => {
      const { data, error } = await supabase
        .from('student_answers')
        .insert({
          attempt_id: attemptId,
          question_id: questionId,
          selected_answer_id: answerData.selected_answer_id,
          answer_text: answerData.answer_text,
          is_correct: answerData.is_correct,
          points_earned: answerData.points_earned
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByAttemptId: async (attemptId: string): Promise<StudentAnswer[]> => {
      const { data, error } = await supabase
        .from('student_answers')
        .select(`
          *,
          question:quiz_questions(*),
          selected_answer:quiz_answers(*)
        `)
        .eq('attempt_id', attemptId);

      if (error) throw error;
      return data;
    }
  },

  // Stats operations
  stats: {
    getTutorStats: async (tutorId: string): Promise<QuizStats> => {
      // Get total quizzes
      const { count: totalQuizzes } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', tutorId);

      // Get active quizzes
      const { count: activeQuizzes } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('tutor_id', tutorId)
        .eq('is_active', true);

      // Get quiz IDs for this tutor
      const { data: tutorQuizzes } = await supabase
        .from('quizzes')
        .select('id')
        .eq('tutor_id', tutorId);

      const quizIds = tutorQuizzes?.map(q => q.id) || [];

      // Initialize stats
      let totalAttempts = 0;
      let averageScore = 0;
      let totalStudents = 0;

      // Only query attempts if the tutor has quizzes
      if (quizIds.length > 0) {
        // Get total attempts
        const { count: attemptsCount } = await supabase
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .in('quiz_id', quizIds);

        totalAttempts = attemptsCount || 0;

        // Get average score
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('score, max_score')
          .in('quiz_id', quizIds)
          .not('score', 'is', null);

        if (attempts && attempts.length > 0) {
          const totalScore = attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
          averageScore = totalScore / attempts.length;
        }

        // Get unique students
        const { count: studentsCount } = await supabase
          .from('quiz_attempts')
          .select('student_id', { count: 'exact', head: true })
          .in('quiz_id', quizIds);

        totalStudents = studentsCount || 0;
      }

      return {
        total_quizzes: totalQuizzes || 0,
        active_quizzes: activeQuizzes || 0,
        total_attempts: totalAttempts,
        average_score: Math.round(averageScore * 100) / 100,
        total_students: totalStudents
      };
    }
  }
}; 