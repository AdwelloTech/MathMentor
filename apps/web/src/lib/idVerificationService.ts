import { getApi } from './api';

export interface IDVerification {
  _id: string;
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
  created_at: string;
  // For profile data when joined
  profiles?: {
    _id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
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
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  recentSubmissions: number;
}

class IDVerificationService {
  private api = getApi();

  async submitVerification(userId: string, formData: IDVerificationFormData): Promise<IDVerification> {
    try {
      // For now, we'll skip image upload and just create the verification record
      // In a real implementation, you'd upload images to a storage service first
      const verificationData = {
        user_id: userId,
        id_type: formData.id_type,
        id_number: formData.id_number,
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth,
        expiry_date: formData.expiry_date,
        issuing_country: formData.issuing_country,
        issuing_authority: formData.issuing_authority,
        front_image_url: '', // Placeholder - implement image upload
        back_image_url: '', // Placeholder - implement image upload
        selfie_with_id_url: '', // Placeholder - implement image upload
        verification_status: 'pending',
        submitted_at: new Date().toISOString()
      };

      const response = await this.api.post('/api/id_verifications', verificationData);
      return response.data;
    } catch (error) {
      console.error('Error in submitVerification:', error);
      throw error;
    }
  }

  async getVerificationByUserId(userId: string): Promise<IDVerification | null> {
    try {
      const response = await this.api.get('/api/id_verifications', {
        params: {
          q: JSON.stringify({ user_id: userId }),
          sort: JSON.stringify({ submitted_at: -1 }),
          limit: 1
        }
      });

      return response.data?.items?.[0] || null;
    } catch (error) {
      console.error('Error in getVerificationByUserId:', error);
      throw error;
    }
  }

  async getVerificationById(verificationId: string): Promise<IDVerification | null> {
    try {
      const response = await this.api.get(`/api/id_verifications/${verificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error in getVerificationById:', error);
      throw error;
    }
  }

  async getAllVerifications(): Promise<IDVerification[]> {
    try {
      const response = await this.api.get('/api/id_verifications', {
        params: {
          sort: JSON.stringify({ submitted_at: -1 })
        }
      });

      const verifications = response.data?.items || [];
      
      // For each verification, try to get profile data
      const verificationsWithProfiles = await Promise.all(
        verifications.map(async (verification: IDVerification) => {
          try {
            const profileResponse = await this.api.get('/api/profiles', {
              params: {
                q: JSON.stringify({ user_id: verification.user_id }),
                limit: 1
              }
            });
            
            return {
              ...verification,
              profiles: profileResponse.data?.[0] || null
            };
          } catch (error) {
            console.warn('Error fetching profile for verification:', verification._id, error);
            return verification;
          }
        })
      );

      return verificationsWithProfiles;
    } catch (error) {
      console.error('Error in getAllVerifications:', error);
      throw error;
    }
  }

  async updateVerificationStatus(
    verificationId: string, 
    status: 'approved' | 'rejected' | 'expired',
    adminNotes?: string,
    rejectionReason?: string,
    verifiedBy?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        verification_status: status,
        verified_at: new Date().toISOString()
      };

      if (adminNotes) updateData.admin_notes = adminNotes;
      if (rejectionReason) updateData.rejection_reason = rejectionReason;
      if (verifiedBy) updateData.verified_by = verifiedBy;

      await this.api.patch(`/api/id_verifications/${verificationId}`, updateData);
    } catch (error) {
      console.error('Error in updateVerificationStatus:', error);
      throw error;
    }
  }

  async getVerificationStats(): Promise<IDVerificationStats> {
    try {
      // Get all verifications to calculate stats
      const response = await this.api.get('/api/id_verifications');
      const verifications = response.data?.items || [];

      const total = verifications.length;
      const pending = verifications.filter((v: IDVerification) => v.verification_status === 'pending').length;
      const approved = verifications.filter((v: IDVerification) => v.verification_status === 'approved').length;
      const rejected = verifications.filter((v: IDVerification) => v.verification_status === 'rejected').length;
      const expired = verifications.filter((v: IDVerification) => v.verification_status === 'expired').length;

      // Get recent submissions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentSubmissions = verifications.filter((v: IDVerification) => {
        const submittedAt = new Date(v.submitted_at);
        return submittedAt >= sevenDaysAgo;
      }).length;

      return {
        total,
        pending,
        approved,
        rejected,
        expired,
        recentSubmissions
      };
    } catch (error) {
      console.error('Error in getVerificationStats:', error);
      throw error;
    }
  }

  async deleteVerification(verificationId: string): Promise<void> {
    try {
      await this.api.delete(`/api/id_verifications/${verificationId}`);
    } catch (error) {
      console.error('Error in deleteVerification:', error);
      throw error;
    }
  }

  async getImageUrl(imageUrl: string): Promise<string> {
    // For now, return the original URL
    // In a real implementation, you might want to process or validate the URL
    return imageUrl || '';
  }
}

export const idVerificationService = new IDVerificationService(); 