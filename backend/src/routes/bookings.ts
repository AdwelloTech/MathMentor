import express from 'express';
import Joi from 'joi';
import { BookingService, CreateBookingData, UpdateBookingData } from '../services/bookingService';
import { authenticate, authorize } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';

const router = express.Router();

// Validation schemas
const createBookingSchema = Joi.object({
  classId: Joi.string().optional(),
  bookingType: Joi.string().valid('class', 'session', 'consultation').required(),
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(500).optional(),
  subjectId: Joi.string().optional(),
  gradeLevelId: Joi.string().optional(),
  scheduledDate: Joi.date().required(),
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  duration: Joi.number().min(15).max(480).required(),
  price: Joi.number().min(0).optional(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD', 'AUD').optional(),
  notes: Joi.string().max(1000).optional(),
  specialRequirements: Joi.string().max(500).optional(),
  meetingLink: Joi.string().optional(),
  roomNumber: Joi.string().max(50).optional(),
  location: Joi.string().max(200).optional(),
  paymentId: Joi.string().optional(),
  paymentStatus: Joi.string().valid('pending', 'paid', 'refunded', 'cancelled').optional(),
});

const updateBookingSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed', 'no_show').optional(),
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(500).optional(),
  scheduledDate: Joi.date().optional(),
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  duration: Joi.number().min(15).max(480).optional(),
  price: Joi.number().min(0).optional(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP', 'CAD', 'AUD').optional(),
  notes: Joi.string().max(1000).optional(),
  specialRequirements: Joi.string().max(500).optional(),
  meetingLink: Joi.string().optional(),
  roomNumber: Joi.string().max(50).optional(),
  location: Joi.string().max(200).optional(),
});

// Create booking
router.post('/', authenticate, async (req, res) => {
  try {
    const validatedData = validateOrThrow(createBookingSchema, req.body) as CreateBookingData;
    const result = await BookingService.createBooking(req.user!.id, validatedData);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get booking by ID
router.get('/:bookingId', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await BookingService.getBookingById(bookingId, req.user!.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get bookings by student
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if user can access this student's bookings
    if (req.user!.id !== studentId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const filters = {
      status: req.query.status as any,
      bookingType: req.query.bookingType as any,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
    };

    const bookings = await BookingService.getBookingsByStudent(studentId, filters);

    res.json({
      success: true,
      data: bookings,
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

// Get bookings by teacher
router.get('/teacher/:teacherId', authenticate, async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Check if user can access this teacher's bookings
    if (req.user!.id !== teacherId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const filters = {
      status: req.query.status as any,
      bookingType: req.query.bookingType as any,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
    };

    const bookings = await BookingService.getBookingsByTeacher(teacherId, filters);

    res.json({
      success: true,
      data: bookings,
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

// Update booking
router.put('/:bookingId', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const validatedData = validateOrThrow(updateBookingSchema, req.body) as UpdateBookingData;
    const result = await BookingService.updateBooking(bookingId, req.user!.id, validatedData);

    res.json({
      success: true,
      message: 'Booking updated successfully',
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

// Cancel booking
router.post('/:bookingId/cancel', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const result = await BookingService.cancelBooking(bookingId, req.user!.id, reason);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
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

// Confirm booking (teacher only)
router.post('/:bookingId/confirm', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await BookingService.confirmBooking(bookingId, req.user!.id);

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
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

// Complete booking
router.post('/:bookingId/complete', authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await BookingService.completeBooking(bookingId, req.user!.id);

    res.json({
      success: true,
      message: 'Booking completed successfully',
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

// Get booking statistics
router.get('/stats/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query;

    // Check if user can access these stats
    if (req.user!.id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const stats = await BookingService.getBookingStats(userId, role as 'student' | 'tutor');

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

// Check for scheduling conflicts
router.post('/check-conflict', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { teacherId, scheduledDate, startTime, endTime, excludeBookingId } = req.body;

    if (!teacherId || !scheduledDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Check if user can check conflicts for this teacher
    if (req.user!.id !== teacherId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    const hasConflict = await BookingService.checkConflict(
      teacherId,
      new Date(scheduledDate),
      startTime,
      endTime,
      excludeBookingId
    );

    res.json({
      success: true,
      data: { hasConflict },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
