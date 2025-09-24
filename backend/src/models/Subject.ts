import mongoose, { Document, Schema } from 'mongoose';

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string; // e.g., "mathematics", "physics"
  displayName: string; // e.g., "Mathematics", "Physics"
  description?: string;
  color: string; // hex color for UI
  icon?: string; // icon name or URL
  category?: string; // e.g., "stem", "humanities", "languages"
  isActive: boolean;
  sortOrder: number;
  parentId?: mongoose.Types.ObjectId; // for sub-subjects
  createdAt: Date;
  updatedAt: Date;
}

// Subject schema
const subjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300
    },
    color: {
      type: String,
      required: true,
      default: '#3B82F6', // blue-500
      validate: {
        validator: function(v: string) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'Color must be a valid hex color code'
      }
    },
    icon: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true,
      lowercase: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
subjectSchema.index({ name: 1 }, { unique: true });
subjectSchema.index({ category: 1, isActive: 1 });
subjectSchema.index({ parentId: 1 });

// Prevent circular references
subjectSchema.pre('save', async function(next) {
  if (this.parentId && this.parentId.equals(this._id)) {
    return next(new Error('Subject cannot be its own parent'));
  }

  // Check for circular reference
  if (this.parentId) {
    const parent = await mongoose.model('Subject').findById(this.parentId);
    if (parent && parent.parentId && parent.parentId.equals(this._id)) {
      return next(new Error('Circular reference detected in subject hierarchy'));
    }
  }

  next();
});

// Virtual for child subjects
subjectSchema.virtual('children', {
  ref: 'Subject',
  localField: '_id',
  foreignField: 'parentId'
});

// Static method to get active subjects
subjectSchema.statics.getActive = function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, displayName: 1 });
};

// Static method to get subjects by category
subjectSchema.statics.getByCategory = function(category: string) {
  return this.find({ category, isActive: true })
    .sort({ sortOrder: 1, displayName: 1 });
};

// Static method to get root subjects (no parent)
subjectSchema.statics.getRootSubjects = function() {
  return this.find({ parentId: { $exists: false }, isActive: true })
    .sort({ sortOrder: 1, displayName: 1 });
};

// Static method to get subject hierarchy
subjectSchema.statics.getHierarchy = async function() {
  const rootSubjects = await this.find({ parentId: { $exists: false }, isActive: true })
    .sort({ sortOrder: 1, displayName: 1 });

  const hierarchy = await Promise.all(
    rootSubjects.map(async (subject: ISubject) => {
      const children = await this.find({ parentId: subject._id, isActive: true })
        .sort({ sortOrder: 1, displayName: 1 });
      return {
        ...subject.toObject(),
        children
      };
    })
  );

  return hierarchy;
};

// Predefined subjects data
export const DEFAULT_SUBJECTS = [
  // Mathematics
  { name: 'mathematics', displayName: 'Mathematics', color: '#3B82F6', category: 'stem', sortOrder: 1 },
  { name: 'algebra', displayName: 'Algebra', color: '#1D4ED8', category: 'stem', sortOrder: 2, parentName: 'mathematics' },
  { name: 'geometry', displayName: 'Geometry', color: '#1E40AF', category: 'stem', sortOrder: 3, parentName: 'mathematics' },
  { name: 'calculus', displayName: 'Calculus', color: '#1E3A8A', category: 'stem', sortOrder: 4, parentName: 'mathematics' },
  { name: 'statistics', displayName: 'Statistics', color: '#172554', category: 'stem', sortOrder: 5, parentName: 'mathematics' },

  // Science
  { name: 'science', displayName: 'Science', color: '#10B981', category: 'stem', sortOrder: 6 },
  { name: 'physics', displayName: 'Physics', color: '#059669', category: 'stem', sortOrder: 7, parentName: 'science' },
  { name: 'chemistry', displayName: 'Chemistry', color: '#047857', category: 'stem', sortOrder: 8, parentName: 'science' },
  { name: 'biology', displayName: 'Biology', color: '#065F46', category: 'stem', sortOrder: 9, parentName: 'science' },

  // Languages
  { name: 'english', displayName: 'English', color: '#F59E0B', category: 'languages', sortOrder: 10 },
  { name: 'spanish', displayName: 'Spanish', color: '#D97706', category: 'languages', sortOrder: 11 },
  { name: 'french', displayName: 'French', color: '#B45309', category: 'languages', sortOrder: 12 },

  // Social Studies
  { name: 'history', displayName: 'History', color: '#8B5CF6', category: 'humanities', sortOrder: 13 },
  { name: 'geography', displayName: 'Geography', color: '#7C3AED', category: 'humanities', sortOrder: 14 },
];

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
export default Subject;
