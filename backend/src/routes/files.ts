import express from 'express';
import path from 'path';
import Joi from 'joi';
import { authenticate } from '../middleware/auth';
import { validateFileUpload, validateDocumentFile, validateImageFile, fileUploadRateLimit } from '../middleware/fileValidation';
import { serveFile, serveThumbnail, servePublicFile, fileDownloadRateLimit, logFileAccess } from '../middleware/fileServing';
import { FileUploadService, uploadInstances } from '../services/fileUploadService';
import { ProfileImage } from '../models/ProfileImage';
import { File, FileType } from '../models/File';
import { StudyNote } from '../models/StudyNote';
import { optimizeImage } from '../utils/imageProcessing';
import { validateOrThrow } from '../utils/validation';

const router = express.Router();

// Validation schemas
const uploadProfileImageSchema = Joi.object({
  userId: Joi.string().required(),
  profileId: Joi.string().required()
});

const activateImageSchema = Joi.object({
  imageId: Joi.string().required()
});

const deleteImageSchema = Joi.object({
  imageId: Joi.string().required()
});

const uploadDocumentSchema = Joi.object({
  userId: Joi.string().required(),
  entityType: Joi.string().valid('tutor_application', 'user_profile').required(),
  entityId: Joi.string().optional(), // For tutor applications
  isPublic: Joi.boolean().default(false)
});

const deleteDocumentSchema = Joi.object({
  documentId: Joi.string().required()
});

const uploadAttachmentSchema = Joi.object({
  userId: Joi.string().required(),
  studyNoteId: Joi.string().required(),
  isPublic: Joi.boolean().default(false)
});

const deleteAttachmentSchema = Joi.object({
  attachmentId: Joi.string().required()
});

// =============================================================================
// PROFILE IMAGE ROUTES
// =============================================================================

/**
 * Upload profile image
 * POST /api/files/profile-images/upload
 */
router.post('/profile-images/upload',
  authenticate,
  fileUploadRateLimit,
  uploadInstances.profileImages.single('image'),
  validateFileUpload('profileImages'),
  validateImageFile,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      const { userId, profileId } = req.body;

      // Validate request body
      const validatedData = validateOrThrow(uploadProfileImageSchema, { userId, profileId });

      // Verify user owns the profile
      if (req.user!.id !== validatedData.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: cannot upload for another user'
        });
      }

      const file = req.file;
      const fileInfo = FileUploadService.getFileInfo(file);

      console.log('Processing profile image upload:', {
        userId: validatedData.userId,
        fileName: file.originalname,
        fileSize: file.size
      });

      // Process and optimize the image
      const processedFileName = `profile_${validatedData.userId}_${Date.now()}.jpg`;
      const processedPath = file.path.replace(path.basename(file.path), processedFileName);

      const processedResult = await optimizeImage(file.path, processedPath, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 85,
        generateThumbnail: true,
        thumbnailSize: 150
      });

      // Clean up original file
      await FileUploadService.deleteFile(file.path);

      // Create database record
      const imageRecord = {
        userId: validatedData.userId,
        profileId: validatedData.profileId,
        fileName: processedFileName,
        originalName: file.originalname,
        filePath: processedResult.processedPath,
        fileSize: processedResult.fileSize,
        mimeType: 'image/jpeg',
        width: processedResult.dimensions.width,
        height: processedResult.dimensions.height,
        isActive: false // Will be activated separately
      };

      const savedImage = await ProfileImage.create(imageRecord);

      console.log('Profile image uploaded successfully:', savedImage._id);

      res.json({
        success: true,
        data: {
          id: savedImage._id,
          fileName: savedImage.fileName,
          fileSize: savedImage.fileSize,
          width: savedImage.width,
          height: savedImage.height,
          uploadedAt: savedImage.uploadedAt,
          url: FileUploadService.getFileUrl(savedImage.filePath)
        }
      });

    } catch (error: any) {
      console.error('Profile image upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload profile image'
      });
    }
  }
);

/**
 * Activate profile image (set as current)
 * POST /api/files/profile-images/activate
 */
