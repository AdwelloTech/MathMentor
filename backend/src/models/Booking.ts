import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type BookingType = 'class' | 'session' | 'consultation';

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  bookingType: BookingType;
  title: string;
  description?: string;
  subjectId?: mongoose.Types.ObjectId;
  gradeLevelId?: mongoose.Types.ObjectId;

  // Scheduling
  scheduledDate: Date;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  duration: number; // in minutes

  // Status and lifecycle
  status: BookingStatus;
  isConfirmed: boolean;
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;

  // Payment
  price?: number;
  currency?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'cancelled';
  paymentId?: string;

  // Communication
  notes?: string;
  specialRequirements?: string;
  meetingLink?: string;
  roomNumber?: string;
  location?: string;

  // Tracking
  createdBy: mongoose.Types.ObjectId; // Who created the booking
  createdAt: Date;
  updatedAt: Date;
}

// Booking schema
const bookingSchema = new Schema<IBooking>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class'
    },
    bookingType: {
      type: String,
      required: true,
      enum: ['class', 'session', 'consultation'],
      default: 'session'
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
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject'
    },
    gradeLevelId: {
      type: Schema.Types.ObjectId,
      ref: 'GradeLevel'
    },

    // Scheduling
    scheduledDate: {
      type: Date,
      required: true
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
    },

    // Status and lifecycle
    status: {
      type: String,
      required: true,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
      default: 'pending'
    },
    isConfirmed: {
      type: Boolean,
      default: false
    },
    confirmedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 300
    },

    // Payment
    price: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'refunded', 'cancelled'],
      default: 'pending'
    },
    paymentId: {
      type: String,
      trim: true
    },

    // Communication
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    specialRequirements: {
      type: String,
      trim: true,
      maxlength: 500
    },
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
    },

    // Tracking
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
bookingSchema.index({ studentId: 1, status: 1 });
bookingSchema.index({ teacherId: 1, status: 1 });
bookingSchema.index({ classId: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1, startTime: 1 });
bookingSchema.index({ status: 1, scheduledDate: 1 });
bookingSchema.index({ bookingType: 1, status: 1 });
bookingSchema.index({ createdAt: -1 });

// Compound index for preventing double bookings
bookingSchema.index({
  teacherId: 1,
  scheduledDate: 1,
  startTime: 1,
  endTime: 1,
  status: 1
}, {
  unique: false, // Allow multiple pending bookings
  partialFilterExpression: { status: { $in: ['confirmed', 'pending'] } }
});

// Virtual for formatted date and time
bookingSchema.virtual('formattedDateTime').get(function() {
  const date = this.scheduledDate.toLocaleDateString();
  return `${date} ${this.startTime} - ${this.endTime}`;
});

// Virtual for checking if booking is in the past
bookingSchema.virtual('isPast').get(function() {
  const now = new Date();
  const bookingDateTime = new Date(this.scheduledDate);
  const [hours, minutes] = this.endTime.split(':').map(Number);
  bookingDateTime.setHours(hours, minutes, 0, 0);
  return bookingDateTime < now;
});

// Virtual for checking if booking is upcoming
bookingSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  const bookingDateTime = new Date(this.scheduledDate);
  const [hours, minutes] = this.startTime.split(':').map(Number);
  bookingDateTime.setHours(hours, minutes, 0, 0);
  return bookingDateTime > now;
});

// Pre-save middleware to set confirmedAt when status changes to confirmed
bookingSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'confirmed' && !this.confirmedAt) {
    this.confirmedAt = new Date();
    this.isConfirmed = true;
  }

  if (this.isModified('status') && this.status === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }

  next();
});

// Instance method to confirm booking
bookingSchema.methods.confirm = async function(): Promise<boolean> {
  if (this.status === 'pending') {
    this.status = 'confirmed';
    this.isConfirmed = true;
    this.confirmedAt = new Date();
    await this.save();
    return true;
  }
  return false;
};

// Instance method to cancel booking
bookingSchema.methods.cancel = async function(reason?: string): Promise<boolean> {
  if (this.status === 'pending' || this.status === 'confirmed') {
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    if (reason) {
      this.cancellationReason = reason;
    }
    await this.save();
    return true;
  }
  return false;
};

// Instance method to complete booking
bookingSchema.methods.complete = async function(): Promise<boolean> {
  if (this.status === 'confirmed') {
    this.status = 'completed';
    await this.save();
    return true;
  }
  return false;
};

// Instance method to mark as no-show
bookingSchema.methods.markNoShow = async function(): Promise<boolean> {
  if (this.status === 'confirmed') {
    this.status = 'no_show';
    await this.save();
    return true;
  }
  return false;
};

// Static method to get student's bookings
bookingSchema.statics.getByStudent = function(
  studentId: mongoose.Types.ObjectId,
  status?: BookingStatus,
  limit: number = 20,
  skip: number = 0
) {
  const query: any = { studentId };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('teacherId', 'firstName lastName fullName')
    .populate('classId', 'title subjectId gradeLevelId')
    .populate('subjectId', 'name displayName color')
    .populate('gradeLevelId', 'displayName')
    .sort({ scheduledDate: -1, startTime: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get teacher's bookings
bookingSchema.statics.getByTeacher = function(
  teacherId: mongoose.Types.ObjectId,
  status?: BookingStatus,
  limit: number = 20,
  skip: number = 0
) {
  const query: any = { teacherId };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate('studentId', 'firstName lastName fullName')
    .populate('classId', 'title subjectId gradeLevelId')
    .populate('subjectId', 'name displayName color')
    .populate('gradeLevelId', 'displayName')
    .sort({ scheduledDate: -1, startTime: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to check for scheduling conflicts
bookingSchema.statics.checkConflict = async function(
  teacherId: mongoose.Types.ObjectId,
  scheduledDate: Date,
  startTime: string,
  endTime: string,
  excludeBookingId?: mongoose.Types.ObjectId
): Promise<boolean> {
  const query: any = {
    teacherId,
    scheduledDate: scheduledDate.toISOString().split('T')[0], // Compare date part only
    status: { $in: ['confirmed', 'pending'] },
    $or: [
      {
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } }
        ]
      }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await this.findOne(query);
  return !!conflict;
};

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;
