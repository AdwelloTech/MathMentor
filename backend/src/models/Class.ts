import mongoose, { Document, Schema } from 'mongoose';

export interface IClass extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  subjectId: mongoose.Types.ObjectId;
  gradeLevelId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  schedule: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    duration: number; // in minutes
  };
  startDate: Date;
  endDate?: Date;
  capacity: number;
  enrolledCount: number;
  price?: number;
  currency?: string;
  isActive: boolean;
  isFull: boolean;
  prerequisites?: string[];
  materials?: string[];
  meetingLink?: string;
  roomNumber?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Class schema
const classSchema = new Schema<IClass>(
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
      maxlength: 1000
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    gradeLevelId: {
      type: Schema.Types.ObjectId,
      ref: 'GradeLevel',
      required: true
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    schedule: {
      dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6
      },
      startTime: {
        type: String,
        required: true,
        validate: {
          validator: function(v: string) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Start time must be in HH:MM format'
        }
      },
      endTime: {
        type: String,
        required: true,
        validate: {
          validator: function(v: string) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'End time must be in HH:MM format'
        }
      },
      duration: {
        type: Number,
        required: true,
        min: 15,
        max: 480 // 8 hours max
      }
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    enrolledCount: {
      type: Number,
      default: 0,
      min: 0
    },
    price: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isFull: {
      type: Boolean,
      default: false
    },
    prerequisites: [{ type: String, trim: true }],
    materials: [{ type: String, trim: true }],
    meetingLink: {
      type: String,
      trim: true
    },
    roomNumber: {
      type: String,
      trim: true,
      maxlength: 50
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200
    }
  },
  {
    timestamps: true
  }
);

// Indexes
classSchema.index({ subjectId: 1, gradeLevelId: 1 });
classSchema.index({ teacherId: 1, isActive: 1 });
classSchema.index({ 'schedule.dayOfWeek': 1, 'schedule.startTime': 1 });
classSchema.index({ startDate: 1, endDate: 1 });
classSchema.index({ isActive: 1, capacity: 1, enrolledCount: 1 });
classSchema.index({ createdAt: -1 });

// Virtual for checking if class is available
classSchema.virtual('isAvailable').get(function() {
  return this.isActive && !this.isFull && this.enrolledCount < this.capacity;
});

// Virtual for remaining spots
classSchema.virtual('remainingSpots').get(function() {
  return Math.max(0, this.capacity - this.enrolledCount);
});

// Pre-save middleware to update isFull status
classSchema.pre('save', function(next) {
  this.isFull = this.enrolledCount >= this.capacity;
  next();
});

// Instance method to check if student can enroll
classSchema.methods.canEnroll = function(studentId: mongoose.Types.ObjectId): boolean {
  return this.isAvailable && !this.isFull;
};

// Instance method to enroll a student
classSchema.methods.enrollStudent = async function(studentId: mongoose.Types.ObjectId): Promise<boolean> {
  if (!this.canEnroll(studentId)) {
    return false;
  }

  this.enrolledCount += 1;
  this.isFull = this.enrolledCount >= this.capacity;
  await this.save();
  return true;
};

// Instance method to unenroll a student
classSchema.methods.unenrollStudent = async function(studentId: mongoose.Types.ObjectId): Promise<boolean> {
  if (this.enrolledCount > 0) {
    this.enrolledCount -= 1;
    this.isFull = false; // Reset isFull in case we now have space
    await this.save();
    return true;
  }
  return false;
};

// Static method to find available classes
classSchema.statics.findAvailable = function(filters: {
  subjectId?: mongoose.Types.ObjectId;
  gradeLevelId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
}) {
  const query: any = {
    isActive: true,
    isFull: false,
    enrolledCount: { $lt: mongoose.Types.ObjectId }, // This should be capacity field reference
  };

  if (filters.subjectId) {
    query.subjectId = filters.subjectId;
  }

  if (filters.gradeLevelId) {
    query.gradeLevelId = filters.gradeLevelId;
  }

  if (filters.teacherId) {
    query.teacherId = filters.teacherId;
  }

  if (filters.dayOfWeek !== undefined) {
    query['schedule.dayOfWeek'] = filters.dayOfWeek;
  }

  // Add date range filter
  const now = new Date();
  query.startDate = { $lte: now };
  query.$or = [
    { endDate: { $exists: false } },
    { endDate: { $gte: now } }
  ];

  return this.find(query)
    .populate('teacherId', 'firstName lastName fullName')
    .populate('subjectId', 'name displayName color')
    .populate('gradeLevelId', 'displayName')
    .sort({ startDate: 1 });
};

// Static method to get teacher's classes
classSchema.statics.getByTeacher = function(teacherId: mongoose.Types.ObjectId, activeOnly: boolean = true) {
  const query: any = { teacherId };

  if (activeOnly) {
    query.isActive = true;
  }

  return this.find(query)
    .populate('subjectId', 'name displayName color')
    .populate('gradeLevelId', 'displayName')
    .sort({ 'schedule.dayOfWeek': 1, 'schedule.startTime': 1 });
};

export const Class = mongoose.model<IClass>('Class', classSchema);
export default Class;