router.post('/profile-images/activate', authenticate, async (req, res) => {
  try {
    const { imageId } = req.body;

    // Validate request
    const validatedData = validateOrThrow(activateImageSchema, { imageId });

    // Find the image
    const image = await ProfileImage.findById(validatedData.imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Profile image not found'
      });
    }

    // Verify ownership
    if (image.userId.toString() !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: image belongs to another user'
      });
    }

    // Deactivate all other images for this user
    await ProfileImage.updateMany(
      { userId: image.userId, isActive: true },
      { isActive: false, updatedAt: new Date() }
    );

    // Activate this image
    image.isActive = true;
    image.updatedAt = new Date();
    await image.save();

    console.log('Profile image activated:', image._id);

    res.json({
      success: true,
      data: {
        id: image._id,
        isActive: true,
        activatedAt: image.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Profile image activation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to activate profile image'
    });
  }
});

/**
 * Delete profile image
 * DELETE /api/files/profile-images/:imageId
 */
router.delete('/profile-images/:imageId', authenticate, async (req, res) => {
  try {
    const { imageId } = req.params;

    // Find the image
    const image = await ProfileImage.findById(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Profile image not found'
      });
    }

    // Verify ownership
    if (image.userId.toString() !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: image belongs to another user'
      });
    }

    // Delete file from disk
    if (image.filePath && FileUploadService.fileExists(image.filePath)) {
      await FileUploadService.deleteFile(image.filePath);
    }

    // Delete from database
    await ProfileImage.findByIdAndDelete(imageId);

    console.log('Profile image deleted:', imageId);

    res.json({
      success: true,
      message: 'Profile image deleted successfully'
    });

  } catch (error: any) {
    console.error('Profile image deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete profile image'
    });
  }
});

/**
 * Get user's profile images
 * GET /api/files/profile-images
 */
router.get('/profile-images', authenticate, async (req, res) => {
  try {
    const images = await ProfileImage.find({
      userId: req.user!.id
    }).sort({ uploadedAt: -1 });

    const formattedImages = images.map(image => ({
      id: image._id,
      fileName: image.fileName,
      originalName: image.originalName,
      fileSize: image.fileSize,
      mimeType: image.mimeType,
      width: image.width,
      height: image.height,
      isActive: image.isActive,
      uploadedAt: image.uploadedAt,
      url: FileUploadService.getFileUrl(image.filePath)
    }));

    res.json({
      success: true,
      data: formattedImages
    });

  } catch (error: any) {
    console.error('Get profile images error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get profile images'
    });
  }
});

/**
 * Get active profile image
 * GET /api/files/profile-images/active
 */
router.get('/profile-images/active', authenticate, async (req, res) => {
  try {
    const image = await ProfileImage.findOne({
      userId: req.user!.id,
      isActive: true
    });

    if (!image) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: {
        id: image._id,
        fileName: image.fileName,
        originalName: image.originalName,
        fileSize: image.fileSize,
        mimeType: image.mimeType,
        width: image.width,
        height: image.height,
        uploadedAt: image.uploadedAt,
        url: FileUploadService.getFileUrl(image.filePath)
      }
    });

  } catch (error: any) {
    console.error('Get active profile image error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get active profile image'
    });
  }
});

// =============================================================================
// DOCUMENT UPLOAD ROUTES
// =============================================================================

/**
 * Upload document (CV, resume, etc.)
 * POST /api/files/documents/upload
 */
router.post('/documents/upload',
  authenticate,
  fileUploadRateLimit,
  uploadInstances.documents.single('document'),
  validateFileUpload('documents'),
  validateDocumentFile,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No document file provided'
        });
      }

      const { userId, entityType, entityId, isPublic } = req.body;

      // Validate request body
      const validatedData = validateOrThrow(uploadDocumentSchema, {
        userId,
        entityType,
        entityId,
        isPublic: isPublic === 'true' || isPublic === true
      });

      // Verify user owns the upload
      if (req.user!.id !== validatedData.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: cannot upload for another user'
        });
      }

      const file = req.file;
      const fileInfo = FileUploadService.getFileInfo(file);

      console.log('Processing document upload:', {
        userId: validatedData.userId,
        entityType: validatedData.entityType,
        fileName: file.originalname,
        fileSize: file.size
      });

      // Determine file type based on entity type
      const fileType = validatedData.entityType === 'tutor_application'
        ? FileType.DOCUMENT
        : FileType.DOCUMENT;

      // Create database record using new File model
      const documentRecord = {
        userId: validatedData.userId,
        fileType,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId || validatedData.userId, // Default to userId if no entityId
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        extension: path.extname(file.originalname).toLowerCase(),
        isPublic: validatedData.isPublic,
        status: 'active' as const
      };

      const savedDocument = await File.create(documentRecord);

      console.log('Document uploaded successfully:', savedDocument._id);

      res.json({
        success: true,
        data: {
          id: savedDocument._id,
          fileName: savedDocument.fileName,
          originalName: savedDocument.originalName,
          fileSize: savedDocument.fileSize,
          mimeType: savedDocument.mimeType,
          extension: savedDocument.extension,
          entityType: savedDocument.entityType,
          entityId: savedDocument.entityId,
          isPublic: savedDocument.isPublic,
          uploadedAt: savedDocument.uploadedAt,
          url: FileUploadService.getFileUrl(savedDocument.filePath)
        }
      });

    } catch (error: any) {
      console.error('Document upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload document'
      });
    }
  }
);

