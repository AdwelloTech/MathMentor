import mongoose, { Document, Schema } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'pending';

export interface IAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;

  // Session details
  sessionDate: Date;
  subjectId?: mongoose.Types.ObjectId;
  gradeLevelId?: mongoose.Types.ObjectId;

  // Attendance status
  status: AttendanceStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  duration?: number; // in minutes

  // Notes and feedback
  notes?: string;
  teacherNotes?: string;
  studentFeedback?: string;

  // Performance tracking
  participationScore?: number; // 1-10 scale
  understandingLevel?: number; // 1-10 scale
  homeworkCompleted?: boolean;

  // Administrative
  markedBy: mongoose.Types.ObjectId; // Who marked the attendance
  isVerified: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// Attendance schema
const attendanceSchema = new Schema<IAttendance>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking'
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class'
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Session details
    sessionDate: {
      type: Date,
      required: true
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject'
    },
    gradeLevelId: {
      type: Schema.Types.ObjectId,
      ref: 'GradeLevel'
    },

    // Attendance status
    status: {
      type: String,
      required: true,
      enum: ['present', 'absent', 'late', 'excused', 'pending'],
      default: 'pending'
    },
    checkInTime: {
      type: Date
    },
    checkOutTime: {
      type: Date
    },
    duration: {
      type: Number,
      min: 0
    },

    // Notes and feedback
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    },
    teacherNotes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    studentFeedback: {
      type: String,
      trim: true,
      maxlength: 500
    },

    // Performance tracking
    participationScore: {
      type: Number,
      min: 1,
      max: 10
    },
    understandingLevel: {
      type: Number,
      min: 1,
      max: 10
    },
    homeworkCompleted: {
      type: Boolean,
      default: false
    },

    // Administrative
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes
attendanceSchema.index({ studentId: 1, sessionDate: -1 });
attendanceSchema.index({ teacherId: 1, sessionDate: -1 });
attendanceSchema.index({ classId: 1, sessionDate: -1 });
attendanceSchema.index({ bookingId: 1 });
attendanceSchema.index({ status: 1, sessionDate: -1 });
attendanceSchema.index({ sessionDate: -1 });
attendanceSchema.index({ createdAt: -1 });

// Compound index for unique attendance records
attendanceSchema.index({
  studentId: 1,
  sessionDate: 1,
  classId: 1
}, {
  unique: true,
  partialFilterExpression: { classId: { $exists: true } }
});

// Compound index for booking attendance
attendanceSchema.index({
  studentId: 1,
  bookingId: 1
}, {
  unique: true,
  partialFilterExpression: { bookingId: { $exists: true } }
});

// Virtual for session duration in hours
attendanceSchema.virtual('durationHours').get(function() {
  return this.duration ? Math.round((this.duration / 60) * 100) / 100 : 0;
});

// Virtual for formatted check-in time
attendanceSchema.virtual('formattedCheckIn').get(function() {
  return this.checkInTime ? this.checkInTime.toLocaleTimeString() : null;
});

// Virtual for formatted check-out time
attendanceSchema.virtual('formattedCheckOut').get(function() {
  return this.checkOutTime ? this.checkOutTime.toLocaleTimeString() : null;
});

// Pre-save middleware to calculate duration
attendanceSchema.pre('save', function(next) {
  if (this.checkInTime && this.checkOutTime) {
    const durationMs = this.checkOutTime.getTime() - this.checkInTime.getTime();
    this.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
  }
  next();
});

// Instance method to check in
attendanceSchema.methods.checkIn = async function(): Promise<boolean> {
  if (this.status === 'pending' || this.status === 'absent') {
    this.status = 'present';
    this.checkInTime = new Date();
    await this.save();
    return true;
  }
  return false;
};

// Instance method to check out
attendanceSchema.methods.checkOut = async function(): Promise<boolean> {
  if (this.status === 'present' && this.checkInTime && !this.checkOutTime) {
    this.checkOutTime = new Date();
    const durationMs = this.checkOutTime.getTime() - this.checkInTime.getTime();
    this.duration = Math.round(durationMs / (1000 * 60));
    await this.save();
    return true;
  }
  return false;
};

// Instance method to mark as late
attendanceSchema.methods.markLate = async function(): Promise<boolean> {
  if (this.status === 'pending' || this.status === 'absent') {
    this.status = 'late';
    await this.save();
    return true;
  }
  return false;
};

// Instance method to mark as absent
attendanceSchema.methods.markAbsent = async function(): Promise<boolean> {
  if (this.status === 'pending') {
    this.status = 'absent';
    await this.save();
    return true;
  }
  return false;
};

// Instance method to excuse absence
attendanceSchema.methods.excuse = async function(notes?: string): Promise<boolean> {
  if (this.status === 'absent' || this.status === 'pending') {
    this.status = 'excused';
    if (notes) {
      this.teacherNotes = notes;
    }
    await this.save();
    return true;
  }
  return false;
};

