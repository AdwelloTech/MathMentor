import express from 'express';
import Joi from 'joi';
import { FlashcardService } from '../services/flashcardService';
import { authenticate, authorize } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';

const router = express.Router();

// Validation schemas
const createSetSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  subject: Joi.string().min(1).max(100).required(),
  topic: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  gradeLevelId: Joi.string().optional(),
  isPublic: Joi.boolean().optional(),
  flashcards: Joi.array().items(
    Joi.object({
      frontText: Joi.string().min(1).max(1000).required(),
      backText: Joi.string().min(1).max(2000).required(),
      difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
      tags: Joi.array().items(Joi.string()).optional()
    })
  ).min(1).required()
});

const updateSetSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  subject: Joi.string().min(1).max(100).optional(),
  topic: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  gradeLevelId: Joi.string().optional(),
  isPublic: Joi.boolean().optional()
});

const addFlashcardsSchema = Joi.object({
  flashcards: Joi.array().items(
    Joi.object({
      frontText: Joi.string().min(1).max(1000).required(),
      backText: Joi.string().min(1).max(2000).required(),
      difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
      tags: Joi.array().items(Joi.string()).optional()
    })
  ).min(1).required()
});

const updateFlashcardSchema = Joi.object({
  frontText: Joi.string().min(1).max(1000).optional(),
  backText: Joi.string().min(1).max(2000).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

const studyResultsSchema = Joi.object({
  results: Joi.array().items(
    Joi.object({
      flashcardId: Joi.string().required(),
      correct: Joi.boolean().required(),
      timeSpent: Joi.number().min(0).optional()
    })
  ).min(1).required()
});

// Create flashcard set
router.post('/sets', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const validatedData = validateOrThrow(createSetSchema, req.body);
    const result = await FlashcardService.createSet(req.user!.id, validatedData);

    res.status(201).json({
      success: true,
      message: 'Flashcard set created successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get flashcard sets with filtering
router.get('/sets', authenticate, async (req, res) => {
  try {
    const filters = {
      tutorId: req.query.tutorId as string,
      subject: req.query.subject as string,
      difficulty: req.query.difficulty as string,
      gradeLevelId: req.query.gradeLevelId as string,
      isPublic: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
      userId: req.user!.id,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0
    };

    const sets = await FlashcardService.getSets(filters);

    res.json({
      success: true,
      data: sets,
      pagination: {
        limit: filters.limit,
        skip: filters.skip
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get flashcard set by ID
router.get('/sets/:setId', authenticate, async (req, res) => {
  try {
    const { setId } = req.params;
    const set = await FlashcardService.getSetById(setId, req.user!.id);

    res.json({
      success: true,
      data: set
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Update flashcard set
router.put('/sets/:setId', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { setId } = req.params;
    const validatedData = validateOrThrow(updateSetSchema, req.body);
    const result = await FlashcardService.updateSet(setId, req.user!.id, validatedData);

    res.json({
      success: true,
      message: 'Flashcard set updated successfully',
      data: result
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Delete flashcard set
router.delete('/sets/:setId', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { setId } = req.params;
    await FlashcardService.deleteSet(setId, req.user!.id);

    res.json({
      success: true,
      message: 'Flashcard set deleted successfully'
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Add flashcards to set
router.post('/sets/:setId/flashcards', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { setId } = req.params;
    const validatedData = validateOrThrow(addFlashcardsSchema, req.body);
    const result = await FlashcardService.addFlashcards(setId, req.user!.id, validatedData.flashcards);

    res.status(201).json({
      success: true,
      message: 'Flashcards added successfully',
      data: result
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Update flashcard
router.put('/flashcards/:flashcardId', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { flashcardId } = req.params;
    const validatedData = validateOrThrow(updateFlashcardSchema, req.body);
    const result = await FlashcardService.updateFlashcard(flashcardId, req.user!.id, validatedData);

    res.json({
      success: true,
      message: 'Flashcard updated successfully',
      data: result
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Delete flashcard
router.delete('/flashcards/:flashcardId', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { flashcardId } = req.params;
    await FlashcardService.deleteFlashcard(flashcardId, req.user!.id);

    res.json({
      success: true,
      message: 'Flashcard deleted successfully'
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Get study session
router.get('/sets/:setId/study', authenticate, async (req, res) => {
  try {
    const { setId } = req.params;
    const count = req.query.count ? parseInt(req.query.count as string) : 10;
    const flashcards = await FlashcardService.getStudySession(setId, req.user!.id, count);

    res.json({
      success: true,
      data: flashcards
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Record study results
router.post('/sets/:setId/study', authenticate, async (req, res) => {
  try {
    const { setId } = req.params;
    const validatedData = validateOrThrow(studyResultsSchema, req.body);
    await FlashcardService.recordStudyResults(setId, req.user!.id, validatedData.results);

    res.json({
      success: true,
      message: 'Study results recorded successfully'
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Reset progress
router.post('/sets/:setId/reset', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { setId } = req.params;
    await FlashcardService.resetProgress(setId, req.user!.id);

    res.json({
      success: true,
      message: 'Progress reset successfully'
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Get statistics
router.get('/sets/:setId/statistics', authenticate, async (req, res) => {
  try {
    const { setId } = req.params;
    const stats = await FlashcardService.getStatistics(setId, req.user!.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// Student endpoints

// Get available flashcard sets for a student
router.get('/student/available/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject } = req.query;
    const sets = await FlashcardService.getAvailableSetsForStudent(studentId, subject as string);

    res.json({
      success: true,
      data: sets
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