/**
 * Delete document
 * DELETE /api/files/documents/:documentId
 */
router.delete('/documents/:documentId', authenticate, async (req, res) => {
  try {
    const { documentId } = req.params;

    // Find the document
    const document = await File.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Verify ownership
    if (document.userId.toString() !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: document belongs to another user'
      });
    }

    // Verify it's a document type
    if (document.fileType !== FileType.DOCUMENT) {
      return res.status(400).json({
        success: false,
        error: 'File is not a document'
      });
    }

    // Delete file from disk
    if (document.filePath && FileUploadService.fileExists(document.filePath)) {
      await FileUploadService.deleteFile(document.filePath);
    }

    // Soft delete from database
    await File.findByIdAndUpdate(documentId, {
      status: 'deleted' as const,
      isActive: false,
      deletedAt: new Date()
    });

    console.log('Document deleted:', documentId);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error: any) {
    console.error('Document deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete document'
    });
  }
});

/**
 * Get user's documents
 * GET /api/files/documents
 */
router.get('/documents', authenticate, async (req, res) => {
  try {
    const { entityType, entityId } = req.query;

    const query: any = {
      userId: req.user!.id,
      fileType: FileType.DOCUMENT,
      status: 'active',
      isActive: true
    };

    if (entityType) {
      query.entityType = entityType;
    }

    if (entityId) {
      query.entityId = entityId;
    }

    const documents = await File.find(query).sort({ uploadedAt: -1 });

    const formattedDocuments = documents.map(doc => ({
      id: doc._id,
      fileName: doc.fileName,
      originalName: doc.originalName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      extension: doc.extension,
      entityType: doc.entityType,
      entityId: doc.entityId,
      isPublic: doc.isPublic,
      uploadedAt: doc.uploadedAt,
      url: FileUploadService.getFileUrl(doc.filePath)
    }));

    res.json({
      success: true,
      data: formattedDocuments
    });

  } catch (error: any) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get documents'
    });
  }
});

// =============================================================================
// STUDY NOTE ATTACHMENTS ROUTES
// =============================================================================

/**
 * Upload attachments for study note
 * POST /api/files/attachments/upload
 */
router.post('/attachments/upload',
  authenticate,
  fileUploadRateLimit,
  uploadInstances.attachments.array('attachments', 5),
  validateFileUpload('attachments'),
  async (req, res) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No attachment files provided'
        });
      }

      const { userId, studyNoteId, isPublic } = req.body;

      // Validate request body
      const validatedData = validateOrThrow(uploadAttachmentSchema, {
        userId,
        studyNoteId,
        isPublic: isPublic === 'true' || isPublic === true
      });

      // Verify user owns the upload
      if (req.user!.id !== validatedData.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: cannot upload for another user'
        });
      }

      // Verify user owns the study note
      const studyNote = await StudyNote.findById(validatedData.studyNoteId);
      if (!studyNote) {
        return res.status(404).json({
          success: false,
          error: 'Study note not found'
        });
      }

      if (studyNote.createdBy.toString() !== validatedData.userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: study note belongs to another user'
        });
      }

      const files = req.files as Express.Multer.File[];
      const uploadedAttachments = [];

      console.log('Processing attachment upload:', {
        userId: validatedData.userId,
        studyNoteId: validatedData.studyNoteId,
        fileCount: files.length
      });

      for (const file of files) {
        // Create database record for each attachment
        const attachmentRecord = {
          userId: validatedData.userId,
          fileType: FileType.ATTACHMENT,
          entityType: 'study_note',
          entityId: validatedData.studyNoteId,
          fileName: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          extension: path.extname(file.originalname).toLowerCase(),
          isPublic: validatedData.isPublic,
          status: 'active' as const
        };

        const savedAttachment = await File.create(attachmentRecord);
        uploadedAttachments.push({
          id: savedAttachment._id,
          fileName: savedAttachment.fileName,
          originalName: savedAttachment.originalName,
          fileSize: savedAttachment.fileSize,
          mimeType: savedAttachment.mimeType,
          extension: savedAttachment.extension,
          uploadedAt: savedAttachment.uploadedAt,
          url: FileUploadService.getFileUrl(savedAttachment.filePath)
        });
      }

      console.log('Attachments uploaded successfully:', uploadedAttachments.length);

      res.json({
        success: true,
        data: {
          attachments: uploadedAttachments,
          totalUploaded: uploadedAttachments.length,
          studyNoteId: validatedData.studyNoteId
        }
      });

    } catch (error: any) {
      console.error('Attachment upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload attachments'
      });
    }
  }
);

