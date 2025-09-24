import apiClient from './apiClient';
import type { ProfileImage, ProfileImageUpload, ProfileImageUploadResponse } from '@/types/auth';

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Validate image file before upload
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File must be a valid image (JPEG, PNG, WebP, or GIF)'
    };
  }

  return { valid: true };
};

/**
 * Create a preview URL for an image file
 */
export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Clean up preview URL
 */
export const revokeImagePreview = (previewUrl: string): void => {
  URL.revokeObjectURL(previewUrl);
};


/**
 * Upload profile image to backend API
 */
export const uploadProfileImage = async (
  file: File,
  userId: string,
  profileId: string
): Promise<ProfileImageUploadResponse> => {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    console.log('Uploading profile image:', file.name, 'Size:', file.size);

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('profileImage', file);

    // Upload via backend API
    const response = await apiClient.post<ProfileImageUploadResponse>(
      '/api/profile-images/upload',
      formData
    );

    console.log('Profile image upload successful:', response);

    return response;
  } catch (error: any) {
    console.error('Profile image upload failed:', error);
    throw error;
  }
};

/**
 * Get active profile image for current user
 */
export const getActiveProfileImage = async (userId: string): Promise<ProfileImage | null> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: ProfileImage | null }>('/api/profile-images/active');
    return response.success ? response.data : null;
  } catch (error: any) {
    console.error('Failed to fetch active profile image:', error);
    return null; // Return null instead of throwing to prevent profile loading errors
  }
};

/**
 * Get all profile images for current user
 */
export const getUserProfileImages = async (userId: string): Promise<ProfileImage[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: ProfileImage[] }>('/api/profile-images');
    return response.success ? response.data : [];
  } catch (error: any) {
    console.error('Failed to fetch user profile images:', error);
    return [];
  }
};

/**
 * Activate a profile image (set as current)
 */
export const activateProfileImage = async (imageId: string): Promise<void> => {
  try {
    console.log('Activating profile image:', imageId);

    await apiClient.put(`/api/profile-images/${imageId}/activate`);

    console.log('Profile image activated successfully');
  } catch (error: any) {
    console.error('Failed to activate profile image:', error);
    throw new Error(`Failed to activate profile image: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Delete a profile image
 */
export const deleteProfileImage = async (imageId: string): Promise<void> => {
  try {
    console.log('Deleting profile image:', imageId);

    await apiClient.delete(`/api/profile-images/${imageId}`);

    console.log('Profile image deleted successfully');
  } catch (error: any) {
    console.error('Failed to delete profile image:', error);
    throw new Error(`Failed to delete profile image: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Get public URL for a profile image
 */
export const getProfileImageUrl = (url: string): string => {
  // The URL is already provided by the backend
  return url;
}; 