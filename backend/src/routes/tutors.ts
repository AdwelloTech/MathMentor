import express from 'express';
import Joi from 'joi';
import { authenticate } from '../middleware/auth';
import { TutorService } from '../services/tutorService';
import { uploadInstances, FileUploadService } from '../services/fileUploadService';

// Validation schema for tutor application
const tutorApplicationSchema = Joi.object({
  user_id: Joi.string().required(),
  applicant_email: Joi.string().email().required(),
  full_name: Joi.string().required(),
  phone_number: Joi.string().required(),
  subjects: Joi.array().items(Joi.string()).min(1).required(),
  specializes_learning_disabilities: Joi.boolean().required(),
  cv_file_name: Joi.string().optional(),
  cv_url: Joi.string().optional(),
  cv_file_size: Joi.number().optional(),
  additional_notes: Joi.string().optional().allow(''),
  postcode: Joi.string().optional(),
  based_in_country: Joi.string().optional(),
  past_experience: Joi.string().optional().allow(''),
  weekly_availability: Joi.string().optional().allow(''),
  employment_status: Joi.string().optional().allow(''),
  education_level: Joi.string().optional().allow(''),
  average_weekly_hours: Joi.number().optional(),
  expected_hourly_rate: Joi.number().optional(),
});

const router = express.Router();

// Create tutor application
router.post('/applications', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Validate request body
    const { error, value } = tutorApplicationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Verify user owns this application
    if (req.user.id !== value.user_id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: cannot create application for another user'
      });
    }

    const application = await TutorService.createTutorApplication(value);

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error: any) {
    console.error('Error creating tutor application:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create tutor application'
    });
  }
});

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

// Accept all pending tutor applications (development/testing endpoint - no auth required)
router.post('/applications/accept-all', async (req, res) => {
  try {
    const result = await TutorService.acceptAllPendingApplications();

    res.json({
      success: true,
      message: `Accepted ${result.acceptedCount} tutor applications`,
      data: result
    });
  } catch (error: any) {
    console.error('Error accepting all applications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to accept applications'
    });
  }
});

// Accept all pending ID verifications (development/testing endpoint - no auth required)
router.post('/id-verification/accept-all', async (req, res) => {
  try {
    const result = await TutorService.acceptAllPendingIDVerifications();

    res.json({
      success: true,
      message: `Accepted ${result.acceptedCount} ID verifications`,
      data: result
    });
  } catch (error: any) {
    console.error('Error accepting all ID verifications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to accept ID verifications'
    });
  }
});

// Update tutor application by user ID
router.put('/applications/:userId', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { userId } = req.params;

    // Verify user owns this application or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: cannot update application for another user'
      });
    }

    const application = await TutorService.updateTutorApplication(userId, req.body);

    res.json({
      success: true,
      data: application
    });
  } catch (error: any) {
    console.error('Error updating tutor application:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tutor application'
    });
  }
});

// Submit ID verification
router.post('/id-verification', authenticate, uploadInstances.idVerificationImages.fields([
  { name: 'front_image', maxCount: 1 },
  { name: 'back_image', maxCount: 1 },
  { name: 'selfie_with_id', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Extract form data
    const {
      id_type,
      id_number,
      full_name,
      date_of_birth,
      expiry_date,
      issuing_country,
      issuing_authority
    } = req.body;

    // Extract uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Validate required fields
    if (!id_type || !id_number || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id_type, id_number, full_name'
      });
    }

    if (!files.front_image || !files.back_image || !files.selfie_with_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required image files'
      });
    }

    // Get file URLs
    const frontImageUrl = FileUploadService.getFileUrl(files.front_image[0].path, process.env.BASE_URL);
    const backImageUrl = FileUploadService.getFileUrl(files.back_image[0].path, process.env.BASE_URL);
    const selfieUrl = FileUploadService.getFileUrl(files.selfie_with_id[0].path, process.env.BASE_URL);

    const verificationData = {
      user_id: req.user.id,
      id_type,
      id_number,
      full_name,
      date_of_birth: date_of_birth || undefined,
      expiry_date: expiry_date || undefined,
      issuing_country: issuing_country || undefined,
      issuing_authority: issuing_authority || undefined,
      front_image_url: frontImageUrl,
      back_image_url: backImageUrl,
      selfie_with_id_url: selfieUrl,
      verification_status: 'pending' as const,
      submitted_at: new Date().toISOString(),
      reviewed_at: undefined,
      reviewed_by: undefined,
      rejection_reason: undefined,
      admin_notes: undefined,
      verified_at: undefined,
      verified_by: undefined,
    };

    const verification = await TutorService.submitIDVerification(verificationData);

    res.status(201).json({
      success: true,
      data: verification
    });
  } catch (error: any) {
    console.error('Error submitting ID verification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit ID verification'
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

    if (!verification) {
      return res.status(404).json({
        success: false,
        error: 'No ID verification found'
      });
    }

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

// Update ID verification status (admin only)
router.put('/id-verification/:userId', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user is admin (for now, allow any authenticated user to update)
    // In production, you might want to restrict this to admins only
    const { userId } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: pending, approved, rejected, expired'
      });
    }

    const verification = await TutorService.updateIDVerificationStatus(userId, status, req.user.id);

    res.json({
      success: true,
      data: verification
    });
  } catch (error: any) {
    console.error('Error updating ID verification status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update ID verification status'
    });
  }
});

export default router;
