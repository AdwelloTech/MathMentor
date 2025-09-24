import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { File, FileType } from '../models/File';
import { ProfileImage } from '../models/ProfileImage';
import { authenticate } from './auth';
import { FileUploadService } from '../services/fileUploadService';

// Extend global type for rate limiting
declare global {
  var fileDownloadCounts: Map<string, number[]> | undefined;
}

// Security headers for file serving
const FILE_SECURITY_HEADERS = {
  'Cache-Control': 'private, max-age=31536000', // 1 year for private files
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// MIME type mappings for secure content type setting
const MIME_TYPE_MAPPING: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.zip': 'application/zip'
};

/**
 * Set security headers for file responses
 */
export const setFileSecurityHeaders = (res: Response, mimeType: string) => {
  // Set security headers
  Object.entries(FILE_SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Set content type
  res.setHeader('Content-Type', mimeType);

  // Additional security for specific file types
  if (mimeType.startsWith('text/')) {
    res.setHeader('Content-Disposition', 'attachment'); // Force download for text files
  }

  // Prevent MIME sniffing
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
};

/**
 * Check if user has access to a file
 */
export const checkFileAccess = async (
  fileId: string,
  userId: string,
  requestedFileType?: string
): Promise<{ hasAccess: boolean; file?: any; error?: string }> => {
  try {
    // First try to find in the new File model
    let file = await File.findById(fileId);

    if (file) {
      // Check ownership
      if (!file.userId.equals(userId) && !file.isPublic) {
        return { hasAccess: false, error: 'Access denied: file is private' };
      }

      // Check if file is active
      if (!file.isActive) {
        return { hasAccess: false, error: 'File is not available' };
      }

      return { hasAccess: true, file };
    }

    // If not found in File model, check ProfileImage model for backward compatibility
    if (!requestedFileType || requestedFileType === 'profile_image') {
      const profileImage = await ProfileImage.findById(fileId);
      if (profileImage) {
        // Check ownership
        if (!profileImage.userId.equals(userId) && !profileImage.isActive) {
          return { hasAccess: false, error: 'Access denied: profile image is not active' };
        }

        return { hasAccess: true, file: profileImage };
      }
    }

    return { hasAccess: false, error: 'File not found' };
  } catch (error) {
    console.error('Error checking file access:', error);
    return { hasAccess: false, error: 'Error checking file access' };
  }
};

/**
 * Serve file with access control
 */
export const serveFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check file access
    const accessCheck = await checkFileAccess(fileId, userId);
    if (!accessCheck.hasAccess) {
      return res.status(accessCheck.error === 'File not found' ? 404 : 403).json({
        error: accessCheck.error || 'Access denied'
      });
    }

    const file = accessCheck.file;
    let filePath: string;
    let mimeType: string;

    // Handle different file models
    if (file instanceof File || file.filePath) {
      // New File model
      filePath = file.filePath;
      mimeType = file.mimeType;
    } else if (file.fileName && file.mimeType) {
      // ProfileImage model - construct path
      filePath = path.join(__dirname, '../../uploads/profile-images', file.fileName);
      mimeType = file.mimeType;
    } else {
      return res.status(404).json({ error: 'File path not found' });
    }

    // Check if file exists
    if (!FileUploadService.fileExists(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Set security headers
    setFileSecurityHeaders(res, mimeType);

    // Handle range requests for large files (optional streaming)
    const stat = await FileUploadService.getFileStats(filePath);
    if (stat) {
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Accept-Ranges', 'bytes');
    }

    // Stream the file
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', (error) => {
      console.error('File streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Serve thumbnail with access control
 */
export const serveThumbnail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check file access
    const accessCheck = await checkFileAccess(fileId, userId);
    if (!accessCheck.hasAccess) {
      return res.status(accessCheck.error === 'File not found' ? 404 : 403).json({
        error: accessCheck.error || 'Access denied'
      });
    }

    const file = accessCheck.file;
    let thumbnailPath: string;

    // Handle different file models
    if (file.thumbnailPath) {
      // New File model with thumbnail
      thumbnailPath = file.thumbnailPath;
    } else if (file.fileName) {
      // For profile images, we might create thumbnails on demand
      // For now, serve the original image
      return serveFile(req, res, next);
    } else {
      return res.status(404).json({ error: 'Thumbnail not available' });
    }

    // Check if thumbnail exists
    if (!FileUploadService.fileExists(thumbnailPath)) {
      // Fallback to original file
      return serveFile(req, res, next);
    }

    // Set security headers for image
    setFileSecurityHeaders(res, 'image/jpeg');

    // Stream the thumbnail
    const fileStream = fs.createReadStream(thumbnailPath);

    fileStream.on('error', (error) => {
      console.error('Thumbnail streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming thumbnail' });
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('Thumbnail serving error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check public file access (no authentication required)
 */
export const servePublicFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;

    // Find public file
    const file = await File.findOne({
      _id: fileId,
      isPublic: true,
      isActive: true,
      status: 'active'
    });

    if (!file) {
      return res.status(404).json({ error: 'Public file not found' });
    }

    const filePath = file.filePath;
    const mimeType = file.mimeType;

    // Check if file exists
    if (!FileUploadService.fileExists(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Set security headers with public cache settings
    Object.entries({
      ...FILE_SECURITY_HEADERS,
      'Cache-Control': 'public, max-age=86400' // 24 hours for public files
    }).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.setHeader('Content-Type', mimeType);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', (error) => {
      console.error('Public file streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('Public file serving error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Rate limiting for file downloads
 */
export const fileDownloadRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Simple rate limiting - in production, use proper rate limiting middleware
  const userId = (req as any).user?.id;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxDownloads = 50; // Max 50 downloads per minute

  if (!global.fileDownloadCounts) {
    (global as any).fileDownloadCounts = new Map();
  }

  const userDownloads = (global as any).fileDownloadCounts.get(userId) || [];

  // Clean old entries
  const recentDownloads = userDownloads.filter((timestamp: number) => now - timestamp < windowMs);

  if (recentDownloads.length >= maxDownloads) {
    return res.status(429).json({
      error: 'Too many file downloads. Please try again later.'
    });
  }

  // Add current download
  recentDownloads.push(now);
  (global as any).fileDownloadCounts.set(userId, recentDownloads);

  next();
};

/**
 * Logging middleware for file access
 */
export const logFileAccess = (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id;
  const fileId = req.params.fileId;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';

  console.log(`File access: ${fileId} by user ${userId} from ${ip} using ${userAgent}`);

  next();
};

export default {
  serveFile,
  serveThumbnail,
  servePublicFile,
  setFileSecurityHeaders,
  checkFileAccess,
  fileDownloadRateLimit,
  logFileAccess
};
