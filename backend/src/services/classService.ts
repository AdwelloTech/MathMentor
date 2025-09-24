import mongoose from 'mongoose';
import { Class, IClass } from '../models/Class';
import { User } from '../models/User';

export interface CreateClassData {
  title: string;
  description?: string;
  subjectId: mongoose.Types.ObjectId;
  gradeLevelId: mongoose.Types.ObjectId;
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    duration: number;
  };
  startDate: Date;
  endDate?: Date;
  capacity: number;
  price?: number;
  currency?: string;
  prerequisites?: string[];
  materials?: string[];
  meetingLink?: string;
  roomNumber?: string;
  location?: string;
}

export interface UpdateClassData {
  title?: string;
  description?: string;
  subjectId?: mongoose.Types.ObjectId;
  gradeLevelId?: mongoose.Types.ObjectId;
  schedule?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    duration: number;
  };
  startDate?: Date;
  endDate?: Date;
  capacity?: number;
  price?: number;
  currency?: string;
  isActive?: boolean;
  prerequisites?: string[];
  materials?: string[];
  meetingLink?: string;
  roomNumber?: string;
  location?: string;
}

export interface ClassFilters {
  teacherId?: string;
  subjectId?: string;
  gradeLevelId?: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  dayOfWeek?: number;
  limit?: number;
  skip?: number;
}

export interface AvailableClassFilters {
  subjectId?: string;
  gradeLevelId?: string;
  teacherId?: string;
  dayOfWeek?: number;
  startDate?: Date;
  endDate?: Date;
  priceMin?: number;
  priceMax?: number;
  limit?: number;
  skip?: number;
}

export class ClassService {
  /**
   * Create a new class
   */
  static async createClass(teacherId: string, classData: CreateClassData): Promise<IClass> {
    // Verify teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Create the class
    const newClass = new Class({
      ...classData,
      teacherId: new mongoose.Types.ObjectId(teacherId),
      enrolledCount: 0,
      isActive: true,
      isFull: false,
    });

    return await newClass.save();
  }

  /**
   * Get class by ID with populated references
   */
  static async getClassById(classId: string): Promise<IClass | null> {
    return await Class.findById(classId)
      .populate('teacherId', 'firstName lastName fullName email')
      .populate('subjectId', 'name displayName color')
      .populate('gradeLevelId', 'displayName');
  }

  /**
   * Get classes by teacher
   */
  static async getClassesByTeacher(
    teacherId: string,
    filters: ClassFilters = {}
  ): Promise<IClass[]> {
    const query: any = { teacherId: new mongoose.Types.ObjectId(teacherId) };

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.subjectId) {
      query.subjectId = new mongoose.Types.ObjectId(filters.subjectId);
    }

    if (filters.gradeLevelId) {
      query.gradeLevelId = new mongoose.Types.ObjectId(filters.gradeLevelId);
    }

    if (filters.startDate || filters.endDate) {
      query.startDate = {};
      if (filters.startDate) {
        query.startDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.startDate.$lte = filters.endDate;
      }
    }

    if (filters.dayOfWeek !== undefined) {
      query['schedule.dayOfWeek'] = filters.dayOfWeek;
    }