// Static method to get student's attendance records
attendanceSchema.statics.getByStudent = function(
  studentId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date,
  limit: number = 50,
  skip: number = 0
) {
  const query: any = { studentId };

  if (startDate || endDate) {
    query.sessionDate = {};
    if (startDate) query.sessionDate.$gte = startDate;
    if (endDate) query.sessionDate.$lte = endDate;
  }

  return this.find(query)
    .populate('teacherId', 'firstName lastName fullName')
    .populate('classId', 'title subjectId gradeLevelId')
    .populate('bookingId', 'title subjectId gradeLevelId')
    .populate('subjectId', 'name displayName color')
    .populate('gradeLevelId', 'displayName')
    .populate('markedBy', 'firstName lastName fullName')
    .sort({ sessionDate: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get class attendance
attendanceSchema.statics.getByClass = function(
  classId: mongoose.Types.ObjectId,
  sessionDate?: Date,
  limit: number = 100,
  skip: number = 0
) {
  const query: any = { classId };

  if (sessionDate) {
    // If specific date, get attendance for that session
    const startOfDay = new Date(sessionDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sessionDate);
    endOfDay.setHours(23, 59, 59, 999);
    query.sessionDate = { $gte: startOfDay, $lte: endOfDay };
  }

  return this.find(query)
    .populate('studentId', 'firstName lastName fullName')
    .populate('teacherId', 'firstName lastName fullName')
    .populate('markedBy', 'firstName lastName fullName')
    .sort({ sessionDate: -1, 'studentId.lastName': 1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get attendance statistics for a student
attendanceSchema.statics.getStudentStats = async function(
  studentId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  averageParticipationScore: number;
  averageUnderstandingLevel: number;
}> {
  const query: any = { studentId };

  if (startDate || endDate) {
    query.sessionDate = {};
    if (startDate) query.sessionDate.$gte = startDate;
    if (endDate) query.sessionDate.$lte = endDate;
  }

  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
        },
        lateCount: {
          $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
        },
        excusedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] }
        },
        totalParticipationScore: {
          $sum: { $ifNull: ['$participationScore', 0] }
        },
        participationScoreCount: {
          $sum: { $cond: [{ $ne: ['$participationScore', null] }, 1, 0] }
        },
        totalUnderstandingLevel: {
          $sum: { $ifNull: ['$understandingLevel', 0] }
        },
        understandingLevelCount: {
          $sum: { $cond: [{ $ne: ['$understandingLevel', null] }, 1, 0] }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      attendanceRate: 0,
      averageParticipationScore: 0,
      averageUnderstandingLevel: 0
    };
  }

  const result = stats[0];
  const attendedSessions = result.presentCount + result.lateCount + result.excusedCount;

  return {
    totalSessions: result.totalSessions,
    presentCount: result.presentCount,
    absentCount: result.absentCount,
    lateCount: result.lateCount,
    excusedCount: result.excusedCount,
    attendanceRate: result.totalSessions > 0 ? Math.round((attendedSessions / result.totalSessions) * 100) : 0,
    averageParticipationScore: result.participationScoreCount > 0
      ? Math.round((result.totalParticipationScore / result.participationScoreCount) * 100) / 100
      : 0,
    averageUnderstandingLevel: result.understandingLevelCount > 0
      ? Math.round((result.totalUnderstandingLevel / result.understandingLevelCount) * 100) / 100
      : 0
  };
};

// Static method to bulk mark attendance
attendanceSchema.statics.bulkMarkAttendance = async function(
  attendanceRecords: Array<{
    studentId: mongoose.Types.ObjectId;
    classId?: mongoose.Types.ObjectId;
    bookingId?: mongoose.Types.ObjectId;
    sessionDate: Date;
    status: AttendanceStatus;
    teacherId: mongoose.Types.ObjectId;
    markedBy: mongoose.Types.ObjectId;
    notes?: string;
  }>
): Promise<IAttendance[]> {
  const bulkOps = attendanceRecords.map(record => ({
    updateOne: {
      filter: {
        studentId: record.studentId,
        sessionDate: record.sessionDate,
        ...(record.classId && { classId: record.classId }),
        ...(record.bookingId && { bookingId: record.bookingId })
      },
      update: {
        ...record,
        isVerified: true
      },
      upsert: true,
      setDefaultsOnInsert: true
    }
  }));

  await this.bulkWrite(bulkOps);

  // Return the updated/created records
  const filters = attendanceRecords.map(record => ({
    studentId: record.studentId,
    sessionDate: record.sessionDate,
    ...(record.classId && { classId: record.classId }),
    ...(record.bookingId && { bookingId: record.bookingId })
  }));

  return await this.find({ $or: filters });
};

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
export default Attendance;
