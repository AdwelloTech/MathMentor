import express from 'express';
import Joi from 'joi';
import { GradeLevelService } from '../services/gradeLevelService';
import { authenticate, authorize } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';

const router = express.Router();

// Validation schemas
const createGradeLevelSchema = Joi.object({
  code: Joi.string().min(1).max(10).required(),
  displayName: Joi.string().min(1).max(50).required(),
  sortOrder: Joi.number().min(0).required(),
  category: Joi.string().valid('preschool', 'elementary', 'middle', 'high', 'college', 'graduate').required(),
});

const updateGradeLevelSchema = Joi.object({
  code: Joi.string().min(1).max(10).optional(),
  displayName: Joi.string().min(1).max(50).optional(),
  sortOrder: Joi.number().min(0).optional(),
  category: Joi.string().valid('preschool', 'elementary', 'middle', 'high', 'college', 'graduate').optional(),
  isActive: Joi.boolean().optional(),
});

// Get all active grade levels
router.get('/', authenticate, async (req, res) => {
  try {
    const gradeLevels = await GradeLevelService.getActiveGradeLevels();

    res.json({
      success: true,
      data: gradeLevels,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get grade levels by category
router.get('/category/:category', authenticate, async (req, res) => {
  try {
    const { category } = req.params;
    const gradeLevels = await GradeLevelService.getGradeLevelsByCategory(category);

    res.json({
      success: true,
      data: gradeLevels,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get grade level by ID
router.get('/:gradeLevelId', authenticate, async (req, res) => {
  try {
    const { gradeLevelId } = req.params;
    const gradeLevel = await GradeLevelService.getGradeLevelById(gradeLevelId);

    if (!gradeLevel) {
      return res.status(404).json({
        success: false,
        error: 'Grade level not found',
      });
    }

    res.json({
      success: true,
      data: gradeLevel,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Create grade level (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const validatedData = validateOrThrow(createGradeLevelSchema, req.body);
    const gradeLevel = await GradeLevelService.createGradeLevel(validatedData);

    res.status(201).json({
      success: true,
      message: 'Grade level created successfully',
      data: gradeLevel,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update grade level (admin only)
router.put('/:gradeLevelId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { gradeLevelId } = req.params;
    const validatedData = validateOrThrow(updateGradeLevelSchema, req.body);
    const gradeLevel = await GradeLevelService.updateGradeLevel(gradeLevelId, validatedData);

    if (!gradeLevel) {
      return res.status(404).json({
        success: false,
        error: 'Grade level not found',
      });
    }

    res.json({
      success: true,
      message: 'Grade level updated successfully',
      data: gradeLevel,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete grade level (admin only)
router.delete('/:gradeLevelId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { gradeLevelId } = req.params;
    const gradeLevel = await GradeLevelService.deleteGradeLevel(gradeLevelId);

    if (!gradeLevel) {
      return res.status(404).json({
        success: false,
        error: 'Grade level not found',
      });
    }

    res.json({
      success: true,
      message: 'Grade level deleted successfully',
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
