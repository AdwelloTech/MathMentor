import { supabase } from "./supabase";
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

export const quizService = {
  // Quiz operations
  quizzes: {
    create: async (
      tutorId: string,
      quizData: CreateQuizData
    ): Promise<Quiz> => {
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          tutor_id: tutorId,
          title: quizData.title,
          description: quizData.description,
          subject: quizData.subject,
          grade_level: quizData.grade_level,
          time_limit_minutes: quizData.time_limit_minutes,
          total_questions: quizData.total_questions,
          total_points: quizData.total_points,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions and answers
      for (const questionData of quizData.questions) {
        const { data: question, error: questionError } = await supabase
          .from("quiz_questions")
          .insert({
            quiz_id: quiz.id,
            question_text: questionData.question_text,
            question_type: questionData.question_type,
            points: questionData.points,
            question_order: questionData.question_order,
            is_ai_generated: (questionData as any).is_ai_generated ?? false,
            ai_status: (questionData as any).ai_status ?? null,
            ai_metadata: (questionData as any).ai_metadata ?? null,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        // Create answers for this question (only if answers are provided)
        const requiresAnswers = ["multiple_choice", "true_false"].includes(
          questionData.question_type as string
        );
        if (questionData.answers?.length) {
          const answersToInsert = questionData.answers.map((a) => ({
            question_id: question.id,
            answer_text: a.answer_text,
            is_correct: a.is_correct,
            // let DB default apply if not provided
            ...(a.answer_order !== undefined
              ? { answer_order: a.answer_order }
              : {}),
          }));
          const { error: answersError } = await supabase
            .from("quiz_answers")
            .insert(answersToInsert);
          if (answersError) throw answersError;
        } else if (requiresAnswers) {
          throw new Error(
            `Question of type ${questionData.question_type} must include at least one answer`
          );
        }
      }

      return quiz;
    },

    getById: async (quizId: string): Promise<Quiz> => {
      const { data, error } = await supabase
        .from("quizzes")
        .select(
          `
          *,
          tutor:profiles(id, full_name, email),
          questions:quiz_questions(
            *,
            answers:quiz_answers(*)
          )
        `
        )
        .eq("id", quizId)
        .single();

      if (error) throw error;
      return data;
    },

    getByTutorId: async (tutorId: string): Promise<Quiz[]> => {
      const { data, error } = await supabase
        .from("quizzes")
        .select(
          `
          *,
          tutor:profiles(id, full_name, email)
        `
        )
        .eq("tutor_id", tutorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },

    update: async (
      quizId: string,
      updateData: UpdateQuizData
    ): Promise<Quiz> => {
      const { data, error } = await supabase
        .from("quizzes")
        .update(updateData)
        .eq("id", quizId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (quizId: string): Promise<void> => {
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId);

      if (error) throw error;
    },

    getAll: async (): Promise<Quiz[]> => {
      const { data, error } = await supabase
        .from("quizzes")
        .select(
          `
          *,
          tutor:profiles(id, full_name, email)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  },

  // Question operations
  questions: {
    create: async (
      quizId: string,
      questionData: CreateQuestionData
    ): Promise<Question> => {
      const { data: question, error: questionError } = await supabase
        .from("quiz_questions")
        .insert({
          quiz_id: quizId,
          question_text: questionData.question_text,
          question_type: questionData.question_type,
          points: questionData.points,
          question_order: questionData.question_order,
          is_ai_generated: (questionData as any).is_ai_generated ?? false,
          ai_status: (questionData as any).ai_status ?? null,
          ai_metadata: (questionData as any).ai_metadata ?? null,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Create answers for this question (only if answers are provided)
      const requiresAnswers = ["multiple_choice", "true_false"].includes(
        questionData.question_type as string
      );
      if (questionData.answers?.length) {
        const answersToInsert = questionData.answers.map((a) => ({
          question_id: question.id,
          answer_text: a.answer_text,
          is_correct: a.is_correct,
          // let DB default apply if not provided
          ...(a.answer_order !== undefined
            ? { answer_order: a.answer_order }
            : {}),
        }));
        const { error: answersError } = await supabase
          .from("quiz_answers")
          .insert(answersToInsert);
        if (answersError) throw answersError;
      } else if (requiresAnswers) {
        throw new Error(
          `Question of type ${questionData.question_type} must include at least one answer`
        );
      }

      return question;
    },

    getByQuizId: async (quizId: string): Promise<Question[]> => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select(
          `
          *,
          answers:quiz_answers(*)
        `
        )
        .eq("quiz_id", quizId)
        .order("question_order", { ascending: true });

      if (error) throw error;
      return data;
    },

    update: async (
      questionId: string,
      updateData: Partial<Question>
    ): Promise<Question> => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .update(updateData)
        .eq("id", questionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (questionId: string): Promise<void> => {
      const { error } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;
    },
  },

  // Answer operations
  answers: {
    create: async (
      questionId: string,
      answerData: CreateAnswerData
    ): Promise<Answer> => {
      const { data, error } = await supabase
        .from("quiz_answers")
        .insert({
          question_id: questionId,
          answer_text: answerData.answer_text,
          is_correct: answerData.is_correct,
          answer_order: answerData.answer_order,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByQuestionId: async (questionId: string): Promise<Answer[]> => {
      const { data, error } = await supabase
        .from("quiz_answers")
        .select("*")
        .eq("question_id", questionId)
        .order("answer_order", { ascending: true });

      if (error) throw error;
      return data;
    },

    update: async (
      answerId: string,
      updateData: Partial<Answer>
    ): Promise<Answer> => {
      const { data, error } = await supabase
        .from("quiz_answers")
        .update(updateData)
        .eq("id", answerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (answerId: string): Promise<void> => {
      const { error } = await supabase
        .from("quiz_answers")
        .delete()
        .eq("id", answerId);

      if (error) throw error;
    },
  },

  // Quiz attempts operations
  attempts: {
    create: async (quizId: string, studentId: string): Promise<QuizAttempt> => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: quizId,
          student_id: studentId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getById: async (attemptId: string): Promise<QuizAttempt> => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select(
          `
          *,
          quiz:quizzes(*),
          student:profiles(id, full_name, email)
        `
        )
        .eq("id", attemptId)
        .single();

      if (error) throw error;
      return data;
    },

    // Update overall tutor feedback on an attempt
    saveTutorFeedback: async (
      attemptId: string,
      feedback: string
    ): Promise<void> => {
      const { error } = await supabase
        .from("quiz_attempts")
        .update({ tutor_feedback: feedback })
        .eq("id", attemptId);

      if (error) throw error;
    },

    getByStudentId: async (studentId: string): Promise<QuizAttempt[]> => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select(
          `
          *,
          quiz:quizzes(*)
        `
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },

    complete: async (
      attemptId: string,
      score: number,
      maxScore: number
    ): Promise<QuizAttempt> => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .update({
          completed_at: new Date().toISOString(),
          score: score,
          max_score: maxScore,
          status: "completed",
        })
        .eq("id", attemptId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  },

  // Student answers operations
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
      const { data, error } = await supabase
        .from("student_answers")
        .insert({
          attempt_id: attemptId,
          question_id: questionId,
          selected_answer_id: answerData.selected_answer_id,
          answer_text: answerData.answer_text,
          is_correct: answerData.is_correct,
          points_earned: answerData.points_earned,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByAttemptId: async (attemptId: string): Promise<StudentAnswer[]> => {
      const { data, error } = await supabase
        .from("student_answers")
        .select(
          `
          *,
          question:quiz_questions(*),
          selected_answer:quiz_answers(*)
        `
        )
        .eq("attempt_id", attemptId);

      if (error) throw error;
      return data;
    },
  },

  // Stats operations
  stats: {
    getTutorStats: async (tutorId: string): Promise<QuizStats> => {
      // Get total quizzes
      const { count: totalQuizzes } = await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true })
        .eq("tutor_id", tutorId);

      // Get active quizzes
      const { count: activeQuizzes } = await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true })
        .eq("tutor_id", tutorId)
        .eq("is_active", true);

      // Get quiz IDs for this tutor
      const { data: tutorQuizzes } = await supabase
        .from("quizzes")
        .select("id")
        .eq("tutor_id", tutorId);

      const quizIds = tutorQuizzes?.map((q) => q.id) || [];

      // Initialize stats
      let totalAttempts = 0;
      let averageScore = 0;
      let totalStudents = 0;

      // Only query attempts if the tutor has quizzes
      if (quizIds.length > 0) {
        // Get total attempts
        const { count: attemptsCount } = await supabase
          .from("quiz_attempts")
          .select("*", { count: "exact", head: true })
          .in("quiz_id", quizIds);

        totalAttempts = attemptsCount || 0;

        // Get average score
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("score, max_score")
          .in("quiz_id", quizIds)
          .not("score", "is", null);

        if (attempts && attempts.length > 0) {
          const totalScore = attempts.reduce(
            (sum, attempt) => sum + (attempt.score || 0),
            0
          );
          averageScore = totalScore / attempts.length;
        }

        // Get unique students
        const { count: studentsCount } = await supabase
          .from("quiz_attempts")
          .select("student_id", { count: "exact", head: true })
          .in("quiz_id", quizIds);

        totalStudents = studentsCount || 0;
      }

      return {
        total_quizzes: totalQuizzes || 0,
        active_quizzes: activeQuizzes || 0,
        total_attempts: totalAttempts,
        average_score: Math.round(averageScore * 100) / 100,
        total_students: totalStudents,
      };
    },
  },

  // Student quiz operations
  studentQuizzes: {
    // Get quizzes available to a student (from tutors they've booked with)
    getAvailableQuizzes: async (
      studentId: string,
      subjectFilter?: string
    ): Promise<Quiz[]> => {
      // First get the tutor IDs from class bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("class_bookings")
        .select(
          `
           tutor_classes!inner(tutor_id)
         `
        )
        .eq("student_id", studentId)
        .eq("booking_status", "confirmed");

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
        throw bookingsError;
      }

      const tutorUserIds =
        bookings
          ?.flatMap((booking) =>
            Array.isArray(booking.tutor_classes)
              ? booking.tutor_classes.map((tc: any) => tc.tutor_id)
              : [(booking.tutor_classes as any)?.tutor_id]
          )
          .filter(Boolean) || [];

      if (tutorUserIds.length === 0) {
        return [];
      }

      // Convert tutor user_ids to profile ids for quiz lookup
      const { data: tutorProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id")
        .in("user_id", tutorUserIds);

      if (profileError) {
        console.error("Error fetching tutor profiles:", profileError);
        throw profileError;
      }

      const tutorProfileIds = tutorProfiles?.map((profile) => profile.id) || [];

      if (tutorProfileIds.length === 0) {
        return [];
      }

      // Then get quizzes from those tutors
      const { data: quizzesData, error } = await supabase
        .from("quizzes")
        .select(
          `
           *,
           tutor:profiles(id, full_name, email)
         `
        )
        .eq("is_active", true)
        .in("tutor_id", tutorProfileIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching quizzes:", error);
        throw error;
      }

      // Get student's profile ID for attempt lookup
      const { data: studentProfile, error: studentProfileError } =
        await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", studentId)
          .single();

      if (studentProfileError) throw studentProfileError;

      // Get student's attempts for these quizzes
      const { data: attemptsData } = await supabase
        .from("quiz_attempts")
        .select(
          "id, quiz_id, status, score, max_score, correct_answers, total_questions, tutor_feedback"
        )
        .eq("student_id", studentProfile.id);

      // Add attempt status to each quiz
      const quizzesWithAttempts = quizzesData.map((quiz) => {
        const attempt = attemptsData?.find((a) => a.quiz_id === quiz.id);
        return {
          ...quiz,
          attempt_status: attempt?.status || null,
          attempt_score: attempt?.score || null,
          attempt_max_score: attempt?.max_score || null,
          attempt_correct_answers: attempt?.correct_answers || null,
          attempt_total_questions: attempt?.total_questions || null,
          attempt_id: attempt?.id || null,
          attempt_tutor_feedback: (attempt as any)?.tutor_feedback ?? null,
        };
      });

      // Filter by subject if provided
      if (subjectFilter) {
        const filtered = quizzesWithAttempts.filter(
          (quiz) => quiz.subject === subjectFilter
        );
        return filtered;
      }

      return quizzesWithAttempts;
    },

    // Get recent quizzes that the student has attempted or completed
    getRecentQuizzes: async (studentId: string): Promise<Quiz[]> => {
      try {
        // Get student's profile ID
        const { data: studentProfile, error: studentProfileError } =
          await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", studentId)
            .single();

        if (studentProfileError) throw studentProfileError;

        // Get recent quiz attempts
        const { data: attempts, error: attemptsError } = await supabase
          .from("quiz_attempts")
          .select(
            `
            id,
            quiz_id,
            status,
            score,
            max_score,
            correct_answers,
            total_questions,
            created_at,
            quiz:quizzes(
              id,
              title,
              description,
              subject,
              grade_level,
              time_limit_minutes,
              total_questions,
              total_points,
              created_at,
              tutor:profiles(id, full_name, email)
            )
          `
          )
          .eq("student_id", studentProfile.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (attemptsError) throw attemptsError;

        // Transform the data to match the expected Quiz format
        const recentQuizzes =
          attempts?.map((attempt) => ({
            ...attempt.quiz,
            attempt_status: attempt.status,
            attempt_score: attempt.score,
            attempt_max_score: attempt.max_score,
            attempt_correct_answers: attempt.correct_answers,
            attempt_total_questions: attempt.total_questions,
            attempt_id: attempt.id,
          })) || [];

        return recentQuizzes;
      } catch (error) {
        console.error("Error fetching recent quizzes:", error);
        throw error;
      }
    },

    // Get quiz with questions and answers for taking
    getQuizForTaking: async (quizId: string): Promise<Quiz> => {
      const { data, error } = await supabase
        .from("quizzes")
        .select(
          `
          *,
          tutor:profiles(id, full_name, email),
          questions:quiz_questions(
            id,
            quiz_id,
            question_text,
            question_type,
            points,
            question_order,
            created_at,
            answers:quiz_answers(id, answer_text, answer_order)
          )
        `
        )
        .eq("id", quizId)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },

    // Start a quiz attempt
    startQuizAttempt: async (
      quizId: string,
      studentId: string
    ): Promise<QuizAttempt> => {
      // Convert student user_id to profile id
      const { data: studentProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", studentId)
        .single();

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: quizId,
          student_id: studentProfile.id,
          status: "in_progress",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      // Get the attempt and quiz details
      const { data: attempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .select(
          `
          *,
          quiz:quizzes(*)
        `
        )
        .eq("id", attemptId)
        .single();

      if (attemptError) throw attemptError;

      // Get correct answers for all questions
      const { data: questions, error: questionsError } = await supabase
        .from("quiz_questions")
        .select(
          `
          *,
          answers:quiz_answers(*)
        `
        )
        .eq("quiz_id", attempt.quiz_id)
        .order("question_order", { ascending: true });

      if (questionsError) throw questionsError;

      let totalScore = 0;
      let maxScore = 0;
      const studentAnswers = [];

      // Calculate score for each answer
      for (const question of questions) {
        maxScore += question.points;
        const studentAnswer = answers.find((a) => a.questionId === question.id);

        if (studentAnswer) {
          let isCorrect = false;
          let pointsEarned = 0;

          if (
            question.question_type === "multiple_choice" &&
            studentAnswer.selectedAnswerId
          ) {
            const correctAnswer = question.answers.find(
              (a: any) => a.is_correct
            );
            isCorrect = correctAnswer?.id === studentAnswer.selectedAnswerId;
            pointsEarned = isCorrect ? question.points : 0;
          } else if (
            question.question_type === "true_false" &&
            studentAnswer.selectedAnswerId
          ) {
            const correctAnswer = question.answers.find(
              (a: any) => a.is_correct
            );
            isCorrect = correctAnswer?.id === studentAnswer.selectedAnswerId;
            pointsEarned = isCorrect ? question.points : 0;
          } else if (
            question.question_type === "short_answer" &&
            studentAnswer.answerText
          ) {
            // For short answer, we'll need manual grading later
            // For now, we'll store the answer but not auto-grade
            pointsEarned = 0;
          }

          totalScore += pointsEarned;

          studentAnswers.push({
            attempt_id: attemptId,
            question_id: question.id,
            selected_answer_id: studentAnswer.selectedAnswerId,
            answer_text: studentAnswer.answerText,
            is_correct: isCorrect,
            points_earned: pointsEarned,
          });
        }
      }

      // Insert student answers
      if (studentAnswers.length > 0) {
        const { error: insertError } = await supabase
          .from("student_answers")
          .insert(studentAnswers);

        if (insertError) throw insertError;
      }

      // Update attempt with final score
      const percentage =
        maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      // Calculate questions answered correctly
      const correctAnswers = studentAnswers.filter((a) => a.is_correct).length;
      const totalQuestions = questions.length;

      const { error: updateError } = await supabase
        .from("quiz_attempts")
        .update({
          completed_at: new Date().toISOString(),
          score: totalScore,
          max_score: maxScore,
          correct_answers: correctAnswers,
          total_questions: totalQuestions,
          status: "completed",
        })
        .eq("id", attemptId);

      if (updateError) throw updateError;

      return {
        score: totalScore,
        maxScore,
        percentage,
        correctAnswers,
        totalQuestions,
      };
    },

    // Get student's quiz attempts
    getStudentAttempts: async (studentId: string): Promise<QuizAttempt[]> => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select(
          `
          *,
          quiz:quizzes(
            *,
            tutor:profiles(id, full_name, email)
          )
        `
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },

    // Get attempt details with answers
    getAttemptDetails: async (
      attemptId: string
    ): Promise<{
      attempt: QuizAttempt;
      studentAnswers: StudentAnswer[];
      questions: Question[];
    }> => {
      console.log("Fetching attempt details for ID:", attemptId);

      const { data: attempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .select(
          `
          *,
          quiz:quizzes(
            *,
            tutor:profiles(id, full_name, email)
          )
        `
        )
        .eq("id", attemptId)
        .single();

      if (attemptError) {
        console.error("Error fetching attempt:", attemptError);
        throw attemptError;
      }

      if (!attempt) {
        throw new Error(`Attempt with ID ${attemptId} not found`);
      }

      console.log("Attempt found:", attempt);

      console.log("Fetching student answers for attempt:", attemptId);

      const { data: studentAnswers, error: answersError } = await supabase
        .from("student_answers")
        .select(
          `
          *,
          question:quiz_questions(
            id,
            quiz_id,
            question_text,
            question_type,
            points,
            question_order,
            created_at
          ),
          selected_answer:quiz_answers(*)
        `
        )
        .eq("attempt_id", attemptId);

      if (answersError) {
        console.error("Error fetching student answers:", answersError);
        throw answersError;
      }

      console.log("Student answers found:", studentAnswers);

      console.log("Fetching questions for quiz:", attempt.quiz_id);

      const { data: questions, error: questionsError } = await supabase
        .from("quiz_questions")
        .select(
          `
          id,
          quiz_id,
          question_text,
          question_type,
          points,
          question_order,
          created_at,
          answers:quiz_answers(*)
        `
        )
        .eq("quiz_id", attempt.quiz_id)
        .order("question_order", { ascending: true });

      if (questionsError) {
        console.error("Error fetching questions:", questionsError);
        throw questionsError;
      }

      console.log("Questions found:", questions);

      const result = {
        attempt,
        studentAnswers: studentAnswers || [],
        questions: questions || [],
      };

      console.log("Returning attempt details:", result);
      return result;
    },
  },
};
