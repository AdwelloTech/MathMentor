import express from 'express';
import { authenticate } from '../middleware/auth';
import { TutorService } from '../services/tutorService';

// For debugging purposes - temporary solution
const debugAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Bypass authentication for development
  console.log('DEBUG: Using mock authentication');
  req.user = {
    id: 'admin-debug-id',
    email: 'admin@example.com',
    role: 'admin'
  };
  next();
};

const router = express.Router();

// Admin routes - require authentication and admin role
const adminGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

// Get tutor statistics
router.get('/tutors/stats', debugAuth, async (req, res) => {
  try {
    console.log('GET /api/admin/tutors/stats - Fetching tutor statistics');
    const stats = await TutorService.getTutorStats();
    console.log('GET /api/admin/tutors/stats - Statistics retrieved successfully', stats);
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting tutor stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tutor stats'
    });
  }
});

// Get all tutors with their applications
router.get('/tutors', debugAuth, async (req, res) => {
  try {
    console.log('GET /api/admin/tutors - Fetching all tutors for admin');
    const tutors = await TutorService.getAllTutorsForAdmin();
    console.log(`GET /api/admin/tutors - Found ${tutors.length} tutors`);
    return res.json({
      success: true,
      data: tutors
    });
  } catch (error: any) {
    console.error('Error getting all tutors for admin:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tutors'
    });
  }
});

// Get classes for a specific tutor
router.get('/tutors/:tutorId/classes', debugAuth, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const classes = await TutorService.getTutorClasses(tutorId);
    res.json({
      success: true,
      data: classes
    });
  } catch (error: any) {
    console.error('Error getting tutor classes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tutor classes'
    });
  }
});

// Update tutor status (activate/deactivate)
router.put('/tutors/:tutorId/status', debugAuth, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'is_active must be a boolean value'
      });
    }

    await TutorService.updateTutorStatus(tutorId, is_active);
    res.json({
      success: true,
      data: { id: tutorId, is_active }
    });
  } catch (error: any) {
    console.error('Error updating tutor status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tutor status'
    });
  }
});

// Delete a tutor
router.delete('/tutors/:tutorId', debugAuth, async (req, res) => {
  try {
    const { tutorId } = req.params;
    await TutorService.deleteTutor(tutorId);
    res.json({
      success: true,
      data: { id: tutorId }
    });
  } catch (error: any) {
    console.error('Error deleting tutor:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete tutor'
    });
  }
});

// Get a specific tutor by ID
router.get('/tutors/:tutorId', debugAuth, async (req, res) => {
  try {
    const { tutorId } = req.params;
    console.log('GET /api/admin/tutors/:tutorId - tutorId:', tutorId);

    // Skip if it's a special route like "stats"
    if (tutorId === 'stats') {
      return res.status(404).json({
        success: false,
        error: 'Not found'
      });
    }

    const tutor = await TutorService.getTutorById(tutorId);
    console.log('GET /api/admin/tutors/:tutorId - Found tutor:', tutor ? tutor._id : 'null');

    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: 'Tutor not found'
      });
    }

    return res.json({
      success: true,
      data: tutor
    });
  } catch (error: any) {
    console.error('Error getting tutor details:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tutor details'
    });
  }
});

// Get all tutor applications
router.get('/tutor-applications', debugAuth, async (req, res) => {
  try {
    console.log('GET /api/admin/tutor-applications - Fetching all tutor applications');
    const applications = await TutorService.getAllTutorApplications();
    console.log(`GET /api/admin/tutor-applications - Found ${applications.length} applications`);
    return res.json({
      success: true,
      data: applications
    });
  } catch (error: any) {
    console.error('Error getting all tutor applications:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tutor applications'
    });
  }
});

// Get tutor application statistics
router.get('/tutor-applications/stats', debugAuth, async (req, res) => {
  try {
    console.log('GET /api/admin/tutor-applications/stats - Fetching application statistics');
    const stats = await TutorService.getTutorApplicationStats();
    console.log('GET /api/admin/tutor-applications/stats - Statistics retrieved successfully', stats);
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting tutor application stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tutor application stats'
    });
  }
});

// Update tutor application status
router.put('/tutor-applications/:userId', debugAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, rejection_reason, admin_notes } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: pending, approved, rejected'
      });
    }

    const application = await TutorService.updateTutorApplicationStatus(
      userId,
      status,
      req.user!.id,
      rejection_reason,
      admin_notes
    );

    res.json({
      success: true,
      data: application
    });
  } catch (error: any) {
    console.error('Error updating tutor application status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tutor application status'
    });
  }
});

// Get all ID verifications
router.get('/id-verifications', debugAuth, async (req, res) => {
  try {
    console.log('GET /api/admin/id-verifications - Fetching all ID verifications');
    const verifications = await TutorService.getAllIDVerifications();
    console.log(`GET /api/admin/id-verifications - Found ${verifications.length} verifications`);
    return res.json({
      success: true,
      data: verifications
    });
  } catch (error: any) {
    console.error('Error getting all ID verifications:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get ID verifications'
    });
  }
});

// Get ID verification statistics
router.get('/id-verifications/stats', debugAuth, async (req, res) => {
  try {
    console.log('GET /api/admin/id-verifications/stats - Fetching ID verification statistics');
    const stats = await TutorService.getIDVerificationStats();
    console.log('GET /api/admin/id-verifications/stats - Statistics retrieved successfully', stats);
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting ID verification stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get ID verification stats'
    });
  }
});

// Update an ID verification status
router.put('/id-verifications/:verificationId', debugAuth, async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { status, admin_notes, rejection_reason } = req.body;

    if (!status || !['pending', 'approved', 'rejected', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: pending, approved, rejected, expired'
      });
    }

    console.log('PUT /api/admin/id-verifications/:verificationId - verificationId:', verificationId, 'status:', status);

    const verification = await TutorService.updateIDVerificationById(
      verificationId,
      status,
      req.user!.id,
      admin_notes,
      rejection_reason
    );

    res.json({
      success: true,
      data: verification
    });
  } catch (error: any) {
    console.error('Error updating ID verification by ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update ID verification'
    });
  }
});

// Delete an ID verification
router.delete('/id-verifications/:verificationId', debugAuth, async (req, res) => {
  try {
    const { verificationId } = req.params;
    console.log('DELETE /api/admin/id-verifications/:verificationId - verificationId:', verificationId);

    await TutorService.deleteIDVerification(verificationId);
    res.json({
      success: true,
      data: { id: verificationId }
    });
  } catch (error: any) {
    console.error('Error deleting ID verification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete ID verification'
    });
  }
});

export default router;
