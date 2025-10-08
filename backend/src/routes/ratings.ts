import express from 'express';
import Joi from 'joi';
import { SessionRating } from '../models/SessionRating';
import { authenticate } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';
import mongoose from 'mongoose';

const router = express.Router();

// Validation schemas
const createRatingSchema = Joi.object({
  sessionId: Joi.string().required(),
  tutorId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  reviewText: Joi.string().max(1000).optional(),
  isAnonymous: Joi.boolean().optional()
});

const updateRatingSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  reviewText: Joi.string().max(1000).optional(),
  isAnonymous: Joi.boolean().optional()
});

// Create a new rating
router.post('/', authenticate, async (req, res) => {
  try {
    const validated = validateOrThrow(createRatingSchema, req.body);
    const studentId = req.user!.id;

    // Check if student has already rated this session
    const existingRating = await SessionRating.findOne({
      sessionId: validated.sessionId,
      studentId
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        error: 'You have already rated this session'
      });
    }

    const rating = new SessionRating({
      ...validated,
      studentId,
      isAnonymous: validated.isAnonymous || false
    });

    await rating.save();

    res.status(201).json({
      success: true,
      data: rating
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update an existing rating
router.put('/:ratingId', authenticate, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const validated = validateOrThrow(updateRatingSchema, req.body);
    const studentId = req.user!.id;

    const rating = await SessionRating.findOneAndUpdate(
      { _id: ratingId, studentId },
      validated,
      { new: true }
    );

    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found or access denied'
      });
    }

    res.json({
      success: true,
      data: rating
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get rating by ID
router.get('/:ratingId', authenticate, async (req, res) => {
  try {
    const { ratingId } = req.params;

    const rating = await SessionRating.findById(ratingId)
      .populate('studentId', 'fullName profileImageUrl')
      .populate('tutorId', 'fullName profileImageUrl');

    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found'
      });
    }

    res.json({
      success: true,
      data: rating
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get rating for a specific session and student
router.get('/session/:sessionId/student/:studentId', authenticate, async (req, res) => {
  try {
    const { sessionId, studentId } = req.params;

    // Ensure user can only access their own ratings or is a tutor/admin
    if (req.user!.id !== studentId && req.user!.role !== 'admin' && req.user!.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const rating = await SessionRating.findOne({
      sessionId,
      studentId
    });

    res.json({
      success: true,
      data: rating
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all ratings for a tutor
router.get('/tutor/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params;

    const ratings = await SessionRating.find({ tutorId })
      .populate('studentId', 'fullName profileImageUrl')
      .populate('sessionId', 'title scheduledDate startTime endTime')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: ratings
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all ratings for a session
router.get('/session/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const ratings = await SessionRating.find({ sessionId })
      .populate('studentId', 'fullName profileImageUrl')
      .populate('tutorId', 'fullName profileImageUrl')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: ratings
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get tutor rating statistics
router.get('/tutor/:tutorId/stats', async (req, res) => {
  try {
    const { tutorId } = req.params;

    const ratings = await SessionRating.find({ tutorId }).select('rating');

    if (!ratings || ratings.length === 0) {
      return res.json({
        success: true,
        data: {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
        }
      });
    }

    const totalReviews = ratings.length;
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / totalReviews;

    const ratingDistribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    ratings.forEach(r => {
      ratingDistribution[r.rating.toString()]++;
    });

    res.json({
      success: true,
      data: {
        average_rating: Math.round(averageRating * 10) / 10,
        total_reviews: totalReviews,
        rating_distribution: ratingDistribution
      }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Check if student has rated a session
router.get('/session/:sessionId/student/:studentId/check', authenticate, async (req, res) => {
  try {
    const { sessionId, studentId } = req.params;

    // Ensure user can only check their own ratings
    if (req.user!.id !== studentId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const rating = await SessionRating.findOne({
      sessionId,
      studentId
    }).select('_id');

    res.json({
      success: true,
      data: { hasRated: !!rating }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a rating
router.delete('/:ratingId', authenticate, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const studentId = req.user!.id;

    const rating = await SessionRating.findOneAndDelete({
      _id: ratingId,
      studentId
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        error: 'Rating not found or access denied'
      });
    }

    res.json({
      success: true,
      data: { message: 'Rating deleted successfully' }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

