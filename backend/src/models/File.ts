import mongoose, { Document, Schema } from 'mongoose';

export enum FileType {
  PROFILE_IMAGE = 'profile_image',
  DOCUMENT = 'document',
  ATTACHMENT = 'attachment',
  PDF = 'pdf',
  OTHER = 'other'
}

export enum FileStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  PROCESSING = 'processing'
}

export interface IFile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fileType: FileType;
  entityType: string; // 'user', 'study_note', 'tutor_application', etc.
  entityId: mongoose.Types.ObjectId; // ID of the related entity

  // File metadata
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  extension: string;

  // Image-specific fields (optional)
  width?: number;
  height?: number;
  thumbnailPath?: string;

  // Status and flags
  status: FileStatus;
  isActive: boolean;
  isPublic: boolean;

  // Upload and processing info
  uploadedAt: Date;
  processedAt?: Date;
  deletedAt?: Date;

  // Metadata
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

// File schema
const fileSchema = new Schema<IFile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    fileType: {
      type: String,
      enum: Object.values(FileType),
      required: true,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },

    // File metadata
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0
    },
    mimeType: {
      type: String,
      required: true
    },
    extension: {
      type: String,
      required: true
    },

    // Image-specific fields
    width: { type: Number },
    height: { type: Number },
    thumbnailPath: { type: String },

    // Status and flags
    status: {
      type: String,
      enum: Object.values(FileStatus),
      default: FileStatus.ACTIVE,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true
    },

    // Upload and processing info
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    processedAt: { type: Date },
    deletedAt: { type: Date },

    // Metadata
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
fileSchema.index({ userId: 1, fileType: 1 });
fileSchema.index({ entityType: 1, entityId: 1 });
fileSchema.index({ status: 1, isActive: 1 });
fileSchema.index({ uploadedAt: -1 });
fileSchema.index({ isPublic: 1, status: 1 });

// Static methods
fileSchema.statics = {
  // Get files by user and type
  getByUserAndType: function(userId: mongoose.Types.ObjectId, fileType: FileType) {
    return this.find({
      userId,
      fileType,
      status: FileStatus.ACTIVE,
      isActive: true
    }).sort({ uploadedAt: -1 });
  },

  // Get files by entity
  getByEntity: function(entityType: string, entityId: mongoose.Types.ObjectId) {
    return this.find({
      entityType,
      entityId,
      status: FileStatus.ACTIVE,
      isActive: true
    }).sort({ uploadedAt: -1 });
  },

  // Get active files for user
  getActiveForUser: function(userId: mongoose.Types.ObjectId) {
    return this.find({
      userId,
      status: FileStatus.ACTIVE,
      isActive: true
    }).sort({ uploadedAt: -1 });
  },

  // Soft delete a file
  softDelete: function(fileId: mongoose.Types.ObjectId) {
    return this.updateOne(
      { _id: fileId },
      {
        status: FileStatus.DELETED,
        isActive: false,
        deletedAt: new Date()
      }
    );
  },

  // Get file by ID with ownership check
  getByIdAndUser: function(fileId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId) {
    return this.findOne({
      _id: fileId,
      userId,
      status: FileStatus.ACTIVE,
      isActive: true
    });
  },

  // Get public files
  getPublicFiles: function(fileType?: FileType) {
    const query: any = {
      isPublic: true,
      status: FileStatus.ACTIVE,
      isActive: true
    };

    if (fileType) {
      query.fileType = fileType;
    }

    return this.find(query).sort({ uploadedAt: -1 });
  }
};

// Instance methods
fileSchema.methods = {
  // Get public URL for the file
  getUrl: function(baseUrl: string = ''): string {
    return `${baseUrl}/api/files/${this._id}`;
  },

  // Get thumbnail URL if available
  getThumbnailUrl: function(baseUrl: string = ''): string {
    if (this.thumbnailPath) {
      return `${baseUrl}/api/files/${this._id}/thumbnail`;
    }
    return this.getUrl(baseUrl);
  },

  // Mark as processed
  markAsProcessed: function() {
    this.status = FileStatus.ACTIVE;
    this.processedAt = new Date();
    return this.save();
  },

  // Check if file is owned by user
  isOwnedBy: function(userId: mongoose.Types.ObjectId): boolean {
    return this.userId.equals(userId);
  },

  // Get file info summary
  getSummary: function() {
    return {
      id: this._id,
      fileName: this.fileName,
      originalName: this.originalName,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      extension: this.extension,
      fileType: this.fileType,
      uploadedAt: this.uploadedAt,
      url: this.getUrl(),
      thumbnailUrl: this.getThumbnailUrl(),
      width: this.width,
      height: this.height
    };
  }
};

export const File = mongoose.model<IFile>('File', fileSchema);
export default File;
