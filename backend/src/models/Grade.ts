import mongoose, { Document, Schema } from 'mongoose';

export type GradeType = 'assignment' | 'quiz' | 'exam' | 'project' | 'participation' | 'homework' | 'test' | 'final_exam';

export interface IGrade extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  gradeLevelId?: mongoose.Types.ObjectId;

  // Assessment details
  assessmentId?: mongoose.Types.ObjectId; // Reference to quiz, assignment, etc.
  assessmentType: GradeType;
  title: string;
  description?: string;

  // Grading
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade?: string;
  gradeScale?: 'A-F' | '4.0' | '100' | 'custom';

  // Date and period
  assessmentDate: Date;
  academicYear: string; // e.g., "2024-2025"
  term?: string; // e.g., "Fall", "Spring", "Summer"
  week?: number;

  // Feedback
  comments?: string;
  teacherFeedback?: string;
  strengths?: string[];
  areasForImprovement?: string[];

  // Metadata
  isFinal: boolean;
  isVerified: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// Grade schema
const gradeSchema = new Schema<IGrade>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class'
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking'
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject'
    },
    gradeLevelId: {
      type: Schema.Types.ObjectId,
      ref: 'GradeLevel'
    },

    // Assessment details
    assessmentId: {
      type: Schema.Types.ObjectId
    },
    assessmentType: {
      type: String,
      required: true,
      enum: ['assignment', 'quiz', 'exam', 'project', 'participation', 'homework', 'test', 'final_exam']
    },
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

    // Grading
    score: {
      type: Number,
      required: true,
      min: 0
    },
    maxScore: {
      type: Number,
      required: true,
      min: 0.1
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    letterGrade: {
      type: String,
      trim: true,
      maxlength: 5,
      uppercase: true
    },
    gradeScale: {
      type: String,
      enum: ['A-F', '4.0', '100', 'custom'],
      default: '100'
    },

    // Date and period
    assessmentDate: {
      type: Date,
      required: true
    },
    academicYear: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^\d{4}-\d{4}$/.test(v);
        },
        message: 'Academic year must be in YYYY-YYYY format'
      }
    },
    term: {
      type: String,
      trim: true,
      maxlength: 50
    },
    week: {
      type: Number,
      min: 1,
      max: 52
    },

    // Feedback
    comments: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    teacherFeedback: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    strengths: [{ type: String, trim: true }],
    areasForImprovement: [{ type: String, trim: true }],

    // Metadata
    isFinal: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
gradeSchema.index({ studentId: 1, assessmentDate: -1 });
gradeSchema.index({ teacherId: 1, assessmentDate: -1 });
gradeSchema.index({ classId: 1, assessmentDate: -1 });
gradeSchema.index({ subjectId: 1, assessmentDate: -1 });
gradeSchema.index({ assessmentType: 1, assessmentDate: -1 });
gradeSchema.index({ academicYear: 1, term: 1 });
gradeSchema.index({ percentage: -1 });
gradeSchema.index({ createdAt: -1 });

// Compound index for unique grades per assessment
gradeSchema.index({
  studentId: 1,
  assessmentId: 1,
  assessmentType: 1
}, {
  unique: true,
  partialFilterExpression: { assessmentId: { $exists: true } }
});

// Virtual for GPA calculation (if using 4.0 scale)
gradeSchema.virtual('gpa').get(function() {
  if (this.gradeScale !== '4.0') return null;

  // Convert percentage to 4.0 GPA scale
  if (this.percentage >= 93) return 4.0;
  if (this.percentage >= 90) return 3.7;
  if (this.percentage >= 87) return 3.3;
  if (this.percentage >= 83) return 3.0;
  if (this.percentage >= 80) return 2.7;
  if (this.percentage >= 77) return 2.3;
  if (this.percentage >= 73) return 2.0;
  if (this.percentage >= 70) return 1.7;
  if (this.percentage >= 67) return 1.3;
  if (this.percentage >= 60) return 1.0;
  return 0.0;
});

// Virtual for formatted grade
gradeSchema.virtual('formattedGrade').get(function() {
  if (this.letterGrade) {
    return `${this.letterGrade} (${this.percentage}%)`;
  }
  return `${this.percentage}%`;
});

