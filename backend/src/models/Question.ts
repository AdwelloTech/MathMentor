import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer {
  _id?: mongoose.Types.ObjectId;
  answerText: string;
  isCorrect: boolean;
  explanation?: string;
  order: number;
}

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false';
  points: number;
  answers: IAnswer[];
  explanation?: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Answer sub-schema
const answerSchema = new Schema<IAnswer>(
  {
    answerText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: 300
    },
    order: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: true }
);

// Question schema
const questionSchema = new Schema<IQuestion>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    questionType: {
      type: String,
      required: true,
      enum: ['multiple_choice', 'true_false'],
      default: 'multiple_choice'
    },
    points: {
      type: Number,
      required: true,
      min: 0,
      default: 10
    },
    answers: [answerSchema],
    explanation: {
      type: String,
      trim: true,
      maxlength: 500
    },
    hint: {
      type: String,
      trim: true,
      maxlength: 200
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    tags: [{ type: String, trim: true }],
    order: {
      type: Number,
      required: true,
      min: 0,
      default: 0
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

// Indexes
questionSchema.index({ quizId: 1, order: 1 });
questionSchema.index({ questionType: 1 });
questionSchema.index({ difficulty: 1 });

// Validation: ensure at least one correct answer for multiple choice
questionSchema.pre('save', function(next) {
  if (this.questionType === 'multiple_choice') {
    const correctAnswers = this.answers.filter(answer => answer.isCorrect);
    if (correctAnswers.length === 0) {
      return next(new Error('Multiple choice questions must have at least one correct answer'));
    }
    if (this.answers.length < 2) {
      return next(new Error('Multiple choice questions must have at least 2 answers'));
    }
  } else if (this.questionType === 'true_false') {
    if (this.answers.length !== 2) {
      return next(new Error('True/false questions must have exactly 2 answers'));
    }
    const correctAnswers = this.answers.filter(answer => answer.isCorrect);
    if (correctAnswers.length !== 1) {
      return next(new Error('True/false questions must have exactly one correct answer'));
    }
  }
  next();
});

// Static method to get questions for a quiz
questionSchema.statics.getByQuizId = function(quizId: mongoose.Types.ObjectId, activeOnly: boolean = true) {
  const query: any = { quizId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ order: 1 });
};

// Static method to get random questions for quiz generation
questionSchema.statics.getRandomQuestions = function(
  subject: string,
  difficulty: string,
  questionType: 'multiple_choice' | 'true_false' | 'mixed',
  count: number,
  gradeLevelId?: mongoose.Types.ObjectId
) {
  const query: any = {
    isActive: true,
    difficulty,
    subject
  };

  if (gradeLevelId) {
    query.gradeLevelId = gradeLevelId;
  }

  if (questionType !== 'mixed') {
    query.questionType = questionType;
  }

  return this.aggregate([
    { $match: query },
    { $sample: { size: count } }
  ]);
};

// Instance method to check if answer is correct
questionSchema.methods.checkAnswer = function(answerIds: mongoose.Types.ObjectId[]): {
  isCorrect: boolean;
  correctAnswers: IAnswer[];
  score: number;
} {
  const correctAnswers = this.answers.filter((answer: IAnswer) => answer.isCorrect);
  const userAnswers = this.answers.filter((answer: IAnswer) =>
    answerIds.some(id => id.equals(answer._id))
  );

  const isCorrect = correctAnswers.length === userAnswers.length &&
    correctAnswers.every((correct: IAnswer) =>
      userAnswers.some((user: IAnswer) => user._id?.equals(correct._id))
    );

  const score = isCorrect ? this.points : 0;

  return {
    isCorrect,
    correctAnswers,
    score
  };
};

// Instance method to get correct answer IDs
questionSchema.methods.getCorrectAnswerIds = function(): mongoose.Types.ObjectId[] {
  return this.answers
    .filter((answer: IAnswer) => answer.isCorrect)
    .map((answer: IAnswer) => answer._id!)
    .filter((id: mongoose.Types.ObjectId) => id);
};

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
export default Question;
