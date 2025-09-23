import { supabase } from './supabase';
import type { ProfileImage, ProfileImageUpload, ProfileImageUploadResponse } from '@/types/auth';

// Constants
const STORAGE_BUCKET = 'profile-images';
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
 * Generate unique filename for storage
 */
const generateFileName = (originalName: string, userId: string): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${userId}/${timestamp}-${randomId}.${extension}`;
};

/**
 * Get image dimensions from file
 */
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = createImagePreview(file);
  });
};

/**
 * Upload profile image to Supabase Storage
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

    // Generate unique filename
    const fileName = generateFileName(file.name, userId);
    const filePath = fileName;

    // Get image dimensions
    const dimensions = await getImageDimensions(file);
    console.log('Image dimensions:', dimensions);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('File uploaded successfully:', uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    console.log('Public URL:', publicUrl);

    // Save image record to database
    const imageRecord = {
      user_id: userId,
      profile_id: profileId,
      file_name: fileName,
      original_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      width: dimensions.width,
      height: dimensions.height,
      is_active: false, // Will be activated separately
    };

    const { data: dbData, error: dbError } = await supabase
      .from('profile_images')
      .insert([imageRecord])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);
        
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('Image record saved to database:', dbData);

    return {
      id: dbData.id,
      file_path: filePath,
      file_name: fileName,
      file_size: file.size,
      width: dimensions.width,
      height: dimensions.height,
      public_url: publicUrl
    };

  } catch (error: any) {
    console.error('Profile image upload failed:', error);
    throw error;
  }
};

/**
 * Activate a profile image (set as current)
 */
export const activateProfileImage = async (imageId: string, retryCount: number = 0): Promise<void> => {
  const maxRetries = 2;
  
  try {
    console.log('Activating profile image:', imageId, retryCount > 0 ? `(retry ${retryCount})` : '');

    const { error } = await supabase.rpc('activate_profile_image', {
      image_id: imageId
    });

    if (error) {
      console.error('Error activating profile image:', error);
      
      // Handle unique constraint violation with retry
      if (error.message?.includes('duplicate key value violates unique constraint') || 
          error.code === '23505') {
        
        if (retryCount < maxRetries) {
          console.log(`Unique constraint violation detected, retrying in ${(retryCount + 1) * 500}ms...`);
          
          // Wait a bit before retrying to avoid race conditions
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500));
          
          return activateProfileImage(imageId, retryCount + 1);
        } else {
          throw new Error('Failed to activate profile image due to concurrent updates. Please try again.');
        }
      }
      
      throw error;
    }

    console.log('Profile image activated successfully');
  } catch (error: any) {
    console.error('Failed to activate profile image:', error);
    
    // If it's not our custom error, wrap it
    if (!error.message?.includes('Failed to activate profile image due to concurrent updates')) {
      throw new Error(`Failed to activate profile image: ${error.message || 'Unknown error'}`);
    }
    
    throw error;
  }
};

/**
 * Delete a profile image
 */
export const deleteProfileImage = async (imageId: string): Promise<void> => {
  try {
    console.log('Deleting profile image:', imageId);

    // Get image details first
    const { data: imageData, error: fetchError } = await supabase
      .from('profile_images')
      .select('file_path')
      .eq('id', imageId)
      .single();

    if (fetchError) {
      console.error('Error fetching image details:', fetchError);
      throw fetchError;
    }

    // Delete from database using the stored procedure
    const { error: dbError } = await supabase.rpc('delete_profile_image', {
      image_id: imageId
    });

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      throw dbError;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([imageData.file_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Don't throw here as the database record is already deleted
    }

    console.log('Profile image deleted successfully');
  } catch (error: any) {
    console.error('Failed to delete profile image:', error);
    throw error;
  }
};

/**
 * Get all profile images for a user
 */
export const getUserProfileImages = async (userId: string): Promise<ProfileImage[]> => {
  try {
    const { data, error } = await supabase
      .from('profile_images')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching user profile images:', error);
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Failed to fetch user profile images:', error);
    throw error;
  }
};

/**
 * Get the active profile image for a user
 */
export const getActiveProfileImage = async (userId: string): Promise<ProfileImage | null> => {
  try {
    const { data, error } = await supabase
      .from('profile_images')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active profile image found
        return null;
      }
      console.error('Error fetching active profile image:', error);
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Failed to fetch active profile image:', error);
    throw error;
  }
};

/**
 * Get public URL for a profile image
 */
export const getProfileImageUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}; 