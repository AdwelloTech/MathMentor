import mongoose, { Document, Schema } from 'mongoose';

export interface IFlashcardSet extends Document {
  _id: mongoose.Types.ObjectId;
  tutorId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  topic?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  gradeLevelId?: mongoose.Types.ObjectId;
  isPublic: boolean;
  isActive: boolean;
  tags?: string[];
  viewCount: number;
  studyCount: number;
  averageRating?: number;
  totalRatings: number;
  createdAt: Date;
  updatedAt: Date;
}

// Flashcard set schema
const flashcardSetSchema = new Schema<IFlashcardSet>(
  {
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    topic: {
      type: String,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    gradeLevelId: {
      type: Schema.Types.ObjectId,
      ref: 'GradeLevel'
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    tags: [{ type: String, trim: true }],
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    studyCount: {
      type: Number,
      default: 0,
      min: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes
flashcardSetSchema.index({ subject: 1, isPublic: 1 });
flashcardSetSchema.index({ tutorId: 1, isActive: 1 });
flashcardSetSchema.index({ createdAt: -1 });
flashcardSetSchema.index({ viewCount: -1 });
flashcardSetSchema.index({ averageRating: -1 });

// Virtual for total flashcards in set
flashcardSetSchema.virtual('flashcardCount', {
  ref: 'Flashcard',
  localField: '_id',
  foreignField: 'setId',
  count: true
});

// Static method to get popular public sets
flashcardSetSchema.statics.getPopular = function(limit: number = 10) {
  return this.find({ isPublic: true, isActive: true })
    .sort({ viewCount: -1, averageRating: -1 })
    .limit(limit)
    .populate('tutorId', 'firstName lastName fullName')
    .populate('gradeLevelId', 'displayName');
};

// Static method to get sets by subject
flashcardSetSchema.statics.getBySubject = function(subject: string, includePrivate: boolean = false) {
  const query: any = { subject, isActive: true };
  if (!includePrivate) {
    query.isPublic = true;
  }
  return this.find(query)
    .sort({ averageRating: -1, createdAt: -1 })
    .populate('tutorId', 'firstName lastName fullName')
    .populate('gradeLevelId', 'displayName');
};

// Instance method to increment view count
flashcardSetSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Instance method to increment study count
flashcardSetSchema.methods.incrementStudyCount = function() {
  this.studyCount += 1;
  return this.save();
};

// Instance method to add rating
flashcardSetSchema.methods.addRating = function(rating: number) {
  if (rating < 0 || rating > 5) {
    throw new Error('Rating must be between 0 and 5');
  }

  const newTotalRatings = this.totalRatings + 1;
  const newAverageRating = ((this.averageRating || 0) * this.totalRatings + rating) / newTotalRatings;

  this.totalRatings = newTotalRatings;
  this.averageRating = Math.round(newAverageRating * 10) / 10; // Round to 1 decimal

  return this.save();
};

export const FlashcardSet = mongoose.model<IFlashcardSet>('FlashcardSet', flashcardSetSchema);
export default FlashcardSet;
