import { useState, useEffect, useCallback } from "react";
import {
  sessionRatingService,
  type SessionRating,
  type TutorRatingStats,
} from "@/lib/sessionRatingService";
import { useAuth } from "@/contexts/AuthContext";

export const useSessionRating = (tutorId?: string) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<SessionRating[]>([]);
  const [stats, setStats] = useState<TutorRatingStats | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const loading = loadingRatings || loadingStats;
  const [ratingsError, setRatingsError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const error = ratingsError || statsError;

  // Load tutor ratings
  const loadTutorRatings = useCallback(async () => {
    if (!tutorId) return;

    try {
      setLoadingRatings(true);
      setRatingsError(null);
      const tutorRatings = await sessionRatingService.getByTutorId(tutorId);
      setRatings(tutorRatings);
    } catch (err) {
      setRatingsError(
        err instanceof Error ? err.message : "Failed to load ratings"
      );
      console.error("Error loading tutor ratings:", err);
    } finally {
      setLoadingRatings(false);
    }
  }, [tutorId]);

  // Load tutor rating stats
  const loadTutorStats = useCallback(async () => {
    if (!tutorId) return;

    try {
      setLoadingStats(true);
      setStatsError(null);
      const tutorStats = await sessionRatingService.getTutorStats(tutorId);
      setStats(tutorStats);
    } catch (err) {
      setStatsError(
        err instanceof Error ? err.message : "Failed to load rating stats"
      );
      console.error("Error loading tutor rating stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, [tutorId]);

  // Check if current user has rated a specific session
  const hasRatedSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        return await sessionRatingService.hasStudentRated(sessionId, user.id);
      } catch (err) {
        console.error("Error checking if session was rated:", err);
        return false;
      }
    },
    [user]
  );

  // Create a new rating
  const createRating = useCallback(
    async (ratingData: {
      sessionId: string;
      tutorId: string;
      rating: number;
      reviewText?: string;
      isAnonymous?: boolean;
    }) => {
      if (!user) {
        throw new Error("User must be logged in to create a rating");
      }

      try {
        const newRating = await sessionRatingService.create(ratingData);

        // Update local state
        setRatings((prev) => [newRating, ...prev]);

        // Reload stats to get updated averages
        if (ratingData.tutorId === tutorId) {
          await loadTutorStats();
        }

        return newRating;
      } catch (err) {
        console.error("Error creating rating:", err);
        throw err;
      }
    },
    [user, tutorId, loadTutorStats]
  );

  // Update an existing rating
  const updateRating = useCallback(
    async (
      ratingId: string,
      updates: {
        rating?: number;
        reviewText?: string;
        isAnonymous?: boolean;
      }
    ) => {
      try {
        const updatedRating = await sessionRatingService.update(
          ratingId,
          updates
        );

        // Update local state
        setRatings((prev) =>
          prev.map((rating) =>
            rating._id === ratingId ? updatedRating : rating
          )
        );

        // Reload stats to get updated averages
        if (tutorId) {
          await loadTutorStats();
        }

        return updatedRating;
      } catch (err) {
        console.error("Error updating rating:", err);
        throw err;
      }
    },
    [tutorId, loadTutorStats]
  );

  // Delete a rating
  const deleteRating = useCallback(
    async (ratingId: string) => {
      try {
        if (!user) {
          throw new Error("User must be authenticated to delete a rating");
        }

        await sessionRatingService.delete(ratingId);

        // Update local state
        setRatings((prev) => prev.filter((rating) => rating._id !== ratingId));

        // Reload stats to get updated averages
        if (tutorId) {
          await loadTutorStats();
        }
      } catch (err) {
        console.error("Error deleting rating:", err);
        throw err;
      }
    },
    [user, tutorId, loadTutorStats]
  );

  // Load data when tutorId changes
  useEffect(() => {
    if (tutorId) {
      loadTutorRatings();
      loadTutorStats();
    }
  }, [tutorId, loadTutorRatings, loadTutorStats]);

  return {
    ratings,
    stats,
    loading,
    error,
    hasRatedSession,
    createRating,
    updateRating,
    deleteRating,
    loadTutorRatings,
    loadTutorStats,
  };
};
