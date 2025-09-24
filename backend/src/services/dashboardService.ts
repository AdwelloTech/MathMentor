import { User } from '../models/User';
import { Booking } from '../models/Booking';
import Class from '../models/Class';
import { QuizAttempt } from '../models/Quiz';
import { FlashcardSet } from '../models/FlashcardSet';
import { StudyNote } from '../models/StudyNote';

export interface StudentDashboardStats {
  total_bookings: number;
  upcoming_bookings: number;
  completed_bookings: number;
  total_spent: number;
  average_rating: number;
  total_tutors: number;
  bookings_this_month: number;
  spent_this_month: number;
  hours_learned: number;
}

export interface TutorDashboardStats {
  total_sessions: number;
  completed_sessions: number;
  upcoming_sessions: number;
  total_quizzes_created: number;
  total_students: number;
  average_rating: number;
  monthly_earnings: number;
  active_flashcard_sets: number;
}

export interface AdminDashboardStats {
  total_users: number;
  total_students: number;
  total_tutors: number;
  total_sessions: number;
  total_quizzes: number;
  total_revenue: number;
  recent_signups: number;
  active_sessions_today: number;
}

export class DashboardService {
  /**
   * Get student dashboard statistics
   */
  static async getStudentStats(studentId: string): Promise<StudentDashboardStats> {
    try {
      // Get user profile for package info
      const user = await User.findById(studentId);
      if (!user) {
        throw new Error('Student not found');
      }

      // Get booking statistics
      const bookings = await Booking.find({ studentId })
        .populate('classId')
        .lean();

      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const upcomingBookings = bookings.filter(b => b.status === 'confirmed').length;

      // Calculate hours learned from completed bookings
      const hoursLearned = bookings
        .filter(b => b.status === 'completed')
        .reduce((total, booking: any) => {
          const classData = booking.classId;
          if (classData && classData.schedule?.startTime && classData.schedule?.endTime) {
            const [startHour, startMin] = classData.schedule.startTime.split(':').map(Number);
            const [endHour, endMin] = classData.schedule.endTime.split(':').map(Number);
            const minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
            return total + (minutes / 60);
          }
          return total;
        }, 0);

      // Get unique tutors count
      const uniqueTutorIds = new Set(
        bookings
          .filter(b => b.classId)
          .map((b: any) => b.classId.teacherId?.toString())
          .filter(Boolean)
      );
      const totalTutors = uniqueTutorIds.size;

      // Get this month's bookings
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const bookingsThisMonth = bookings.filter((booking: any) => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= startOfMonth && bookingDate <= endOfMonth;
      }).length;

      // Calculate total spent from completed bookings
      const totalSpent = bookings
        .filter((b: any) => b.paymentStatus === 'paid')
        .reduce((sum: number, b: any) => sum + (b.price || 0), 0);

      // Calculate spent this month
      const spentThisMonth = bookings
        .filter((booking: any) => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= startOfMonth && bookingDate <= endOfMonth && booking.paymentStatus === 'paid';
        })
        .reduce((sum: number, b: any) => sum + (b.price || 0), 0);

      // For now, average rating is 0 (would need a rating system)
      const averageRating = 0;

      return {
        total_bookings: totalBookings,
        upcoming_bookings: upcomingBookings,
        completed_bookings: completedBookings,
        total_spent: totalSpent,
        average_rating: averageRating,
        total_tutors: totalTutors,
        bookings_this_month: bookingsThisMonth,
        spent_this_month: spentThisMonth,
        hours_learned: Math.round(hoursLearned * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting student stats:', error);
      throw error;
    }
  }

  /**
   * Get tutor dashboard statistics
   */
  static async getTutorStats(tutorId: string): Promise<TutorDashboardStats> {
    try {
      // This would need to be implemented based on the actual models
      // For now, return placeholder data
      return {
        total_sessions: 0,
        completed_sessions: 0,
        upcoming_sessions: 0,
        total_quizzes_created: 0,
        total_students: 0,
        average_rating: 0,
        monthly_earnings: 0,
        active_flashcard_sets: 0,
      };
    } catch (error) {
      console.error('Error getting tutor stats:', error);
      throw error;
    }
  }

  /**
   * Get admin dashboard statistics
   */
  static async getAdminStats(): Promise<AdminDashboardStats> {
    try {
      // This would need to be implemented based on the actual models
      // For now, return placeholder data
      return {
        total_users: 0,
        total_students: 0,
        total_tutors: 0,
        total_sessions: 0,
        total_quizzes: 0,
        total_revenue: 0,
        recent_signups: 0,
        active_sessions_today: 0,
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      throw error;
    }
  }

  /**
   * Get student upcoming sessions
   */
  static async getStudentUpcomingSessions(studentId: string): Promise<any[]> {
    try {
      const now = new Date();

      const upcomingBookings = await Booking.find({
        studentId,
        status: 'confirmed'
      })
      .populate('classId')
      .populate('teacherId', 'firstName lastName fullName')
      .lean();

      return upcomingBookings
        .filter((booking: any) => {
          const classData = booking.classId as any;
          if (!classData?.startDate || !classData?.schedule?.startTime) return false;
          const sessionDateTime = new Date(`${classData.startDate}T${classData.schedule.startTime}`);
          return sessionDateTime > now;
        })
        .map((booking: any) => {
          const classData = booking.classId as any;
          return {
            id: booking._id,
            tutor_name: booking.teacherId?.fullName || 'Unknown Tutor',
            title: classData?.title || 'Untitled Class',
            date: classData?.startDate,
            start_time: classData?.schedule?.startTime,
            end_time: classData?.schedule?.endTime,
            class_type_name: 'Class',
            subject_name: classData?.subjectId_populated?.displayName || '',
          };
        })
        .sort((a, b) => new Date(`${a.date}T${a.start_time}`).getTime() - new Date(`${b.date}T${b.start_time}`).getTime());
    } catch (error) {
      console.error('Error getting student upcoming sessions:', error);
      throw error;
    }
  }

  /**
   * Get tutor upcoming sessions
   */
  static async getTutorUpcomingSessions(tutorId: string): Promise<any[]> {
    try {
      // This would need to be implemented based on the actual class booking model
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting tutor upcoming sessions:', error);
      throw error;
    }
  }

  /**
   * Get student recent activity
   */
  static async getStudentRecentActivity(studentId: string): Promise<any[]> {
    try {
      // This would need to be implemented to track recent quiz attempts, study sessions, etc.
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting student recent activity:', error);
      throw error;
    }
  }

  /**
   * Get tutor recent activity
   */
  static async getTutorRecentActivity(tutorId: string): Promise<any[]> {
    try {
      // This would need to be implemented to track recent class bookings, quiz creations, etc.
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting tutor recent activity:', error);
      throw error;
    }
  }
}