    return await Class.find(query)
      .populate('subjectId', 'name displayName color')
      .populate('gradeLevelId', 'displayName')
      .sort({ 'schedule.dayOfWeek': 1, 'schedule.startTime': 1 })
      .limit(filters.limit || 50)
      .skip(filters.skip || 0);
  }

  /**
   * Get available classes for students (similar to tutor_classes in Supabase)
   */
  static async getAvailableClasses(filters: AvailableClassFilters = {}): Promise<any[]> {
    const query: any = {
      isActive: true,
      isFull: false,
    };

    // Add capacity filter - only show classes with available spots
    query.$expr = { $lt: ['$enrolledCount', '$capacity'] };

    if (filters.teacherId) {
      query.teacherId = new mongoose.Types.ObjectId(filters.teacherId);
    }

    if (filters.subjectId) {
      query.subjectId = new mongoose.Types.ObjectId(filters.subjectId);
    }

    if (filters.gradeLevelId) {
      query.gradeLevelId = new mongoose.Types.ObjectId(filters.gradeLevelId);
    }

    if (filters.dayOfWeek !== undefined) {
      query['schedule.dayOfWeek'] = filters.dayOfWeek;
    }

    // Date range filter - only show upcoming classes
    const now = new Date();
    query.startDate = { $gte: now };
    if (!query.$or) {
      query.$or = [];
    }
    query.$or.push(
      { endDate: { $exists: false } },
      { endDate: { $gte: now } }
    );

    // Price filters
    if (filters.priceMin !== undefined) {
      query.price = { ...query.price, $gte: filters.priceMin };
    }
    if (filters.priceMax !== undefined) {
      query.price = { ...query.price, $lte: filters.priceMax };
    }

    const classes = await Class.find(query)
      .populate('teacherId', 'firstName lastName fullName email')
      .populate('subjectId', 'name displayName color')
      .populate('gradeLevelId', 'displayName')
      .sort({ startDate: 1 })
      .limit(filters.limit || 50)
      .skip(filters.skip || 0)
      .lean();

    // Transform to match frontend expectations
    return classes.map(classRecord => {
      // Format startDate to date-only string for frontend compatibility
      const startDateOnly = classRecord.startDate ? new Date(classRecord.startDate).toISOString().split('T')[0] : undefined;

      // Create a clean class object with populated fields renamed
      const cleanClass = {
        ...classRecord,
        startDate: startDateOnly,
        teacherId_populated: classRecord.teacherId,
        subjectId_populated: classRecord.subjectId,
        gradeLevelId_populated: classRecord.gradeLevelId,
        teacherId: typeof classRecord.teacherId === 'object' ? classRecord.teacherId._id : classRecord.teacherId,
        subjectId: typeof classRecord.subjectId === 'object' ? classRecord.subjectId._id : classRecord.subjectId,
        gradeLevelId: typeof classRecord.gradeLevelId === 'object' ? classRecord.gradeLevelId._id : classRecord.gradeLevelId,
      };

      return {
        class: cleanClass,
        tutor: {
          id: cleanClass.teacherId,
          full_name: (cleanClass.teacherId_populated as any)?.fullName || 'Unknown Tutor',
          rating: 4.5, // Mock rating
          total_reviews: 10, // Mock reviews
          subjects: [] // Mock subjects
        },
        available_slots: classRecord.capacity - classRecord.enrolledCount,
        is_bookable: !classRecord.isFull && classRecord.enrolledCount < classRecord.capacity
      };
    });
  }

  /**
   * Update class
   */
  static async updateClass(
    classId: string,
    teacherId: string,
    updates: UpdateClassData
  ): Promise<IClass> {
    const classDoc = await Class.findOne({
      _id: new mongoose.Types.ObjectId(classId),
      teacherId: new mongoose.Types.ObjectId(teacherId),
    });

    if (!classDoc) {
      throw new Error('Class not found or access denied');
    }

    // Update fields
    Object.assign(classDoc, updates);

    // Update isFull status if capacity or enrolledCount changed
    if (updates.capacity || updates.hasOwnProperty('enrolledCount')) {
      classDoc.isFull = classDoc.enrolledCount >= classDoc.capacity;
    }

    return await classDoc.save();
  }

  /**
   * Delete class
   */
  static async deleteClass(classId: string, teacherId: string): Promise<void> {
    const result = await Class.deleteOne({
      _id: new mongoose.Types.ObjectId(classId),
      teacherId: new mongoose.Types.ObjectId(teacherId),
    });

    if (result.deletedCount === 0) {
      throw new Error('Class not found or access denied');
    }
  }

  /**
   * Enroll student in class
   */
  static async enrollStudent(classId: string, studentId: string): Promise<IClass> {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      throw new Error('Class not found');
    }

    if (classDoc.isFull || classDoc.enrolledCount >= classDoc.capacity) {
      throw new Error('Class is full');
    }

    classDoc.enrolledCount += 1;
    classDoc.isFull = classDoc.enrolledCount >= classDoc.capacity;

    return await classDoc.save();
  }

  /**
   * Unenroll student from class
   */
  static async unenrollStudent(classId: string, studentId: string): Promise<IClass> {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      throw new Error('Class not found');
    }

    if (classDoc.enrolledCount > 0) {
      classDoc.enrolledCount -= 1;
      classDoc.isFull = false; // Reset isFull since we now have space
    }

    return await classDoc.save();
  }

  /**
   * Get class statistics
   */
  static async getClassStats(classId: string, teacherId: string): Promise<any> {
    const classDoc = await Class.findOne({
      _id: new mongoose.Types.ObjectId(classId),
      teacherId: new mongoose.Types.ObjectId(teacherId),
    });

    if (!classDoc) {
      throw new Error('Class not found or access denied');
    }

    return {
      id: classDoc._id,
      title: classDoc.title,
      capacity: classDoc.capacity,
      enrolledCount: classDoc.enrolledCount,
      availableSpots: Math.max(0, classDoc.capacity - classDoc.enrolledCount),
      isFull: classDoc.isFull,
      isActive: classDoc.isActive,
    };
  }
}
