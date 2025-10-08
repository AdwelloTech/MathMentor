import mongoose, { Document, Schema } from 'mongoose';

export type InstantSessionStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

export interface IInstantSession extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  tutorId?: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  
  // Session details
  status: InstantSessionStatus;
  durationMinutes: number; // Fixed at 15 minutes
  
  // Meeting information
  jitsiMeetingUrl?: string;
  tutorJoinedAt?: Date;
  studentJoinedAt?: Date;
  
  // Status tracking
  requestedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  expiredAt?: Date;
  
  // Cancellation info
  cancellationReason?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const instantSessionSchema = new Schema<IInstantSession>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true
    },
    
    // Session details
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'expired'],
      default: 'pending',
      index: true
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 15,
      min: 15,
      max: 15 // Fixed at 15 minutes
    },
    
    // Meeting information
    jitsiMeetingUrl: {
      type: String,
      trim: true
    },
    tutorJoinedAt: {
      type: Date
    },
    studentJoinedAt: {
      type: Date
    },
    
    // Status tracking
    requestedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    acceptedAt: {
      type: Date
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    expiredAt: {
      type: Date
    },
    
    // Cancellation info
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
instantSessionSchema.index({ status: 1, createdAt: -1 });
instantSessionSchema.index({ tutorId: 1, status: 1 });
instantSessionSchema.index({ studentId: 1, status: 1 });
instantSessionSchema.index({ status: 1, subjectId: 1 });
instantSessionSchema.index({ createdAt: 1 }); // For expiration cleanup

// Virtual for checking if session has expired (15 minutes after acceptance)
instantSessionSchema.virtual('isExpired').get(function() {
  if (this.acceptedAt && this.status === 'accepted') {
    const now = new Date();
    const expiryTime = new Date(this.acceptedAt.getTime() + (15 * 60 * 1000));
    return now > expiryTime;
  }
  return false;
});

// Virtual for checking if request is stale (pending for more than 5 minutes)
instantSessionSchema.virtual('isPendingStale').get(function() {
  if (this.status === 'pending') {
    const now = new Date();
    const staleTime = new Date(this.requestedAt.getTime() + (5 * 60 * 1000));
    return now > staleTime;
  }
  return false;
});

// Pre-save middleware
instantSessionSchema.pre('save', function(next) {
  // Set acceptedAt when status changes to accepted
  if (this.isModified('status') && this.status === 'accepted' && !this.acceptedAt) {
    this.acceptedAt = new Date();
    // Generate Jitsi meeting URL
    this.jitsiMeetingUrl = `https://meet.jit.si/MathMentor-instant_${this._id}`;
  }
  
  // Set startedAt when status changes to in_progress
  if (this.isModified('status') && this.status === 'in_progress' && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Set cancelledAt when status changes to cancelled
  if (this.isModified('status') && this.status === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  
  // Set expiredAt when status changes to expired
  if (this.isModified('status') && this.status === 'expired' && !this.expiredAt) {
    this.expiredAt = new Date();
  }
  
  next();
});

// Instance methods
instantSessionSchema.methods.accept = async function(tutorId: mongoose.Types.ObjectId): Promise<boolean> {
  if (this.status === 'pending') {
    this.status = 'accepted';
    this.tutorId = tutorId;
    await this.save();
    return true;
  }
  return false;
};

instantSessionSchema.methods.cancel = async function(userId: mongoose.Types.ObjectId, reason?: string): Promise<boolean> {
  if (this.status === 'pending' || this.status === 'accepted') {
    this.status = 'cancelled';
    this.cancelledBy = userId;
    if (reason) {
      this.cancellationReason = reason;
    }
    await this.save();
    return true;
  }
  return false;
};

instantSessionSchema.methods.markTutorJoined = async function(): Promise<boolean> {
  if (this.status === 'accepted' && !this.tutorJoinedAt) {
    this.tutorJoinedAt = new Date();
    await this.save();
    return true;
  }
  return false;
};

instantSessionSchema.methods.markStudentJoined = async function(): Promise<boolean> {
  if (this.status === 'accepted' && !this.studentJoinedAt) {
    this.studentJoinedAt = new Date();
    await this.save();
    return true;
  }
  return false;
};

instantSessionSchema.methods.startSession = async function(): Promise<boolean> {
  if (this.status === 'accepted') {
    this.status = 'in_progress';
    await this.save();
    return true;
  }
  return false;
};

instantSessionSchema.methods.complete = async function(): Promise<boolean> {
  if (this.status === 'in_progress' || this.status === 'accepted') {
    this.status = 'completed';
    await this.save();
    return true;
  }
  return false;
};

instantSessionSchema.methods.expire = async function(): Promise<boolean> {
  if (this.status === 'accepted' || this.status === 'in_progress') {
    this.status = 'expired';
    await this.save();
    return true;
  }
  return false;
};

// Static methods
instantSessionSchema.statics.getPendingRequests = function(
  subjectId?: mongoose.Types.ObjectId,
  limit: number = 20
) {
  const query: any = { status: 'pending' };
  
  if (subjectId) {
    query.subjectId = subjectId;
  }
  
  return this.find(query)
    .populate('studentId', 'fullName firstName lastName email')
    .populate('subjectId', 'name displayName color')
    .sort({ requestedAt: 1 })
    .limit(limit);
};

instantSessionSchema.statics.getByStudent = function(
  studentId: mongoose.Types.ObjectId,
  limit: number = 10
) {
  return this.find({ studentId })
    .populate('tutorId', 'fullName firstName lastName email')
    .populate('subjectId', 'name displayName color')
    .sort({ createdAt: -1 })
    .limit(limit);
};

instantSessionSchema.statics.getByTutor = function(
  tutorId: mongoose.Types.ObjectId,
  limit: number = 10
) {
  return this.find({ tutorId })
    .populate('studentId', 'fullName firstName lastName email')
    .populate('subjectId', 'name displayName color')
    .sort({ createdAt: -1 })
    .limit(limit);
};

instantSessionSchema.statics.cleanupStaleRequests = async function(): Promise<number> {
  // Cancel requests that have been pending for more than 5 minutes
  const staleTime = new Date(Date.now() - (5 * 60 * 1000));
  
  const result = await this.updateMany(
    {
      status: 'pending',
      requestedAt: { $lt: staleTime }
    },
    {
      $set: {
        status: 'expired',
        expiredAt: new Date()
      }
    }
  );
  
  return result.modifiedCount || 0;
};

instantSessionSchema.statics.expireOldSessions = async function(): Promise<number> {
  // Expire accepted sessions that have exceeded 15 minutes
  const expiryTime = new Date(Date.now() - (15 * 60 * 1000));
  
  const result = await this.updateMany(
    {
      status: { $in: ['accepted', 'in_progress'] },
      acceptedAt: { $lt: expiryTime }
    },
    {
      $set: {
        status: 'expired',
        expiredAt: new Date()
      }
    }
  );
  
  return result.modifiedCount || 0;
};

export const InstantSession = mongoose.model<IInstantSession>('InstantSession', instantSessionSchema);
export default InstantSession;




