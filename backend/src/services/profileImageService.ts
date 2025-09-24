import { ProfileImage } from '../models/ProfileImage';
import { User } from '../models/User';
import FileUploadService, { FILE_TYPE_CONFIGS } from './fileUploadService';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { Types } from 'mongoose';

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
        updatedAt: new Date()
      });

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
      profileImageUrl: imageUrl,
      updatedAt: new Date()
    });

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

    // If this is the active image, clear the user's profile image URL
    if (profileImage.isActive) {
      await User.findByIdAndUpdate(userId, {
        profileImageUrl: null,
        updatedAt: new Date()
      });
    }

    // Delete the file from storage
    await FileUploadService.deleteFile(profileImage.filePath);

    // Delete the database record
    await ProfileImage.findByIdAndDelete(imageId);
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
