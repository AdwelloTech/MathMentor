import mongoose, { Document, Schema } from 'mongoose';

export interface IStudyNote extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  content: string;
  subjectId?: mongoose.Types.ObjectId;
  gradeLevelId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  isPublic: boolean;
  tags?: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  attachments?: string[]; // file URLs
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Study note schema
const studyNoteSchema = new Schema<IStudyNote>(
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
      type: String,
      required: true
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
    isPublic: {
      type: Boolean,
      default: false
    },
    tags: [{ type: String, trim: true }],
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0
    },
    attachments: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
studyNoteSchema.index({ title: 'text', content: 'text' }); // Full text search
studyNoteSchema.index({ subjectId: 1, isPublic: 1 });
studyNoteSchema.index({ createdBy: 1, isActive: 1 });
studyNoteSchema.index({ viewCount: -1 });
studyNoteSchema.index({ createdAt: -1 });

// Static method to search study notes
studyNoteSchema.statics.search = function(
  searchTerm?: string,
  subjectId?: mongoose.Types.ObjectId,
  gradeLevelId?: mongoose.Types.ObjectId,
  createdBy?: mongoose.Types.ObjectId,
  isPublic?: boolean,
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

  if (isPublic !== undefined) {
    query.isPublic = isPublic;
  }

  return this.find(query)
    .sort(searchTerm ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'firstName lastName fullName')
    .populate('subjectId', 'name displayName color')
    .populate('gradeLevelId', 'displayName');
};

// Static method to get popular notes
studyNoteSchema.statics.getPopular = function(limit: number = 10) {
  return this.find({ isPublic: true, isActive: true })
    .sort({ viewCount: -1, likeCount: -1 })
    .limit(limit)
    .populate('createdBy', 'firstName lastName fullName')
    .populate('subjectId', 'name displayName color');
};

// Instance method to increment view count
studyNoteSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Instance method to toggle like
studyNoteSchema.methods.toggleLike = function(userId: mongoose.Types.ObjectId): Promise<boolean> {
  // This would typically use a separate likes collection
  // For now, we'll just increment/decrement the count
  // In a real implementation, you'd check if user already liked it
  this.likeCount += 1;
  return this.save().then(() => true);
};

export const StudyNote = mongoose.model<IStudyNote>('StudyNote', studyNoteSchema);
export default StudyNote;
