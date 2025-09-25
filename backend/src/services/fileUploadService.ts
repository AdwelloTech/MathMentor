import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// File type configurations
export interface FileTypeConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
  allowedExtensions: string[];
  folder: string;
}

// File type configurations
export const FILE_TYPE_CONFIGS: Record<string, FileTypeConfig> = {
  profileImages: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    folder: 'profile-images'
  },
  idVerificationImages: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    folder: 'id-verification'
  },
  documents: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt'],
    folder: 'documents'
  },
  attachments: {
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.zip'],
    folder: 'attachments'
  },
  pdfs: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    allowedExtensions: ['.pdf'],
    folder: 'pdfs'
  }
};

// Storage configuration
const createStorage = (folderName: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../../uploads', folderName);

      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp and random string
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, extension);
      const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');

      const fileName = `${timestamp}-${randomId}-${sanitizedBaseName}${extension}`;
      cb(null, fileName);
    }
  });
};

// File filter function
const createFileFilter = (config: FileTypeConfig) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check file type
    if (!config.allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${config.allowedTypes.join(', ')}`));
    }

    // Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    if (!config.allowedExtensions.includes(extension)) {
      return cb(new Error(`File extension ${extension} not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`));
    }

    cb(null, true);
  };
};

// Create multer upload instances for different file types
export const uploadInstances = {
  profileImages: multer({
    storage: createStorage(FILE_TYPE_CONFIGS.profileImages.folder),
    limits: {
      fileSize: FILE_TYPE_CONFIGS.profileImages.maxSize,
      files: 1
    },
    fileFilter: createFileFilter(FILE_TYPE_CONFIGS.profileImages)
  }),

  idVerificationImages: multer({
    storage: createStorage(FILE_TYPE_CONFIGS.idVerificationImages.folder),
    limits: {
      fileSize: FILE_TYPE_CONFIGS.idVerificationImages.maxSize,
      files: 3 // front, back, selfie
    },
    fileFilter: createFileFilter(FILE_TYPE_CONFIGS.idVerificationImages)
  }),

  documents: multer({
    storage: createStorage(FILE_TYPE_CONFIGS.documents.folder),
    limits: {
      fileSize: FILE_TYPE_CONFIGS.documents.maxSize,
      files: 1
    },
    fileFilter: createFileFilter(FILE_TYPE_CONFIGS.documents)
  }),

  attachments: multer({
    storage: createStorage(FILE_TYPE_CONFIGS.attachments.folder),
    limits: {
      fileSize: FILE_TYPE_CONFIGS.attachments.maxSize,
      files: 5 // Allow up to 5 attachments
    },
    fileFilter: createFileFilter(FILE_TYPE_CONFIGS.attachments)
  }),

  pdfs: multer({
    storage: createStorage(FILE_TYPE_CONFIGS.pdfs.folder),
    limits: {
      fileSize: FILE_TYPE_CONFIGS.pdfs.maxSize,
      files: 10 // Allow up to 10 PDFs
    },
    fileFilter: createFileFilter(FILE_TYPE_CONFIGS.pdfs)
  }),

  // Memory storage for temporary processing (used by AI service)
  memory: multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 10
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    }
  })
};

// File upload result interface
export interface FileUploadResult {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// Utility functions
export class FileUploadService {
  /**
   * Get file info from uploaded file
   */
  static getFileInfo(file: Express.Multer.File): FileUploadResult {
    return {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      destination: file.destination,
      filename: file.filename,
      path: file.path,
      size: file.size
    };
  }

  /**
   * Get public URL for a file
   */
  static getFileUrl(filePath: string, baseUrl?: string): string {
    // For local storage, construct URL relative to uploads directory
    const relativePath = path.relative(path.join(__dirname, '../../uploads'), filePath);
    const urlPath = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    // If baseUrl is provided, return full URL
    if (baseUrl) {
      return `${baseUrl}${urlPath}`;
    }

    // Otherwise return relative URL
    return urlPath;
  }

  /**
   * Delete a file from storage
   */
  static deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') { // Ignore if file doesn't exist
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Check if file exists
   */
  static fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  static getFileStats(filePath: string): Promise<fs.Stats | null> {
    return new Promise((resolve) => {
      fs.stat(filePath, (err, stats) => {
        if (err) {
          resolve(null);
        } else {
          resolve(stats);
        }
      });
    });
  }

  /**
   * Validate file before processing
   */
  static validateFile(file: Express.Multer.File, config: FileTypeConfig): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > config.maxSize) {
      return {
        valid: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${config.maxSize / 1024 / 1024}MB)`
      };
    }

    // Check file type
    if (!config.allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} not allowed. Allowed types: ${config.allowedTypes.join(', ')}`
      };
    }

    // Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    if (!config.allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension ${extension} not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`
      };
    }

    return { valid: true };
  }
}

export default FileUploadService;
