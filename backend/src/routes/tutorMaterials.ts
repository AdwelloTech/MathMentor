import express from 'express';
import Joi from 'joi';
import { TutorNotesService } from '../services/tutorNotesService';
import { authenticate } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';

const router = express.Router();

// Validation schemas
const getMaterialsSchema = Joi.object({
  q: Joi.string().optional(), // search term
  subjectId: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  skip: Joi.number().integer().min(0).optional(),
});

/**
 * GET /api/tutor-materials
 * Get tutor materials for the authenticated student
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const validatedData = validateOrThrow(getMaterialsSchema, req.query);

    const materials = await TutorNotesService.getStudentTutorMaterials(req.user!.id, {
      searchTerm: validatedData.q,
      subjectFilter: validatedData.subjectId,
      limit: validatedData.limit || 50,
      skip: validatedData.skip || 0,
    });

    res.json({
      success: true,
      data: materials,
    });
  } catch (error: any) {
    console.error('Error fetching tutor materials:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/tutor-materials/:materialId
 * Get a specific tutor material by ID
 */
router.get('/:materialId', authenticate, async (req, res) => {
  try {
    const { materialId } = req.params;

    const material = await TutorNotesService.getTutorMaterialById(materialId, req.user!.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Tutor material not found',
      });
    }

    res.json({
      success: true,
      data: material,
    });
  } catch (error: any) {
    console.error('Error fetching tutor material:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/tutor-materials/premium/check
 * Check if student has premium access
 */
router.get('/premium/check', authenticate, async (req, res) => {
  try {
    const hasPremiumAccess = await TutorNotesService.checkStudentPremiumAccess(req.user!.id);

    res.json({
      success: true,
      data: {
        has_premium_access: hasPremiumAccess,
      },
    });
  } catch (error: any) {
    console.error('Error checking premium access:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/tutor-materials/:materialId/view
 * Increment view count for a tutor material
 */
router.post('/:materialId/view', authenticate, async (req, res) => {
  try {
    const { materialId } = req.params;

    await TutorNotesService.incrementViewCount(materialId);

    res.json({
      success: true,
      message: 'View count incremented',
    });
  } catch (error: any) {
    console.error('Error incrementing view count:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/tutor-materials/:materialId/download
 * Increment download count for a tutor material
 */
router.post('/:materialId/download', authenticate, async (req, res) => {
  try {
    const { materialId } = req.params;

    await TutorNotesService.incrementDownloadCount(materialId);

    res.json({
      success: true,
      message: 'Download count incremented',
    });
  } catch (error: any) {
    console.error('Error incrementing download count:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