// Pre-save middleware to calculate percentage and letter grade
gradeSchema.pre('save', function(next) {
  // Calculate percentage
  this.percentage = Math.round((this.score / this.maxScore) * 100);

  // Auto-assign letter grade if not provided and using A-F scale
  if (!this.letterGrade && this.gradeScale === 'A-F') {
    if (this.percentage >= 93) this.letterGrade = 'A';
    else if (this.percentage >= 90) this.letterGrade = 'A-';
    else if (this.percentage >= 87) this.letterGrade = 'B+';
    else if (this.percentage >= 83) this.letterGrade = 'B';
    else if (this.percentage >= 80) this.letterGrade = 'B-';
    else if (this.percentage >= 77) this.letterGrade = 'C+';
    else if (this.percentage >= 73) this.letterGrade = 'C';
    else if (this.percentage >= 70) this.letterGrade = 'C-';
    else if (this.percentage >= 67) this.letterGrade = 'D+';
    else if (this.percentage >= 63) this.letterGrade = 'D';
    else if (this.percentage >= 60) this.letterGrade = 'D-';
    else this.letterGrade = 'F';
  }

  next();
});

// Instance method to verify grade
gradeSchema.methods.verify = async function(verifierId: mongoose.Types.ObjectId): Promise<boolean> {
  if (!this.isVerified) {
    this.isVerified = true;
    this.verifiedBy = verifierId;
    this.verifiedAt = new Date();
    await this.save();
    return true;
  }
  return false;
};

