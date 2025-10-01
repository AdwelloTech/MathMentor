import express from 'express';
import Joi from 'joi';
import { TutorNotesService } from '../services/tutorNotesService';
import { authenticate, authorize } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Allow common document and media types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only documents, images, and media files are allowed.'));
    }
  }
});

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

// TUTOR MANAGEMENT ROUTES

const createMaterialSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  content: Joi.string().optional(),
  subjectId: Joi.string().optional(),
  gradeLevelId: Joi.string().optional(),
  isPremium: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string()).optional(),
}).unknown(true); // Allow additional fields like file

const updateMaterialSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  content: Joi.string().optional(),
  subjectId: Joi.string().optional(),
  gradeLevelId: Joi.string().optional(),
  isPremium: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
}).unknown(true); // Allow additional fields like file

/**
 * GET /api/tutor-materials/tutor/list
 * Get tutor materials for the authenticated tutor
 */
router.get('/tutor/list', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const tutorId = req.user!.id;
    const materials = await TutorNotesService.getTutorMaterials(tutorId);

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
 * POST /api/tutor-materials/tutor/create
 * Create a new tutor material
 */
router.post('/tutor/create', authenticate, authorize('tutor'), upload.single('file'), async (req, res) => {
  try {
    const validatedData = validateOrThrow(createMaterialSchema, req.body);
    const tutorId = req.user!.id;

    const materialData = {
      ...validatedData,
      file: req.file,
    };

    const material = await TutorNotesService.createTutorMaterial(tutorId, materialData);

    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: material,
    });
  } catch (error: any) {
    console.error('Error creating tutor material:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/tutor-materials/tutor/:materialId
 * Update a tutor material
 */
router.put('/tutor/:materialId', authenticate, authorize('tutor'), upload.single('file'), async (req, res) => {
  try {
    const { materialId } = req.params;

    if (!materialId || typeof materialId !== 'string' || materialId.length !== 24) {
      return res.status(400).json({
        success: false,
        error: `Invalid materialId: ${materialId}`,
      });
    }

    const validatedData = validateOrThrow(updateMaterialSchema, req.body);
    const tutorId = req.user!.id;

    // Handle file from req.file (upload.single() returns single file or undefined)
    const file = req.file;

    const materialData = {
      ...validatedData,
      file: file,
    };

    const material = await TutorNotesService.updateTutorMaterial(materialId, tutorId, materialData);

    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found or access denied',
      });
    }

    res.json({
      success: true,
      message: 'Material updated successfully',
      data: material,
    });
  } catch (error: any) {
    console.error('Error updating tutor material:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/tutor-materials/tutor/:materialId
 * Delete a tutor material
 */
router.delete('/tutor/:materialId', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { materialId } = req.params;
    const tutorId = req.user!.id;

    const success = await TutorNotesService.deleteTutorMaterial(materialId, tutorId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Material not found or access denied',
      });
    }

    res.json({
      success: true,
      message: 'Material deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting tutor material:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/tutor-materials/tutor/search
 * Search tutor materials for the authenticated tutor
 */
router.post('/tutor/search', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { searchTerm } = req.body;
    const tutorId = req.user!.id;

    const materials = await TutorNotesService.searchTutorMaterials(tutorId, searchTerm);

    res.json({
      success: true,
      data: materials,
    });
  } catch (error: any) {
    console.error('Error searching tutor materials:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
