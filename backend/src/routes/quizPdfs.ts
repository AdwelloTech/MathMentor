import express from 'express';
import Joi from 'joi';
import { QuizPdfService } from '../services/quizPdfService';
import { authenticate, authorize } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';

const router = express.Router();

// Validation schemas
const createQuizPdfSchema = Joi.object({
  fileName: Joi.string().min(1).max(255).required(),
  filePath: Joi.string().min(1).max(500).required(),
  fileSize: Joi.number().integer().min(0).required(),
  gradeLevelId: Joi.string().optional(),
  subjectId: Joi.string().required(),
  uploadedBy: Joi.string().required(),
  isActive: Joi.boolean().optional(),
});

const updateQuizPdfSchema = Joi.object({
  fileName: Joi.string().min(1).max(255).optional(),
  filePath: Joi.string().min(1).max(500).optional(),
  fileSize: Joi.number().integer().min(0).optional(),
  gradeLevelId: Joi.string().optional(),
  subjectId: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

const filtersSchema = Joi.object({
  gradeLevelId: Joi.string().optional(),
  subjectId: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

// Get all quiz PDFs with optional filters
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = req.query;
    const validatedFilters = validateOrThrow(filtersSchema, filters);

    const quizPdfs = await QuizPdfService.getQuizPdfs(validatedFilters);

    res.json({
      success: true,
      data: quizPdfs,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get quiz PDFs by grade level and subject (for student selection)
router.get('/by-grade-subject/:gradeLevelId/:subjectId', authenticate, async (req, res) => {
  try {
    const { gradeLevelId, subjectId } = req.params;

    const quizPdfs = await QuizPdfService.getByGradeAndSubject(gradeLevelId, subjectId);

    res.json({
      success: true,
      data: quizPdfs,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get quiz PDF by ID
router.get('/:quizPdfId', authenticate, async (req, res) => {
  try {
    const { quizPdfId } = req.params;
    const quizPdf = await QuizPdfService.getQuizPdfById(quizPdfId);

    if (!quizPdf) {
      return res.status(404).json({
        success: false,
        error: 'Quiz PDF not found',
      });
    }

    res.json({
      success: true,
      data: quizPdf,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Create quiz PDF (admin/tutor only)
router.post('/', authenticate, authorize('admin', 'tutor'), async (req, res) => {
  try {
    const validatedData = validateOrThrow(createQuizPdfSchema, req.body);
    const quizPdf = await QuizPdfService.createQuizPdf(validatedData);

    res.status(201).json({
      success: true,
      message: 'Quiz PDF created successfully',
      data: quizPdf,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update quiz PDF (admin/tutor only)
router.put('/:quizPdfId', authenticate, authorize('admin', 'tutor'), async (req, res) => {
  try {
    const { quizPdfId } = req.params;
    const validatedData = validateOrThrow(updateQuizPdfSchema, req.body);
    const quizPdf = await QuizPdfService.updateQuizPdf(quizPdfId, validatedData);

    if (!quizPdf) {
      return res.status(404).json({
        success: false,
        error: 'Quiz PDF not found',
      });
    }

    res.json({
      success: true,
      message: 'Quiz PDF updated successfully',
      data: quizPdf,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete quiz PDF (admin only)
router.delete('/:quizPdfId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { quizPdfId } = req.params;
    const quizPdf = await QuizPdfService.deleteQuizPdf(quizPdfId);

    if (!quizPdf) {
      return res.status(404).json({
        success: false,
        error: 'Quiz PDF not found',
      });
    }

    res.json({
      success: true,
      message: 'Quiz PDF deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

// Toggle active status (admin/tutor only)
router.patch('/:quizPdfId/toggle-active', authenticate, authorize('admin', 'tutor'), async (req, res) => {
  try {
    const { quizPdfId } = req.params;
    const quizPdf = await QuizPdfService.toggleActive(quizPdfId);

    if (!quizPdf) {
      return res.status(404).json({
        success: false,
        error: 'Quiz PDF not found',
      });
    }

    res.json({
      success: true,
      message: `Quiz PDF ${quizPdf.isActive ? 'activated' : 'deactivated'} successfully`,
      data: quizPdf,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
