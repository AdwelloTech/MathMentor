import express from 'express';
import Joi from 'joi';
import { authenticate } from '../middleware/auth';
import { TutorService } from '../services/tutorService';

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
