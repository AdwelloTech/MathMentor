import express from 'express';
import { authenticate } from '../middleware/auth';
import instantSessionService from '../services/instantSessionService';

const router = express.Router();

/**
 * @route   POST /api/instant-sessions/request
 * @desc    Create a new instant session request
 * @access  Private (Student)
 */
router.post('/request', authenticate, async (req, res) => {
  try {
    const { subjectId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        error: 'Subject ID is required'
      });
    }

    const session = await instantSessionService.createRequest({
      studentId: userId,
      subjectId
    });

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Error creating instant session request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create instant session request'
    });
  }
});

/**
 * @route   GET /api/instant-sessions/pending
 * @desc    Get all pending instant session requests
 * @access  Private (Tutor)
 */
router.get('/pending', authenticate, async (req, res) => {
  try {
    const { subjectId, limit } = req.query;
    
    const sessions = await instantSessionService.getPendingRequests(
      subjectId as string | undefined,
      limit ? parseInt(limit as string) : 20
    );

    res.json({
      success: true,
      data: sessions
    });
  } catch (error: any) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pending requests'
    });
  }
});

/**
 * @route   POST /api/instant-sessions/:id/accept
 * @desc    Accept an instant session request
 * @access  Private (Tutor)
 */
router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const session = await instantSessionService.acceptRequest({
      requestId: id,
      tutorId: userId
    });

    res.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Error accepting instant session:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to accept instant session'
    });
  }
});

/**
 * @route   POST /api/instant-sessions/:id/cancel
 * @desc    Cancel an instant session request
 * @access  Private (Student or Tutor)
 */
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const session = await instantSessionService.cancelRequest({
      requestId: id,
      userId,
      reason
    });

    res.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Error cancelling instant session:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to cancel instant session'
    });
  }
});

/**
 * @route   GET /api/instant-sessions/:id
 * @desc    Get instant session by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await instantSessionService.getSessionById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Error fetching instant session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch instant session'
    });
  }
});

/**
 * @route   GET /api/instant-sessions/student/me
 * @desc    Get current student's instant sessions
 * @access  Private (Student)
 */
router.get('/student/me', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const sessions = await instantSessionService.getStudentSessions(
      userId,
      limit ? parseInt(limit as string) : 10
    );

    res.json({
      success: true,
      data: sessions
    });
  } catch (error: any) {
    console.error('Error fetching student sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch student sessions'
    });
  }
});

/**
 * @route   GET /api/instant-sessions/tutor/me
 * @desc    Get current tutor's instant sessions
 * @access  Private (Tutor)
 */
router.get('/tutor/me', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const sessions = await instantSessionService.getTutorSessions(
      userId,
      limit ? parseInt(limit as string) : 10
    );

    res.json({
      success: true,
      data: sessions
    });
  } catch (error: any) {
    console.error('Error fetching tutor sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tutor sessions'
    });
  }
});

/**
 * @route   POST /api/instant-sessions/:id/tutor-joined
 * @desc    Mark tutor as joined
 * @access  Private (Tutor)
 */
router.post('/:id/tutor-joined', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await instantSessionService.markTutorJoined(id);

    res.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Error marking tutor joined:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to mark tutor as joined'
    });
  }
});

/**
 * @route   POST /api/instant-sessions/:id/student-joined
 * @desc    Mark student as joined
 * @access  Private (Student)
 */
router.post('/:id/student-joined', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await instantSessionService.markStudentJoined(id);

    res.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Error marking student joined:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to mark student as joined'
    });
  }
});

/**
 * @route   POST /api/instant-sessions/:id/start
 * @desc    Start an instant session
 * @access  Private (Tutor)
 */
router.post('/:id/start', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await instantSessionService.startSession(id);

    res.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Error starting session:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to start session'
    });
  }
});

/**
 * @route   POST /api/instant-sessions/:id/complete
 * @desc    Complete an instant session
 * @access  Private (Tutor or Student)
 */
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await instantSessionService.completeSession(id);

    res.json({
      success: true,
      data: session
    });
  } catch (error: any) {
    console.error('Error completing session:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to complete session'
    });
  }
});

/**
 * @route   POST /api/instant-sessions/cleanup
 * @desc    Cleanup stale and expired sessions (admin or cron job)
 * @access  Private (Admin)
 */
router.post('/cleanup', authenticate, async (req, res) => {
  try {
    const result = await instantSessionService.cleanupSessions();

    res.json({
      success: true,
      data: {
        message: 'Cleanup completed',
        ...result
      }
    });
  } catch (error: any) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cleanup sessions'
    });
  }
});

export default router;

