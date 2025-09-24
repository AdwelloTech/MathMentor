import mongoose from 'mongoose';
import { Question, IQuestion, IAnswer } from '../models/Question';
import { Quiz } from '../models/Quiz';

export interface CreateQuestionData {
  quizId: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false';
  points?: number;
  answers: Omit<IAnswer, '_id'>[];
  explanation?: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  order?: number;
}

export interface UpdateQuestionData {
  questionText?: string;
  questionType?: 'multiple_choice' | 'true_false';
  points?: number;
  answers?: Omit<IAnswer, '_id'>[];
  explanation?: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  order?: number;
}

export interface QuestionFilters {
  quizId?: string;
  questionType?: 'multiple_choice' | 'true_false';
  difficulty?: string;
  tags?: string[];
  isActive?: boolean;
  limit?: number;
  skip?: number;
}

export class QuestionService {
  // Create a new question
  static async createQuestion(userId: string, questionData: CreateQuestionData): Promise<IQuestion> {
    // Verify quiz ownership
    const quiz = await Quiz.findOne({
      _id: questionData.quizId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    // Get the next order number
    const lastQuestion = await Question.findOne({ quizId: questionData.quizId })
      .sort({ order: -1 });

    const order = questionData.order !== undefined
      ? questionData.order
      : (lastQuestion?.order || 0) + 1;

    const question = new Question({
      ...questionData,
      quizId: new mongoose.Types.ObjectId(questionData.quizId),
      points: questionData.points || 10,
      difficulty: questionData.difficulty || 'medium',
      order,
      isActive: true,
    });

    return await question.save();
  }

  // Get question by ID
  static async getQuestionById(questionId: string, userId?: string): Promise<IQuestion | null> {
    const question = await Question.findOne({
      _id: questionId,
      isActive: true
    });

    if (!question) {
      return null;
    }

    // Check if user has access to the quiz
    const quiz = await Quiz.findOne({
      _id: question.quizId,
      isActive: true,
      $or: userId ? [
        { isPublic: true },
        { createdBy: new mongoose.Types.ObjectId(userId) }
      ] : [
        { isPublic: true }
      ]
    });

    return quiz ? question : null;
  }

  // Get questions for a quiz
  static async getQuestionsByQuiz(quizId: string, userId?: string): Promise<IQuestion[]> {
    // Verify quiz access
    const quiz = await Quiz.findOne({
      _id: quizId,
      isActive: true,
      $or: userId ? [
        { isPublic: true },
        { createdBy: new mongoose.Types.ObjectId(userId) }
      ] : [
        { isPublic: true }
      ]
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    return await Question.find({
      quizId: new mongoose.Types.ObjectId(quizId),
      isActive: true
    }).sort({ order: 1 });
  }

  // Get questions with filters
  static async getQuestions(filters: QuestionFilters): Promise<{ questions: IQuestion[]; total: number }> {
    const query: any = {};

    if (filters.quizId) {
      query.quizId = new mongoose.Types.ObjectId(filters.quizId);
    }

    if (filters.questionType) {
      query.questionType = filters.questionType;
    }

    if (filters.difficulty) {
      query.difficulty = filters.difficulty;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    } else {
      query.isActive = true;
    }

    const limit = filters.limit || 50;
    const skip = filters.skip || 0;

    const [questions, total] = await Promise.all([
      Question.find(query)
        .populate({
          path: 'quizId',
          select: 'title subject createdBy isPublic',
          populate: {
            path: 'createdBy',
            select: 'firstName lastName fullName'
          }
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      Question.countDocuments(query)
    ]);

    return { questions, total };
  }

  // Update question
  static async updateQuestion(questionId: string, userId: string, updateData: UpdateQuestionData): Promise<IQuestion> {
    const question = await Question.findOne({
      _id: questionId,
      isActive: true
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Verify quiz ownership
    const quiz = await Quiz.findOne({
      _id: question.quizId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    Object.assign(question, updateData);
    return await question.save();
  }

  // Delete question (soft delete)
  static async deleteQuestion(questionId: string, userId: string): Promise<void> {
    const question = await Question.findOne({
      _id: questionId,
      isActive: true
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Verify quiz ownership
    const quiz = await Quiz.findOne({
      _id: question.quizId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    question.isActive = false;
    await question.save();
  }

  // Bulk create questions
  static async bulkCreateQuestions(
    userId: string,
    quizId: string,
    questionsData: CreateQuestionData[]
  ): Promise<IQuestion[]> {
    // Verify quiz ownership
    const quiz = await Quiz.findOne({
      _id: quizId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    // Get the next order number
    const lastQuestion = await Question.findOne({ quizId })
      .sort({ order: -1 });

    let nextOrder = (lastQuestion?.order || 0) + 1;

    const questions: IQuestion[] = [];

    for (const questionData of questionsData) {
      const question = new Question({
        ...questionData,
        quizId: new mongoose.Types.ObjectId(quizId),
        points: questionData.points || 10,
        difficulty: questionData.difficulty || 'medium',
        order: questionData.order !== undefined ? questionData.order : nextOrder++,
        isActive: true,
      });

      questions.push(await question.save());
    }

    return questions;
  }

  // Reorder questions
  static async reorderQuestions(
    userId: string,
    quizId: string,
    questionOrders: { questionId: string; order: number }[]
  ): Promise<void> {
    // Verify quiz ownership
    const quiz = await Quiz.findOne({
      _id: quizId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    // Update orders in batch
    const bulkOps = questionOrders.map(({ questionId, order }) => ({
      updateOne: {
        filter: { _id: questionId, quizId },
        update: { order }
      }
    }));

    await Question.bulkWrite(bulkOps);
  }

  // Import questions from AI-generated data
  static async importAIQuestions(
    userId: string,
    quizId: string,
    aiQuestions: {
      question_text: string;
      question_type: 'multiple_choice' | 'true_false';
      points: number;
      answers: { answer_text: string; is_correct: boolean }[];
      is_ai_generated: boolean;
      ai_status: 'pending' | 'approved' | 'discarded';
      ai_metadata?: Record<string, any>;
    }[]
  ): Promise<IQuestion[]> {
    // Verify quiz ownership
    const quiz = await Quiz.findOne({
      _id: quizId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    // Get the next order number
    const lastQuestion = await Question.findOne({ quizId })
      .sort({ order: -1 });

    let nextOrder = (lastQuestion?.order || 0) + 1;

    const questions: IQuestion[] = [];

    for (const aiQuestion of aiQuestions) {
      // Convert AI format to our format
      const answers: Omit<IAnswer, '_id'>[] = aiQuestion.answers.map((answer, index) => ({
        answerText: answer.answer_text,
        isCorrect: answer.is_correct,
        order: index
      }));

      const question = new Question({
        quizId: new mongoose.Types.ObjectId(quizId),
        questionText: aiQuestion.question_text,
        questionType: aiQuestion.question_type,
        points: aiQuestion.points,
        answers,
        order: nextOrder++,
        difficulty: quiz.difficulty, // Use quiz difficulty
        isActive: true,
        // Store AI metadata
        tags: ['ai-generated']
      });

      questions.push(await question.save());
    }

    return questions;
  }

  // Get question statistics
  static async getQuestionStats(quizId: string, userId: string): Promise<{
    totalQuestions: number;
    multipleChoice: number;
    trueFalse: number;
    byDifficulty: { easy: number; medium: number; hard: number };
  }> {
    // Verify quiz access
    const quiz = await Quiz.findOne({
      _id: quizId,
      isActive: true,
      $or: userId ? [
        { isPublic: true },
        { createdBy: new mongoose.Types.ObjectId(userId) }
      ] : [
        { isPublic: true }
      ]
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied');
    }

    const stats = await Question.aggregate([
      { $match: { quizId: new mongoose.Types.ObjectId(quizId), isActive: true } },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          multipleChoice: {
            $sum: { $cond: [{ $eq: ['$questionType', 'multiple_choice'] }, 1, 0] }
          },
          trueFalse: {
            $sum: { $cond: [{ $eq: ['$questionType', 'true_false'] }, 1, 0] }
          },
          easy: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] }
          },
          medium: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] }
          },
          hard: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalQuestions: 0,
        multipleChoice: 0,
        trueFalse: 0,
        byDifficulty: { easy: 0, medium: 0, hard: 0 }
      };
    }

    const result = stats[0];
    return {
      totalQuestions: result.totalQuestions,
      multipleChoice: result.multipleChoice,
      trueFalse: result.trueFalse,
      byDifficulty: {
        easy: result.easy,
        medium: result.medium,
        hard: result.hard
      }
    };
  }
}
