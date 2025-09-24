import { User, RefreshToken } from '../models';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'principal' | 'teacher' | 'student' | 'parent' | 'hr' | 'finance' | 'support';
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthTokens> {
    const { firstName, lastName, email, password, role, phone } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const fullName = `${firstName} ${lastName}`;
    const user = new User({
      firstName,
      lastName,
      fullName,
      email: email.toLowerCase(),
      password,
      role,
      phone,
      isActive: true
    });

    await user.save();

    // Generate tokens
    const tokens = generateTokenPair(user._id, user.email, user.role);

    // Save refresh token
    await this.saveRefreshToken(user._id, tokens.tokenId, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    };
  }

  /**
   * Login user
   */
  static async login(data: LoginData): Promise<AuthTokens> {
    const { email, password } = data;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = generateTokenPair(user._id, user.email, user.role);

    // Save refresh token
    await this.saveRefreshToken(user._id, tokens.tokenId, tokens.refreshToken);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if refresh token exists and is valid in database
      const tokenDoc = await RefreshToken.findOne({
        token: refreshToken,
        userId: decoded.userId,
        isRevoked: false
      });

      if (!tokenDoc) {
        throw new Error('Invalid refresh token');
      }

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = generateTokenPair(user._id, user.email, user.role);

      // Revoke old refresh token
      tokenDoc.isRevoked = true;
      await tokenDoc.save();

      // Save new refresh token
      await this.saveRefreshToken(user._id, tokens.tokenId, tokens.refreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl
        }
      };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user by revoking refresh token
   */
  static async logout(refreshToken: string): Promise<void> {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken, userId: decoded.userId },
        { isRevoked: true }
      );
    } catch (error) {
      // Ignore errors during logout
    }
  }

  /**
   * Logout from all devices by revoking all refresh tokens for user
   */
  static async logoutAll(userId: string): Promise<void> {
    await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }

  /**
   * Save refresh token to database
   */
  private static async saveRefreshToken(
    userId: Types.ObjectId,
    tokenId: string,
    token: string
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const refreshToken = new RefreshToken({
      token,
      userId,
      expiresAt
    });

    await refreshToken.save();
  }

  /**
   * Get user by ID (without password)
   */
  static async getUserById(userId: string) {
    return User.findById(userId);
  }

  /**
   * Update user password
   */
  static async updatePassword(userId: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: Partial<any>): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update allowed fields
    const allowedFields = [
      'firstName', 'lastName', 'fullName', 'phone', 'address', 'gender',
      'emergencyContact', 'age', 'gradeLevelId', 'currentGrade', 'academicSet',
      'hasLearningDisabilities', 'learningNeedsDescription', 'parentName',
      'parentPhone', 'parentEmail', 'city', 'postcode', 'schoolName',
      'avatarUrl', 'profileImageUrl'
    ];

    // Build update object with only allowed fields
    const updateData: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        // Convert field names to match database schema
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[field] = updates[field];
      }
    }

    // Update full name if first or last name changed
    if (updates.firstName || updates.lastName) {
      updateData.fullName = `${updates.firstName || user.firstName} ${updates.lastName || user.lastName}`;
    }

    // Apply updates
    Object.assign(user, updateData);
    await user.save();

    return {
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
      updated_at: user.updatedAt
    };
  }
}
