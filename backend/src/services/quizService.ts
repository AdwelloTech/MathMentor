import mongoose from 'mongoose';
import { Quiz, IQuiz, QuizAttempt, IQuizAttempt } from '../models/Quiz';
import { Question, IQuestion, IAnswer } from '../models/Question';
import { User } from '../models/User';

export interface CreateQuizData {
  title: string;
  description?: string;
  subject: string;
  gradeLevelId?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple_choice' | 'true_false' | 'mixed';
  totalQuestions: number;
  timeLimit?: number;
  isPublic?: boolean;
  tags?: string[];
  passingScore?: number;
  instructions?: string;
  questions?: any[]; // Frontend question format
}

export interface UpdateQuizData {
  title?: string;
  description?: string;
  subject?: string;
  gradeLevelId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionType?: 'multiple_choice' | 'true_false' | 'mixed';
  totalQuestions?: number;
  timeLimit?: number;
  isPublic?: boolean;
  tags?: string[];
  passingScore?: number;
  instructions?: string;
}

export interface QuizFilters {
  tutorId?: string;
  subject?: string;
  difficulty?: string;
  gradeLevelId?: string;
  isPublic?: boolean;
  userId?: string;
  limit?: number;
  skip?: number;
}

export class QuizService {
  // Helper function to check if a quiz attempt has expired
  private static async isAttemptExpired(attempt: any): Promise<boolean> {
    if (!attempt || !attempt.started_at) return false;

    // Get the quiz to check time limit
    const quiz = await Quiz.findById(attempt.quiz_id);
    if (!quiz || !quiz.timeLimit) return false;

    const startTime = new Date(attempt.started_at).getTime();
    const timeLimit = quiz.timeLimit * 60 * 1000; // Convert minutes to milliseconds
    const now = new Date().getTime();

    return now - startTime > timeLimit;
  }
  // Create a new quiz
  static async createQuiz(userId: string, quizData: CreateQuizData): Promise<IQuiz> {
    // Check if user is a tutor to automatically make quiz public
    const user = await User.findById(userId);
    const isTutor = user?.role === 'tutor';

    const quiz = new Quiz({
      title: quizData.title,
      description: quizData.description,
      subject: quizData.subject,
      gradeLevelId: quizData.gradeLevelId,
      difficulty: quizData.difficulty,
      questionType: quizData.questionType,
      totalQuestions: quizData.totalQuestions,
      timeLimit: quizData.timeLimit,
      isPublic: quizData.isPublic !== undefined ? quizData.isPublic : isTutor,
      tags: quizData.tags,
      passingScore: quizData.passingScore,
      instructions: quizData.instructions,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true,
    });

    const savedQuiz = await quiz.save();

    // Create questions if provided
    if (quizData.questions && quizData.questions.length > 0) {
      const { QuestionService } = await import('./questionService');

      for (const questionData of quizData.questions) {
        // Transform frontend format to backend format
        const backendQuestionData = {
          quizId: savedQuiz._id.toString(),
          questionText: (questionData as any).question_text,
          questionType: (questionData as any).question_type,
          points: (questionData as any).points,
          answers: (questionData as any).answers?.map((answer: any, index: number) => ({
            answerText: answer.answer_text,
            isCorrect: answer.is_correct,
            order: answer.answer_order || index,
          })),
          explanation: (questionData as any).explanation,
          hint: (questionData as any).hint,
          difficulty: (questionData as any).difficulty,
          tags: (questionData as any).tags,
          order: (questionData as any).question_order,
          isAiGenerated: (questionData as any).is_ai_generated,
          aiStatus: (questionData as any).ai_status,
          aiMetadata: (questionData as any).ai_metadata,
        };

        await QuestionService.createQuestion(userId, backendQuestionData);
      }
    }

    return savedQuiz;
  }

