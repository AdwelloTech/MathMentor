import { supabase } from "./supabase";

export interface Tutor {
  id: string;
  user_id: string;
  email: string;
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
  profile_completed: boolean;
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
  under_review: number;
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
      // Get all tutors first
      const { data: tutors, error: tutorsError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "tutor")
        .order("created_at", { ascending: false });

      if (tutorsError) {
        console.error("Error fetching tutors:", tutorsError);
        throw tutorsError;
      }

      if (!tutors || tutors.length === 0) {
        return [];
      }

      // Get all tutor applications
      const { data: applications, error: applicationsError } = await supabase
        .from("tutor_applications")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError);
        throw applicationsError;
      }

      // Create a map of user_id to application for quick lookup
      const applicationMap = new Map();
      applications?.forEach((app) => {
        if (!applicationMap.has(app.user_id)) {
          applicationMap.set(app.user_id, app);
        }
      });

      // Transform the data to include application information
      const transformedTutors = tutors.map((tutor) => {
        const application = applicationMap.get(tutor.user_id);
        return {
          ...tutor,
          application_status: application?.application_status ?? undefined,
          submitted_at: application?.submitted_at ?? undefined,
          reviewed_at: application?.reviewed_at ?? undefined,
        };
      });

      return transformedTutors;
    } catch (error) {
      console.error("Error in getAllTutors:", error);
      throw error;
    }
  }

  async getTutorById(tutorId: string): Promise<Tutor | null> {
    try {
      // Get tutor profile
      const { data: tutor, error: tutorError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", tutorId)
        .eq("role", "tutor")
        .single();

      if (tutorError) {
        console.error("Error fetching tutor:", tutorError);
        throw tutorError;
      }

      if (!tutor) return null;

      // Get tutor application
      const { data: applications, error: applicationsError } = await supabase
        .from("tutor_applications")
        .select("*")
        .eq("user_id", tutor.user_id)
        .order("submitted_at", { ascending: false })
        .limit(1);

      if (applicationsError) {
        console.error("Error fetching applications:", applicationsError);
        throw applicationsError;
      }

      const application = applications?.[0];

      // Transform the data
      return {
        ...tutor,
        application_status: application?.application_status ?? undefined,
        submitted_at: application?.submitted_at ?? undefined,
        reviewed_at: application?.reviewed_at ?? undefined,
      };
    } catch (error) {
      console.error("Error in getTutorById:", error);
      throw error;
    }
  }

  async updateTutorStatus(tutorId: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("id", tutorId);

      if (error) {
        console.error("Error updating tutor status:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in updateTutorStatus:", error);
      throw error;
    }
  }

  async deleteTutor(tutorId: string): Promise<void> {
    try {
      // First, delete related records (tutor applications, classes, etc.)
      // Note: This is a simplified version. In production, you might want to handle this more carefully

      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", tutorId);

      if (error) {
        console.error("Error deleting tutor:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in deleteTutor:", error);
      throw error;
    }
  }

  async getTutorClasses(tutorId: string): Promise<TutorClass[]> {
    try {
      // Get tutor classes
      const { data: classes, error: classesError } = await supabase
        .from("tutor_classes")
        .select("*")
        .eq("tutor_id", tutorId)
        .order("date", { ascending: false });

      if (classesError) {
        console.error("Error fetching tutor classes:", classesError);
        throw classesError;
      }

      if (!classes || classes.length === 0) {
        return [];
      }

      // Get class types
      const { data: classTypes, error: classTypesError } = await supabase
        .from("class_types")
        .select("*");

      if (classTypesError) {
        console.error("Error fetching class types:", classTypesError);
        throw classTypesError;
      }

      // Create a map of class type IDs to class type objects
      const classTypeMap = new Map();
      classTypes?.forEach((type) => {
        classTypeMap.set(type.id, type);
      });

      // Get jitsi meetings for all classes
      const classIds = classes.map((c) => c.id);
      const { data: jitsiMeetings, error: jitsiError } = await supabase
        .from("jitsi_meetings")
        .select("*")
        .in("class_id", classIds);

      if (jitsiError) {
        console.error("Error fetching jitsi meetings:", jitsiError);
        throw jitsiError;
      }

      // Create a map of class IDs to jitsi meeting objects
      const jitsiMap = new Map();
      jitsiMeetings?.forEach((jitsi) => {
        jitsiMap.set(jitsi.class_id, jitsi);
      });

      // Combine the data
      const enrichedClasses = classes.map((classItem) => ({
        ...classItem,
        class_type: classTypeMap.get(classItem.class_type_id) || {
          id: classItem.class_type_id,
          name: "Unknown",
          duration_minutes: 0,
          description: null,
        },
        jitsi_meeting: jitsiMap.get(classItem.id) || null,
      }));

      return enrichedClasses;
    } catch (error) {
      console.error("Error in getTutorClasses:", error);
      throw error;
    }
  }

  async getTutorStats(): Promise<TutorStats> {
    try {
      // Get total tutors
      const { count: total, error: totalError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "tutor");

      if (totalError) throw totalError;

      // Get active tutors
      const { count: active, error: activeError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "tutor")
        .eq("is_active", true);

      if (activeError) throw activeError;

      // Get inactive tutors
      const { count: inactive, error: inactiveError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "tutor")
        .eq("is_active", false);

      if (inactiveError) throw inactiveError;

      // Get application status counts
      const { data: applications, error: applicationsError } = await supabase
        .from("tutor_applications")
        .select("application_status");

      if (applicationsError) throw applicationsError;

      const approved =
        applications?.filter((app) => app.application_status === "approved")
          .length || 0;
      const pending =
        applications?.filter((app) => app.application_status === "pending")
          .length || 0;
      const rejected =
        applications?.filter((app) => app.application_status === "rejected")
          .length || 0;
      const under_review =
        applications?.filter((app) => app.application_status === "under_review")
          .length || 0;

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentRegistrations, error: recentError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "tutor")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (recentError) throw recentError;

      return {
        total: total || 0,
        active: active || 0,
        inactive: inactive || 0,
        approved,
        pending,
        rejected,
        under_review,
        recentRegistrations: recentRegistrations || 0,
      };
    } catch (error) {
      console.error("Error in getTutorStats:", error);
      throw error;
    }
  }
}

export const adminTutorService = new AdminTutorService();
