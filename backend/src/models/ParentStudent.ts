import mongoose, { Document, Schema } from 'mongoose';

export interface IParentStudent extends Document {
  _id: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  relationship?: string; // e.g., 'mother', 'father', 'guardian', or custom relationship
  isPrimaryContact: boolean;
  canViewGrades: boolean;
  canViewAttendance: boolean;
  canViewReports: boolean;
  canBookSessions: boolean;
  isActive: boolean;
  linkedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const parentStudentSchema = new Schema<IParentStudent>(
  {
    parentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    studentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    relationship: {
      type: String
    },
    isPrimaryContact: { type: Boolean, default: false },
    canViewGrades: { type: Boolean, default: true },
    canViewAttendance: { type: Boolean, default: true },
    canViewReports: { type: Boolean, default: true },
    canBookSessions: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    linkedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index to ensure a parent-student pair is unique
parentStudentSchema.index({ parentId: 1, studentId: 1 }, { unique: true });

// Virtual populate for parent details
parentStudentSchema.virtual('parent', {
  ref: 'User',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for student details
parentStudentSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

export const ParentStudent = mongoose.model<IParentStudent>('ParentStudent', parentStudentSchema);
export default ParentStudent;