  // Get quiz by ID
  static async getQuizById(quizId: string, userId?: string): Promise<IQuiz | null> {
    const query: any = { _id: quizId, isActive: true };

    // If userId provided, check if quiz is public or created by user
    if (userId) {
      query.$or = [
        { isPublic: true },
        { createdBy: new mongoose.Types.ObjectId(userId) }
      ];
    } else {
      query.isPublic = true;
    }

    return await Quiz.findOne(query)
      .populate('createdBy', 'firstName lastName fullName')
      .populate('gradeLevelId', 'displayName');
  }

  // Get quizzes with filters
  static async getQuizzes(filters: QuizFilters): Promise<{ quizzes: IQuiz[]; total: number }> {
    const query: any = { isActive: true };

    // Apply filters
    if (filters.subject) {
      query.subject = new RegExp(filters.subject, 'i');
    }

    if (filters.difficulty) {
      query.difficulty = filters.difficulty;
    }

    if (filters.gradeLevelId) {
      query.gradeLevelId = new mongoose.Types.ObjectId(filters.gradeLevelId);
    }

    if (filters.isPublic !== undefined) {
      query.isPublic = filters.isPublic;
    }

    // User-specific filters
    if (filters.userId) {
      if (filters.tutorId && filters.tutorId !== filters.userId) {
        // If filtering by another tutor's quizzes, only show public ones
        query.isPublic = true;
        query.createdBy = new mongoose.Types.ObjectId(filters.tutorId);
      } else {
        // Show user's own quizzes or public quizzes
        query.$or = [
          { createdBy: new mongoose.Types.ObjectId(filters.userId) },
          { isPublic: true }
        ];
      }
    } else {
      // No user context, only public quizzes
      query.isPublic = true;
    }

    const limit = filters.limit || 20;
    const skip = filters.skip || 0;

    const [quizzes, total] = await Promise.all([
      Quiz.find(query)
        .populate('createdBy', 'firstName lastName fullName')
        .populate('gradeLevelId', 'displayName')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      Quiz.countDocuments(query)
    ]);

    return { quizzes, total };
  }

