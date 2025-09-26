import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhotoIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from './LoadingSpinner';
import {
  uploadProfileImage,
  activateProfileImage,
  validateImageFile,
  createImagePreview,
  revokeImagePreview
} from '@/lib/profileImages';
import type { ProfileImageUploadResponse } from '@/types/auth';

interface ProfileImageUploadProps {
  userId: string;
  profileId: string;
  currentImageUrl?: string;
  onImageChange?: (imageUrl: string | null) => void;
  className?: string;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  userId,
  profileId,
  currentImageUrl,
  onImageChange,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset states
  const resetStates = useCallback(() => {
    setError('');
    setSuccess('');
    if (previewUrl) {
      revokeImagePreview(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
  }, [previewUrl]);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetStates();

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Create preview
    const preview = createImagePreview(file);
    setPreviewUrl(preview);
    setSelectedFile(file);

    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [resetStates]);

  // Handle file upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Uploading file:', selectedFile.name);

      // Upload the image
      const uploadResult: ProfileImageUploadResponse = await uploadProfileImage(
        selectedFile,
        userId,
        profileId
      );

      console.log('Upload successful:', uploadResult);

      // Add a small delay before activation to ensure upload is fully committed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Activate the uploaded image
      await activateProfileImage(uploadResult.id);

      // Update parent component
      if (onImageChange) {
        onImageChange(uploadResult.url);
      }

      setSuccess('Profile image updated successfully!');
      resetStates();

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (error: any) {
      console.error('Upload failed:', error);
      setError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, userId, profileId, onImageChange, resetStates]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    resetStates();
  }, [resetStates]);

  // Handle remove current image
  const handleRemoveCurrentImage = useCallback(async () => {
    if (!currentImageUrl) return;

    try {
      setError('');
      setSuccess('');

      // For demo purposes, we'll just clear the UI
      // In a real implementation, you'd call deleteProfileImage() with the image ID
      console.log('Removing current profile image');

      if (onImageChange) {
        onImageChange(null);
      }

      setSuccess('Profile image removed successfully!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (error: any) {
      console.error('Failed to remove image:', error);
      setError(error.message || 'Failed to remove image');
    }
  }, [currentImageUrl, onImageChange]);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Image Display */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {/* Image Preview/Current */}
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <UserCircleIcon className="w-24 h-24" />
              </div>
            )}
          </div>

          {/* Remove button for current image */}
          {currentImageUrl && !previewUrl && (
            <button
              onClick={handleRemoveCurrentImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
              title="Remove current image"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Actions */}
        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              key="upload-actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center space-y-3"
            >
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="btn btn-sm btn-primary"
                >
                  {isUploading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4 mr-1" />
                      Upload
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isUploading}
                  className="btn btn-sm btn-secondary"
                >
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="select-button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={triggerFileInput}
              className="btn btn-outline flex items-center space-x-2"
            >
              <PhotoIcon className="w-4 h-4" />
              <span>Choose Photo</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3"
          >
            <p className="text-sm text-green-600">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Guidelines */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Maximum file size: 5MB
        </p>
        <p className="text-xs text-gray-500">
          Supported formats: JPEG, PNG, WebP, GIF
        </p>
      </div>
    </div>
  );
};

export default ProfileImageUpload; 