import { supabase } from './supabase';

export interface IDVerification {
  id: string;
  user_id: string;
  application_id?: string;
  id_type: 'national_id' | 'passport' | 'drivers_license' | 'student_id' | 'other';
  id_number: string;
  full_name_on_id: string;
  date_of_birth_on_id?: string;
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
  full_name_on_id: string;
  date_of_birth_on_id?: string;
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
  private bucketName = 'id-verification-documents';

  async submitVerification(userId: string, applicationId: string, formData: IDVerificationFormData): Promise<IDVerification> {
    try {
      // Upload images to storage
      const [frontImageUrl, backImageUrl, selfieUrl] = await Promise.all([
        this.uploadImage(userId, 'front', formData.front_image),
        this.uploadImage(userId, 'back', formData.back_image),
        this.uploadImage(userId, 'selfie', formData.selfie_with_id)
      ]);

      // Create verification record
      const { data, error } = await supabase
        .from('id_verifications')
        .insert({
          user_id: userId,
          application_id: applicationId,
          id_type: formData.id_type,
          id_number: formData.id_number,
          full_name_on_id: formData.full_name_on_id,
          date_of_birth_on_id: formData.date_of_birth_on_id,
          expiry_date: formData.expiry_date,
          issuing_country: formData.issuing_country,
          issuing_authority: formData.issuing_authority,
          front_image_url: frontImageUrl,
          back_image_url: backImageUrl,
          selfie_with_id_url: selfieUrl,
          verification_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting ID verification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in submitVerification:', error);
      throw error;
    }
  }

  private async uploadImage(userId: string, imageType: 'front' | 'back' | 'selfie', file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${imageType}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error(`Error uploading ${imageType} image:`, error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Error in uploadImage for ${imageType}:`, error);
      throw error;
    }
  }

  async getVerificationByUserId(userId: string): Promise<IDVerification | null> {
    try {
      const { data, error } = await supabase
        .from('id_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching ID verification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getVerificationByUserId:', error);
      throw error;
    }
  }

  async getVerificationById(verificationId: string): Promise<IDVerification | null> {
    try {
      const { data, error } = await supabase
        .from('id_verifications')
        .select('*')
        .eq('id', verificationId)
        .single();

      if (error) {
        console.error('Error fetching ID verification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getVerificationById:', error);
      throw error;
    }
  }

  async getAllVerifications(): Promise<IDVerification[]> {
    try {
      const { data, error } = await supabase
        .from('id_verifications')
        .select(`
          *,
          profiles:user_id (
            id,
            user_id,
            full_name,
            email,
            phone
          ),
          tutor_applications:application_id (
            id,
            full_name,
            applicant_email
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching all ID verifications:', error);
        throw error;
      }

      return data || [];
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

      const { error } = await supabase
        .from('id_verifications')
        .update(updateData)
        .eq('id', verificationId);

      if (error) {
        console.error('Error updating verification status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateVerificationStatus:', error);
      throw error;
    }
  }

  async getVerificationStats(): Promise<IDVerificationStats> {
    try {
      // Get total count
      const { count: total, error: totalError } = await supabase
        .from('id_verifications')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get status counts
      const { data: verifications, error: statusError } = await supabase
        .from('id_verifications')
        .select('verification_status');

      if (statusError) throw statusError;

      const pending = verifications?.filter(v => v.verification_status === 'pending').length || 0;
      const approved = verifications?.filter(v => v.verification_status === 'approved').length || 0;
      const rejected = verifications?.filter(v => v.verification_status === 'rejected').length || 0;
      const expired = verifications?.filter(v => v.verification_status === 'expired').length || 0;

      // Get recent submissions (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentSubmissions, error: recentError } = await supabase
        .from('id_verifications')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', sevenDaysAgo.toISOString());

      if (recentError) throw recentError;

      return {
        total: total || 0,
        pending,
        approved,
        rejected,
        expired,
        recentSubmissions: recentSubmissions || 0
      };
    } catch (error) {
      console.error('Error in getVerificationStats:', error);
      throw error;
    }
  }

  async deleteVerification(verificationId: string): Promise<void> {
    try {
      // Get verification to delete associated images
      const verification = await this.getVerificationById(verificationId);
      if (!verification) {
        throw new Error('Verification not found');
      }

      // Delete images from storage
      const imageUrls = [
        verification.front_image_url,
        verification.back_image_url,
        verification.selfie_with_id_url
      ].filter(Boolean);

      for (const url of imageUrls) {
        if (url) {
          const path = url.split('/').slice(-2).join('/'); // Extract path from URL
          await supabase.storage
            .from(this.bucketName)
            .remove([path]);
        }
      }

      // Delete verification record
      const { error } = await supabase
        .from('id_verifications')
        .delete()
        .eq('id', verificationId);

      if (error) {
        console.error('Error deleting verification:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteVerification:', error);
      throw error;
    }
  }

  async getImageUrl(imageUrl: string): Promise<string> {
    try {
      if (!imageUrl) return '';
      
      // Extract path from URL
      const path = imageUrl.split('/').slice(-2).join('/');
      
      const { data } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return imageUrl; // Return original URL as fallback
    }
  }
}

export const idVerificationService = new IDVerificationService(); 