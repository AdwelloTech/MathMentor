import express from 'express';
import { authenticate } from '../middleware/auth';
import { uploadInstances } from '../services/fileUploadService';
import ProfileImageService from '../services/profileImageService';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Upload a new profile image
 * POST /api/profile-images/upload
 */
router.post('/upload', uploadInstances.profileImages.single('profileImage'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const result = await ProfileImageService.uploadProfileImage(
      req.user.id,
      req.file
    );

    res.status(201).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Profile image upload error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get active profile image for current user
 * GET /api/profile-images/active
 */
router.get('/active', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const profileImage = await ProfileImageService.getActiveProfileImage(req.user.id);

    res.json({
      success: true,
      data: profileImage // This will be null if no active image exists
    });
  } catch (error: any) {
    console.error('Get active profile image error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all profile images for current user
 * GET /api/profile-images
 */
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const profileImages = await ProfileImageService.getUserProfileImages(req.user.id);

    res.json({
      success: true,
      data: profileImages
    });
  } catch (error: any) {
    console.error('Get profile images error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Activate a specific profile image
 * PATCH /api/profile-images/:imageId/activate
 */
router.patch('/:imageId/activate', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await ProfileImageService.activateProfileImage(
      req.user.id,
      req.params.imageId
    );

    res.json({
      success: true,
      message: 'Profile image activated successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Activate profile image error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete a profile image
 * DELETE /api/profile-images/:imageId
 */
router.delete('/:imageId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    await ProfileImageService.deleteProfileImage(req.user.id, req.params.imageId);

    res.json({
      success: true,
      message: 'Profile image deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete profile image error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Cleanup inactive profile images
 * POST /api/profile-images/cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const deletedCount = await ProfileImageService.cleanupInactiveImages(req.user.id);

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} inactive profile images`,
      data: { deletedCount }
    });
  } catch (error: any) {
    console.error('Cleanup profile images error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
