import express from 'express';
import { AuthService, RegisterData, LoginData } from '../services/authService';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema, validateOrThrow } from '../utils/validation';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const validatedData = validateOrThrow(registerSchema, req.body) as RegisterData;

    // Register user
    const result = await AuthService.register(validatedData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const { email, password } = validateOrThrow(loginSchema, req.body) as LoginData;

    // Login user
    const result = await AuthService.login({ email, password });

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await AuthService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Logout user
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Logout from all devices
router.post('/logout-all', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    await AuthService.logoutAll(req.user.id);

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await AuthService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        user_id: user._id.toString(),
        first_name: user.firstName,
        last_name: user.lastName,
        full_name: user.fullName,
        email: user.email,
        role: user.role,
        avatar_url: user.avatarUrl,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        emergency_contact: user.emergencyContact,
        age: (user as any).age, // Access virtual field
        grade_level_id: user.gradeLevelId,
        current_grade: user.currentGrade,
        academic_set: user.academicSet,
        has_learning_disabilities: user.hasLearningDisabilities,
        learning_needs_description: user.learningNeedsDescription,
        parent_name: user.parentName,
        parent_phone: user.parentPhone,
        parent_email: user.parentEmail,
        city: user.city,
        postcode: user.postcode,
        school_name: user.schoolName,
        profile_image_url: user.profileImageUrl,
        created_at: user.createdAt,
        last_login: user.lastLogin
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update current user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const updatedProfile = await AuthService.updateProfile(req.user.id, req.body);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    // Validate input
    const { email, password } = validateOrThrow(loginSchema, req.body) as LoginData;

    // Login admin
    const result = await AuthService.adminLogin({ email, password });

    res.json({
      success: true,
      message: 'Admin login successful',
      data: result
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Admin logout
router.post('/admin/logout', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { refreshToken } = req.body;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Admin logout successful'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Validate admin session
router.get('/admin/validate-session', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const user = await AuthService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        admin_id: user._id.toString(),
        admin_email: user.email
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
