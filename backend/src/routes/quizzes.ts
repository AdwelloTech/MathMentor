import express from 'express';
import Joi from 'joi';
import { QuizService } from '../services/quizService';
import { QuestionService } from '../services/questionService';
import { authenticate, authorize } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';

const router = express.Router();

// Validation schemas
const createQuizSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(500).allow('').optional(),
  subject: Joi.string().min(1).max(100).required(),
  gradeLevelId: Joi.string().optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
  questionType: Joi.string().valid('multiple_choice', 'true_false', 'mixed').required(),
  totalQuestions: Joi.number().integer().min(1).max(100).required(),
  timeLimit: Joi.number().integer().min(1).max(180).optional(),
  isPublic: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  passingScore: Joi.number().min(0).max(100).optional(),
  instructions: Joi.string().max(1000).allow('').optional(),
  // Additional fields from frontend
  tutorId: Joi.string().optional(), // User ID from frontend (ignored, we use auth)
  questions: Joi.array().optional(), // Allow empty questions array
});

const updateQuizSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(500).optional(),
  subject: Joi.string().min(1).max(100).optional(),
  gradeLevelId: Joi.string().optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  questionType: Joi.string().valid('multiple_choice', 'true_false', 'mixed').optional(),
  totalQuestions: Joi.number().integer().min(1).max(100).optional(),
  timeLimit: Joi.number().integer().min(1).max(180).optional(),
  isPublic: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  passingScore: Joi.number().min(0).max(100).optional(),
  instructions: Joi.string().max(1000).allow('').optional(),
});

const createQuestionSchema = Joi.object({
  quizId: Joi.string().required(),
  questionText: Joi.string().min(1).max(1000).required(),
  questionType: Joi.string().valid('multiple_choice', 'true_false').required(),
  points: Joi.number().min(0).optional(),
  answers: Joi.array().items(
    Joi.object({
      answerText: Joi.string().min(1).max(500).required(),
      isCorrect: Joi.boolean().required(),
      explanation: Joi.string().max(300).optional(),
      order: Joi.number().min(0).optional(),
    })
  ).min(1).required(),
  explanation: Joi.string().max(500).optional(),
  hint: Joi.string().max(200).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  order: Joi.number().min(0).optional(),
  // AI-related fields
  isAiGenerated: Joi.boolean().optional(),
  aiStatus: Joi.string().valid('pending', 'approved', 'discarded').optional(),
  aiMetadata: Joi.object().optional(),
});

const updateQuestionSchema = Joi.object({
  questionText: Joi.string().min(1).max(1000).optional(),
  questionType: Joi.string().valid('multiple_choice', 'true_false').optional(),
  points: Joi.number().min(0).optional(),
  answers: Joi.array().items(
    Joi.object({
      answerText: Joi.string().min(1).max(500).required(),
      isCorrect: Joi.boolean().required(),
      explanation: Joi.string().max(300).optional(),
      order: Joi.number().min(0).optional(),
    })
  ).optional(),
  explanation: Joi.string().max(500).optional(),
  hint: Joi.string().max(200).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  order: Joi.number().min(0).optional(),
});

const importQuestionsSchema = Joi.object({
  questions: Joi.array().items(
    Joi.object({
      question_text: Joi.string().required(),
      question_type: Joi.string().valid('multiple_choice', 'true_false').required(),
      points: Joi.number().min(0).optional(),
      answers: Joi.array().items(
        Joi.object({
          answer_text: Joi.string().required(),
          is_correct: Joi.boolean().required(),
        })
      ).required(),
      is_ai_generated: Joi.boolean().optional(),
      ai_status: Joi.string().valid('pending', 'approved', 'discarded').optional(),
      ai_metadata: Joi.object().optional(),
    })
  ).min(1).required(),
});

// Quiz routes