  // Update quiz
  static async updateQuiz(quizId: string, userId: string, updateData: UpdateQuizData): Promise<IQuiz> {
    const quiz = await Quiz.findOne({
      _id: quizId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    Object.assign(quiz, updateData);
    return await quiz.save();
  }

  // Delete quiz (soft delete)
  static async deleteQuiz(quizId: string, userId: string): Promise<void> {
    const quiz = await Quiz.findOne({
      _id: quizId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    // Soft delete the quiz
    quiz.isActive = false;
    await quiz.save();

    // Also deactivate all questions in the quiz
    await Question.updateMany(
      { quizId: quiz._id },
      { isActive: false }
    );
  }

  // Duplicate quiz
  static async duplicateQuiz(quizId: string, userId: string, newTitle?: string): Promise<IQuiz> {
    const originalQuiz = await Quiz.findOne({
      _id: quizId,
      isActive: true,
      $or: [
        { isPublic: true },
        { createdBy: new mongoose.Types.ObjectId(userId) }
      ]
    });

    if (!originalQuiz) {
      throw new Error('Quiz not found or access denied');
    }

    // Create duplicate quiz
    const duplicateQuiz = new Quiz({
      title: newTitle || `${originalQuiz.title} (Copy)`,
      description: originalQuiz.description,
      subject: originalQuiz.subject,
      gradeLevelId: originalQuiz.gradeLevelId,
      createdBy: new mongoose.Types.ObjectId(userId),
      difficulty: originalQuiz.difficulty,
      questionType: originalQuiz.questionType,
      totalQuestions: originalQuiz.totalQuestions,
      timeLimit: originalQuiz.timeLimit,
      isPublic: false, // Duplicates are private by default
      tags: originalQuiz.tags,
      passingScore: originalQuiz.passingScore,
      instructions: originalQuiz.instructions,
      isActive: true,
    });

    const savedQuiz = await duplicateQuiz.save();

    // Copy questions
    const questions = await Question.find({
      quizId: originalQuiz._id,
      isActive: true
    });

    for (const question of questions) {
      const newQuestion = new Question({
        quizId: savedQuiz._id,
        questionText: question.questionText,
        questionType: question.questionType,
        points: question.points,
        answers: question.answers,
        explanation: question.explanation,
        hint: question.hint,
        difficulty: question.difficulty,
        tags: question.tags,
        order: question.order,
        isActive: true,
      });
      await newQuestion.save();
    }

    return savedQuiz;
  }

  // Get quiz statistics
  static async getQuizStats(quizId: string, userId: string): Promise<{
    quiz: IQuiz;
    questionCount: number;
    completedQuestions: number;
    isComplete: boolean;
  }> {
    const quiz = await this.getQuizById(quizId, userId);
    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    const [questionCount, completedQuestions] = await Promise.all([
      Question.countDocuments({ quizId: quiz._id, isActive: true }),
      Question.countDocuments({
        quizId: quiz._id,
        isActive: true,
        answers: { $exists: true, $ne: [] }
      })
    ]);

    const isComplete = questionCount === quiz.totalQuestions && completedQuestions === quiz.totalQuestions;

    return {
      quiz,
      questionCount,
      completedQuestions,
      isComplete
    };
  }

  // Publish/unpublish quiz
  static async togglePublishStatus(quizId: string, userId: string): Promise<IQuiz> {
    const quiz = await Quiz.findOne({
      _id: quizId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    quiz.isPublic = !quiz.isPublic;
    return await quiz.save();
  }

  // Student quiz methods

  // Start a quiz attempt for a student
  static async startQuizAttempt(quizId: string, studentId: string): Promise<IQuizAttempt> {
    // Check if student already has an in-progress attempt for this quiz
    const existingAttempt = await QuizAttempt.findOne({
      quiz_id: new mongoose.Types.ObjectId(quizId),
      student_id: new mongoose.Types.ObjectId(studentId),
      status: 'in_progress',
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    // Create new attempt
    const attempt = new QuizAttempt({
      quiz_id: new mongoose.Types.ObjectId(quizId),
      student_id: new mongoose.Types.ObjectId(studentId),
      status: 'in_progress',
      started_at: new Date(),
    });

    return await attempt.save();
  }

  // Get available quizzes for a student (from tutors they've had sessions with OR quizzes created by the student)
  static async getAvailableQuizzesForStudent(studentId: string, subject?: string): Promise<any[]> {
    // Include both public quizzes from tutors AND quizzes created by the student themselves
    const query: any = {
      isActive: true,
      $or: [
        { isPublic: true }, // Public quizzes from tutors
        { createdBy: new mongoose.Types.ObjectId(studentId) } // Quizzes created by the student
      ]
    };

    if (subject) {
      query.subject = new RegExp(subject, 'i');
    }

    // Get quizzes first
    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'firstName lastName fullName')
      .populate('gradeLevelId', 'displayName')
      .sort({ createdAt: -1 })
      .limit(50); // Increased limit to accommodate student-created quizzes

    // Import QuizAttempt here to avoid circular dependency
    const { QuizAttempt } = await import('../models/Quiz');

    // Get attempt status for each quiz and filter out quizzes with 0 questions
    const quizzesWithStatus = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await Question.countDocuments({ quizId: quiz._id });
        if (questionCount === 0) return null;

        // Check if student has attempted this quiz
        const latestAttempt = await QuizAttempt.findOne({
          quiz_id: quiz._id,
          student_id: new mongoose.Types.ObjectId(studentId)
        })
        .sort({ created_at: -1 })
        .lean();

        // Check if attempt has expired
        let isExpired = false;
        let status = latestAttempt?.status || null;
        
        if (latestAttempt && status === 'in_progress') {
          isExpired = await this.isAttemptExpired(latestAttempt);
          if (isExpired) {
            // Update attempt status to expired
            await QuizAttempt.updateOne(
              { _id: latestAttempt._id },
              { status: 'expired' }
            );
            status = 'expired';
          }
        }

        const quizObj = quiz.toObject();
        return {
          ...quizObj,
          id: quizObj.id || quizObj._id.toString(),
          attempt_status: status,
          attempt_id: latestAttempt?._id || null,
          attempt_expired: isExpired
        };
      })
    );

    // Remove null entries (quizzes with 0 questions)
    return quizzesWithStatus.filter((quiz) => quiz !== null);
  }

  // Get recent quiz attempts for a student
  static async getRecentQuizzesForStudent(studentId: string): Promise<any[]> {
    // Import QuizAttempt here to avoid circular dependency
    const { QuizAttempt } = await import('../models/Quiz');

    const recentAttempts = await QuizAttempt.find({
      student_id: new mongoose.Types.ObjectId(studentId)
    })
    .populate({
      path: 'quiz_id',
      populate: [
        { path: 'createdBy', select: 'firstName lastName fullName' },
        { path: 'gradeLevelId', select: 'displayName' }
      ]
    })
    .sort({ created_at: -1 })
    .limit(10)
    .lean();

    // Transform to match expected format
    return recentAttempts.map((attempt: any) => ({
      id: attempt._id,
      title: attempt.quiz_id?.title || 'Unknown Quiz',
      description: attempt.quiz_id?.description,
      subject: attempt.quiz_id?.subject,
      grade_level: attempt.quiz_id?.gradeLevelId?.displayName,
      difficulty: attempt.quiz_id?.difficulty,
      total_questions: attempt.quiz_id?.totalQuestions,
      time_limit_minutes: attempt.quiz_id?.timeLimit,
      created_at: attempt.quiz_id?.createdAt,
      tutor: attempt.quiz_id?.createdBy,
      attempt_status: attempt.status,
      attempt_score: attempt.score,
      attempt_max_score: attempt.max_score,
      attempt_correct_answers: attempt.correct_answers,
      attempt_total_questions: attempt.total_questions,
      attempt_id: attempt._id,
      attempt_created_at: attempt.created_at,
    }));
  }

  // Get all quiz attempts for a student
  static async getStudentAttempts(studentId: string): Promise<any[]> {
    // Import QuizAttempt here to avoid circular dependency
    const { QuizAttempt } = await import('../models/Quiz');

    const attempts = await QuizAttempt.find({
      student_id: new mongoose.Types.ObjectId(studentId)
    })
    .populate({
      path: 'quiz_id',
      populate: [
        { path: 'createdBy', select: 'firstName lastName fullName' },
        { path: 'gradeLevelId', select: 'displayName' }
      ]
    })
    .sort({ created_at: -1 })
    .lean();

    // Transform to match frontend expectations (quiz instead of quiz_id)
    return attempts.map((attempt: any) => ({
      id: attempt._id,
      quiz_id: attempt.quiz_id?._id || attempt.quiz_id,
      student_id: attempt.student_id,
      status: attempt.status,
      score: attempt.score,
      max_score: attempt.max_score,
      correct_answers: attempt.correct_answers,
      total_questions: attempt.total_questions,
      started_at: attempt.started_at,
      completed_at: attempt.completed_at,
      tutor_feedback: attempt.tutor_feedback,
      created_at: attempt.created_at,
      updated_at: attempt.updated_at,
      quiz: attempt.quiz_id ? {
        id: attempt.quiz_id._id,
        title: attempt.quiz_id.title,
        description: attempt.quiz_id.description,
        subject: attempt.quiz_id.subject,
        gradeLevelId: attempt.quiz_id.gradeLevelId,
        difficulty: attempt.quiz_id.difficulty,
        questionType: attempt.quiz_id.questionType,
        totalQuestions: attempt.quiz_id.totalQuestions,
        timeLimit: attempt.quiz_id.timeLimit,
        isPublic: attempt.quiz_id.isPublic,
        isActive: attempt.quiz_id.isActive,
        tags: attempt.quiz_id.tags,
        passingScore: attempt.quiz_id.passingScore,
        instructions: attempt.quiz_id.instructions,
        createdAt: attempt.quiz_id.createdAt,
        updatedAt: attempt.quiz_id.updatedAt,
        tutor: attempt.quiz_id.createdBy ? {
          id: attempt.quiz_id.createdBy._id,
          firstName: attempt.quiz_id.createdBy.firstName,
          lastName: attempt.quiz_id.createdBy.lastName,
          full_name: attempt.quiz_id.createdBy.fullName
        } : undefined
      } : undefined
    }));
  }

  // Get all quiz attempts for a specific quiz (for tutors to view student responses)
  static async getQuizAttempts(quizId: string, userId: string): Promise<any[]> {
    // Verify the user owns this quiz
    const quiz = await Quiz.findOne({
      _id: quizId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    // Import QuizAttempt here to avoid circular dependency
    const { QuizAttempt } = await import('../models/Quiz');

    const attempts = await QuizAttempt.find({
      quiz_id: new mongoose.Types.ObjectId(quizId)
    })
    .populate({
      path: 'student_id',
      select: 'firstName lastName fullName email'
    })
    .sort({ created_at: -1 })
    .lean();

    return attempts;
  }

  // Get quiz attempt details by attempt ID
  static async getAttemptById(attemptId: string, userId: string): Promise<any> {
    // Import QuizAttempt here to avoid circular dependency
    const { QuizAttempt } = await import('../models/Quiz');

    const attempt = await QuizAttempt.findOne({
      _id: new mongoose.Types.ObjectId(attemptId),
      $or: [
        { student_id: new mongoose.Types.ObjectId(userId) }, // Student owns the attempt
        // For tutors, check if they own the quiz that the attempt belongs to
        {
          quiz_id: {
            $in: await Quiz.find({
              createdBy: new mongoose.Types.ObjectId(userId),
              isActive: true
            }).distinct('_id')
          }
        }
      ]
    })
    .populate({
      path: 'student_id',
      select: 'firstName lastName fullName email'
    })
    .populate({
      path: 'quiz_id',
      select: 'title subject createdBy',
      populate: {
        path: 'createdBy',
        select: 'firstName lastName fullName'
      }
    })
    .lean();

    if (!attempt) {
      throw new Error('Attempt not found or access denied');
    }

    // Check if attempt has expired
    if (attempt.status === 'in_progress' && await this.isAttemptExpired(attempt)) {
      // Update attempt status to expired
      await QuizAttempt.updateOne(
        { _id: attempt._id },
        { status: 'expired' }
      );
      attempt.status = 'expired';
    }

    return attempt;
  }

  // Submit quiz answers and calculate score
  static async submitQuizAttempt(
    attemptId: string,
    studentId: string,
    answers: Array<{
      questionId: string;
      selectedAnswerId?: string;
      answerText?: string;
    }>
  ): Promise<{
    score: number;
    maxScore: number;
    percentage: number;
    correctAnswers: number;
    totalQuestions: number;
  }> {
    // Import models here to avoid circular dependencies
    const { QuizAttempt, StudentAnswer } = await import('../models/Quiz');
    const { QuestionService } = await import('./questionService');

    // Get the attempt - check for both in_progress and expired status
    const attempt = await QuizAttempt.findOne({
      _id: new mongoose.Types.ObjectId(attemptId),
      student_id: new mongoose.Types.ObjectId(studentId),
      status: { $in: ['in_progress', 'expired'] }
    });

    if (!attempt) {
      throw new Error('Quiz attempt not found or already completed');
    }

    // Check if attempt has expired (or was already marked as expired)
    if (attempt.status === 'expired' || await this.isAttemptExpired(attempt)) {
      // Update attempt status to expired if not already
      if (attempt.status !== 'expired') {
        await QuizAttempt.updateOne(
          { _id: attempt._id },
          { status: 'expired' }
        );
      }
      throw new Error('Quiz attempt has expired');
    }

    // Get all questions for this quiz (pass studentId for access check)
    const questions = await QuestionService.getQuestionsByQuiz(attempt.quiz_id.toString(), studentId);

    let totalScore = 0;
    let maxScore = 0;
    let correctAnswers = 0;

    // Process each answer
    for (const answer of answers) {
      const question = questions.find((q: any) => q.id === answer.questionId);
      if (!question) continue;

      maxScore += question.points || 0;

      // Determine if answer is correct
      let isCorrect = false;
      let pointsEarned = 0;

      if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
        // For multiple choice/true false, check if selected answer is correct
        if (answer.selectedAnswerId) {
          const selectedAnswer = question.answers?.find((a: any) => a.id === answer.selectedAnswerId);
          isCorrect = selectedAnswer?.isCorrect || false;
        }
      } else if (question.questionType === 'short_answer') {
        // For short answer, we'd need manual grading - for now, assume incorrect
        // In a real implementation, this would be graded by tutor
        isCorrect = false;
      }

      if (isCorrect) {
        pointsEarned = question.points || 0;
        correctAnswers++;
      }

      totalScore += pointsEarned;

      // Save student answer
      await StudentAnswer.create({
        attempt_id: attempt._id,
        question_id: new mongoose.Types.ObjectId(question.id),
        selected_answer_id: answer.selectedAnswerId ? new mongoose.Types.ObjectId(answer.selectedAnswerId) : undefined,
        answer_text: answer.answerText,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      });
    }

    // Update attempt with results
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    await QuizAttempt.updateOne(
      { _id: attempt._id },
      {
        status: 'completed',
        score: totalScore,
        max_score: maxScore,
        correct_answers: correctAnswers,
        total_questions: questions.length,
        completed_at: new Date(),
      }
    );

    return {
      score: totalScore,
      maxScore,
      percentage,
      correctAnswers,
      totalQuestions: questions.length,
    };
  }

  // Save tutor feedback for a quiz attempt
  static async saveTutorFeedback(attemptId: string, tutorId: string, feedback: string): Promise<void> {
    // Import QuizAttempt here to avoid circular dependency
    const { QuizAttempt } = await import('../models/Quiz');

    // First verify the tutor owns the quiz that this attempt belongs to
    const attempt = await QuizAttempt.findOne({
      _id: new mongoose.Types.ObjectId(attemptId)
    }).populate('quiz_id', 'createdBy');

    if (!attempt) {
      throw new Error('Quiz attempt not found');
    }

    // Check if the tutor owns this quiz
    const quizCreatedBy = (attempt.quiz_id as any)?.createdBy?.toString();
    if (!quizCreatedBy || quizCreatedBy !== tutorId) {
      throw new Error('Access denied: You can only provide feedback for attempts on your own quizzes');
    }

    // Update the feedback
    await QuizAttempt.updateOne(
      { _id: new mongoose.Types.ObjectId(attemptId) },
      { tutor_feedback: feedback }
    );
  }

  // Get student answers for an attempt
  static async getStudentAnswersByAttempt(attemptId: string, userId: string): Promise<any[]> {
    // Import models here to avoid circular dependencies
    const { StudentAnswer } = await import('../models/Quiz');

    // First verify the user has access to this attempt
    const attempt = await this.getAttemptById(attemptId, userId);
    if (!attempt) {
      throw new Error('Attempt not found or access denied');
    }

    const answers = await StudentAnswer.find({
      attempt_id: new mongoose.Types.ObjectId(attemptId)
    })
    .populate({
      path: 'question_id',
      select: 'questionText questionType points answers explanation hint difficulty tags order isActive'
    })
    .populate({
      path: 'selected_answer_id',
      select: 'answerText isCorrect explanation order'
    })
    .sort({ created_at: 1 })
    .lean();

    // Transform to match frontend format
    return answers.map((answer: any) => ({
      id: answer._id?.toString(),
      attempt_id: answer.attempt_id?.toString(),
      question_id: answer.question_id?._id?.toString(),
      selected_answer_id: answer.selected_answer_id?._id?.toString(),
      answer_text: answer.answer_text,
      is_correct: answer.is_correct,
      points_earned: answer.points_earned,
      created_at: answer.created_at,
      updated_at: answer.updated_at,
      // Include populated question data
      question: answer.question_id ? {
        id: answer.question_id._id?.toString(),
        question_text: answer.question_id.questionText,
        question_type: answer.question_id.questionType,
        points: answer.question_id.points,
        answers: answer.question_id.answers?.map((a: any) => ({
          id: a._id?.toString(),
          answer_text: a.answerText,
          is_correct: a.isCorrect,
          explanation: a.explanation,
          answer_order: a.order,
        })),
        explanation: answer.question_id.explanation,
        hint: answer.question_id.hint,
        difficulty: answer.question_id.difficulty,
        tags: answer.question_id.tags,
        question_order: answer.question_id.order,
        is_active: answer.question_id.isActive,
      } : null,
    }));
  }

  // Get tutor statistics
  static async getTutorStats(tutorId: string): Promise<{
    total_quizzes: number;
    active_quizzes: number;
    total_attempts: number;
    average_score: number;
    total_students: number;
  }> {
    // Import QuizAttempt here to avoid circular dependency
    const { QuizAttempt } = await import('../models/Quiz');

    // Get quiz counts
    const totalQuizzes = await Quiz.countDocuments({
      createdBy: new mongoose.Types.ObjectId(tutorId),
      isActive: true
    });

    const activeQuizzes = await Quiz.countDocuments({
      createdBy: new mongoose.Types.ObjectId(tutorId),
      isActive: true,
      isPublic: true
    });

    // Get attempts statistics
    const attempts = await QuizAttempt.find({
      quiz_id: {
        $in: await Quiz.find({
          createdBy: new mongoose.Types.ObjectId(tutorId),
          isActive: true
        }).distinct('_id')
      }
    }).lean();

    const totalAttempts = attempts.length;

    // Calculate average score
    const completedAttempts = attempts.filter(a => a.status === 'completed' && a.score !== undefined);
    const averageScore = completedAttempts.length > 0
      ? Math.round((completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / completedAttempts.length) * 100) / 100
      : 0;

    // Get unique students who have attempted quizzes
    const uniqueStudents = new Set(attempts.map(a => a.student_id.toString()));
    const totalStudents = uniqueStudents.size;

    return {
      total_quizzes: totalQuizzes,
      active_quizzes: activeQuizzes,
      total_attempts: totalAttempts,
      average_score: averageScore,
      total_students: totalStudents
    };
  }

  // Delete a quiz attempt (for students to remove incomplete attempts)
  static async deleteQuizAttempt(attemptId: string, userId: string): Promise<void> {
    // Import QuizAttempt here to avoid circular dependency
    const { QuizAttempt, StudentAnswer } = await import('../models/Quiz');

    // First verify the user owns this attempt
    const attempt = await QuizAttempt.findOne({
      _id: new mongoose.Types.ObjectId(attemptId),
      student_id: new mongoose.Types.ObjectId(userId)
    });

    if (!attempt) {
      throw new Error('Attempt not found or access denied');
    }

    // Don't allow deleting completed attempts
    if (attempt.status === 'completed') {
      throw new Error('Cannot delete completed quiz attempts');
    }

    // Delete all student answers for this attempt
    await StudentAnswer.deleteMany({
      attempt_id: new mongoose.Types.ObjectId(attemptId)
    });

    // Delete the attempt itself
    await QuizAttempt.deleteOne({
      _id: new mongoose.Types.ObjectId(attemptId),
      student_id: new mongoose.Types.ObjectId(userId)
    });
  }
}
