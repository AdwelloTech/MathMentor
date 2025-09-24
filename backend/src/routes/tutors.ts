import express from 'express';
import { authenticate } from '../middleware/auth';
import { TutorService } from '../services/tutorService';

const router = express.Router();

// Get tutor application by user ID
router.get('/applications', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const applications = await TutorService.getTutorApplications(req.user.id);

    res.json({
      success: true,
      data: applications
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get ID verification by user ID
router.get('/id-verification', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const verification = await TutorService.getIDVerification(req.user.id);

    res.json({
      success: true,
      data: verification
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
