import { supabase } from "./supabase";
import type { Quiz } from "@/types/quiz";

export interface AdminQuiz extends Quiz {
  tutor: {
    id: string;
    full_name: string;
    email: string;
  };
  total_attempts: number;
  avg_score: number;
}

export interface QuizStats {
  total: number;
  active: number;
  inactive: number;
  total_attempts: number;
  by_subject: Record<string, number>;
}

export class AdminQuizService {
  // Fetch all quizzes from all tutors
  static async getAllQuizzes(): Promise<AdminQuiz[]> {
    try {
      console.log("Fetching all quizzes with admin service...");

      // First try to get quizzes with tutor info using explicit join
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching quizzes:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("No quizzes found");
        return [];
      }

      // Get tutor information separately to avoid foreign key issues
      const tutorIds = [...new Set(data.map((quiz) => quiz.tutor_id))].filter(
        Boolean
      );

      let tutorMap = new Map();
      if (tutorIds.length > 0) {
        const { data: tutors, error: tutorError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", tutorIds);

        if (tutorError) {
          console.error("Error fetching tutors:", tutorError);
        } else {
          tutors?.forEach((tutor) => {
            tutorMap.set(tutor.id, tutor);
          });
        }
      }

      // Get quiz attempt statistics for each quiz
      const quizzesWithStats = await Promise.all(
        data.map(async (quiz) => {
          // Get attempt statistics
          const { data: attempts, error: attemptsError } = await supabase
            .from("quiz_attempts")
            .select("score, max_score")
            .eq("quiz_id", quiz.id)
            .eq("status", "completed");

          if (attemptsError) {
            console.error("Error fetching attempts for quiz:", quiz.id);
          }

          const totalAttempts = attempts?.length || 0;
          const avgScore =
            totalAttempts > 0
              ? attempts.reduce(
                  (sum, attempt) => sum + (attempt.score || 0),
                  0
                ) / totalAttempts
              : 0;

          // Get tutor info from our map
          const tutor = tutorMap.get(quiz.tutor_id) || {
            id: quiz.tutor_id,
            full_name: "Unknown Tutor",
            email: "unknown@example.com",
          };

          return {
            ...quiz,
            tutor,
            total_attempts: totalAttempts,
            avg_score: avgScore,
          } as AdminQuiz;
        })
      );

      console.log(
        "Quizzes fetched with admin service:",
        quizzesWithStats.length
      );
      return quizzesWithStats;
    } catch (error) {
      console.error("Error in getAllQuizzes:", error);
      throw error;
    }
  }

  // Get quiz statistics
  static async getQuizStats(): Promise<QuizStats> {
    try {
      // Get total quizzes and active/inactive counts
      const { data: quizzes, error: quizzesError } = await supabase
        .from("quizzes")
        .select("is_active, subject");

      if (quizzesError) throw quizzesError;

      const total = quizzes?.length || 0;
      const active = quizzes?.filter((q) => q.is_active).length || 0;
      const inactive = total - active;

      // Count by subject
      const bySubject: Record<string, number> = {};
      quizzes?.forEach((quiz) => {
        bySubject[quiz.subject] = (bySubject[quiz.subject] || 0) + 1;
      });

      // Get total attempts across all quizzes
      const { count: totalAttempts } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true });