// Create quiz
router.post('/', authenticate, authorize('tutor', 'student'), async (req, res) => {
  try {
    const validatedData = validateOrThrow(createQuizSchema, req.body);
    const result = await QuizService.createQuiz(req.user!.id, validatedData);

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get quizzes with filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      tutorId: req.query.tutorId as string,
      subject: req.query.subject as string,
      difficulty: req.query.difficulty as string,
      gradeLevelId: req.query.gradeLevelId as string,
      isPublic: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
      userId: req.user!.id,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
    };

    const result = await QuizService.getQuizzes(filters);

    res.json({
      success: true,
      data: result.quizzes,
      pagination: {
        total: result.total,
        limit: filters.limit,
        skip: filters.skip,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get quiz by ID
router.get('/:quizId', authenticate, async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await QuizService.getQuizById(quizId, req.user!.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
      });
    }

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update quiz
router.put('/:quizId', authenticate, authorize('tutor', 'student'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const validatedData = validateOrThrow(updateQuizSchema, req.body);
    const result = await QuizService.updateQuiz(quizId, req.user!.id, validatedData);

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete quiz
router.delete('/:quizId', authenticate, authorize('tutor', 'student'), async (req, res) => {
  try {
    const { quizId } = req.params;
    await QuizService.deleteQuiz(quizId, req.user!.id);

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

// Duplicate quiz
router.post('/:quizId/duplicate', authenticate, authorize('tutor', 'student'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const { title } = req.body;
    const result = await QuizService.duplicateQuiz(quizId, req.user!.id, title);

    res.status(201).json({
      success: true,
      message: 'Quiz duplicated successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Toggle publish status
router.post('/:quizId/toggle-publish', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const result = await QuizService.togglePublishStatus(quizId, req.user!.id);

    res.json({
      success: true,
      message: `Quiz ${result.isPublic ? 'published' : 'unpublished'} successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get quiz statistics
router.get('/:quizId/stats', authenticate, async (req, res) => {
  try {
    const { quizId } = req.params;
    const stats = await QuizService.getQuizStats(quizId, req.user!.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all quiz attempts/responses for a quiz (for tutors to view student responses)
router.get('/:quizId/attempts', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const attempts = await QuizService.getQuizAttempts(quizId, req.user!.id);

    res.json({
      success: true,
      data: attempts,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get tutor statistics
router.get('/tutor/stats/:tutorId', authenticate, async (req, res) => {
  try {
    const { tutorId } = req.params;

    // Verify the user can access this tutor's stats
    if (req.user!.id !== tutorId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const stats = await QuizService.getTutorStats(tutorId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get quiz attempt details by attempt ID
router.get('/student/attempts/:attemptId', authenticate, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await QuizService.getAttemptById(attemptId, req.user!.id);

    res.json({
      success: true,
      data: attempt,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get student answers for an attempt
router.get('/student/attempts/:attemptId/answers', authenticate, async (req, res) => {
  try {
    const { attemptId } = req.params;
    const answers = await QuizService.getStudentAnswersByAttempt(attemptId, req.user!.id);

    res.json({
      success: true,
      data: answers,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Save tutor feedback for a quiz attempt
router.post('/student/attempts/:attemptId/feedback', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { feedback } = req.body;

    if (typeof feedback !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Feedback must be a string',
      });
    }

    await QuizService.saveTutorFeedback(attemptId, req.user!.id, feedback.trim());

    res.json({
      success: true,
      message: 'Feedback saved successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Question routes

// Get questions for a quiz
router.get('/:quizId/questions', authenticate, async (req, res) => {
  try {
    const { quizId } = req.params;
    const questions = await QuestionService.getQuestionsByQuiz(quizId, req.user!.id);

    res.json({
      success: true,
      data: questions,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Create question
router.post('/:quizId/questions', authenticate, authorize('tutor', 'student'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const questionData = { ...req.body, quizId };
    const validatedData = validateOrThrow(createQuestionSchema, questionData);

    const result = await QuestionService.createQuestion(req.user!.id, validatedData);

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Import AI-generated questions
router.post('/:quizId/questions/import-ai', authenticate, authorize('tutor', 'student'), async (req, res) => {
  try {
    const { quizId } = req.params;
    const validatedData = validateOrThrow(importQuestionsSchema, req.body);

    const result = await QuestionService.importAIQuestions(req.user!.id, quizId, validatedData.questions);

    res.status(201).json({
      success: true,
      message: `${result.length} questions imported successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get question by ID
router.get('/:quizId/questions/:questionId', authenticate, async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await QuestionService.getQuestionById(questionId, req.user!.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }

    res.json({
      success: true,
      data: question,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update question
router.put('/:quizId/questions/:questionId', authenticate, authorize('tutor', 'student'), async (req, res) => {
  try {
    const { questionId } = req.params;
    const validatedData = validateOrThrow(updateQuestionSchema, req.body);

    const result = await QuestionService.updateQuestion(questionId, req.user!.id, validatedData);

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete question
router.delete('/:quizId/questions/:questionId', authenticate, authorize('tutor', 'student'), async (req, res) => {
  try {
    const { questionId } = req.params;
    await QuestionService.deleteQuestion(questionId, req.user!.id);

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

// Get question statistics for a quiz
router.get('/:quizId/questions/stats', authenticate, async (req, res) => {
  try {
    const { quizId } = req.params;
    const stats = await QuestionService.getQuestionStats(quizId, req.user!.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Student quiz endpoints

// Get available quizzes for a student
router.get('/student/available/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject } = req.query;
    const quizzes = await QuizService.getAvailableQuizzesForStudent(studentId, subject as string);

    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get recent quiz attempts for a student
router.get('/student/recent/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const recentQuizzes = await QuizService.getRecentQuizzesForStudent(studentId);

    res.json({
      success: true,
      data: recentQuizzes,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Start a quiz attempt for a student
router.post('/student/attempts/start', authenticate, authorize('student'), async (req, res) => {
  try {
    const { quizId } = req.body;
    const studentId = req.user!.id; // Use authenticated user's ID

    if (!quizId) {
      return res.status(400).json({
        success: false,
        error: 'quizId is required',
      });
    }

    // Verify the student can access this quiz
    const quiz = await QuizService.getAvailableQuizzesForStudent(studentId);
    const hasAccess = quiz.some(q => q.id === quizId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this quiz',
      });
    }

    // Create the quiz attempt
    const attempt = await QuizService.startQuizAttempt(quizId, studentId);

    res.status(201).json({
      success: true,
      message: 'Quiz attempt started successfully',
      data: attempt,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Submit quiz attempt with answers
router.post('/student/attempts/submit', authenticate, authorize('student'), async (req, res) => {
  try {
    const { attemptId, answers } = req.body;

    if (!attemptId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'attemptId and answers array are required',
      });
    }

    const results = await QuizService.submitQuizAttempt(
      attemptId,
      req.user!.id,
      answers
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get quiz attempts for a student
router.get('/students/:studentId/attempts', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Students can only view their own attempts, admins can view any student's attempts
    if (req.user!.id !== studentId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only view your own quiz attempts',
      });
    }

    const attempts = await QuizService.getStudentAttempts(studentId);

    res.json({
      success: true,
      data: attempts,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete a quiz attempt (students can delete their own incomplete attempts)
router.delete('/students/attempts/:attemptId', authenticate, authorize('student'), async (req, res) => {
  try {
    const { attemptId } = req.params;

    await QuizService.deleteQuizAttempt(attemptId, req.user!.id);

    res.json({
      success: true,
      message: 'Quiz attempt deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') || error.message.includes('access denied') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
