import apiClient from "./apiClient";

export interface TutorApplication {
  id: string;
  user_id: string;
  applicant_email: string;
  full_name: string;
  phone_number: string;
  subjects: string[];
  specializes_learning_disabilities: boolean;
  cv_file_name: string;
  cv_url: string;
  cv_file_size: number;
  additional_notes: string | null;
  application_status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  // New fields added to tutor applications
  postcode: string;
  past_experience: string | null;
  weekly_availability: string | null;
  employment_status: string | null;
  education_level: string | null;
  average_weekly_hours: number | null;
  expected_hourly_rate: number | null;
  based_in_country: string;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  recentApplications: number;
}

export class AdminTutorApplicationService {
  // Fetch all tutor applications
  static async getAllApplications(): Promise<TutorApplication[]> {
    try {
      console.log("Fetching all tutor applications...");
      const applications = await apiClient.get<TutorApplication[]>('/api/admin/tutor-applications');

      // Transform the data to ensure proper typing and handle any malformed data
      const transformedApplications = applications.map((app: any) => {
        try {
          return {
            id: app.id || app._id,
            user_id: app.user_id,
            applicant_email: app.applicant_email,
            full_name: app.full_name,
            phone_number: app.phone_number,
            subjects: (() => {
              try {
                if (Array.isArray(app.subjects)) {
                  return app.subjects;
                }
                if (typeof app.subjects === "string") {
                  // Handle the malformed JSON string from your data
                  let cleaned = app.subjects;

                  // Remove outer quotes if present
                  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                    cleaned = cleaned.slice(1, -1);
                  }

                  // Replace escaped quotes
                  cleaned = cleaned.replace(/\\"/g, '"');

                  // Fix the malformed JSON (remove extra quotes and fix brackets)
                  cleaned = cleaned.replace(/^"|"$/g, "");
                  cleaned = cleaned.replace(/\]}$/, "}");

                  const parsed = JSON.parse(cleaned);
                  return parsed;
                }
                return [];
              } catch (parseError) {
                console.error("❌ Error parsing subjects:", parseError);
                console.error("Raw subjects data:", app.subjects);
                return [];
              }
            })(),
            specializes_learning_disabilities:
              app.specializes_learning_disabilities || false,
            cv_file_name: app.cv_file_name,
            cv_url: app.cv_url,
            cv_file_size: app.cv_file_size,
            additional_notes: app.additional_notes,
            application_status: app.application_status || "pending",
            admin_notes: app.admin_notes,
            rejection_reason: app.rejection_reason,
            submitted_at: app.submitted_at,
            reviewed_at: app.reviewed_at,
            reviewed_by: app.reviewed_by,
            approved_by: app.approved_by,
            created_at: app.created_at,
            updated_at: app.updated_at,
            // New fields
            postcode: app.postcode || "N/A",
            past_experience: app.past_experience,
            weekly_availability: app.weekly_availability,
            employment_status: app.employment_status,
            education_level: app.education_level,
            average_weekly_hours: app.average_weekly_hours,
            expected_hourly_rate: app.expected_hourly_rate,
            based_in_country: app.based_in_country || "Not specified",
          } as TutorApplication;
        } catch (transformError) {
          console.error(
            "Error transforming application data:",
            transformError
          );
          return null;
        }
      }).filter((app): app is TutorApplication => app !== null);

      console.log(`Successfully fetched ${transformedApplications.length} applications`);
      return transformedApplications;
    } catch (error) {
      console.error("❌ Error in getAllApplications:", error);
      return [];
    }
  }

  // Get application statistics
  static async getApplicationStats(): Promise<ApplicationStats> {
    try {
      console.log("Fetching application statistics...");
      const stats = await apiClient.get<ApplicationStats>('/api/admin/tutor-applications/stats');
      console.log("Application stats retrieved successfully:", stats);
      return stats;
    } catch (error) {
      console.error("Error fetching application stats:", error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        recentApplications: 0,
      };
    }
  }

  // Approve an application
  static async approveApplication(
    applicationId: string,
    adminNotes?: string
  ): Promise<boolean> {
    try {
      console.log("Approving application:", applicationId);

      // First get the application to find the user_id
      const application = await this.getApplicationById(applicationId);
      if (!application) {
        console.error("Application not found:", applicationId);
        return false;
      }

      const updateData = {
        status: "approved",
        admin_notes: adminNotes,
      };

      await apiClient.put(`/api/admin/tutor-applications/${application.user_id}`, updateData);
      console.log("Application approved successfully");
      return true;
    } catch (error) {
      console.error("❌ Error approving application:", error);
      return false;
    }
  }

  // Reject an application
  static async rejectApplication(
    applicationId: string,
    rejectionReason: string,
    adminNotes?: string
  ): Promise<boolean> {
    try {
      console.log("Rejecting application:", applicationId);

      // First get the application to find the user_id
      const application = await this.getApplicationById(applicationId);
      if (!application) {
        console.error("Application not found:", applicationId);
        return false;
      }

      const updateData = {
        status: "rejected",
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
      };

      await apiClient.put(`/api/admin/tutor-applications/${application.user_id}`, updateData);
      console.log("Application rejected successfully");
      return true;
    } catch (error) {
      console.error("❌ Error rejecting application:", error);
      return false;
    }
  }

  // Get application by ID
  static async getApplicationById(
    applicationId: string
  ): Promise<TutorApplication | null> {
    try {
      console.log("Fetching application by ID:", applicationId);

      // Get all applications and find the one with matching ID
      const applications = await this.getAllApplications();
      const application = applications.find(app => app.id === applicationId);

      if (!application) {
        console.log("Application not found");
        return null;
      }

      return application;
    } catch (error) {
      console.error("Error fetching application by ID:", error);
      return null;
    }
  }

  // Update application notes
  static async updateApplicationNotes(
    applicationId: string,
    adminNotes: string
  ): Promise<boolean> {
    try {
      console.log("Updating application notes:", applicationId);

      // First get the application to find the user_id and current status
      const application = await this.getApplicationById(applicationId);
      if (!application) {
        console.error("Application not found:", applicationId);
        return false;
      }

      // Update notes by calling the status update route with the current status
      const updateData = {
        status: application.application_status,
        admin_notes: adminNotes,
      };

      await apiClient.put(`/api/admin/tutor-applications/${application.user_id}`, updateData);
      console.log("Application notes updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating application notes:", error);
      return false;
    }
  }
}
