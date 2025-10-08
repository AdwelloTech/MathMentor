import apiClient from "./apiClient";

export interface NotesSearchParams {
  searchTerm?: string;
  subjectFilter?: string;
  gradeFilter?: string;
}

export interface NoteCardProps {
  id: string;
  title: string;
  description: string | null;
  subjectName: string | null;
  subjectDisplayName: string | null;
  subjectColor: string | null;
  gradeLevelDisplay: string | null;
  viewCount: number;
  createdAt: string;
}

export interface StudyNoteWithDetails {
  _id: string;
  title: string;
  description: string | null;
  content: string;
  subjectId?: {
    _id: string;
    name: string;
    displayName: string;
    color: string;
  };
  gradeLevelId?: {
    _id: string;
    code: string;
    displayName: string;
  };
  createdBy: string;
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteSubject {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Search and filter study notes
 */
export async function searchStudyNotes(
  params: NotesSearchParams = {}
): Promise<StudyNoteWithDetails[]> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.searchTerm) {
      queryParams.append('q', params.searchTerm);
    }
    if (params.subjectFilter) {
      queryParams.append('subjectId', params.subjectFilter);
    }
    if (params.gradeFilter) {
      queryParams.append('gradeLevelId', params.gradeFilter);
    }

    const data = await apiClient.get<StudyNoteWithDetails[]>(
      `/api/study-notes?${queryParams.toString()}`
    );

    return data || [];
  } catch (error) {
    console.error("Error in searchStudyNotes:", error);
    throw error;
  }
}

/**
 * Get all note subjects for filtering
 */
export async function getNoteSubjects(): Promise<NoteSubject[]> {
  try {
    console.log("Fetching note subjects from API...");
    const response = await apiClient.get("/api/subjects");

    console.log("Subjects API response:", response);

    if (!response || !Array.isArray(response)) {
      console.warn("No data in subjects response");
      return [];
    }

    const subjects = response.map((subject: any) => ({
      id: subject._id,
      name: subject.name,
      display_name: subject.displayName,
      description: subject.description || null,
      color: subject.color,
      is_active: true,
      sort_order: subject.sortOrder || 0,
      created_at: subject.createdAt,
      updated_at: subject.updatedAt,
    }));

    console.log("Note subjects fetched successfully:", subjects);
    return subjects;
  } catch (error) {
    console.error("Error in getNoteSubjects:", error);
    throw error;
  }
}

/**
 * Get a single study note by ID
 */
export async function getStudyNoteById(
  id: string
): Promise<StudyNoteWithDetails | null> {
  try {
    const data = await apiClient.get<StudyNoteWithDetails>(`/api/study-notes/${id}`);
    return data;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    console.error("Error in getStudyNoteById:", error);
    throw error;
  }
}

/**
 * Increment the view count for a note
 */
export async function incrementNoteViewCount(noteId: string): Promise<void> {
  try {
    // The backend should handle incrementing view count when fetching a note
    // For now, we'll make a simple request to increment it
    // If you have a specific endpoint for this, use it
    await apiClient.get(`/api/study-notes/${noteId}`);
  } catch (error) {
    console.error("Error in incrementNoteViewCount:", error);
    // Don't throw - view count increment failures shouldn't break the app
  }
}

/**
 * Transform study note data for card display
 */
export function transformNoteForCard(
  note: StudyNoteWithDetails
): NoteCardProps {
  return {
    id: note._id,
    title: note.title,
    description: note.description,
    subjectName: note.subjectId?.name || null,
    subjectDisplayName: note.subjectId?.displayName || null,
    subjectColor: note.subjectId?.color || null,
    gradeLevelDisplay: note.gradeLevelId?.displayName || null,
    viewCount: note.viewCount,
    createdAt: note.createdAt,
  };
}

/**
 * Format date for display
 */
export function formatNoteDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    }
    return `${Math.floor(diffInHours)} hour${
      Math.floor(diffInHours) !== 1 ? "s" : ""
    } ago`;
  } else if (diffInHours < 168) {
    // 7 days
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

/**
 * Get subject color with fallback
 */
export function getSubjectColor(color: string | null): string {
  return color || "#3B82F6"; // Default blue
}

/**
 * Truncate text for card display
 */
export function truncateText(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}
