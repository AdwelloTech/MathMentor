import apiClient from "@/lib/apiClient";
import type { GradeLevel } from "@/types/auth";

// Cache for grade levels to avoid repeated database calls
let gradeLevelsCache: GradeLevel[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all active grade levels from the database
 */
export const fetchGradeLevels = async (): Promise<GradeLevel[]> => {
  const now = Date.now();

  // Return cached data if it's still fresh
  if (gradeLevelsCache && now - lastFetchTime < CACHE_DURATION) {
    return gradeLevelsCache;
  }

  try {
    console.log("Fetching grade levels from backend...");

    const data = await apiClient.get<any[]>("/api/grade-levels");

    // Transform backend data to match frontend interface
    const transformedData = data.map(item => ({
      id: item._id || item.id,
      code: item.code,
      display_name: item.displayName || item.display_name,
      sort_order: item.sortOrder || item.sort_order,
      category: item.category,
      is_active: item.isActive !== undefined ? item.isActive : item.is_active,
      created_at: item.createdAt || item.created_at,
      updated_at: item.updatedAt || item.updated_at,
    }));

    console.log(`Fetched ${transformedData?.length || 0} grade levels`);

    // Update cache
    gradeLevelsCache = transformedData || [];
    lastFetchTime = now;

    return gradeLevelsCache;
  } catch (error) {
    console.error("Failed to fetch grade levels:", error);

    // Return empty array on error, but log it
    return [];
  }
};

/**
 * Get grade levels grouped by category
 */
export const getGradeLevelsByCategory = async (): Promise<
  Record<string, GradeLevel[]>
> => {
  const gradeLevels = await fetchGradeLevels();

  return gradeLevels.reduce((acc, gradeLevel) => {
    const category = gradeLevel.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(gradeLevel);
    return acc;
  }, {} as Record<string, GradeLevel[]>);
};

/**
 * Find a grade level by ID
 */
export const findGradeLevelById = async (
  id: string
): Promise<GradeLevel | null> => {
  const gradeLevels = await fetchGradeLevels();
  return gradeLevels.find((gl) => gl.id === id) || null;
};

/**
 * Find a grade level by code
 */
export const findGradeLevelByCode = async (
  code: string
): Promise<GradeLevel | null> => {
  const gradeLevels = await fetchGradeLevels();
  return gradeLevels.find((gl) => gl.code === code) || null;
};

/**
 * Clear the grade levels cache (useful for admin operations)
 */
export const clearGradeLevelsCache = (): void => {
  gradeLevelsCache = null;
  lastFetchTime = 0;
};

/**
 * Get grade level display name by ID (synchronous version for UI display)
 */
export const getGradeLevelDisplayName = (
  id: string | null | undefined
): string => {
  if (!id) return "Not specified";

  // Check cache first
  if (gradeLevelsCache) {
    const gradeLevel = gradeLevelsCache.find((gl) => gl.id === id);
    return gradeLevel?.display_name || "Unknown grade";
  }

  // If cache not available, return the ID for now
  // In practice, this should rarely happen as the cache is populated on app load
  return "Loading...";
};

// Import React for the hook
import React from "react";

/**
 * React hook for fetching grade levels
 */
export const useGradeLevels = () => {
  const [gradeLevels, setGradeLevels] = React.useState<GradeLevel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadGradeLevels = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGradeLevels();
      setGradeLevels(data);
    } catch (err: any) {
      setError(err.message || "Failed to load grade levels");
      console.error("Error in useGradeLevels:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadGradeLevels();
  }, [loadGradeLevels]);

  const refetch = React.useCallback(() => {
    clearGradeLevelsCache();
    return loadGradeLevels();
  }, [loadGradeLevels]);

  return {
    gradeLevels,
    loading,
    error,
    refetch,
  };
};
