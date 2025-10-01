import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizPdf extends Document {
  _id: mongoose.Types.ObjectId;
  fileName: string;
  filePath: string;
  fileSize: number;
  gradeLevelId?: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId; // User ID
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz PDF schema
const quizPdfSchema = new Schema<IQuizPdf>(
  {
    fileName: {
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
    gradeLevelId: {
      type: Schema.Types.ObjectId,
      ref: 'GradeLevel'
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
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

// Indexes for performance
quizPdfSchema.index({ gradeLevelId: 1, subjectId: 1, isActive: 1 });
quizPdfSchema.index({ subjectId: 1, isActive: 1 });
quizPdfSchema.index({ uploadedBy: 1 });
quizPdfSchema.index({ createdAt: -1 });

// Static methods
quizPdfSchema.statics = {
  // Get active quiz PDFs by grade level and subject
  getByGradeAndSubject: function(gradeLevelId: mongoose.Types.ObjectId | undefined, subjectId: mongoose.Types.ObjectId) {
    const query: any = {
      subjectId,
      isActive: true
    };

    if (gradeLevelId) {
      query.$or = [
        { gradeLevelId },
        { gradeLevelId: { $exists: false } }
      ];
    }

    return this.find(query)
      .populate('gradeLevelId', 'code displayName')
      .populate('subjectId', 'name displayName')
      .populate('uploadedBy', 'firstName lastName fullName email')
      .sort({ createdAt: -1 });
  },

  // Get active quiz PDFs with optional filters
  getActive: function(filters?: {
    gradeLevelId?: mongoose.Types.ObjectId;
    subjectId?: mongoose.Types.ObjectId;
  }) {
    const query: any = { isActive: true };

    if (filters?.gradeLevelId) {
      query.gradeLevelId = filters.gradeLevelId;
    }
    if (filters?.subjectId) {
      query.subjectId = filters.subjectId;
    }

    return this.find(query)
      .populate('gradeLevelId', 'code displayName')
      .populate('subjectId', 'name displayName')
      .populate('uploadedBy', 'firstName lastName fullName email')
      .sort({ createdAt: -1 });
  }
};

export const QuizPdf = mongoose.model<IQuizPdf>('QuizPdf', quizPdfSchema);
export default QuizPdf;
