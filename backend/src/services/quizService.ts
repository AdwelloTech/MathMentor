import mongoose from 'mongoose';
import { Quiz, IQuiz, QuizAttempt, IQuizAttempt } from '../models/Quiz';
import { Question, IQuestion, IAnswer } from '../models/Question';

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
  // Create a new quiz
  static async createQuiz(userId: string, quizData: CreateQuizData): Promise<IQuiz> {
    const quiz = new Quiz({
      ...quizData,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true,
    });

    return await quiz.save();
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
  static async getAvailableQuizzesForStudent(studentId: string, subject?: string): Promise<IQuiz[]> {
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

    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'firstName lastName fullName')
      .populate('gradeLevelId', 'displayName')
      .sort({ createdAt: -1 })
      .limit(50); // Increased limit to accommodate student-created quizzes

    return quizzes;
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
    return recentAttempts.map(attempt => ({
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

    return attempts;
  }
}