      return {
        total,
        active,
        inactive,
        total_attempts: totalAttempts || 0,
        by_subject: bySubject,
      };
    } catch (error) {
      console.error("Error getting quiz stats:", error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        total_attempts: 0,
        by_subject: {},
      };
    }
  }

  // Delete a quiz (and all its related data)
  static async deleteQuiz(quizId: string): Promise<boolean> {
    try {
      console.log("Starting quiz deletion for:", quizId);

      // Delete in correct order due to foreign key constraints

      // 1. First get all attempt IDs for this quiz
      const { data: attemptIds } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("quiz_id", quizId);

      console.log("Found attempts to delete:", attemptIds?.length || 0);

      // 2. Delete student answers for these attempts
      if (attemptIds && attemptIds.length > 0) {
        const attemptIdList = attemptIds.map((a) => a.id);
        const { error: studentAnswersError } = await supabase
          .from("student_answers")
          .delete()
          .in("attempt_id", attemptIdList);

        if (studentAnswersError) {
          console.error("Error deleting student answers:", studentAnswersError);
        } else {
          console.log("Student answers deleted successfully");
        }
      }

      // 3. Delete quiz attempts
      const { error: attemptsError } = await supabase
        .from("quiz_attempts")
        .delete()
        .eq("quiz_id", quizId);

      if (attemptsError) {
        console.error("Error deleting quiz attempts:", attemptsError);
      } else {
        console.log("Quiz attempts deleted successfully");
      }

      // 4. Get all question IDs for this quiz
      const { data: questionIds } = await supabase
        .from("quiz_questions")
        .select("id")
        .eq("quiz_id", quizId);

      console.log("Found questions to delete:", questionIds?.length || 0);

      // 5. Delete quiz answers for these questions
      if (questionIds && questionIds.length > 0) {
        const questionIdList = (questionIds as { id: string }[]).map((q) => q.id);
        const { error: answersError } = await supabase
          .from("quiz_answers")
          .delete()
          .in("question_id", questionIdList);

        if (answersError) {
          console.error("Error deleting quiz answers:", answersError);
        } else {
          console.log("Quiz answers deleted successfully");
        }
      }

      // 6. Delete quiz questions
      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("quiz_id", quizId);

      if (questionsError) {
        console.error("Error deleting quiz questions:", questionsError);
      } else {
        console.log("Quiz questions deleted successfully");
      }

      // 7. Finally delete the quiz
      const { error: quizError } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId);

      if (quizError) {
        console.error("Error deleting quiz:", quizError);
        throw quizError;
      }

      console.log("Quiz deleted successfully");
      return true;
    } catch (error) {
      console.error("Error in deleteQuiz:", error);
      throw error;
    }
  }

  // Get quiz details with questions and attempts
  static async getQuizDetails(quizId: string): Promise<AdminQuiz | null> {
    try {
      console.log("Fetching quiz details for:", quizId);

      // First get the quiz basic info
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();

      if (quizError) {
        console.error("Error fetching quiz:", quizError);
        throw quizError;
      }
      if (!quiz) return null;

      const typedQuiz = quiz as Quiz;
      console.log("Quiz found:", typedQuiz.title);

      // Get tutor information separately
      let tutor = {
        id: typedQuiz.tutor_id,
        full_name: "Unknown Tutor",
        email: "unknown@example.com",
      };

      if (typedQuiz.tutor_id) {
        const { data: tutorData, error: tutorError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", typedQuiz.tutor_id)
          .single();

        if (tutorError) {
          console.error("Error fetching tutor:", tutorError);
        } else if (tutorData) {
          tutor = tutorData;
        }
      }

      // Get questions for this quiz
      console.log("Attempting to fetch questions for quiz_id:", quizId);
      console.log("Quiz ID type:", typeof quizId, "Value:", quizId);

      // Query the actual table names in your database
      const { data: questions, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("question_order");

      console.log("Questions query result:", { questions, questionsError });

      if (questionsError) {
        console.error(
          "Error fetching questions from quiz_questions:",
          questionsError
        );
      }

      console.log("Questions found:", questions?.length || 0);

      if (questions && questions.length > 0) {
        console.log("First question:", questions[0]);
        console.log(
          "All question IDs:",
          (questions as Question[]).map((q) => q.id)
        );
      }

      // Also check if there are ANY questions in the quiz_questions table
      const totalQuestionsResult = await supabase
        .from("quiz_questions")
        .select("*", { count: "exact", head: true });

      console.log("Total questions in database:", totalQuestionsResult.count);

      // Get answers for each question if questions exist
      let questionsWithAnswers: Question[] = [];
      if (questions && questions.length > 0) {
        questionsWithAnswers = await Promise.all(
          (questions as Question[]).map(async (question) => {
            const { data: answers, error: answersError } = await supabase
              .from("quiz_answers")
              .select("id, answer_text, is_correct, answer_order")
              .eq("question_id", question.id)
              .order("answer_order");

            if (answersError) {
              console.error(
                "Error fetching answers for question:",
                question.id,
                answersError
              );
            }

            console.log(
              `Question ${question.id} has ${answers?.length || 0} answers`
            );

            return {
              ...question,
              answers: answers || [],
            };
          })
        );
      }

      // Get attempt statistics
      const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("score, max_score")
        .eq("quiz_id", typedQuiz.id)
        .eq("status", "completed");

      const typedAttempts = attempts as { score?: number; max_score?: number }[] | null;
      const totalAttempts = typedAttempts?.length || 0;
      const avgScore =
        totalAttempts > 0
          ? typedAttempts!.reduce((sum: number, attempt: { score?: number }) => sum + (attempt.score || 0), 0) /
            totalAttempts
          : 0;

      const result = {
        ...typedQuiz,
        tutor,
        questions: questionsWithAnswers,
        total_attempts: totalAttempts,
        avg_score: avgScore,
      } as AdminQuiz;

      console.log("Final quiz details:", {
        id: result.id,
        title: result.title,
        tutor: result.tutor.full_name,
        questionCount: result.questions?.length || 0,
      });

      return result;
    } catch (error) {
      console.error("Error getting quiz details:", error);
      throw error;
    }
  }
}
