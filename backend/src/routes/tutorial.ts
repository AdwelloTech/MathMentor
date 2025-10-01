import express from 'express';
import { TutorialService } from '../services/tutorialService';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Get tutorial status for current user
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const status = await TutorialService.getTutorialStatus(userId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update tutorial status for current user
router.put('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const updates = req.body;

    const status = await TutorialService.updateTutorialStatus(userId, updates);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Complete tutorial for current user
router.post('/complete', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const success = await TutorialService.completeTutorial(userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Tutorial completed successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Dismiss tutorial for current user
router.post('/dismiss', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const status = await TutorialService.dismissTutorial(userId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
