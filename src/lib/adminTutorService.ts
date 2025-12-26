import apiClient from './apiClient';

export interface Tutor {
  id: string;
  user_id: string;
  email?: string; // Email might come from auth.users, not profiles
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  cv_url: string | null;
  cv_file_name: string | null;
  specializations: string[] | null;
  hourly_rate: number | null;
  availability: string | null;
  bio: string | null;
  certifications: string[] | null;
  languages: string[] | null;
  profile_completed: boolean | null;
  qualification: string | null;
  experience_years: number | null;
  subjects: string[] | null;
  profile_image_url?: string | null;
  // Application status from tutor_applications
  application_status?: string;
  submitted_at?: string;
  reviewed_at?: string;
  // Allowed session types (admin-approved)
  allowed_session_types?: ('one-on-one' | 'group' | 'consultation')[];
}

export interface TutorStats {
  total: number;
  online: number;
  inactive: number;
  approved: number;
  pending: number;
  rejected: number;
  recentRegistrations: number;
}

export interface TutorClass {
  id: string;
  tutor_id: string;
  class_type_id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string;
  max_students: number;
  current_students: number;
  price_per_session: number;
  is_recurring: boolean;
  recurring_pattern: string | null;
  recurring_end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  class_type: {
    id: string;
    name: string;
    duration_minutes: number;
    description: string | null;
  };
  jitsi_meeting: {
    id: string;
    room_name: string;
    meeting_url: string;
    start_url: string;
  } | null;
}

class AdminTutorService {
  async getAllTutors(): Promise<Tutor[]> {
    try {
      const tutors = await apiClient.get<Tutor[]>('/api/admin/tutors');
      return tutors || [];
    } catch (error) {
      console.error('Error in getAllTutors:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async getTutorById(tutorId: string): Promise<Tutor | null> {
    try {
      const tutor = await apiClient.get<Tutor>(`/api/admin/tutors/${tutorId}`);
      return tutor;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error('Error in getTutorById:', error);
      throw error;
    }
  }

  async updateTutorStatus(tutorId: string, isActive: boolean): Promise<void> {
    try {
      await apiClient.put<void>(`/api/admin/tutors/${tutorId}/status`, { isActive: isActive });
    } catch (error) {
      console.error('Error in updateTutorStatus:', error);
      throw error;
    }
  }

  async deleteTutor(tutorId: string): Promise<void> {
    try {
      await apiClient.delete<void>(`/api/admin/tutors/${tutorId}`);
    } catch (error) {
      console.error('Error in deleteTutor:', error);
      throw error;
    }
  }

  async getTutorClasses(tutorId: string): Promise<TutorClass[]> {
    try {
      const classes = await apiClient.get<TutorClass[]>(`/api/admin/tutors/${tutorId}/classes`);
      return classes || [];
    } catch (error) {
      console.error('Error in getTutorClasses:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async getTutorStats(): Promise<TutorStats> {
    try {
      const stats = await apiClient.get<TutorStats>('/api/admin/tutors/stats');
      return stats || {
        total: 0,
        active: 0,
        inactive: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        recentRegistrations: 0
      };
    } catch (error) {
      console.error('Error in getTutorStats:', error);
      return {
        total: 0,
        online: 0,
        inactive: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        recentRegistrations: 0
      }; // Return default values instead of throwing
    }
  }

  async updateTutorApplication(
    userId: string,
    status: 'pending' | 'approved' | 'rejected',
    rejectionReason?: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      await apiClient.put<void>(`/api/admin/tutor-applications/${userId}`, {
        status,
        rejection_reason: rejectionReason,
        admin_notes: adminNotes
      });
    } catch (error) {
      console.error('Error in updateTutorApplication:', error);
      throw error;
    }
  }

  async updateSessionTypes(
    tutorId: string,
    sessionTypes: ('one-on-one' | 'group' | 'consultation')[]
  ): Promise<void> {
    try {
      await apiClient.put<void>(`/api/admin/tutors/${tutorId}/session-types`, {
        session_types: sessionTypes
      });
    } catch (error) {
      console.error('Error in updateSessionTypes:', error);
      throw error;
    }
  }
}

export const adminTutorService = new AdminTutorService();