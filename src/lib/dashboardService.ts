/**
 * Dashboard Service
 * Handles dashboard data fetching from the backend API
 */

import apiClient from './apiClient';

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

class DashboardService {
  /**
   * Get student dashboard statistics
   */
  static async getStudentStats(studentId: string): Promise<StudentDashboardStats> {
    const stats = await apiClient.get<StudentDashboardStats>(`/api/dashboard/student/stats/${studentId}`);
    return stats;
  }

  /**
   * Get tutor dashboard statistics
   */
  static async getTutorStats(tutorId: string): Promise<TutorDashboardStats> {
    const stats = await apiClient.get<TutorDashboardStats>(`/api/dashboard/tutor/stats/${tutorId}`);
    return stats;
  }

  /**
   * Get admin dashboard statistics
   */
  static async getAdminStats(): Promise<any> {
    const stats = await apiClient.get('/api/dashboard/admin/stats');
    return stats;
  }

  /**
   * Get student upcoming sessions
   */
  static async getStudentUpcomingSessions(studentId: string): Promise<any[]> {
    const sessions = await apiClient.get(`/api/dashboard/student/sessions/upcoming/${studentId}`);
    return sessions;
  }

  /**
   * Get tutor upcoming sessions
   */
  static async getTutorUpcomingSessions(tutorId: string): Promise<any[]> {
    const sessions = await apiClient.get(`/api/dashboard/tutor/sessions/upcoming/${tutorId}`);
    return sessions;
  }

  /**
   * Get student recent activity
   */
  static async getStudentRecentActivity(studentId: string): Promise<any[]> {
    const activity = await apiClient.get(`/api/dashboard/student/activity/recent/${studentId}`);
    return activity;
  }

  /**
   * Get tutor recent activity
   */
  static async getTutorRecentActivity(tutorId: string): Promise<any[]> {
    const activity = await apiClient.get(`/api/dashboard/tutor/activity/recent/${tutorId}`);
    return activity;
  }
}

export default DashboardService;
