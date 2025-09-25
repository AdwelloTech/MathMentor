/**
 * Authentication Service
 * Handles all authentication operations with the backend API
 */

import apiClient from './apiClient';
import type {
  RegisterFormData,
  LoginFormData,
  User,
  UserProfile
} from '@/types/auth';

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

export interface BackendUser {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: string;
  package?: 'free' | 'silver' | 'gold'; // Include package for students
  avatar_url?: string;
  phone?: string;
  address?: string;
  gender?: string;
  emergency_contact?: string;
  age?: number;
  grade_level_id?: string;
  current_grade?: string;
  academic_set?: string;
  has_learning_disabilities: boolean;
  learning_needs_description?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  city?: string;
  postcode?: string;
  school_name?: string;
  profile_image_url?: string;
  created_at: string;
  last_login?: string;
}

class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterFormData): Promise<AuthTokens> {
    // Transform frontend data to match backend schema
    const registrationData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      role: data.role,
      phone: data.phone,
      // Add role-specific fields
      ...(data.role === 'student' && { package: data.package }),
      ...(data.role === 'tutor' && {
        subjects: data.subjects || [],
        experience: data.experience,
        qualification: data.qualification,
      }),
    };

    const result = await apiClient.post<AuthTokens>('/api/auth/register', registrationData, {
      skipAuth: true,
    });

    // Store tokens in API client
    apiClient.setTokens(result.accessToken, result.refreshToken);

    return result;
  }

  /**
   * Login user
   */
  static async login(data: LoginFormData): Promise<AuthTokens> {
    const result = await apiClient.post<AuthTokens>('/api/auth/login', {
      email: data.email,
      password: data.password,
    }, {
      skipAuth: true,
    });

    // Store tokens in API client
    apiClient.setTokens(result.accessToken, result.refreshToken);

    return result;
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      // Get refresh token from localStorage
      const tokens = localStorage.getItem('mathmentor_tokens');
      if (tokens) {
        const parsed = JSON.parse(tokens);
        if (parsed.refreshToken) {
          await apiClient.post('/api/auth/logout', { refreshToken: parsed.refreshToken });
        }
      }
    } catch (error) {
      console.warn('Logout API call failed, but clearing local tokens anyway:', error);
    } finally {
      // Always clear local tokens
      apiClient.clearTokens();
    }
  }

  /**
   * Logout from all devices
   */
  static async logoutAll(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout-all');
    } catch (error) {
      console.error('Logout all failed:', error);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<BackendUser> {
    const user = await apiClient.get<BackendUser>('/api/auth/me');
    return user;
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<AuthTokens> {
    const result = await apiClient.post<AuthTokens>('/api/auth/refresh', {
      refreshToken: apiClient['refreshToken'], // Access private property
    }, {
      skipAuth: true,
    });

    // Update tokens in API client
    apiClient.setTokens(result.accessToken, result.refreshToken);

    return result;
  }

  /**
   * Reset password (request)
   */
  static async resetPassword(email: string): Promise<void> {
    await apiClient.post('/api/auth/forgot-password', { email }, { skipAuth: true });
  }

  /**
   * Update password
   */
  static async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.put('/api/auth/password', {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const updatedProfile = await apiClient.put<UserProfile>('/api/auth/profile', updates);
    return updatedProfile;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Transform backend user data to frontend format
   * Handles both camelCase (from login) and snake_case (from /me) formats
   */
  static transformUserData(backendUser: any, profile: any): User {
    // Handle both camelCase (login response) and snake_case (/me response) formats
    const firstName = backendUser.first_name || backendUser.firstName;
    const lastName = backendUser.last_name || backendUser.lastName;
    const fullName = backendUser.full_name || backendUser.fullName;
    const avatarUrl = backendUser.avatar_url || backendUser.avatarUrl;
    const createdAt = backendUser.created_at || backendUser.createdAt;
    const lastLogin = backendUser.last_login || backendUser.lastLogin;

    return {
      id: backendUser.id,
      email: backendUser.email,
      created_at: createdAt,
      updated_at: createdAt, // Backend doesn't provide updated_at in /me endpoint
      email_confirmed_at: createdAt, // Assume confirmed if user exists
      last_sign_in_at: lastLogin,
      role: backendUser.role as any,
      profile: {
        ...profile,
        // Ensure required fields are present
        id: backendUser.id,
        user_id: backendUser.id,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        email: backendUser.email,
        role: backendUser.role as any,
        package: backendUser.package as any, // Include package for students
        avatar_url: avatarUrl,
        phone: backendUser.phone,
        is_active: true, // Assume active if user exists
        last_login: lastLogin,
        created_at: createdAt,
        updated_at: createdAt,
      },
    };
  }
}

export default AuthService;
