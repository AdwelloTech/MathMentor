import apiClient from "./apiClient";

export interface SessionRating {
  _id: string;
  sessionId: string;
  studentId: string;
  tutorId: string;
  rating: number;
  reviewText?: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;

  // Populated fields
  student?: {
    id: string;
    fullName: string;
    profileImageUrl?: string;
  };
  tutor?: {
    id: string;
    fullName: string;
    profileImageUrl?: string;
  };
  session?: {
    id: string;
    title: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
  };
}

export interface CreateRatingData {
  sessionId: string;
  tutorId: string;
  rating: number;
  reviewText?: string;
  isAnonymous?: boolean;
}

export interface UpdateRatingData {
  rating?: number;
  reviewText?: string;
  isAnonymous?: boolean;
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

    const data = await apiClient.post<SessionRating>("/api/ratings", ratingData);
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

    const data = await apiClient.put<SessionRating>(`/api/ratings/${ratingId}`, updates);
    return data;
  },

  // Get rating by ID
  getById: async (ratingId: string): Promise<SessionRating | null> => {
    try {
      const data = await apiClient.get<SessionRating>(`/api/ratings/${ratingId}`);
      return data;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get rating for a specific session and student
  getBySessionAndStudent: async (
    sessionId: string,
    studentId: string
  ): Promise<SessionRating | null> => {
    try {
      const data = await apiClient.get<SessionRating>(
        `/api/ratings/session/${sessionId}/student/${studentId}`
      );
      return data;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get all ratings for a tutor
  getByTutorId: async (tutorId: string): Promise<SessionRating[]> => {
    const data = await apiClient.get<SessionRating[]>(`/api/ratings/tutor/${tutorId}`);
    return data || [];
  },

  // Get all ratings for a session
  getBySessionId: async (sessionId: string): Promise<SessionRating[]> => {
    const data = await apiClient.get<SessionRating[]>(`/api/ratings/session/${sessionId}`);
    return data || [];
  },

  // Get tutor rating statistics
  getTutorStats: async (tutorId: string): Promise<TutorRatingStats> => {
    try {
      const data = await apiClient.get<TutorRatingStats>(`/api/ratings/tutor/${tutorId}/stats`);
      return data;
    } catch (error) {
      console.error("Error fetching tutor rating stats:", error);
      // Return default stats on error
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
      };
    }
  },

  // Check if student has already rated a session
  hasStudentRated: async (
    sessionId: string,
    studentId: string
  ): Promise<boolean> => {
    try {
      const data = await apiClient.get<{ hasRated: boolean }>(
        `/api/ratings/session/${sessionId}/student/${studentId}/check`
      );
      return data.hasRated;
    } catch (error) {
      console.error("Error checking if student rated:", error);
      return false;
    }
  },

  // Delete a rating (only by the student who created it)
  delete: async (ratingId: string): Promise<void> => {
    await apiClient.delete(`/api/ratings/${ratingId}`);
  },
};
