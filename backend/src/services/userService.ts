import { User, IUser } from '../models/User';
import { ProfileImageService } from './profileImageService';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';
const DB_NAME = process.env.DB_NAME || 'mathmentor';

export class UserService {
  private static getClient(): MongoClient {
    return new MongoClient(MONGODB_URI);
  }

  // Get all students for admin management
  static async getAllStudents(): Promise<any[]> {
    try {
      const students = await User.find({ role: 'student' })
        .select('-password') // Exclude password field
        .sort({ createdAt: -1 });

      // Transform the data to match frontend expectations
      return students.map(student => ({
        id: student._id.toString(),
        full_name: student.fullName,
        email: student.email,
        student_id: student.studentId || '',
        student_code: student.studentCode || '',
        package: student.package || 'free',
        is_active: student.isActive,
        last_login: student.lastLogin?.toISOString() || null,
        first_name: student.firstName,
        last_name: student.lastName,
        profile_image_url: student.profileImageUrl,
        phone: student.phone,
        date_of_birth: student.dateOfBirth?.toISOString(),
        gender: student.gender,
        age: student.age,
        emergency_contact: student.emergencyContact,
        city: student.city,
        postcode: student.postcode,
        address: student.address,
        school_name: student.schoolName,
        parent_name: student.parentName,
        parent_phone: student.parentPhone,
        parent_email: student.parentEmail,
        current_grade: student.currentGrade,
        academic_set: student.academicSet,
        has_learning_disabilities: student.hasLearningDisabilities,
        learning_needs_description: student.learningNeedsDescription,
        subscription_status: 'active', // Default for now
        subscription_start_date: student.enrollmentDate?.toISOString(),
        subscription_end_date: null, // Not implemented yet
        created_at: student.createdAt.toISOString(),
        updated_at: student.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      throw new Error('Failed to fetch students');
    }
  }

  // Get student statistics
  static async getStudentStats(): Promise<{
    total: number;
    active: number;
    byPackage: Record<string, number>;
    recentRegistrations: number;
  }> {
    try {
      const students = await User.find({ role: 'student' });

      const byPackage: Record<string, number> = {};

      // Count students by package
      students.forEach(student => {
        const pkg = student.package || 'free';
        byPackage[pkg] = (byPackage[pkg] || 0) + 1;
      });

      // Count recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRegistrations = students.filter(
        student => student.createdAt > thirtyDaysAgo
      ).length;

      return {
        total: students.length,
        active: students.filter(s => s.isActive).length,
        byPackage,
        recentRegistrations,
      };
    } catch (error) {
      console.error('Error getting student stats:', error);
      throw new Error('Failed to get student stats');
    }
  }

  // Get student by ID
  static async getStudentById(studentId: string): Promise<any | null> {
    try {
      const student = await User.findOne({
        _id: studentId,
        role: 'student'
      }).select('-password');

      if (!student) return null;

      // Transform the data to match frontend expectations
      return {
        id: student._id.toString(),
        full_name: student.fullName,
        email: student.email,
        student_id: student.studentId || '',
        package: student.package || 'free',
        is_active: student.isActive,
        last_login: student.lastLogin?.toISOString() || null,
        first_name: student.firstName,
        last_name: student.lastName,
        profile_image_url: student.profileImageUrl,
        phone: student.phone,
        date_of_birth: student.dateOfBirth?.toISOString(),
        gender: student.gender,
        age: student.age,
        emergency_contact: student.emergencyContact,
        city: student.city,
        postcode: student.postcode,
        address: student.address,
        school_name: student.schoolName,
        parent_name: student.parentName,
        parent_phone: student.parentPhone,
        parent_email: student.parentEmail,
        current_grade: student.currentGrade,
        academic_set: student.academicSet,
        has_learning_disabilities: student.hasLearningDisabilities,
        learning_needs_description: student.learningNeedsDescription,
        subscription_status: 'active', // Default for now
        subscription_start_date: student.enrollmentDate?.toISOString(),
        subscription_end_date: null, // Not implemented yet
        created_at: student.createdAt.toISOString(),
        updated_at: student.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('Error fetching student by ID:', error);
      throw new Error('Failed to fetch student');
    }
  }

  // Update student
  static async updateStudent(studentId: string, updates: any): Promise<any> {
    try {
      const normalizedUpdates: any = {
        ...updates,
        ...(updates && typeof updates === 'object' && 'profile_image_url' in updates
          ? { profileImageUrl: updates.profile_image_url }
          : {}),
        ...(updates && typeof updates === 'object' && 'avatar_url' in updates
          ? { avatarUrl: updates.avatar_url }
          : {}),
      };

      // Remove snake_case fields so we don't persist unknown keys
      delete (normalizedUpdates as any).profile_image_url;
      delete (normalizedUpdates as any).avatar_url;

      const profileImageRemovalRequested = (
        ('profileImageUrl' in normalizedUpdates && (normalizedUpdates.profileImageUrl === null || normalizedUpdates.profileImageUrl === '')) ||
        ('avatarUrl' in normalizedUpdates && (normalizedUpdates.avatarUrl === null || normalizedUpdates.avatarUrl === ''))
      );

      if (profileImageRemovalRequested) {
        normalizedUpdates.profileImageUrl = null;
        normalizedUpdates.avatarUrl = null;
        normalizedUpdates.profileImageId = null;
      }

      const student = await User.findOneAndUpdate(
        { _id: studentId, role: 'student' },
        normalizedUpdates,
        { new: true }
      ).select('-password');

      if (!student) {
        throw new Error('Student not found');
      }

      if (profileImageRemovalRequested) {
        await ProfileImageService.clearProfileImages(studentId);
      }

      // Transform the data to match frontend expectations
      return {
        id: student._id.toString(),
        full_name: student.fullName,
        email: student.email,
        student_id: student.studentId || '',
        package: student.package || 'free',
        is_active: student.isActive,
        last_login: student.lastLogin?.toISOString() || null,
        first_name: student.firstName,
        last_name: student.lastName,
        profile_image_url: student.profileImageUrl,
        phone: student.phone,
        date_of_birth: student.dateOfBirth?.toISOString(),
        gender: student.gender,
        age: student.age,
        emergency_contact: student.emergencyContact,
        city: student.city,
        postcode: student.postcode,
        address: student.address,
        school_name: student.schoolName,
        parent_name: student.parentName,
        parent_phone: student.parentPhone,
        parent_email: student.parentEmail,
        current_grade: student.currentGrade,
        academic_set: student.academicSet,
        has_learning_disabilities: student.hasLearningDisabilities,
        learning_needs_description: student.learningNeedsDescription,
        subscription_status: 'active', // Default for now
        subscription_start_date: student.enrollmentDate?.toISOString(),
        subscription_end_date: null, // Not implemented yet
        created_at: student.createdAt.toISOString(),
        updated_at: student.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('Error updating student:', error);
      throw new Error('Failed to update student');
    }
  }

  // Delete student with all related data
  static async deleteStudent(studentId: string): Promise<void> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      // Get the user first to verify it exists and get details
      const user = await User.findOne({ _id: studentId, role: 'student' });
      if (!user) {
        throw new Error('Student not found');
      }

      console.log(`Deleting student: ${user.email} (${user._id})`);

      // Delete all related data
      await this.deleteUserRelatedData(db, user._id.toString());

      // Finally delete the user account
      const deleteResult = await User.findOneAndDelete({ _id: studentId, role: 'student' });
      if (!deleteResult) {
        throw new Error('Failed to delete student account');
      }

      console.log(`Successfully deleted student: ${user.email}`);

    } catch (error) {
      console.error('Error deleting student:', error);
      throw new Error('Failed to delete student');
    } finally {
      await client.close();
    }
  }

  // Comprehensive user deletion with all related data
  static async deleteUser(userId: string): Promise<void> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      // Get the user first to verify it exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      console.log(`Deleting user: ${user.email} (${user.role}) - ID: ${user._id}`);

      // Delete all related data
      await this.deleteUserRelatedData(db, user._id.toString());

      // Finally delete the user account
      const deleteResult = await User.findByIdAndDelete(userId);
      if (!deleteResult) {
        throw new Error('Failed to delete user account');
      }

      console.log(`Successfully deleted user: ${user.email}`);

    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    } finally {
      await client.close();
    }
  }

