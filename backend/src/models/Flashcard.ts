import mongoose, { Document, Schema } from 'mongoose';

export interface IFlashcard extends Document {
  _id: mongoose.Types.ObjectId;
  setId: mongoose.Types.ObjectId;
  frontText: string;
  backText: string;
  cardOrder: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  isActive: boolean;
  lastReviewed?: Date;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  masteryLevel: number; // 0-100, indicates how well the user knows this card
  nextReviewDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Flashcard schema
const flashcardSchema = new Schema<IFlashcard>(
  {
    setId: {
      type: Schema.Types.ObjectId,
      ref: 'FlashcardSet',
      required: true
    },
    frontText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    backText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    cardOrder: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    tags: [{ type: String, trim: true }],
    isActive: {
      type: Boolean,
      default: true
    },
    lastReviewed: { type: Date },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    correctCount: {
      type: Number,
      default: 0,
      min: 0
    },
    incorrectCount: {
      type: Number,
      default: 0,
      min: 0
    },
    masteryLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    nextReviewDate: { type: Date }
  },
  {
    timestamps: true
  }
);

// Indexes
flashcardSchema.index({ setId: 1, cardOrder: 1 });
flashcardSchema.index({ nextReviewDate: 1 });
flashcardSchema.index({ masteryLevel: 1 });

// Static method to get flashcards for a set
flashcardSchema.statics.getBySetId = function(setId: mongoose.Types.ObjectId) {
  return this.find({ setId }).sort({ cardOrder: 1 });
};

// Static method to get due flashcards for spaced repetition
flashcardSchema.statics.getDueCards = function(setId?: mongoose.Types.ObjectId, limit: number = 20) {
  const query: any = {
    $or: [
      { nextReviewDate: { $exists: false } },
      { nextReviewDate: { $lte: new Date() } }
    ]
  };

  if (setId) {
    query.setId = setId;
  }

  return this.find(query)
    .sort({ nextReviewDate: 1, masteryLevel: 1 })
    .limit(limit);
};

// Instance method to record a review
flashcardSchema.methods.recordReview = function(correct: boolean) {
  this.lastReviewed = new Date();
  this.reviewCount += 1;

  if (correct) {
    this.correctCount += 1;
  } else {
    this.incorrectCount += 1;
  }

  // Calculate mastery level (simple algorithm)
  const totalAttempts = this.correctCount + this.incorrectCount;
  if (totalAttempts > 0) {
    const accuracy = this.correctCount / totalAttempts;
    this.masteryLevel = Math.round(accuracy * 100);
  }

  // Set next review date based on spaced repetition (simplified)
  const now = new Date();
  let daysToNextReview = 1; // Default: review tomorrow

  if (this.masteryLevel >= 80) {
    daysToNextReview = 7; // Good mastery: weekly review
  } else if (this.masteryLevel >= 60) {
    daysToNextReview = 3; // Medium mastery: every 3 days
  } else if (this.masteryLevel >= 40) {
    daysToNextReview = 1; // Low mastery: daily review
  }

  // If answered incorrectly recently, review sooner
  if (!correct && this.incorrectCount > this.correctCount) {
    daysToNextReview = Math.max(1, daysToNextReview / 2);
  }

  this.nextReviewDate = new Date(now.getTime() + daysToNextReview * 24 * 60 * 60 * 1000);

  return this.save();
};

// Instance method to reset progress
flashcardSchema.methods.resetProgress = function() {
  this.lastReviewed = undefined;
  this.reviewCount = 0;
  this.correctCount = 0;
  this.incorrectCount = 0;
  this.masteryLevel = 0;
  this.nextReviewDate = undefined;
  return this.save();
};

export const Flashcard = mongoose.model<IFlashcard>('Flashcard', flashcardSchema);
export default Flashcard;
