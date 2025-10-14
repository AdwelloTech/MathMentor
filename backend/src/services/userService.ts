import { User, IUser } from '../models/User';

export class UserService {

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
      const student = await User.findOneAndUpdate(
        { _id: studentId, role: 'student' },
        updates,
        { new: true }
      ).select('-password');

      if (!student) {
        throw new Error('Student not found');
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

  // Delete student
  static async deleteStudent(studentId: string): Promise<void> {
    try {
      const result = await User.findOneAndDelete({
        _id: studentId,
        role: 'student'
      });

      if (!result) {
        throw new Error('Student not found');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      throw new Error('Failed to delete student');
    }
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