  // Delete all data related to a user
  private static async deleteUserRelatedData(db: any, userId: string): Promise<void> {
    console.log(`Deleting related data for user: ${userId}`);

    // Delete profile
    const profileDeleted = await db.collection('profiles').deleteMany({ user_id: userId });
    console.log(`  ✅ Deleted ${profileDeleted.deletedCount} profiles`);

    // Delete refresh tokens
    const tokensDeleted = await db.collection('refresh_tokens').deleteMany({ userId: new ObjectId(userId) });
    console.log(`  ✅ Deleted ${tokensDeleted.deletedCount} refresh tokens`);

    // Delete tutor applications
    const appsDeleted = await db.collection('tutor_applications').deleteMany({ user_id: userId });
    console.log(`  ✅ Deleted ${appsDeleted.deletedCount} tutor applications`);

    // Delete ID verifications
    const verificationsDeleted = await db.collection('id_verifications').deleteMany({ user_id: userId });
    console.log(`  ✅ Deleted ${verificationsDeleted.deletedCount} ID verifications`);

    // Delete OTP records
    const otpsDeleted = await db.collection('otps').deleteMany({ email: { $exists: true } });
    // We can't filter by user ID for OTPs since they use email, so we'll clean up old ones
    console.log(`  ✅ Cleaned up OTP records`);

    // Delete bookings (as student or tutor)
    const bookingsDeleted = await db.collection('bookings').deleteMany({
      $or: [
        { student_id: new ObjectId(userId) },
        { tutor_id: new ObjectId(userId) }
      ]
    });
    console.log(`  ✅ Deleted ${bookingsDeleted.deletedCount} bookings`);

    // Delete instant sessions (as student or tutor)
    const sessionsDeleted = await db.collection('instant_sessions').deleteMany({
      $or: [
        { student_id: new ObjectId(userId) },
        { tutor_id: new ObjectId(userId) }
      ]
    });
    console.log(`  ✅ Deleted ${sessionsDeleted.deletedCount} instant sessions`);

    // Delete ratings (given or received)
    const ratingsDeleted = await db.collection('ratings').deleteMany({
      $or: [
        { from_user_id: new ObjectId(userId) },
        { to_user_id: new ObjectId(userId) }
      ]
    });
    console.log(`  ✅ Deleted ${ratingsDeleted.deletedCount} ratings`);

    // Delete flashcards and sets
    const flashcardSets = await db.collection('flashcard_sets').find({ user_id: new ObjectId(userId) }).toArray();
    const setIds = flashcardSets.map((set: any) => set._id);

    const setsDeleted = await db.collection('flashcard_sets').deleteMany({ user_id: new ObjectId(userId) });
    const cardsDeleted = await db.collection('flashcards').deleteMany({ set_id: { $in: setIds } });
    console.log(`  ✅ Deleted ${setsDeleted.deletedCount} flashcard sets and ${cardsDeleted.deletedCount} flashcards`);

    // Delete quizzes
    const quizzesDeleted = await db.collection('quizzes').deleteMany({ created_by: new ObjectId(userId) });
    console.log(`  ✅ Deleted ${quizzesDeleted.deletedCount} quizzes`);

    // Delete quiz attempts
    const attemptsDeleted = await db.collection('quiz_attempts').deleteMany({ user_id: new ObjectId(userId) });
    console.log(`  ✅ Deleted ${attemptsDeleted.deletedCount} quiz attempts`);

    // Delete study notes
    const notesDeleted = await db.collection('study_notes').deleteMany({ user_id: new ObjectId(userId) });
    console.log(`  ✅ Deleted ${notesDeleted.deletedCount} study notes`);

    // Delete messages (sent or received)
    const messagesDeleted = await db.collection('messages').deleteMany({
      $or: [
        { sender_id: new ObjectId(userId) },
        { recipient_id: new ObjectId(userId) }
      ]
    });
    console.log(`  ✅ Deleted ${messagesDeleted.deletedCount} messages`);

    // Delete notifications
    const notificationsDeleted = await db.collection('notifications').deleteMany({ user_id: new ObjectId(userId) });
    console.log(`  ✅ Deleted ${notificationsDeleted.deletedCount} notifications`);

    // Delete profile images
    const imagesDeleted = await db.collection('profile_images').deleteMany({ user_id: userId });
    console.log(`  ✅ Deleted ${imagesDeleted.deletedCount} profile images`);

    // Delete tutor classes (if tutor)
    const classesDeleted = await db.collection('tutor_classes').deleteMany({ tutor_id: new ObjectId(userId) });
    console.log(`  ✅ Deleted ${classesDeleted.deletedCount} tutor classes`);

    // Delete conversations (if any)
    const conversationsDeleted = await db.collection('conversations').deleteMany({
      participants: new ObjectId(userId)
    });
    console.log(`  ✅ Deleted ${conversationsDeleted.deletedCount} conversations`);
  }

  static async getRecentStudentSignups(limit: number = 5): Promise<any[]> {
    try {
      const students = await User.find({ role: 'student' })
        .select('-password') // Exclude password field
        .sort({ createdAt: -1 })
        .limit(limit);

      // Transform the data to match dashboard expectations
      return students.map(student => ({
        id: student._id.toString(),
        name: student.fullName,
        grade: student.currentGrade,
        package: student.package || 'free',
        date: this.getRelativeTime(student.createdAt),
        created_at: student.createdAt.toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching recent students:', error);
      throw new Error('Failed to fetch recent students');
    }
  }

  static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} mins ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}
