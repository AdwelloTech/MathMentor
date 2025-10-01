import mongoose, { Document, Schema } from 'mongoose';

export interface ITutorNote extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  subjectId?: mongoose.Types.ObjectId;
  gradeLevelId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  isPremium: boolean;
  isActive: boolean;
  viewCount: number;
  downloadCount: number;
  likeCount: number;
  tags?: string[];
  price?: number; // for premium content
  previewContent?: string; // free preview text
  createdAt: Date;
  updatedAt: Date;
}

// Tutor note schema
const tutorNoteSchema = new Schema<ITutorNote>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    content: {
      type: String
    },
    fileUrl: {
      type: String
    },
    fileName: {
      type: String
    },
    fileSize: {
      type: Number,
      min: 0
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject'
    },
    gradeLevelId: {
      type: Schema.Types.ObjectId,
      ref: 'GradeLevel'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0
    },
    tags: [{ type: String, trim: true }],
    price: {
      type: Number,
      min: 0
    },
    previewContent: {
      type: String,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

// Indexes
tutorNoteSchema.index({ title: 'text', description: 'text', previewContent: 'text' });
tutorNoteSchema.index({ subjectId: 1, isPremium: 1 });
tutorNoteSchema.index({ createdBy: 1, isActive: 1 });
tutorNoteSchema.index({ isPremium: 1, viewCount: -1 });
tutorNoteSchema.index({ createdAt: -1 });

// Validation: ensure either content or fileUrl is provided
tutorNoteSchema.pre('save', function(next) {
  if (!this.content && !this.fileUrl) {
    return next(new Error('Tutor note must have either content or fileUrl'));
  }
  next();
});

// Static method to search tutor notes
tutorNoteSchema.statics.search = function(
  searchTerm?: string,
  subjectId?: mongoose.Types.ObjectId,
  gradeLevelId?: mongoose.Types.ObjectId,
  createdBy?: mongoose.Types.ObjectId,
  isPremium?: boolean,
  limit: number = 20,
  skip: number = 0
) {
  const query: any = { isActive: true };

  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  if (subjectId) {
    query.subjectId = subjectId;
  }

  if (gradeLevelId) {
    query.gradeLevelId = gradeLevelId;
  }

  if (createdBy) {
    query.createdBy = createdBy;
  }

  if (isPremium !== undefined) {
    query.isPremium = isPremium;
  }

  return this.find(query)
    .sort(searchTerm ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'firstName lastName fullName')
    .populate('subjectId', 'name displayName color')
    .populate('gradeLevelId', 'displayName');
};

// Static method to get premium content
tutorNoteSchema.statics.getPremium = function(limit: number = 20, skip: number = 0) {
  return this.find({ isPremium: true, isActive: true })
    .sort({ viewCount: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'firstName lastName fullName')
    .populate('subjectId', 'name displayName color');
};

// Static method to get free content
tutorNoteSchema.statics.getFree = function(limit: number = 20, skip: number = 0) {
  return this.find({ isPremium: false, isActive: true })
    .sort({ viewCount: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'firstName lastName fullName')
    .populate('subjectId', 'name displayName color');
};

// Instance method to increment view count
tutorNoteSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Instance method to increment download count
tutorNoteSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

// Instance method to check if user can access (for premium content)
tutorNoteSchema.methods.canAccess = function(userId: mongoose.Types.ObjectId, userPackage?: string): boolean {
  if (!this.isPremium) {
    return true; // Free content is accessible to all
  }

  // Premium content logic would go here
  // For now, allow access if user has gold package or is the creator
  return userPackage === 'gold' || this.createdBy.equals(userId);
};

export const TutorNote = mongoose.model<ITutorNote>('TutorNote', tutorNoteSchema);
export default TutorNote;
