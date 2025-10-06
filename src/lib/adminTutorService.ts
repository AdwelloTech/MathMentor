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
}

export interface TutorStats {
  total: number;
  active: number;
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/tutors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch tutors:', response.status, response.statusText);
        // Return empty array instead of throwing
        return [];
      }

      try {
        const data = await response.json();
        return data.data || [];
      } catch (parseError) {
        console.error('Error parsing tutor response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error in getAllTutors:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async getTutorById(tutorId: string): Promise<Tutor | null> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/tutors/${tutorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tutor');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in getTutorById:', error);
      throw error;
    }
  }

  async updateTutorStatus(tutorId: string, isActive: boolean): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/tutors/${tutorId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_active: isActive })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tutor status');
      }
    } catch (error) {
      console.error('Error in updateTutorStatus:', error);
      throw error;
    }
  }

  async deleteTutor(tutorId: string): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/tutors/${tutorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete tutor');
      }
    } catch (error) {
      console.error('Error in deleteTutor:', error);
      throw error;
    }
  }

  async getTutorClasses(tutorId: string): Promise<TutorClass[]> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/tutors/${tutorId}/classes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch tutor classes:', response.status, response.statusText);
        return []; // Return empty array instead of throwing
      }

      try {
        const data = await response.json();
        return data.data || [];
      } catch (parseError) {
        console.error('Error parsing classes response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error in getTutorClasses:', error);
      return []; // Return empty array instead of throwing
    }
  }

  async getTutorStats(): Promise<TutorStats> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/tutors/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch tutor stats:', response.status, response.statusText);
        // Return default values instead of throwing
        return {
          total: 0,
          active: 0,
          inactive: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          recentRegistrations: 0
        };
      }

      try {
        const data = await response.json();
        return data.data || {
          total: 0,
          active: 0,
          inactive: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          recentRegistrations: 0
        };
      } catch (parseError) {
        console.error('Error parsing stats response:', parseError);
        return {
          total: 0,
          active: 0,
          inactive: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          recentRegistrations: 0
        };
      }
    } catch (error) {
      console.error('Error in getTutorStats:', error);
      return {
        total: 0,
        active: 0,
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/tutor-applications/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status,
          rejection_reason: rejectionReason,
          admin_notes: adminNotes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update application status');
      }
    } catch (error) {
      console.error('Error in updateTutorApplication:', error);
      throw error;
    }
  }
}

export const adminTutorService = new AdminTutorService();