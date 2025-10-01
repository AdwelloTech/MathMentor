import mongoose, { Document, Schema } from 'mongoose';

export interface IQuiz extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  subject: string;
  gradeLevelId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; // User ID
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple_choice' | 'true_false' | 'mixed';
  totalQuestions: number;
  timeLimit?: number; // in minutes
  isPublic: boolean;
  isActive: boolean;
  tags?: string[];
  passingScore?: number; // percentage required to pass
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Quiz schema
const quizSchema = new Schema<IQuiz>(
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
    subject: {
      type: String,
      required: true,
      trim: true
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
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    questionType: {
      type: String,
      required: true,
      enum: ['multiple_choice', 'true_false', 'mixed'],
      default: 'multiple_choice'
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    timeLimit: {
      type: Number,
      min: 1,
      max: 180 // 3 hours max
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    tags: [{ type: String, trim: true }],
    passingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

// Indexes
quizSchema.index({ subject: 1, isPublic: 1 });
quizSchema.index({ createdBy: 1, isActive: 1 });
quizSchema.index({ difficulty: 1 });
quizSchema.index({ createdAt: -1 });

// Virtual for id field (to match frontend expectations)
quizSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
quizSchema.set('toJSON', {
  virtuals: true,
});

// Virtual for total questions in quiz
quizSchema.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'quizId',
  count: true
});

// Static method to get public quizzes by subject
quizSchema.statics.getBySubject = function(subject: string, difficulty?: string) {
  const query: any = { subject, isPublic: true, isActive: true };
  if (difficulty) {
    query.difficulty = difficulty;
  }
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName fullName')
    .populate('gradeLevelId', 'displayName');
};

// Static method to get quizzes created by user
quizSchema.statics.getByCreator = function(userId: mongoose.Types.ObjectId) {
  return this.find({ createdBy: userId, isActive: true })
    .sort({ updatedAt: -1 })
    .populate('gradeLevelId', 'displayName');
};

// Instance method to check if quiz is complete (has all questions)
quizSchema.methods.isComplete = async function(): Promise<boolean> {
  const Question = mongoose.model('Question');
  const questionCount = await Question.countDocuments({ quizId: this._id });
  return questionCount === this.totalQuestions;
};

// QuizAttempt schema for tracking student quiz attempts
export interface IQuizAttempt extends Document {
  _id: mongoose.Types.ObjectId;
  quiz_id: mongoose.Types.ObjectId;
  student_id: mongoose.Types.ObjectId;
  status: 'in_progress' | 'completed' | 'abandoned';
  score?: number;
  max_score?: number;
  correct_answers?: number;
  total_questions?: number;
  started_at: Date;
  completed_at?: Date;
  tutor_feedback?: string;
  created_at: Date;
  updated_at: Date;
}

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quiz_id: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    student_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
      required: true,
    },
    score: {
      type: Number,
    },
    max_score: {
      type: Number,
    },
    correct_answers: {
      type: Number,
    },
    total_questions: {
      type: Number,
    },
    started_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
    completed_at: {
      type: Date,
    },
    tutor_feedback: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Add virtual for id field
quizAttemptSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
quizAttemptSchema.set('toJSON', {
  virtuals: true,
});

// Indexes
quizAttemptSchema.index({ quiz_id: 1, student_id: 1 });
quizAttemptSchema.index({ student_id: 1, created_at: -1 });
quizAttemptSchema.index({ status: 1 });

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
export default Quiz;
