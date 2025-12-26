import express from 'express';
import jwt from 'jsonwebtoken';
import { AuthService, RegisterData, LoginData } from '../services/authService';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema, validateOrThrow } from '../utils/validation';
import { User } from '../models';
import {
  authLimiter,
  passwordResetLimiter,
  otpLimiter,
  emailLimiter
} from '../middleware/rateLimiter';

const router = express.Router();

// Register new user - sends OTP to email
router.post('/register', authLimiter, async (req, res) => {
  try {
    console.log('🔍 REGISTRATION: Received registration request');
    console.log('🔍 REGISTRATION: Request body:', JSON.stringify(req.body, null, 2));

    // Validate input
    const validatedData = validateOrThrow(registerSchema, req.body) as RegisterData;

    console.log('🔍 REGISTRATION: Validation passed, registering user');

    // Register user (this will send OTP)
    const result = await AuthService.register(validatedData);

    console.log('🔍 REGISTRATION: User registration successful:', result.email);

    res.status(201).json({
      success: true,
      message: result.message,
      data: { email: result.email }
    });
  } catch (error: any) {
    console.log('❌ REGISTRATION: Error occurred:', error.message);
    console.log('❌ REGISTRATION: Full error:', error);
    console.log('❌ REGISTRATION: Request body that caused error:', JSON.stringify(req.body, null, 2));

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Verify email OTP
router.post('/verify-email', otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    const result = await AuthService.verifyEmail(email, otp);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Verify email via link (GET route for email links)
router.get('/verify-email-link', async (req, res) => {
  try {
    const { token } = req.query;

    console.log('Email verification link clicked, token:', token ? 'present' : 'missing');

    if (!token || typeof token !== 'string') {
      console.log('Invalid token format');
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1 class="error">Invalid Verification Link</h1>
          <p>The verification link is invalid or has expired.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">Go to Login</a></p>
        </body>
        </html>
      `);
    }

    // Verify the JWT token
    console.log('Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    console.log('Decoded token:', { email: decoded.email, type: decoded.type });

    if (!decoded.email || decoded.type !== 'email_verification') {
      console.log('Invalid token content');
      throw new Error('Invalid token');
    }

    // Find and update the user
    console.log('Looking for user with email:', decoded.email.toLowerCase());
    const user = await User.findOne({ email: decoded.email.toLowerCase() });
    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      console.log('User not found');
      throw new Error('User not found');
    }

    console.log('User emailVerified status:', user.emailVerified);

    if (user.emailVerified) {
      console.log('Email already verified, showing already verified page');
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Already Verified</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #28a745; }
          </style>
        </head>
        <body>
          <h1 class="success">Email Already Verified</h1>
          <p>Your email has already been verified.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">Go to Login</a></p>
        </body>
        </html>
      `);
    }

    // Mark email as verified
    console.log('Updating user emailVerified to true');
    user.emailVerified = true;
    user.lastLogin = new Date();
    await user.save();
    console.log('User saved successfully');

    // Send success response
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: #28a745; }
          .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1 class="success">Email Verified Successfully!</h1>
        <p>Welcome to MathMentor! Your email has been verified.</p>
        <p>You can now log in to your account.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Go to Login</a>
      </body>
      </html>
    `);

  } catch (error: any) {
    console.error('Email verification link error:', error);
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verification Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; }
        </style>
      </head>
      <body>
        <h1 class="error">Verification Failed</h1>
        <p>The verification link is invalid or has expired.</p>
        <p>Please try logging in again to receive a new verification link.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">Go to Login</a></p>
      </body>
      </html>
    `);
  }
});

// Resend verification OTP
router.post('/resend-verification-otp', emailLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const message = await AuthService.resendVerificationOTP(email);

    res.json({
      success: true,
      data: { message }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Login user
router.post('/login', authLimiter, async (req, res) => {
  try {
    // Validate input
    const { email, password } = validateOrThrow(loginSchema, req.body) as LoginData;

    // Login user
    const result = await AuthService.login({ email, password });

    // AGGRESSIVE CACHE PREVENTION - Multiple headers to ensure no caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Cache-Prevent', 'true'); // Custom header to verify

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error: any) {
    // Handle email not verified error specially
    if (error.code === 'EMAIL_NOT_VERIFIED') {
      return res.status(403).json({
        success: false,
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email. We have sent a verification code to your email.',
        email: error.email
      });
    }

    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Login with email verification (for unverified accounts)
router.post('/login-with-verification', authLimiter, async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    if (!email || !password || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and OTP are required'
      });
    }

    const result = await AuthService.loginWithVerification(email, password, otp);

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

    // AGGRESSIVE CACHE PREVENTION for /me endpoint
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Cache-Prevent', 'true');

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
        package: user.package, // Include package for students
        student_code: user.studentCode, // Include student code for parent linking
        avatar_url: user.avatarUrl,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        emergency_contact: user.emergencyContact,
        date_of_birth: user.dateOfBirth,
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
        // Tutor-specific fields
        qualification: user.qualification,
        experience_years: user.experienceYears,
        specializations: user.specializations,
        hourly_rate: user.hourlyRate,
        availability: user.availability,
        bio: user.bio,
        certifications: user.certifications,
        languages: user.languages,
        cv_url: user.cvUrl,
        cv_file_name: user.cvFileName,
        profile_completed: user.profileCompleted,
        is_online: user.isOnline,
        allowed_session_types: user.allowedSessionTypes,
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
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile'
    });
  }
});

// Admin login
router.post('/admin/login', authLimiter, async (req, res) => {
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
    console.error('Admin login error:', error.message);
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

// Request password reset - sends OTP to email
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const message = await AuthService.requestPasswordReset(email);

    res.json({
      success: true,
      data: { message }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify password reset OTP
router.post('/verify-reset-otp', otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    const message = await AuthService.verifyPasswordResetOTP(email, otp);

    res.json({
      success: true,
      message
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Reset password with OTP
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email, OTP, and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    const message = await AuthService.resetPassword(email, otp, newPassword);

    res.json({
      success: true,
      data: { message }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Resend password reset OTP
router.post('/resend-reset-otp', emailLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const message = await AuthService.resendPasswordResetOTP(email);

    res.json({
      success: true,
      message
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
