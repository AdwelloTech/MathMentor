import { supabase } from "./supabase";

export interface SessionRating {
  id: string;
  session_id: string;
  student_id: string;
  tutor_id: string;
  rating: number;
  review_text?: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;

  // Joined fields from profiles table
  student?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };

  // Joined fields from tutor_classes table
  session?: {
    id: string;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
  };
}

export interface CreateRatingData {
  session_id: string;
  student_id: string;
  tutor_id: string;
  rating: number;
  review_text?: string;
  is_anonymous?: boolean;
}

export interface UpdateRatingData {
  rating?: number;
  review_text?: string;
  is_anonymous?: boolean;
}

export interface TutorRatingStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
}

export const sessionRatingService = {
  // Create a new rating
  create: async (ratingData: CreateRatingData): Promise<SessionRating> => {
    // Validate rating bounds (1-5)
    if (
      typeof ratingData.rating !== "number" ||
      ratingData.rating < 1 ||
      ratingData.rating > 5
    ) {
      throw new Error("Rating must be an integer between 1 and 5.");
    }

    const payload = {
      is_anonymous: false,
      ...ratingData,
    };

    const { data, error } = await supabase
      .from("session_ratings")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error creating rating:", error.message);
      throw new Error(`Failed to create rating: ${error.message}`);
    }

    return data;
  },

  // Update an existing rating
  update: async (
    ratingId: string,
    updates: UpdateRatingData
  ): Promise<SessionRating> => {
    // Validate rating bounds (1-5) if rating is being updated
    if (updates.rating != null) {
      if (
        typeof updates.rating !== "number" ||
        updates.rating < 1 ||
        updates.rating > 5
      ) {
        throw new Error("Rating must be an integer between 1 and 5.");
      }
    }

    const { data, error } = await supabase
      .from("session_ratings")
      .update(updates)
      .eq("id", ratingId)
      .select()
      .single();

    if (error) {
      console.error("Error updating rating:", error.message);
      throw new Error(`Failed to update rating: ${error.message}`);
    }

    return data;
  },

  // Get rating by ID
  getById: async (ratingId: string): Promise<SessionRating | null> => {
    const { data, error } = await supabase
      .from("session_ratings")
      .select("*")
      .eq("id", ratingId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching rating:", error);
      throw new Error(`Failed to fetch rating: ${error.message}`);
    }

    return data;
  },

  // Get rating for a specific session and student
  getBySessionAndStudent: async (
    sessionId: string,
    studentId: string
  ): Promise<SessionRating | null> => {
    const { data, error } = await supabase
      .from("session_ratings")
      .select("*")
      .eq("session_id", sessionId)
      .eq("student_id", studentId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching rating:", error.message);
      throw new Error(`Failed to fetch rating: ${error.message}`);
    }

    return data;
  },

  // Get all ratings for a tutor with proper joins
  getByTutorId: async (tutorId: string): Promise<SessionRating[]> => {
    const { data, error } = await supabase
      .from("session_ratings")
      .select(
        `
        *,
        student:profiles!session_ratings_student_id_fkey(id, full_name, avatar_url),
        session:tutor_classes!session_ratings_session_id_fkey(id, title, date, start_time, end_time, duration_minutes)
      `
      )
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tutor ratings:", error);
      throw new Error(`Failed to fetch tutor ratings: ${error.message}`);
    }

    return data || [];
  },

  // Get all ratings for a session with proper joins
  getBySessionId: async (sessionId: string): Promise<SessionRating[]> => {
    const { data, error } = await supabase
      .from("session_ratings")
      .select(
        `
        *,
        student:profiles!session_ratings_student_id_fkey(id, full_name, avatar_url),
        tutor:profiles!session_ratings_tutor_id_fkey(id, full_name, avatar_url)
      `
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching session ratings:", error);
      throw new Error(`Failed to fetch session ratings: ${error.message}`);
    }

    return data || [];
  },

  // Get tutor rating statistics using proper aggregation
  getTutorStats: async (tutorId: string): Promise<TutorRatingStats> => {
    const { data, error } = await supabase
      .from("session_ratings")
      .select("rating")
      .eq("tutor_id", tutorId);

    if (error) {
      console.error("Error fetching tutor rating stats:", error);
      throw new Error(`Failed to fetch tutor rating stats: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
      };
    }

    // Calculate statistics manually since RPC might not be available
    const totalReviews = data.length;
    const totalRating = data.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = totalRating / totalReviews;

    const ratingDistribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    data.forEach((item) => {
      ratingDistribution[item.rating as keyof typeof ratingDistribution]++;
    });

    return {
      average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      total_reviews: totalReviews,
      rating_distribution: ratingDistribution,
    };
  },

  // Check if student has already rated a session
  hasStudentRated: async (
    sessionId: string,
    studentId: string
  ): Promise<boolean> => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("🔍 hasStudentRated called with:", {
        sessionId,
        studentId,
      });
    }

    const { data, error } = await supabase
      .from("session_ratings")
      .select("id")
      .eq("session_id", sessionId)
      .eq("student_id", studentId)
      .single();

    if (process.env.NODE_ENV !== "production") {
      console.debug("🔍 hasStudentRated result:", {
        data,
        error,
        errorCode: error?.code,
      });
    }

    if (error && error.code !== "PGRST116") {
      console.error("Error checking if student rated:", error.message);
      throw new Error(`Failed to check rating: ${error.message}`);
    }

    const result = !!data;
    if (process.env.NODE_ENV !== "production") {
      console.debug("🔍 hasStudentRated returning:", result);
    }
    return result;
  },

  // Delete a rating (only by the student who created it)
  delete: async (ratingId: string, currentUserId: string): Promise<void> => {
    const { error } = await supabase
      .from("session_ratings")
      .delete()
      .eq("id", ratingId)
      .eq("student_id", currentUserId);

    if (error) {
      console.error("Error deleting rating:", error.message);
      throw new Error(`Failed to delete rating: ${error.message}`);
    }
  },

  // Debug function to check database state (development only)
  debugSessionRatings: async (sessionId: string): Promise<any> => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Debug function not available in production");
    }

    if (process.env.NODE_ENV !== "production") {
      console.debug("🔍 Debug: Checking all ratings for session:", sessionId);
    }

    // Check without any filters first
    const { data: allData, error: allError } = await supabase
      .from("session_ratings")
      .select("*");

    if (process.env.NODE_ENV !== "production") {
      console.debug("🔍 All ratings in database:", { allData, allError });
    }

    // Check with session filter
    const { data: sessionData, error: sessionError } = await supabase
      .from("session_ratings")
      .select("*")
      .eq("session_id", sessionId);

    if (process.env.NODE_ENV !== "production") {
      console.debug("🔍 Ratings for this session:", {
        sessionData,
        sessionError,
      });
    }

    return { allData, sessionData };
  },

  // Get rating with full session and user details
  getRatingWithDetails: async (ratingId: string): Promise<any> => {
    const { data, error } = await supabase
      .from("session_ratings")
      .select(
        `
        *,
        session:tutor_classes!session_ratings_session_id_fkey(
          id, title, date, start_time, end_time, duration_minutes, description
        ),
        student:profiles!session_ratings_student_id_fkey(
          id, full_name, avatar_url, email
        ),
        tutor:profiles!session_ratings_tutor_id_fkey(
          id, full_name, avatar_url, email
        )
      `
      )
      .eq("id", ratingId)
      .single();

    if (error) {
      console.error("Error fetching rating with details:", error);
      throw new Error(`Failed to fetch rating details: ${error.message}`);
    }

    return data;
  },
};
