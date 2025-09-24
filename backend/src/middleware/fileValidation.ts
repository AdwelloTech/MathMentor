import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { FileUploadService, FILE_TYPE_CONFIGS } from '../services/fileUploadService';

// File signature validation (magic numbers)
const FILE_SIGNATURES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
  'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],
  'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])], // WebP signature at offset 8 is handled separately
  'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D])],
  'application/msword': [Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    Buffer.from([0x50, 0x4B, 0x03, 0x04]) // ZIP file signature for .docx
  ],
  'text/plain': [], // No specific signature for plain text
  'application/zip': [Buffer.from([0x50, 0x4B, 0x03, 0x04])]
};

// Security checks
const SUSPICIOUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.jar', '.js', '.vbs', '.wsf'];
const SUSPICIOUS_FILENAMES = [
  'con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
  'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
];

// Extend global type for rate limiting
declare global {
  var fileUploadCounts: Map<string, number[]> | undefined;
}

/**
 * Validate file signature (magic number) to ensure file content matches declared type
 */
export const validateFileSignature = async (filePath: string, mimeType: string): Promise<boolean> => {
  try {
    const signatures = FILE_SIGNATURES[mimeType];
    if (!signatures || signatures.length === 0) {
      // For types without specific signatures (like text/plain), skip validation
      return true;
    }

    const fileBuffer = Buffer.alloc(16); // Read first 16 bytes
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, fileBuffer, 0, 16, 0);
    fs.closeSync(fd);

    // Special handling for WebP
    if (mimeType === 'image/webp') {
      // WebP has "RIFF" at start and "WEBP" at offset 8
      const riffSignature = fileBuffer.slice(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46]));
      const webpSignature = fileBuffer.slice(8, 12).equals(Buffer.from([0x57, 0x45, 0x42, 0x50]));
      return riffSignature && webpSignature;
    }

    return signatures.some(signature =>
      fileBuffer.slice(0, signature.length).equals(signature)
    );
  } catch (error) {
    console.error('File signature validation error:', error);
    return false;
  }
};

/**
 * Check for suspicious filename patterns
 */
export const checkSuspiciousFilename = (filename: string): { suspicious: boolean; reason?: string } => {
  const baseName = path.basename(filename, path.extname(filename)).toLowerCase();
  const extension = path.extname(filename).toLowerCase();

  // Check for suspicious extensions
  if (SUSPICIOUS_EXTENSIONS.includes(extension)) {
    return {
      suspicious: true,
      reason: `Suspicious file extension: ${extension}`
    };
  }

  // Check for reserved Windows filenames
  if (SUSPICIOUS_FILENAMES.includes(baseName)) {
    return {
      suspicious: true,
      reason: `Reserved filename: ${baseName}`
    };
  }

  // Check for hidden files (starting with dot)
  if (baseName.startsWith('.')) {
    return {
      suspicious: true,
      reason: 'Hidden file detected'
    };
  }

  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      suspicious: true,
      reason: 'Path traversal attempt detected'
    };
  }

  return { suspicious: false };
};

/**
 * Validate file content for potential security threats
 */
export const validateFileContent = async (filePath: string, mimeType: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    const stats = fs.statSync(filePath);

    // Check if file is empty
    if (stats.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    // Validate file signature
    const signatureValid = await validateFileSignature(filePath, mimeType);
    if (!signatureValid) {
      return { valid: false, error: 'File signature does not match declared MIME type' };
    }

    // For text files, check for suspicious content
    if (mimeType === 'text/plain') {
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      const suspiciousPatterns = [
        '<script', 'javascript:', 'vbscript:', 'onload=', 'onerror=',
        '<?php', '<%', '<jsp:', '<asp:'
      ];

      for (const pattern of suspiciousPatterns) {
        if (content.includes(pattern)) {
          return { valid: false, error: 'Potentially malicious content detected in text file' };
        }
      }
    }

    return { valid: true };
  } catch (error) {
    console.error('File content validation error:', error);
    return { valid: false, error: 'File content validation failed' };
  }
};

/**
 * Comprehensive file validation middleware
 */
export const validateFileUpload = (fileType: keyof typeof FILE_TYPE_CONFIGS) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = FILE_TYPE_CONFIGS[fileType];

      if (!req.file && !(req.files && Array.isArray(req.files) && req.files.length > 0)) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const files = req.files && Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);

      if (files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid files found'
        });
      }

      // Validate each file
      for (const file of files) {
        // Basic validation using FileUploadService
        const basicValidation = FileUploadService.validateFile(file, config);
        if (!basicValidation.valid) {
          return res.status(400).json({
            success: false,
            error: basicValidation.error
          });
        }

        // Check for suspicious filename
        const filenameCheck = checkSuspiciousFilename(file.originalname);
        if (filenameCheck.suspicious) {
          return res.status(400).json({
            success: false,
            error: filenameCheck.reason
          });
        }

        // Content validation
        const contentValidation = await validateFileContent(file.path, file.mimetype);
        if (!contentValidation.valid) {
          // Clean up the uploaded file
          try {
            await FileUploadService.deleteFile(file.path);
          } catch (cleanupError) {
            console.error('Failed to clean up invalid file:', cleanupError);
          }

          return res.status(400).json({
            success: false,
            error: contentValidation.error
          });
        }
      }

      // All validations passed
      next();
    } catch (error: any) {
      console.error('File validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'File validation failed'
      });
    }
  };
};

/**
 * Image-specific validation middleware
 */
export const validateImageFile = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No image file provided'
    });
  }

  const file = req.file;

  // Check if it's actually an image
  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({
      success: false,
      error: 'File is not an image'
    });
  }

  // Additional image-specific checks could be added here
  // For example, checking image dimensions, aspect ratio, etc.

  next();
};

/**
 * Document-specific validation middleware
 */
export const validateDocumentFile = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No document file provided'
    });
  }

  const file = req.file;

  // Check if it's a valid document type
  const validDocumentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (!validDocumentTypes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid document type. Only PDF, Word documents, and text files are allowed.'
    });
  }

  next();
};

/**
 * Rate limiting for file uploads
 */
export const fileUploadRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // This would typically integrate with express-rate-limit
  // For now, we'll just pass through
  // In production, you'd want to implement proper rate limiting based on user/file type

  const userId = (req as any).user?.id;
  const fileType = req.params.fileType || 'unknown';

  // Simple in-memory rate limiting (in production, use Redis or database)
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxUploads = 10; // Max 10 uploads per 15 minutes

  if (!global.fileUploadCounts) {
    (global as any).fileUploadCounts = new Map();
  }

  const key = `${userId}-${fileType}`;
  const userUploads = (global as any).fileUploadCounts.get(key) || [];

  // Clean old entries
  const recentUploads = userUploads.filter((timestamp: number) => now - timestamp < windowMs);

  if (recentUploads.length >= maxUploads) {
    return res.status(429).json({
      success: false,
      error: 'Too many file uploads. Please try again later.'
    });
  }

  // Add current upload
  recentUploads.push(now);
  (global as any).fileUploadCounts.set(key, recentUploads);

  next();
};

export default {
  validateFileUpload,
  validateImageFile,
  validateDocumentFile,
  fileUploadRateLimit,
  validateFileSignature,
  checkSuspiciousFilename,
  validateFileContent
};
