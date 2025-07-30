import { supabase } from "./supabase";
import { supabase as adminSupabase } from "./supabase";

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

      // First, let's test if we can access the table at all
      const { data: testData, error: testError } = await supabase
        .from("tutor_applications")
        .select("id")
        .limit(1);

      if (testError) {
        console.error("❌ Cannot access tutor_applications table:", testError);
        console.error("Error details:", testError);
        return [];
      }

      const { data, error } = await supabase
        .from("tutor_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        return [];
      }

      // Transform the data to match our interface
      const transformedApplications =
        data
          ?.map((app: any) => {
            try {
              return {
                id: app.id,
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
          })
          .filter((app): app is TutorApplication => app !== null) || [];
      return transformedApplications;
    } catch (error) {
      console.error("❌ Error in getAllApplications:", error);
      return [];
    }
  }

  // Get application statistics
  static async getApplicationStats(): Promise<ApplicationStats> {
    try {
      const { data: applications, error } = await supabase
        .from("tutor_applications")
        .select("application_status, created_at");

      if (error) {
        console.error("Error fetching application stats:", error);
        return {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          recentApplications: 0,
        };
      }

      const total = applications?.length || 0;
      const pending =
        applications?.filter((app) => app.application_status === "pending")
          .length || 0;
      const approved =
        applications?.filter((app) => app.application_status === "approved")
          .length || 0;
      const rejected =
        applications?.filter((app) => app.application_status === "rejected")
          .length || 0;

      // Recent applications (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentApplications =
        applications?.filter((app) => new Date(app.created_at) >= oneWeekAgo)
          .length || 0;

      return {
        total,
        pending,
        approved,
        rejected,
        recentApplications,
      };
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
    adminId: string,
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const updateData = {
        application_status: "approved",
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("tutor_applications")
        .update(updateData)
        .eq("id", applicationId)
        .select();

      if (error) {
        console.error("Error approving application:", error);
        return false;
      }

      return true;
      return true;
    } catch (error) {
      console.error("❌ Error approving application:", error);
      return false;
    }
  }

  // Reject an application
  static async rejectApplication(
    applicationId: string,
    adminId: string,
    rejectionReason: string,
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const updateData = {
        application_status: "rejected",
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("tutor_applications")
        .update(updateData)
        .eq("id", applicationId)
        .select();

      if (error) {
        console.error("Error rejecting application:", error);
        return false;
      }

      return true;
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

      const { data, error } = await supabase
        .from("tutor_applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (error) {
        console.error("Error fetching application:", error);
        return null;
      }

      if (!data) {
        console.log("Application not found");
        return null;
      }

      // Transform the data
      const application: TutorApplication = {
        id: data.id,
        user_id: data.user_id,
        applicant_email: data.applicant_email,
        full_name: data.full_name,
        phone_number: data.phone_number,
        subjects: Array.isArray(data.subjects)
          ? data.subjects
          : JSON.parse(data.subjects || "[]"),
        specializes_learning_disabilities:
          data.specializes_learning_disabilities || false,
        cv_file_name: data.cv_file_name,
        cv_url: data.cv_url,
        cv_file_size: data.cv_file_size,
        additional_notes: data.additional_notes,
        application_status: data.application_status || "pending",
        admin_notes: data.admin_notes,
        rejection_reason: data.rejection_reason,
        submitted_at: data.submitted_at,
        reviewed_at: data.reviewed_at,
        reviewed_by: data.reviewed_by,
        approved_by: data.approved_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
        // New fields
        postcode: data.postcode || 'N/A',
        past_experience: data.past_experience,
        weekly_availability: data.weekly_availability,
        employment_status: data.employment_status,
        education_level: data.education_level,
        average_weekly_hours: data.average_weekly_hours,
        expected_hourly_rate: data.expected_hourly_rate,
        based_in_country: data.based_in_country || 'Not specified',
      };

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

      const { error } = await supabase
        .from("tutor_applications")
        .update({
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (error) {
        console.error("Error updating application notes:", error);
        return false;
      }

      console.log("Application notes updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating application notes:", error);
      return false;
    }
  }
}