/**
 * Delete attachment
 * DELETE /api/files/attachments/:attachmentId
 */
router.delete('/attachments/:attachmentId', authenticate, async (req, res) => {
  try {
    const { attachmentId } = req.params;

    // Find the attachment
    const attachment = await File.findById(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found'
      });
    }

    // Verify ownership
    if (attachment.userId.toString() !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: attachment belongs to another user'
      });
    }

    // Verify it's an attachment type
    if (attachment.fileType !== FileType.ATTACHMENT) {
      return res.status(400).json({
        success: false,
        error: 'File is not an attachment'
      });
    }

    // Delete file from disk
    if (attachment.filePath && FileUploadService.fileExists(attachment.filePath)) {
      await FileUploadService.deleteFile(attachment.filePath);
    }

    // Soft delete from database
    await File.findByIdAndUpdate(attachmentId, {
      status: 'deleted' as const,
      isActive: false,
      deletedAt: new Date()
    });

    console.log('Attachment deleted:', attachmentId);

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });

  } catch (error: any) {
    console.error('Attachment deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete attachment'
    });
  }
});

/**
 * Get attachments for a study note
 * GET /api/files/attachments/:studyNoteId
 */
router.get('/attachments/:studyNoteId', authenticate, async (req, res) => {
  try {
    const { studyNoteId } = req.params;

    // Verify user has access to the study note
    const studyNote = await StudyNote.findById(studyNoteId);
    if (!studyNote) {
      return res.status(404).json({
        success: false,
        error: 'Study note not found'
      });
    }

    // Allow access if user owns the note or if it's public
    const hasAccess = studyNote.createdBy.toString() === req.user!.id ||
                     studyNote.isPublic;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: study note is private'
      });
    }

    const attachments = await File.find({
      entityType: 'study_note',
      entityId: studyNoteId,
      fileType: FileType.ATTACHMENT,
      status: 'active',
      isActive: true
    }).sort({ uploadedAt: -1 });

    const formattedAttachments = attachments.map(attachment => ({
      id: attachment._id,
      fileName: attachment.fileName,
      originalName: attachment.originalName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      extension: attachment.extension,
      isPublic: attachment.isPublic,
      uploadedAt: attachment.uploadedAt,
      url: FileUploadService.getFileUrl(attachment.filePath)
    }));

    res.json({
      success: true,
      data: {
        attachments: formattedAttachments,
        studyNoteId,
        totalAttachments: formattedAttachments.length
      }
    });

  } catch (error: any) {
    console.error('Get attachments error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get attachments'
    });
  }
});

// =============================================================================
// GENERAL FILE SERVING ROUTES
// =============================================================================

/**
 * Serve file by ID
 * GET /api/files/:fileId
 */
router.get('/:fileId',
  authenticate,
  fileDownloadRateLimit,
  logFileAccess,
  serveFile
);

/**
 * Serve file thumbnail by ID
 * GET /api/files/:fileId/thumbnail
 */
router.get('/:fileId/thumbnail',
  authenticate,
  fileDownloadRateLimit,
  logFileAccess,
  serveThumbnail
);

/**
 * Serve public file by ID (no authentication required)
 * GET /api/files/public/:fileId
 */
router.get('/public/:fileId',
  fileDownloadRateLimit,
  logFileAccess,
  servePublicFile
);

export default router;
