import express from 'express';
import { authenticate } from '../middleware/auth';
import { DashboardService } from '../services/dashboardService';

const router = express.Router();

// Student dashboard stats
router.get('/student/stats/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const stats = await DashboardService.getStudentStats(studentId);

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

// Student upcoming sessions
router.get('/student/sessions/upcoming/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const sessions = await DashboardService.getStudentUpcomingSessions(studentId);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Student recent activity
router.get('/student/activity/recent/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const activity = await DashboardService.getStudentRecentActivity(studentId);

    res.json({
      success: true,
      data: activity,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Tutor dashboard stats
router.get('/tutor/stats/:tutorId', authenticate, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const stats = await DashboardService.getTutorStats(tutorId);

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

// Tutor upcoming sessions
router.get('/tutor/sessions/upcoming/:tutorId', authenticate, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const sessions = await DashboardService.getTutorUpcomingSessions(tutorId);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Tutor recent activity
router.get('/tutor/activity/recent/:tutorId', authenticate, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const activity = await DashboardService.getTutorRecentActivity(tutorId);

    res.json({
      success: true,
      data: activity,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Admin dashboard stats
router.get('/admin/stats', authenticate, async (req, res) => {
  try {
    const stats = await DashboardService.getAdminStats();

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
