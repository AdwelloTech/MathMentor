import mongoose from 'mongoose';
import { Booking, IBooking, BookingStatus, BookingType } from '../models/Booking';
import { Class } from '../models/Class';
import { User } from '../models/User';
import { ClassService } from './classService';

export interface CreateBookingData {
  classId?: string;
  bookingType: BookingType;
  title: string;
  description?: string;
  subjectId?: mongoose.Types.ObjectId;
  gradeLevelId?: mongoose.Types.ObjectId;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  price?: number;
  currency?: string;
  notes?: string;
  specialRequirements?: string;
  meetingLink?: string;
  roomNumber?: string;
  location?: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  bookingType?: BookingType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

export interface UpdateBookingData {
  status?: BookingStatus;
  title?: string;
  description?: string;
  scheduledDate?: Date;
  startTime?: string;
  endTime?: string;
  duration?: number;
  price?: number;
  currency?: string;
  notes?: string;
  specialRequirements?: string;
  meetingLink?: string;
  roomNumber?: string;
  location?: string;
}

export class BookingService {
  /**
   * Create a new booking
   */
  static async createBooking(
    studentId: string,
    bookingData: CreateBookingData & { paymentId?: string; paymentStatus?: string }
  ): Promise<IBooking> {
    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // If this is a class booking, verify the class exists and has capacity
    let teacherId: mongoose.Types.ObjectId | undefined;
    if (bookingData.classId) {
      const classDoc = await Class.findById(bookingData.classId);
      if (!classDoc) {
        throw new Error('Class not found');
      }

      if (classDoc.isFull || classDoc.enrolledCount >= classDoc.capacity) {
        throw new Error('Class is full');
      }

      teacherId = classDoc.teacherId;

      // Enroll student in class
      await ClassService.enrollStudent(bookingData.classId, studentId);
    }

    // Create the booking
    const newBooking = new Booking({
      ...bookingData,
      studentId: new mongoose.Types.ObjectId(studentId),
      teacherId,
      classId: bookingData.classId ? new mongoose.Types.ObjectId(bookingData.classId) : undefined,
      subjectId: bookingData.subjectId,
      gradeLevelId: bookingData.gradeLevelId,
      status: 'pending',
      isConfirmed: false,
      paymentStatus: bookingData.paymentStatus || 'pending',
      paymentId: bookingData.paymentId,
      createdBy: new mongoose.Types.ObjectId(studentId),
    });

    return await newBooking.save();
  }

  /**
   * Get booking by ID with populated references
   */
  static async getBookingById(bookingId: string, userId?: string): Promise<IBooking | null> {
    const query: any = { _id: new mongoose.Types.ObjectId(bookingId) };

    // If userId provided, ensure user can access this booking
    if (userId) {
      query.$or = [
        { studentId: new mongoose.Types.ObjectId(userId) },
        { teacherId: new mongoose.Types.ObjectId(userId) },
        { createdBy: new mongoose.Types.ObjectId(userId) },
      ];
    }

    return await Booking.findOne(query)
      .populate('studentId', 'firstName lastName fullName email')
      .populate('teacherId', 'firstName lastName fullName email')
      .populate('classId', 'title subjectId gradeLevelId schedule meetingLink jitsiRoomName jitsiPassword teacherId startDate endDate capacity enrolledCount price currency isActive isFull status')
      .populate('subjectId', 'name displayName color')
      .populate('gradeLevelId', 'displayName')
      .populate('createdBy', 'firstName lastName fullName');
  }

  /**
   * Get bookings by student
   */
  static async getBookingsByStudent(
    studentId: string,
    filters: BookingFilters = {}
  ): Promise<IBooking[]> {
    const query: any = { studentId: new mongoose.Types.ObjectId(studentId) };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.bookingType) {
      query.bookingType = filters.bookingType;
    }

    if (filters.startDate || filters.endDate) {
      query.scheduledDate = {};
      if (filters.startDate) {
        query.scheduledDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.scheduledDate.$lte = filters.endDate;
      }
    }

    return await Booking.find(query)
      .populate('teacherId', 'firstName lastName fullName email')
      .populate('classId', 'title subjectId gradeLevelId schedule meetingLink jitsiRoomName jitsiPassword teacherId startDate endDate capacity enrolledCount price currency isActive isFull status')
      .populate('subjectId', 'name displayName color')
      .populate('gradeLevelId', 'displayName')
      .sort({ scheduledDate: -1, startTime: -1 })
      .limit(filters.limit || 20)
      .skip(filters.skip || 0);
  }

  /**
   * Get bookings by teacher
   */
  static async getBookingsByTeacher(
    teacherId: string,
    filters: BookingFilters = {}
  ): Promise<IBooking[]> {
    const query: any = { teacherId: new mongoose.Types.ObjectId(teacherId) };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.bookingType) {
      query.bookingType = filters.bookingType;
    }

