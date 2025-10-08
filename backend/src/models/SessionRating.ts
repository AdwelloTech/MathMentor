import mongoose, { Document, Schema } from 'mongoose';

export interface ISessionRating extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  tutorId: mongoose.Types.ObjectId;
  rating: number; // 1-5
  reviewText?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sessionRatingSchema = new Schema<ISessionRating>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    reviewText: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    isAnonymous: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes
sessionRatingSchema.index({ tutorId: 1, createdAt: -1 });
sessionRatingSchema.index({ sessionId: 1, studentId: 1 }, { unique: true }); // One rating per student per session

export const SessionRating = mongoose.model<ISessionRating>('SessionRating', sessionRatingSchema);
export default SessionRating;

