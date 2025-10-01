import express from 'express';
import Joi from 'joi';
import { StudyNotesService } from '../services/studyNotesService';
import { authenticate } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';

const router = express.Router();

// Validation schemas
const createStudyNoteSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(500).optional(),
  content: Joi.string().min(1).required(),
  subjectId: Joi.string().optional(),
  gradeLevelId: Joi.string().optional(),
  isPublic: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  attachments: Joi.array().items(Joi.string()).optional(),
});

const updateStudyNoteSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(500).optional(),
  content: Joi.string().min(1).optional(),
  subjectId: Joi.string().optional(),
  gradeLevelId: Joi.string().optional(),
  isPublic: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  attachments: Joi.array().items(Joi.string()).optional(),
});

// Create study note
router.post('/', authenticate, async (req, res) => {
  try {
    const validatedData = validateOrThrow(createStudyNoteSchema, req.body);
    const result = await StudyNotesService.createStudyNote(req.user!.id, validatedData);

    res.status(201).json({
      success: true,
      message: 'Study note created successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get study notes with search and filtering
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      searchTerm: req.query.q as string,
      subjectId: req.query.subjectId as string,
      gradeLevelId: req.query.gradeLevelId as string,
      createdBy: req.query.createdBy as string,
      isPublic: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
      userId: req.user!.id,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
    };

    const result = await StudyNotesService.getStudyNotes(filters);

    res.json({
      success: true,
      data: result.notes,
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

// Get study note by ID
router.get('/:noteId', authenticate, async (req, res) => {
  try {
    const { noteId } = req.params;
    const note = await StudyNotesService.getStudyNoteById(noteId, req.user!.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Study note not found',
      });
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update study note
router.put('/:noteId', authenticate, async (req, res) => {
  try {
    const { noteId } = req.params;
    const validatedData = validateOrThrow(updateStudyNoteSchema, req.body);
    const result = await StudyNotesService.updateStudyNote(noteId, req.user!.id, validatedData);

    res.json({
      success: true,
      message: 'Study note updated successfully',
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

// Delete study note
router.delete('/:noteId', authenticate, async (req, res) => {
  try {
    const { noteId } = req.params;
    await StudyNotesService.deleteStudyNote(noteId, req.user!.id);

    res.json({
      success: true,
      message: 'Study note deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

// Duplicate study note
router.post('/:noteId/duplicate', authenticate, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { title } = req.body;
    const result = await StudyNotesService.duplicateStudyNote(noteId, req.user!.id, title);

    res.status(201).json({
      success: true,
      message: 'Study note duplicated successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Toggle like on study note
router.post('/:noteId/like', authenticate, async (req, res) => {
  try {
    const { noteId } = req.params;
    const result = await StudyNotesService.toggleLike(noteId, req.user!.id);

    res.json({
      success: true,
      message: result.liked ? 'Study note liked' : 'Like removed',
      data: {
        liked: result.liked,
        likeCount: result.likeCount,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Toggle publish status
router.post('/:noteId/toggle-publish', authenticate, async (req, res) => {
  try {
    const { noteId } = req.params;
    const result = await StudyNotesService.togglePublishStatus(noteId, req.user!.id);

    res.json({
      success: true,
      message: `Study note ${result.isPublic ? 'published' : 'unpublished'} successfully`,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update tags
router.patch('/:noteId/tags', authenticate, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        error: 'Tags must be an array',
      });
    }

    const result = await StudyNotesService.updateTags(noteId, req.user!.id, tags);

    res.json({
      success: true,
      message: 'Tags updated successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user's study notes
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;

    const result = await StudyNotesService.getUserNotes(userId, limit, skip);

    res.json({
      success: true,
      data: result.notes,
      pagination: {
        total: result.total,
        limit,
        skip,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get popular study notes
router.get('/popular/recent', authenticate, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const notes = await StudyNotesService.getPopularNotes(limit);

    res.json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Search study notes
router.get('/search/advanced', authenticate, async (req, res) => {
  try {
    const searchData = {
      query: req.query.q as string,
      subjectId: req.query.subjectId as string,
      gradeLevelId: req.query.gradeLevelId as string,
      userId: req.user!.id,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
    };

    const result = await StudyNotesService.searchStudyNotes(searchData);

    res.json({
      success: true,
      data: result.notes,
      pagination: {
        total: result.total,
        limit: searchData.limit,
        skip: searchData.skip,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get study notes by subject
router.get('/subject/:subjectId', authenticate, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const notes = await StudyNotesService.getNotesBySubject(subjectId, req.user!.id, limit);

    res.json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get recent study notes
router.get('/recent/all', authenticate, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const notes = await StudyNotesService.getRecentNotes(req.user!.id, limit);

    res.json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get study notes statistics
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const userId = req.query.userId as string || req.user!.id;
    const stats = await StudyNotesService.getStats(userId);

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

export default router;
