import mongoose, { Document, Schema } from 'mongoose';

export interface IProfileImage extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId; // For backward compatibility
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  isActive: boolean;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Profile image schema
const profileImageSchema = new Schema<IProfileImage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
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
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    },
    width: { type: Number },
    height: { type: Number },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes
profileImageSchema.index({ userId: 1, isActive: 1 });
profileImageSchema.index({ uploadedAt: -1 });

// Static method to get active profile image for user
profileImageSchema.statics.getActiveForUser = function(userId: mongoose.Types.ObjectId) {
  return this.findOne({ userId, isActive: true }).sort({ uploadedAt: -1 });
};

// Static method to deactivate old images when uploading new one
profileImageSchema.statics.deactivateOldImages = function(userId: mongoose.Types.ObjectId) {
  return this.updateMany(
    { userId, isActive: true },
    { isActive: false, updatedAt: new Date() }
  );
};

// Instance method to get full URL (if using local storage)
profileImageSchema.methods.getUrl = function(baseUrl: string = ''): string {
  return `${baseUrl}/uploads/profile-images/${this.fileName}`;
};

export const ProfileImage = mongoose.model<IProfileImage>('ProfileImage', profileImageSchema);
export default ProfileImage;
