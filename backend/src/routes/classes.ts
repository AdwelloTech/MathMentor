import express from 'express';
import Joi from 'joi';
import { ClassService, CreateClassData, UpdateClassData } from '../services/classService';
import { authenticate, authorize } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';

const router = express.Router();

// Validation schemas
const createClassSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  subjectId: Joi.string().required(),
  gradeLevelId: Joi.string().required(),
  schedule: Joi.object({
    dayOfWeek: Joi.number().min(0).max(6).required(),
    startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    duration: Joi.number().min(15).max(480).required(),
  }).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().optional(),
  capacity: Joi.number().min(1).max(100).required(),
  price: Joi.number().min(0).optional(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD', 'AUD').optional(),
  prerequisites: Joi.array().items(Joi.string()).optional(),
  materials: Joi.array().items(Joi.string()).optional(),
  meetingLink: Joi.string().optional(),
  jitsiRoomName: Joi.string().max(100).optional(),
  jitsiPassword: Joi.string().max(50).optional(),
  roomNumber: Joi.string().max(50).optional(),
  location: Joi.string().max(200).optional(),
});

const updateClassSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  subjectId: Joi.string().optional(),
  gradeLevelId: Joi.string().optional(),
  schedule: Joi.object({
    dayOfWeek: Joi.number().min(0).max(6).optional(),
    startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    duration: Joi.number().min(15).max(480).optional(),
  }).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  capacity: Joi.number().min(1).max(100).optional(),
  price: Joi.number().min(0).optional(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD', 'AUD').optional(),
  isActive: Joi.boolean().optional(),
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional(),
  prerequisites: Joi.array().items(Joi.string()).optional(),
  materials: Joi.array().items(Joi.string()).optional(),
  meetingLink: Joi.string().optional(),
  jitsiRoomName: Joi.string().max(100).optional(),
  jitsiPassword: Joi.string().max(50).optional(),
  roomNumber: Joi.string().max(50).optional(),
  location: Joi.string().max(200).optional(),
});

// Create class (tutors only)
router.post('/', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const validatedData = validateOrThrow(createClassSchema, req.body) as CreateClassData;
    const result = await ClassService.createClass(req.user!.id, validatedData);

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating class:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Unknown error occurred',
    });
  }
});

// Get available classes for booking (students)
router.get('/available', authenticate, async (req, res) => {
  try {
    const filters = {
      subjectId: req.query.subjectId as string,
      gradeLevelId: req.query.gradeLevelId as string,
      teacherId: req.query.teacherId as string,
      dayOfWeek: req.query.dayOfWeek ? parseInt(req.query.dayOfWeek as string) : undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
    };

    const classes = await ClassService.getAvailableClasses(filters);

    res.json({
      success: true,
      data: classes,
      pagination: {
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

// Get classes by teacher
router.get('/teacher/:teacherId', authenticate, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const filters = {
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      subjectId: req.query.subjectId as string,
      gradeLevelId: req.query.gradeLevelId as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      dayOfWeek: req.query.dayOfWeek ? parseInt(req.query.dayOfWeek as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
    };

    const classes = await ClassService.getClassesByTeacher(teacherId, filters);

    res.json({
      success: true,
      data: classes,
      pagination: {
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

// Get class by ID
router.get('/:classId', authenticate, async (req, res) => {
  try {
    const { classId } = req.params;
    const classData = await ClassService.getClassById(classId);

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found',
      });
    }

    res.json({
      success: true,
      data: classData,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update class (teacher only)
router.put('/:classId', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { classId } = req.params;
    const validatedData = validateOrThrow(updateClassSchema, req.body) as UpdateClassData;
    const result = await ClassService.updateClass(classId, req.user!.id, validatedData);

    res.json({
      success: true,
      message: 'Class updated successfully',
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

// Delete class (teacher only)
router.delete('/:classId', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { classId } = req.params;
    await ClassService.deleteClass(classId, req.user!.id);

    res.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

// Get class statistics (teacher only)
router.get('/:classId/stats', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { classId } = req.params;
    const stats = await ClassService.getClassStats(classId, req.user!.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
