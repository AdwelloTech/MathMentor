import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: string; // For backward compatibility with Supabase
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  password?: string; // Optional for OAuth users
  role: 'admin' | 'principal' | 'teacher' | 'student' | 'parent' | 'tutor' | 'hr' | 'finance' | 'support';
  avatarUrl?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';

  // Student specific fields
  studentId?: string;
  package?: 'free' | 'silver' | 'gold';
  enrollmentDate?: Date;
  classId?: mongoose.Types.ObjectId;
  currentGrade?: string;
  gradeLevelId?: mongoose.Types.ObjectId;
  academicSet?: string;
  hasLearningDisabilities: boolean;
  learningNeedsDescription?: string;

  // Parent contact information
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;

  // Location information
  city?: string;
  postcode?: string;
  schoolName?: string;

  // Profile image fields
  profileImageId?: mongoose.Types.ObjectId;
  profileImageUrl?: string;

  // Tutor specific fields
  cvUrl?: string;
  cvFileName?: string;
  specializations?: string[];
  hourlyRate?: number;
  availability?: string;
  bio?: string;

  // Tutorial fields
  tutorialCompleted?: boolean;
  tutorialDismissedCount?: number;
  tutorialLastShown?: Date;
  certifications?: string[];
  languages?: string[];
  profileCompleted?: boolean;

  // Parent specific fields
  childrenIds?: mongoose.Types.ObjectId[];

  // Employee specific fields
  employeeId?: string;
  department?: string;
  subjects?: string[];
  qualification?: string;
  experienceYears?: number;
  relationship?: string;
  hireDate?: Date;
  salary?: number;
  position?: string;

  // Status fields
  isActive: boolean;
  isOnline?: boolean;
  lastLogin?: Date;

  // Tutorial system fields
  tutorialCompleted: boolean;
  tutorialDismissedCount: number;
  tutorialLastShown?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Pre-save middleware to hash password
const userSchema = new Schema<IUser>(
  {
    userId: { type: String, sparse: true }, // For Supabase migration compatibility
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false }, // Don't include in queries by default
    role: {
      type: String,
      required: true,
      enum: ['admin', 'principal', 'teacher', 'student', 'parent', 'tutor', 'hr', 'finance', 'support']
    },
    avatarUrl: { type: String },
    phone: { type: String },
    address: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },

    // Student specific fields
    studentId: { type: String, sparse: true },
    package: { type: String, enum: ['free', 'silver', 'gold'] },
    enrollmentDate: { type: Date },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    currentGrade: { type: String },
    gradeLevelId: { type: Schema.Types.ObjectId, ref: 'GradeLevel' },
    academicSet: { type: String },
    hasLearningDisabilities: { type: Boolean, default: false },
    learningNeedsDescription: { type: String },

    // Parent contact information
    parentName: { type: String },
    parentPhone: { type: String },
    parentEmail: { type: String },

    // Location information
    city: { type: String },
    postcode: { type: String },
    schoolName: { type: String },

    // Profile image fields
    profileImageId: { type: Schema.Types.ObjectId, ref: 'ProfileImage' },
    profileImageUrl: { type: String },

    // Tutor specific fields
    cvUrl: { type: String },
    cvFileName: { type: String },
    specializations: [{ type: String }],
    hourlyRate: { type: Number },
    availability: { type: String },
    bio: { type: String },
    certifications: [{ type: String }],
    languages: [{ type: String }],
    profileCompleted: { type: Boolean, default: false },

    // Tutorial fields
    tutorialCompleted: { type: Boolean, default: false },
    tutorialDismissedCount: { type: Number, default: 0 },
    tutorialLastShown: { type: Date },

    // Parent specific fields
    childrenIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // Employee specific fields
    employeeId: { type: String, sparse: true },
    department: { type: String },
    subjects: [{ type: String }],
    qualification: { type: String },
    experienceYears: { type: Number },
    relationship: { type: String },
    hireDate: { type: Date },
    salary: { type: Number },
    position: { type: String },

    // Status fields
    isActive: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: false },
    lastLogin: { type: Date },

    // Tutorial system fields
    tutorialCompleted: { type: Boolean, default: false },
    tutorialDismissedCount: { type: Number, default: 0 },
    tutorialLastShown: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ studentId: 1 }, { sparse: true });
userSchema.index({ employeeId: 1 }, { sparse: true });
userSchema.index({ userId: 1 }, { sparse: true });

// Virtual for age calculation
userSchema.virtual('age').get(function(this: IUser) {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password') || !this.password) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

export const User = mongoose.model<IUser>('User', userSchema);
export default User;
