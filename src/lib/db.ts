import apiClient from './apiClient';
import type { UserProfile } from '@/types/auth';

export const db = {
  // Profile operations
  profiles: {
    getByUserId: async (_userId: string) => {
      const result = await apiClient.get('/api/auth/profile') as any;
      return result.data;
    },

    update: async (_userId: string, updates: Partial<UserProfile>) => {
      const result = await apiClient.put('/api/auth/profile', updates) as any;
      return result.data;
    },
  },

  // Tutor application operations
  tutorApplications: {
    create: async (application: {
      user_id: string;
      applicant_email: string;
      full_name: string;
      phone_number: string;
      subjects: string[];
      specializes_learning_disabilities: boolean;
      cv_file_name?: string;
      cv_url?: string;
      cv_file_size?: number;
      additional_notes?: string;
      postcode?: string;
      based_in_country?: string;
      past_experience?: string;
      weekly_availability?: string;
      employment_status?: string;
      education_level?: string;
      average_weekly_hours?: number;
      expected_hourly_rate?: number;
    }) => {
      const result = await apiClient.post('/api/tutors/applications', application);
      return result;
    },

    getByUserId: async (_userId: string) => {
      const result = await apiClient.get('/api/tutors/applications') as any;
      if (result && result.data && Array.isArray(result.data) && result.data.length > 0) {
        // Return the most recent application (first in the sorted array)
        return {
          success: true,
          data: result.data[0]
        };
      }
      return {
        success: false,
        data: null
      };
    },

    update: async (userId: string, updates: any) => {
      const result = await apiClient.put(`/api/tutors/applications/${userId}`, updates);
      return result;
    },
  },

  // Storage operations for CV uploads
  storage: {
    uploadTutorCV: async (userId: string, file: File): Promise<{ url: string; path: string; size: number }> => {
      // Use backend API instead of Supabase storage
      const formData = new FormData();
      formData.append('document', file); // Backend expects field name 'document'
      formData.append('userId', userId);
      formData.append('entityType', 'tutor_application');
      formData.append('entityId', userId); // Use userId as entityId for tutor applications
      formData.append('isPublic', 'false'); // Will be converted to boolean by Joi

      const result = await apiClient.post<{
        id: string;
        fileName: string;
        originalName: string;
        fileSize: number;
        mimeType: string;
        extension: string;
        entityType: string;
        entityId: string;
        isPublic: boolean;
        uploadedAt: string;
        url: string;
        filePath: string;
      }>('/api/files/documents/upload', formData);

      return {
        url: result.url,
        path: result.filePath,
        size: result.fileSize
      };
    },
  },
}; 