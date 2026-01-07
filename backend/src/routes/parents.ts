import express from 'express';
import { ParentService } from '../services/parentService';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * Link a student to parent using student code
 * POST /api/parents/link-student
 */
router.post('/link-student', authenticate, async (req, res, next) => {
  try {
    const parentId = req.user?.id;
    if (!parentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user?.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied: Parent role required' });
    }

    const { studentCode, relationship, isPrimaryContact } = req.body;

    if (!studentCode) {
      return res.status(400).json({ message: 'Student code is required' });
    }

    const link = await ParentService.linkStudent(parentId, {
      studentCode,
      relationship,
      isPrimaryContact
    });

    res.status(201).json({
      success: true,
      data: link,
      message: 'Student linked successfully'
    });
  } catch (error: any) {
    console.error('Error linking student:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to link student'
    });
  }
});

/**
 * Get all linked students
 * GET /api/parents/students
 */
router.get('/students', authenticate, async (req, res, next) => {
  try {
    const parentId = req.user?.id;
    if (!parentId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (req.user?.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Parent role required'
      });
    }

    const students = await ParentService.getLinkedStudents(parentId);

    res.json({
      success: true,
      data: students
    });
  } catch (error: any) {
    console.error('Error fetching linked students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch students'
    });
  }
});

/**
 * Unlink a student from parent
 * DELETE /api/parents/students/:studentId
 */
router.delete('/students/:studentId', authenticate, async (req, res, next) => {
  try {
    const parentId = req.user?.id;
    if (!parentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user?.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied: Parent role required' });
    }

    const { studentId } = req.params;
    await ParentService.unlinkStudent(parentId, studentId);

    res.json({
      success: true,
      message: 'Student unlinked successfully'
    });
  } catch (error: any) {
    console.error('Error unlinking student:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to unlink student'
    });
  }
});

/**
 * Update permissions for a student
 * PATCH /api/parents/students/:studentId/permissions
 */
router.patch('/students/:studentId/permissions', authenticate, async (req, res, next) => {
  try {
    const parentId = req.user?.id;
    if (!parentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user?.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied: Parent role required' });
    }

    const { studentId } = req.params;
    const permissions = req.body;

    const updatedLink = await ParentService.updatePermissions(parentId, studentId, permissions);
    res.json({
      success: true,
      data: updatedLink
    });
  } catch (error: any) {
    console.error('Error updating permissions:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update permissions'
    });
  }
});

/**
 * Get dashboard data for a specific student
 * GET /api/parents/students/:studentId/dashboard
 */
router.get('/students/:studentId/dashboard', authenticate, async (req, res, next) => {
  try {
    const parentId = req.user?.id;
    if (!parentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user?.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied: Parent role required' });
    }

    const { studentId } = req.params;
    const dashboardData = await ParentService.getStudentDashboardData(parentId, studentId);

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error: any) {
    console.error('Error fetching student dashboard:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to fetch student dashboard'
    });
  }
});

/**
 * Get quiz progress for a specific student
 * GET /api/parents/students/:studentId/quiz-progress
 */
router.get('/students/:studentId/quiz-progress', authenticate, async (req, res, next) => {
  try {
    const parentId = req.user?.id;
    if (!parentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user?.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied: Parent role required' });
    }

    const { studentId } = req.params;
    const quizProgress = await ParentService.getStudentQuizProgress(parentId, studentId);

    res.json({
      success: true,
      data: quizProgress
    });
  } catch (error: any) {
    console.error('Error fetching quiz progress:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to fetch quiz progress'
    });
  }
});

/**
 * Get session progress for a specific student
 * GET /api/parents/students/:studentId/session-progress
 */
router.get('/students/:studentId/session-progress', authenticate, async (req, res, next) => {
  try {
    const parentId = req.user?.id;
    if (!parentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user?.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied: Parent role required' });
    }

    const { studentId } = req.params;
    const { filter, page, limit, subject } = req.query;

    const options: any = {};
    if (filter && ['all', 'upcoming', 'completed', 'cancelled'].includes(filter as string)) {
      options.filter = filter;
    }
    if (subject && typeof subject === 'string') {
      options.subject = subject;
    }
    if (page) {
      options.page = parseInt(page as string, 10);
    }
    if (limit) {
      options.limit = parseInt(limit as string, 10);
    }

    const sessionProgress = await ParentService.getStudentSessionProgress(parentId, studentId, options);

    res.json({
      success: true,
      data: sessionProgress
    });
  } catch (error: any) {
    console.error('Error fetching session progress:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to fetch session progress'
    });
  }
});

/**
 * Get details for a specific quiz attempt
 * GET /api/parents/students/:studentId/quiz-attempts/:attemptId
 */
router.get('/students/:studentId/quiz-attempts/:attemptId', authenticate, async (req, res, next) => {
  try {
    const parentId = req.user?.id;
    if (!parentId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user?.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied: Parent role required' });
    }

    const { studentId, attemptId } = req.params;
    const attemptDetails = await ParentService.getStudentQuizAttemptDetails(
      parentId,
      studentId,
      attemptId
    );

    res.json({
      success: true,
      data: attemptDetails
    });
  } catch (error: any) {
    console.error('Error fetching quiz attempt details:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to fetch quiz attempt details'
    });
  }
});

export default router;