    if (filters.startDate || filters.endDate) {
      query.scheduledDate = {};
      if (filters.startDate) {
        query.scheduledDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.scheduledDate.$lte = filters.endDate;
      }
    }

    return await Booking.find(query)
      .populate('studentId', 'firstName lastName fullName email')
      .populate('classId', 'title subjectId gradeLevelId schedule meetingLink jitsiRoomName jitsiPassword teacherId startDate endDate capacity enrolledCount price currency isActive isFull status')
      .populate('subjectId', 'name displayName color')
      .populate('gradeLevelId', 'displayName')
      .sort({ scheduledDate: -1, startTime: -1 })
      .limit(filters.limit || 20)
      .skip(filters.skip || 0);
  }

  /**
   * Update booking
   */
  static async updateBooking(
    bookingId: string,
    userId: string,
    updates: UpdateBookingData
  ): Promise<IBooking> {
    const booking = await Booking.findOne({
      _id: new mongoose.Types.ObjectId(bookingId),
      $or: [
        { studentId: new mongoose.Types.ObjectId(userId) },
        { teacherId: new mongoose.Types.ObjectId(userId) },
        { createdBy: new mongoose.Types.ObjectId(userId) },
      ],
    });

    if (!booking) {
      throw new Error('Booking not found or access denied');
    }

    // Update fields
    Object.assign(booking, updates);

    // Set confirmation timestamps
    if (updates.status === 'confirmed' && !booking.confirmedAt) {
      booking.isConfirmed = true;
      booking.confirmedAt = new Date();
    }

    if (updates.status === 'cancelled' && !booking.cancelledAt) {
      booking.cancelledAt = new Date();
    }

    return await booking.save();
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(bookingId: string, userId: string, reason?: string): Promise<IBooking> {
    const booking = await Booking.findOne({
      _id: new mongoose.Types.ObjectId(bookingId),
      $or: [
        { studentId: new mongoose.Types.ObjectId(userId) },
        { teacherId: new mongoose.Types.ObjectId(userId) },
        { createdBy: new mongoose.Types.ObjectId(userId) },
      ],
    });

    if (!booking) {
      throw new Error('Booking not found or access denied');
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      throw new Error('Cannot cancel booking with current status');
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    if (reason) {
      booking.cancellationReason = reason;
    }

    // If this is a class booking, unenroll the student
    if (booking.classId) {
      await ClassService.unenrollStudent(booking.classId.toString(), userId);
    }

    return await booking.save();
  }

  /**
   * Confirm booking
   */
  static async confirmBooking(bookingId: string, userId: string): Promise<IBooking> {
    const booking = await Booking.findOne({
      _id: new mongoose.Types.ObjectId(bookingId),
      teacherId: new mongoose.Types.ObjectId(userId),
    });

    if (!booking) {
      throw new Error('Booking not found or access denied');
    }

    if (booking.status !== 'pending') {
      throw new Error('Can only confirm pending bookings');
    }

    booking.status = 'confirmed';
    booking.isConfirmed = true;
    booking.confirmedAt = new Date();

    return await booking.save();
  }

  /**
   * Complete booking
   */
  static async completeBooking(bookingId: string, userId: string): Promise<IBooking> {
    const booking = await Booking.findOne({
      _id: new mongoose.Types.ObjectId(bookingId),
      $or: [
        { studentId: new mongoose.Types.ObjectId(userId) },
        { teacherId: new mongoose.Types.ObjectId(userId) },
      ],
    });

    if (!booking) {
      throw new Error('Booking not found or access denied');
    }

    if (booking.status !== 'confirmed') {
      throw new Error('Can only complete confirmed bookings');
    }

    booking.status = 'completed';

    return await booking.save();
  }

  /**
   * Get booking statistics for a user
   */
  static async getBookingStats(userId: string, userRole: 'student' | 'tutor'): Promise<any> {
    const query: any = {};

    if (userRole === 'student') {
      query.studentId = new mongoose.Types.ObjectId(userId);
    } else {
      query.teacherId = new mongoose.Types.ObjectId(userId);
    }

    const bookings = await Booking.find(query);

    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      noShow: bookings.filter(b => b.status === 'no_show').length,
    };

    return stats;
  }

  /**
   * Check for scheduling conflicts
   */
  static async checkConflict(
    teacherId: string,
    scheduledDate: Date,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    const query: any = {
      teacherId: new mongoose.Types.ObjectId(teacherId),
      scheduledDate: scheduledDate.toISOString().split('T')[0], // Compare date part only
      status: { $in: ['confirmed', 'pending'] },
      $and: [
        { startTime: { $lt: endTime } },
        { endTime: { $gt: startTime } }
      ]
    };

    if (excludeBookingId) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeBookingId) };
    }

    const conflict = await Booking.findOne(query);
    return !!conflict;
  }
}
