import mongoose, { Document, Schema } from 'mongoose';

export interface IGradeLevel extends Document {
  _id: mongoose.Types.ObjectId;
  code: string; // e.g., "K", "1", "2", ..., "12", "college-1"
  displayName: string; // e.g., "Kindergarten", "1st Grade", "College Freshman"
  sortOrder: number;
  category: 'preschool' | 'elementary' | 'middle' | 'high' | 'college' | 'graduate';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Grade level schema
const gradeLevelSchema = new Schema<IGradeLevel>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    sortOrder: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      required: true,
      enum: ['preschool', 'elementary', 'middle', 'high', 'college', 'graduate']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
gradeLevelSchema.index({ code: 1 }, { unique: true });
gradeLevelSchema.index({ category: 1, sortOrder: 1 });
gradeLevelSchema.index({ isActive: 1 });

// Static method to get active grade levels
gradeLevelSchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1 });
};

// Static method to get grade levels by category
gradeLevelSchema.statics.getByCategory = function(category: string) {
  return this.find({ category, isActive: true }).sort({ sortOrder: 1 });
};

// Predefined grade levels data
export const DEFAULT_GRADE_LEVELS = [
  // Preschool
  { code: 'PS', displayName: 'Preschool', sortOrder: 1, category: 'preschool' },
  { code: 'K', displayName: 'Kindergarten', sortOrder: 2, category: 'preschool' },

  // Elementary
  { code: '1', displayName: '1st Grade', sortOrder: 3, category: 'elementary' },
  { code: '2', displayName: '2nd Grade', sortOrder: 4, category: 'elementary' },
  { code: '3', displayName: '3rd Grade', sortOrder: 5, category: 'elementary' },
  { code: '4', displayName: '4th Grade', sortOrder: 6, category: 'elementary' },
  { code: '5', displayName: '5th Grade', sortOrder: 7, category: 'elementary' },

  // Middle School
  { code: '6', displayName: '6th Grade', sortOrder: 8, category: 'middle' },
  { code: '7', displayName: '7th Grade', sortOrder: 9, category: 'middle' },
  { code: '8', displayName: '8th Grade', sortOrder: 10, category: 'middle' },

  // High School
  { code: '9', displayName: '9th Grade', sortOrder: 11, category: 'high' },
  { code: '10', displayName: '10th Grade', sortOrder: 12, category: 'high' },
  { code: '11', displayName: '11th Grade', sortOrder: 13, category: 'high' },
  { code: '12', displayName: '12th Grade', sortOrder: 14, category: 'high' },

  // College
  { code: 'C1', displayName: 'College Freshman', sortOrder: 15, category: 'college' },
  { code: 'C2', displayName: 'College Sophomore', sortOrder: 16, category: 'college' },
  { code: 'C3', displayName: 'College Junior', sortOrder: 17, category: 'college' },
  { code: 'C4', displayName: 'College Senior', sortOrder: 18, category: 'college' },

  // Graduate
  { code: 'G1', displayName: 'Graduate Year 1', sortOrder: 19, category: 'graduate' },
  { code: 'G2', displayName: 'Graduate Year 2', sortOrder: 20, category: 'graduate' },
  { code: 'G3', displayName: 'Graduate Year 3+', sortOrder: 21, category: 'graduate' },
];

export const GradeLevel = mongoose.model<IGradeLevel>('GradeLevel', gradeLevelSchema);
export default GradeLevel;
