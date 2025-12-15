import { ProfileImage } from '../models/ProfileImage';
import { User } from '../models/User';
import FileUploadService, { FILE_TYPE_CONFIGS } from './fileUploadService';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import mongoose, { Types } from 'mongoose';

export interface ProfileImageUploadResult {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  url: string;
}

export interface ProfileImageInfo {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  url: string;
  uploadedAt: Date;
  isActive: boolean;
}

export class ProfileImageService {
  private static async upsertProfileImageUrl(
    userId: string,
    imageUrl: string | null
  ) {
    const db = mongoose.connection.db;
    if (!db) return;

    // Keep profile and avatar URLs in sync on the profiles collection
    await db.collection('profiles').updateOne(
      { user_id: userId },
      {
        $set: {
          profile_image_url: imageUrl,
          avatar_url: imageUrl,
          updated_at: new Date(),
        },
        $setOnInsert: {
          user_id: userId,
          created_at: new Date(),
        },
      },
      { upsert: true }
    );
  }

  /**
   * Upload a new profile image for a user
   */
  static async uploadProfileImage(
    userId: string,
    file: Express.Multer.File,
    baseUrl?: string
  ): Promise<ProfileImageUploadResult> {
    try {
      // Validate the file
      const validation = FileUploadService.validateFile(file, FILE_TYPE_CONFIGS.profileImages);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Get image dimensions using sharp
      let width: number | undefined;
      let height: number | undefined;
      try {
        const metadata = await sharp(file.path).metadata();
        width = metadata.width;
        height = metadata.height;
      } catch (error) {
        console.warn('Failed to extract image dimensions:', error);
        // Continue without dimensions if extraction fails
      }

      // Deactivate all existing profile images for this user
      await ProfileImage.updateMany(
        { userId },
        { isActive: false, updatedAt: new Date() }
      );

      // Create new profile image record
      const profileImage = new ProfileImage({
        userId,
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        width,
        height,
        isActive: true
      });

      await profileImage.save();

      // Update user's profile image URL
      const imageUrl = FileUploadService.getFileUrl(file.path, baseUrl);
      await User.findByIdAndUpdate(userId, {
        profileImageUrl: imageUrl,
        avatarUrl: imageUrl, // keep both in sync for frontend consumers
        updatedAt: new Date()
      });
      await ProfileImageService.upsertProfileImageUrl(userId, imageUrl);

      return {
        id: profileImage._id.toString(),
        fileName: profileImage.fileName,
        originalName: profileImage.originalName,
        filePath: profileImage.filePath,
        fileSize: profileImage.fileSize,
        mimeType: profileImage.mimeType,
        width: profileImage.width,
        height: profileImage.height,
        url: imageUrl
      };
    } catch (error) {
      // Clean up uploaded file if database operation failed
      try {
        await FileUploadService.deleteFile(file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Get active profile image for a user
   */
  static async getActiveProfileImage(userId: string, baseUrl?: string): Promise<ProfileImageInfo | null> {
    const profileImage = await ProfileImage.findOne({ userId, isActive: true })
      .sort({ uploadedAt: -1 });

    if (!profileImage) {
      return null;
    }

    return {
      id: profileImage._id.toString(),
      fileName: profileImage.fileName,
      originalName: profileImage.originalName,
      fileSize: profileImage.fileSize,
      mimeType: profileImage.mimeType,
      width: profileImage.width,
      height: profileImage.height,
      url: FileUploadService.getFileUrl(profileImage.filePath, baseUrl),
      uploadedAt: profileImage.uploadedAt,
      isActive: profileImage.isActive
    };
  }

  /**
   * Get all profile images for a user
   */
  static async getUserProfileImages(userId: string, baseUrl?: string): Promise<ProfileImageInfo[]> {
    const profileImages = await ProfileImage.find({ userId })
      .sort({ uploadedAt: -1 });

    return profileImages.map(img => ({
      id: img._id.toString(),
      fileName: img.fileName,
      originalName: img.originalName,
      fileSize: img.fileSize,
      mimeType: img.mimeType,
      width: img.width,
      height: img.height,
      url: FileUploadService.getFileUrl(img.filePath, baseUrl),
      uploadedAt: img.uploadedAt,
      isActive: img.isActive
    }));
  }

  /**
   * Activate a specific profile image (deactivate others)
   */
  static async activateProfileImage(userId: string, imageId: string, baseUrl?: string): Promise<ProfileImageInfo> {
    // Deactivate all images for this user
    await ProfileImage.updateMany(
      { userId },
      { isActive: false, updatedAt: new Date() }
    );

    // Activate the specific image
    const profileImage = await ProfileImage.findOneAndUpdate(
      { _id: imageId, userId },
      { isActive: true, updatedAt: new Date() },
      { new: true }
    );

    if (!profileImage) {
      throw new Error('Profile image not found');
    }

    // Update user's profile image URL
    const imageUrl = FileUploadService.getFileUrl(profileImage.filePath, baseUrl);
    await User.findByIdAndUpdate(userId, {
      avatarUrl: imageUrl,
      profileImageUrl: imageUrl, // Also update this for backward compatibility
      updatedAt: new Date()
    });
    await ProfileImageService.upsertProfileImageUrl(userId, imageUrl);

    return {
      id: profileImage._id.toString(),
      fileName: profileImage.fileName,
      originalName: profileImage.originalName,
      fileSize: profileImage.fileSize,
      mimeType: profileImage.mimeType,
      width: profileImage.width,
      height: profileImage.height,
      url: imageUrl,
      uploadedAt: profileImage.uploadedAt,
      isActive: profileImage.isActive
    };
  }

  /**
   * Delete a profile image
   */
  static async deleteProfileImage(userId: string, imageId: string): Promise<void> {
    const profileImage = await ProfileImage.findOne({ _id: imageId, userId });

    if (!profileImage) {
      throw new Error('Profile image not found');
    }

    // Clear the user's image fields if this image was active OR matches current URLs
    const user = await User.findById(userId);
    const imageUrl = FileUploadService.getFileUrl(profileImage.filePath);
    const matchesCurrent =
      !!user &&
      (user.profileImageUrl === imageUrl || user.avatarUrl === imageUrl);

    if (profileImage.isActive || matchesCurrent) {
      await User.findByIdAndUpdate(userId, {
        profileImageUrl: null,
        avatarUrl: null,
        profileImageId: null,
        updatedAt: new Date()
      });
      await ProfileImageService.upsertProfileImageUrl(userId, null);
    }

    // Delete the file from storage
    await FileUploadService.deleteFile(profileImage.filePath);

    // Delete the database record
    await ProfileImage.findByIdAndDelete(imageId);
  }

  /**
   * Remove all profile images for a user, clearing storage and DB references
   * Used when a profile explicitly removes their photo (student or tutor).
   */
  static async clearProfileImages(userId: string): Promise<void> {
    // Always clear the user/profile URLs, even if no image records exist
    await User.findByIdAndUpdate(userId, {
      profileImageUrl: null,
      avatarUrl: null,
      profileImageId: null,
      updatedAt: new Date()
    });
    await ProfileImageService.upsertProfileImageUrl(userId, null);

    const images = await ProfileImage.find({ userId });
    for (const image of images) {
      try {
        await FileUploadService.deleteFile(image.filePath);
      } catch (error) {
        console.error(`Failed to delete profile image file ${image.filePath}:`, error);
      }

      try {
        await ProfileImage.findByIdAndDelete(image._id);
      } catch (error) {
        console.error(`Failed to delete profile image record ${image._id}:`, error);
      }
    }
  }

  /**
   * Delete all inactive profile images for a user (cleanup)
   */
  static async cleanupInactiveImages(userId: string): Promise<number> {
    const inactiveImages = await ProfileImage.find({ userId, isActive: false });

    let deletedCount = 0;
    for (const image of inactiveImages) {
      try {
        await FileUploadService.deleteFile(image.filePath);
        await ProfileImage.findByIdAndDelete(image._id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete inactive image ${image._id}:`, error);
      }
    }

    return deletedCount;
  }
}

export default ProfileImageService;