// Static method to get student's grades
gradeSchema.statics.getByStudent = function(
  studentId: mongoose.Types.ObjectId,
  subjectId?: mongoose.Types.ObjectId,
  academicYear?: string,
  term?: string,
  limit: number = 50,
  skip: number = 0
) {
  const query: any = { studentId };

  if (subjectId) {
    query.subjectId = subjectId;
  }

  if (academicYear) {
    query.academicYear = academicYear;
  }

  if (term) {
    query.term = term;
  }

  return this.find(query)
    .populate('teacherId', 'firstName lastName fullName')
    .populate('classId', 'title subjectId gradeLevelId')
    .populate('subjectId', 'name displayName color')
    .populate('gradeLevelId', 'displayName')
    .populate('verifiedBy', 'firstName lastName fullName')
    .sort({ assessmentDate: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get class grades
gradeSchema.statics.getByClass = function(
  classId: mongoose.Types.ObjectId,
  assessmentType?: GradeType,
  limit: number = 100,
  skip: number = 0
) {
  const query: any = { classId };

  if (assessmentType) {
    query.assessmentType = assessmentType;
  }

  return this.find(query)
    .populate('studentId', 'firstName lastName fullName')
    .populate('teacherId', 'firstName lastName fullName')
    .populate('subjectId', 'name displayName color')
    .populate('gradeLevelId', 'displayName')
    .sort({ assessmentDate: -1, 'studentId.lastName': 1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get grade statistics for a student
gradeSchema.statics.getStudentStats = async function(
  studentId: mongoose.Types.ObjectId,
  subjectId?: mongoose.Types.ObjectId,
  academicYear?: string,
  term?: string
): Promise<{
  totalAssessments: number;
  averagePercentage: number;
  averageScore: number;
  highestGrade: number;
  lowestGrade: number;
  gradeDistribution: { [key: string]: number };
  subjectBreakdown: Array<{
    subjectId: mongoose.Types.ObjectId;
    subjectName: string;
    averagePercentage: number;
    assessmentCount: number;
  }>;
}> {
  const query: any = { studentId };

  if (subjectId) {
    query.subjectId = subjectId;
  }

  if (academicYear) {
    query.academicYear = academicYear;
  }

  if (term) {
    query.term = term;
  }

  const stats = await this.aggregate([
    { $match: query },
    {
      $lookup: {
        from: 'subjects',
        localField: 'subjectId',
        foreignField: '_id',
        as: 'subject'
      }
    },
    {
      $group: {
        _id: null,
        totalAssessments: { $sum: 1 },
        averagePercentage: { $avg: '$percentage' },
        averageScore: { $avg: '$score' },
        highestGrade: { $max: '$percentage' },
        lowestGrade: { $min: '$percentage' },
        grades: { $push: '$percentage' },
        letterGrades: { $push: '$letterGrade' },
        subjectStats: {
          $push: {
            subjectId: '$subjectId',
            subjectName: { $arrayElemAt: ['$subject.name', 0] },
            percentage: '$percentage'
          }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalAssessments: 0,
      averagePercentage: 0,
      averageScore: 0,
      highestGrade: 0,
      lowestGrade: 0,
      gradeDistribution: {},
      subjectBreakdown: []
    };
  }

  const result = stats[0];

  // Calculate grade distribution
  const gradeDistribution: { [key: string]: number } = {};
  result.letterGrades.forEach((grade: string) => {
    if (grade) {
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    }
  });

  // Calculate subject breakdown
  const subjectMap: { [key: string]: { total: number; count: number; name: string } } = {};
  result.subjectStats.forEach((stat: any) => {
    if (stat.subjectId) {
      const key = stat.subjectId.toString();
      if (!subjectMap[key]) {
        subjectMap[key] = { total: 0, count: 0, name: stat.subjectName || 'Unknown' };
      }
      subjectMap[key].total += stat.percentage;
      subjectMap[key].count += 1;
    }
  });

  const subjectBreakdown = Object.entries(subjectMap).map(([subjectId, data]) => ({
    subjectId: new mongoose.Types.ObjectId(subjectId),
    subjectName: data.name,
    averagePercentage: Math.round((data.total / data.count) * 100) / 100,
    assessmentCount: data.count
  }));

  return {
    totalAssessments: result.totalAssessments,
    averagePercentage: Math.round(result.averagePercentage * 100) / 100,
    averageScore: Math.round(result.averageScore * 100) / 100,
    highestGrade: result.highestGrade,
    lowestGrade: result.lowestGrade,
    gradeDistribution,
    subjectBreakdown
  };
};

// Static method to get class performance statistics
gradeSchema.statics.getClassStats = async function(
  classId: mongoose.Types.ObjectId,
  assessmentType?: GradeType
): Promise<{
  totalStudents: number;
  averageClassPercentage: number;
  gradeDistribution: { [key: string]: number };
  topPerformers: Array<{
    studentId: mongoose.Types.ObjectId;
    studentName: string;
    averagePercentage: number;
  }>;
  strugglingStudents: Array<{
    studentId: mongoose.Types.ObjectId;
    studentName: string;
    averagePercentage: number;
  }>;
}> {
  const query: any = { classId };

  if (assessmentType) {
    query.assessmentType = assessmentType;
  }

  const stats = await this.aggregate([
    { $match: query },
    {
      $lookup: {
        from: 'users',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    {
      $group: {
        _id: '$studentId',
        studentName: { $first: '$student.fullName' },
        averagePercentage: { $avg: '$percentage' },
        totalAssessments: { $sum: 1 },
        grades: { $push: '$letterGrade' }
      }
    },
    {
      $group: {
        _id: null,
        students: {
          $push: {
            studentId: '$_id',
            studentName: '$studentName',
            averagePercentage: '$averagePercentage',
            totalAssessments: '$totalAssessments',
            grades: '$grades'
          }
        },
        totalStudents: { $sum: 1 },
        averageClassPercentage: { $avg: '$averagePercentage' },
        allGrades: { $push: '$grades' }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalStudents: 0,
      averageClassPercentage: 0,
      gradeDistribution: {},
      topPerformers: [],
      strugglingStudents: []
    };
  }

  const result = stats[0];

  // Calculate grade distribution
  const gradeDistribution: { [key: string]: number } = {};
  result.allGrades.flat().forEach((grades: string[]) => {
    grades.forEach((grade: string) => {
      if (grade) {
        gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
      }
    });
  });

  // Sort students by performance
  const students = result.students.sort((a: any, b: any) => b.averagePercentage - a.averagePercentage);

  return {
    totalStudents: result.totalStudents,
    averageClassPercentage: Math.round(result.averageClassPercentage * 100) / 100,
    gradeDistribution,
    topPerformers: students.slice(0, 5).map((s: any) => ({
      studentId: s.studentId,
      studentName: s.studentName,
      averagePercentage: Math.round(s.averagePercentage * 100) / 100
    })),
    strugglingStudents: students.slice(-5).reverse().map((s: any) => ({
      studentId: s.studentId,
      studentName: s.studentName,
      averagePercentage: Math.round(s.averagePercentage * 100) / 100
    }))
  };
};

export const Grade = mongoose.model<IGrade>('Grade', gradeSchema);
export default Grade;
