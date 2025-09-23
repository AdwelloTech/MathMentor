// adminTutorApplicationService.ts - MongoDB API version
import { getApi } from "./api";
import type { TutorApplication, TutorApplicationStatus } from "@/types/auth";

export type ApplicationStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  recentApplications: number;
};

export class AdminTutorApplicationService {
  private api = getApi();

  /**
   * Get all tutor applications
   */
  async getAllApplications(): Promise<TutorApplication[]> {
    try {
      const response = await this.api.get('/api/tutor_applications');
      const applications = response.data?.items || response.data || [];
      
      if (!Array.isArray(applications)) {
        console.error("Applications data is not an array:", applications);
        return [];
      }
      
      // Transform the data to match the expected format
      return applications.map((app: any) => ({
        ...app,
        id: app._id || app.id,
        subjects: Array.isArray(app.subjects) ? app.subjects : 
          (typeof app.subjects === 'string' 
            ? app.subjects.replace(/[{}]/g, '').split(',').map(s => s.trim())
            : []),
        specializes_learning_disabilities: app.specializes_learning_disabilities === 't' || app.specializes_learning_disabilities === true,
        id_verification_required: app.id_verification_required === 't' || app.id_verification_required === true,
        cv_file_size: app.cv_file_size ? parseInt(app.cv_file_size.toString()) : 0,
        expected_hourly_rate: app.expected_hourly_rate ? parseFloat(app.expected_hourly_rate.toString()) : 0,
        average_weekly_hours: app.average_weekly_hours ? parseInt(app.average_weekly_hours.toString()) : 0,
      }));
    } catch (error) {
      console.error("Error fetching all applications:", error);
      throw error;
    }
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(): Promise<ApplicationStats> {
    try {
      const applications = await this.getAllApplications();
      
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const stats: ApplicationStats = {
        total: applications.length,
        pending: applications.filter(app => app.application_status === 'pending').length,
        approved: applications.filter(app => app.application_status === 'approved').length,
        rejected: applications.filter(app => app.application_status === 'rejected').length,
        recentApplications: applications.filter(app => {
          const submittedDate = new Date(app.submitted_at);
          return submittedDate >= sevenDaysAgo;
        }).length,
      };
      
      return stats;
    } catch (error) {
      console.error("Error fetching application stats:", error);
      throw error;
    }
  }

  /**
   * Get applications by status
   */
  async getApplicationsByStatus(status: TutorApplicationStatus): Promise<TutorApplication[]> {
    try {
      const response = await this.api.get('/api/tutor_applications', {
        params: {
          q: JSON.stringify({ application_status: status })
        }
      });
      const applications = response.data?.items || response.data || [];
      
      return applications.map((app: any) => ({
        ...app,
        id: app._id || app.id,
        subjects: Array.isArray(app.subjects) ? app.subjects : 
          (typeof app.subjects === 'string' 
            ? app.subjects.replace(/[{}]/g, '').split(',').map(s => s.trim())
            : []),
        specializes_learning_disabilities: app.specializes_learning_disabilities === 't' || app.specializes_learning_disabilities === true,
        id_verification_required: app.id_verification_required === 't' || app.id_verification_required === true,
        cv_file_size: app.cv_file_size ? parseInt(app.cv_file_size.toString()) : 0,
        expected_hourly_rate: app.expected_hourly_rate ? parseFloat(app.expected_hourly_rate.toString()) : 0,
        average_weekly_hours: app.average_weekly_hours ? parseInt(app.average_weekly_hours.toString()) : 0,
      }));
    } catch (error) {
      console.error("Error fetching applications by status:", error);
      throw error;
    }
  }

  /**
   * Get application by ID
   */
  async getApplicationById(id: string): Promise<TutorApplication | null> {
    try {
      const response = await this.api.get(`/api/tutor_applications/${id}`);
      const application = response.data;
      if (!application) return null;
      
      return {
        ...application,
        id: application._id || application.id,
        subjects: Array.isArray(application.subjects) ? application.subjects : 
          (typeof application.subjects === 'string' 
            ? application.subjects.replace(/[{}]/g, '').split(',').map(s => s.trim())
            : []),
        specializes_learning_disabilities: application.specializes_learning_disabilities === 't' || application.specializes_learning_disabilities === true,
        id_verification_required: application.id_verification_required === 't' || application.id_verification_required === true,
        cv_file_size: application.cv_file_size ? parseInt(application.cv_file_size.toString()) : 0,
        expected_hourly_rate: application.expected_hourly_rate ? parseFloat(application.expected_hourly_rate.toString()) : 0,
        average_weekly_hours: application.average_weekly_hours ? parseInt(application.average_weekly_hours.toString()) : 0,
      };
    } catch (error) {
      console.error("Error fetching application by ID:", error);
      throw error;
    }
  }

  /**
   * Approve a tutor application
   */
  async approveApplication(
    applicationId: string, 
    adminUserId: string, 
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const updates = {
        application_status: 'approved' as TutorApplicationStatus,
        reviewed_at: new Date().toISOString(),
        approved_by: adminUserId,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      };

      await this.api.patch(`/api/tutor_applications/${applicationId}`, updates);
      return true;
    } catch (error) {
      console.error("Error approving application:", error);
      return false;
    }
  }

  /**
   * Reject a tutor application
   */
  async rejectApplication(
    applicationId: string, 
    adminUserId: string, 
    rejectionReason: string, 
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const updates = {
        application_status: 'rejected' as TutorApplicationStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId,
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      };

      await this.api.patch(`/api/tutor_applications/${applicationId}`, updates);
      return true;
    } catch (error) {
      console.error("Error rejecting application:", error);
      return false;
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string, 
    status: TutorApplicationStatus, 
    adminUserId: string, 
    notes?: string
  ): Promise<boolean> {
    try {
      const updates: any = {
        application_status: status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'approved') {
        updates.approved_by = adminUserId;
        updates.reviewed_at = new Date().toISOString();
      } else if (status === 'rejected') {
        updates.reviewed_by = adminUserId;
        updates.reviewed_at = new Date().toISOString();
      }

      if (notes) {
        updates.admin_notes = notes;
      }

      await this.api.patch(`/api/tutor_applications/${applicationId}`, updates);
      return true;
    } catch (error) {
      console.error("Error updating application status:", error);
      return false;
    }
  }
}

// Export singleton instance
export const adminTutorApplicationService = new AdminTutorApplicationService();
export default adminTutorApplicationService;
