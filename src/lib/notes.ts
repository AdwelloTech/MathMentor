import { supabase } from "./supabase";
import type { Database } from "@/types/database";

type StudyNoteWithDetails =
  Database["public"]["Functions"]["search_study_notes"]["Returns"][0];
type NoteSubject = Database["public"]["Tables"]["note_subjects"]["Row"];

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

/**
 * Search and filter study notes
 */
export async function searchStudyNotes(
  params: NotesSearchParams = {}
): Promise<StudyNoteWithDetails[]> {
  try {
    const { data, error } = await supabase.rpc("search_study_notes", {
      search_term: params.searchTerm || "",
      subject_filter: params.subjectFilter || null,
      grade_filter: params.gradeFilter || null,
    });

    if (error) {
      console.error("Error searching study notes:", error);
      throw error;
    }

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
    const apiClient = (await import("./apiClient")).default;
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
): Promise<(StudyNoteWithDetails & { subject_id: string | null }) | null> {
  try {
    // First get the basic note data with subject_id
    const { data: noteData, error: noteError } = await (supabase as any)
      .from("study_notes")
      .select(
        `
        *,
        note_subjects!inner(
          id,
          name,
          display_name,
          color
        )
      `
      )
      .eq("id", id)
      .single();

    if (noteError) {
      console.error("Error fetching study note:", noteError);
      throw noteError;
    }

    if (!noteData) {
      return null;
    }

    // Transform the data to match the StudyNoteWithDetails format
    const transformedNote: StudyNoteWithDetails & {
      subject_id: string | null;
    } = {
      id: noteData.id,
      title: noteData.title,
      description: noteData.description,
      content: noteData.content,
      subject_id: noteData.subject_id, // Include the subject_id
      subject_name: noteData.note_subjects?.name || null,
      subject_display_name: noteData.note_subjects?.display_name || null,
      subject_color: noteData.note_subjects?.color || null,
      grade_level_code: null, // Not implemented yet
      grade_level_display: null, // Not implemented yet
      created_by: noteData.created_by,
      is_public: noteData.is_public,
      view_count: noteData.view_count,
      created_at: noteData.created_at,
    };

    return transformedNote;
  } catch (error) {
    console.error("Error in getStudyNoteById:", error);
    throw error;
  }
}

/**
 * Increment the view count for a note
 */
export async function incrementNoteViewCount(noteId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("increment_note_view_count", {
      note_id: noteId,
    });

    if (error) {
      console.error("Error incrementing note view count:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in incrementNoteViewCount:", error);
    throw error;
  }
}

/**
 * Transform study note data for card display
 */
export function transformNoteForCard(
  note: StudyNoteWithDetails
): NoteCardProps {
  return {
    id: note.id,
    title: note.title,
    description: note.description,
    subjectName: note.subject_name,
    subjectDisplayName: note.subject_display_name,
    subjectColor: note.subject_color,
    gradeLevelDisplay: note.grade_level_display,
    viewCount: note.view_count,
    createdAt: note.created_at,
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
