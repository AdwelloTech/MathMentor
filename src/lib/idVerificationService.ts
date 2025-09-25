import apiClient from './apiClient';

export interface IDVerification {
  id: string;
  user_id: string;
  id_type: 'national_id' | 'passport' | 'drivers_license' | 'student_id' | 'other';
  id_number: string;
  full_name: string;
  date_of_birth?: string;
  expiry_date?: string;
  issuing_country?: string;
  issuing_authority?: string;
  front_image_url?: string;
  back_image_url?: string;
  selfie_with_id_url?: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'expired';
  admin_notes?: string;
  rejection_reason?: string;
  verified_at?: string;
  verified_by?: string;
  submitted_at: string;
  updated_at: string;
}

export interface IDVerificationFormData {
  id_type: 'national_id' | 'passport' | 'drivers_license' | 'student_id' | 'other';
  id_number: string;
  full_name: string;
  date_of_birth?: string;
  expiry_date?: string;
  issuing_country?: string;
  issuing_authority?: string;
  front_image: File;
  back_image: File;
  selfie_with_id: File;
}

export interface IDVerificationStats {
  total_verifications: number;
  pending_verifications: number;
  approved_verifications: number;
  rejected_verifications: number;
  expired_verifications: number;
  total_users: number;
  verification_rate: number;
}

class IDVerificationService {

  async submitVerification(formData: IDVerificationFormData): Promise<IDVerification> {
    try {
      // Create FormData for multipart upload
      const formDataToSend = new FormData();

      // Add form fields
      formDataToSend.append('id_type', formData.id_type);
      formDataToSend.append('id_number', formData.id_number);
      formDataToSend.append('full_name', formData.full_name);

      if (formData.date_of_birth) formDataToSend.append('date_of_birth', formData.date_of_birth);
      if (formData.expiry_date) formDataToSend.append('expiry_date', formData.expiry_date);
      if (formData.issuing_country) formDataToSend.append('issuing_country', formData.issuing_country);
      if (formData.issuing_authority) formDataToSend.append('issuing_authority', formData.issuing_authority);

      // Add image files
      formDataToSend.append('front_image', formData.front_image);
      formDataToSend.append('back_image', formData.back_image);
      formDataToSend.append('selfie_with_id', formData.selfie_with_id);

      return await apiClient.post<IDVerification>('/api/tutors/id-verification', formDataToSend);
    } catch (error) {
      console.error('Error in submitVerification:', error);
      throw error;
    }
  }


  async getVerificationByUserId(): Promise<IDVerification | null> {
    try {
      return await apiClient.get<IDVerification | null>('/api/tutors/id-verification');
    } catch (error: any) {
      // If 404, return null (no verification found)
      if (error.status === 404) {
        return null;
      }
      console.error('Error in getVerificationByUserId:', error);
      throw error;
    }
  }

  async updateVerificationStatus(
    userId: string,
    status: IDVerification['verification_status'],
    adminNotes?: string,
    rejectionReason?: string
  ): Promise<IDVerification> {
    try {
      const payload: any = { status };
      if (adminNotes) payload.admin_notes = adminNotes;
      if (rejectionReason) payload.rejection_reason = rejectionReason;

      return await apiClient.put<IDVerification>(`/api/tutors/id-verification/${userId}`, payload);
    } catch (error) {
      console.error('Error in updateVerificationStatus:', error);
      throw error;
    }
  }

  async getAllVerifications(): Promise<IDVerification[]> {
    try {
      return await apiClient.get<IDVerification[]>('/api/admin/id-verifications');
    } catch (error) {
      console.error('Error in getAllVerifications:', error);
      throw error;
    }
  }

  async getVerificationStats(): Promise<IDVerificationStats> {
    try {
      return await apiClient.get<IDVerificationStats>('/api/admin/id-verifications/stats');
    } catch (error) {
      console.error('Error in getVerificationStats:', error);
      throw error;
    }
  }

  async deleteVerification(verificationId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/admin/id-verifications/${verificationId}`);
    } catch (error) {
      console.error('Error in deleteVerification:', error);
      throw error;
    }
  }

}

export const idVerificationService = new IDVerificationService(); 