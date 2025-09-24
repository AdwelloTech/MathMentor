import express from 'express';
import Joi from 'joi';
import { SubjectService } from '../services/subjectService';
import { authenticate, authorize } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';

const router = express.Router();

// Validation schemas
const createSubjectSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  displayName: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(300).optional(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).required(),
  icon: Joi.string().optional(),
  category: Joi.string().optional(),
  sortOrder: Joi.number().min(0).optional(),
  parentId: Joi.string().optional(),
});

const updateSubjectSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  displayName: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(300).optional(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  icon: Joi.string().optional(),
  category: Joi.string().optional(),
  sortOrder: Joi.number().min(0).optional(),
  parentId: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

// Get all active subjects
router.get('/', authenticate, async (req, res) => {
  try {
    const subjects = await SubjectService.getActiveSubjects();

    res.json({
      success: true,
      data: subjects,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get subjects by category
router.get('/category/:category', authenticate, async (req, res) => {
  try {
    const { category } = req.params;
    const subjects = await SubjectService.getSubjectsByCategory(category);

    res.json({
      success: true,
      data: subjects,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get subject by ID
router.get('/:subjectId', authenticate, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject = await SubjectService.getSubjectById(subjectId);

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Subject not found',
      });
    }

    res.json({
      success: true,
      data: subject,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Create subject (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const validatedData = validateOrThrow(createSubjectSchema, req.body);
    const subject = await SubjectService.createSubject(validatedData);

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update subject (admin only)
router.put('/:subjectId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { subjectId } = req.params;
    const validatedData = validateOrThrow(updateSubjectSchema, req.body);
    const subject = await SubjectService.updateSubject(subjectId, validatedData);

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Subject not found',
      });
    }

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: subject,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete subject (admin only)
router.delete('/:subjectId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject = await SubjectService.deleteSubject(subjectId);

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: 'Subject not found',
      });
    }

    res.json({
      success: true,
      message: 'Subject deleted successfully',
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
