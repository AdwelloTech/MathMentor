import { supabase } from "./supabase";
import type { Database } from "@/types/database";

type TutorNote = Database["public"]["Tables"]["tutor_notes"]["Row"];
export type TutorNoteWithDetails =
  Database["public"]["Functions"]["search_tutor_notes"]["Returns"][0];
type NoteSubject = Database["public"]["Tables"]["note_subjects"]["Row"];

// Re-export getNoteSubjects from notes.ts for convenience
export { getNoteSubjects } from "./notes";

export interface TutorNotesSearchParams {
  searchTerm?: string;
  subjectFilter?: string;
  premiumOnly?: boolean;
  tutorId?: string;
}

export interface TutorNoteCardProps {
  id: string;
  title: string;
  description: string | null;
  subjectName: string | null;
  subjectDisplayName: string | null;
  subjectColor: string | null;
  gradeLevelDisplay: string | null;
  isPremium: boolean;
  viewCount: number;
  downloadCount: number;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string | null;
}

export interface CreateTutorNoteData {
  title: string;
  description?: string;
  content?: string;
  subjectId?: string;
  gradeLevelId?: string;
  isPremium: boolean;
  tags?: string[];
}

export interface UpdateTutorNoteData {
  title?: string;
  description?: string;
  content?: string;
  subjectId?: string;
  gradeLevelId?: string;
  isPremium?: boolean;
  tags?: string[];
}

/**
 * Search and filter tutor notes
 */
export async function searchTutorNotes(
  params: TutorNotesSearchParams = {}
): Promise<TutorNoteWithDetails[]> {
  try {
    const { data, error } = await supabase.rpc("search_tutor_notes", {
      search_term: params.searchTerm || "",
      subject_filter: params.subjectFilter || null,
      premium_only: params.premiumOnly || false,
      tutor_id: params.tutorId || null,
    });

    if (error) {
      console.error("Error searching tutor notes:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in searchTutorNotes:", error);
    throw error;
  }
}

/**
 * Get tutor notes by tutor ID
 */
export async function getTutorNotesByTutorId(
  tutorId: string
): Promise<TutorNoteWithDetails[]> {
  try {
    const { data, error } = await supabase.rpc("search_tutor_notes", {
      search_term: "",
      subject_filter: null,
      premium_only: false,
      tutor_id: tutorId,
    });

    if (error) {
      console.error("Error fetching tutor notes:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getTutorNotesByTutorId:", error);
    throw error;
  }
}

/**
 * Get a single tutor note by ID
 */
export async function getTutorNoteById(
  id: string
): Promise<TutorNoteWithDetails | null> {
  try {
    const { data, error } = await supabase
      .from("tutor_notes")
      .select(
        `
        *,
        note_subjects!left(
          id,
          name,
          display_name,
          color
        ),
        grade_levels!left(
          id,
          code,
          display_name
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching tutor note:", error);
      throw error;
    }

    if (!data) {
      return null;
    }

    // Transform the data to match the TutorNoteWithDetails format
    const ns = Array.isArray(data.note_subjects)
      ? data.note_subjects[0]
      : (data.note_subjects as any | null);
    const gl = Array.isArray(data.grade_levels)
      ? data.grade_levels[0]
      : (data.grade_levels as any | null);

    const transformedNote: TutorNoteWithDetails = {
      id: data.id,
      title: data.title,
      description: data.description,
      content: data.content,
      file_url: data.file_url,
      file_name: data.file_name,
      file_size: data.file_size,
      subject_id: data.subject_id,
      subject_name: ns?.name ?? null,
      subject_display_name: ns?.display_name ?? null,
      subject_color: ns?.color ?? null,
      grade_level_id: data.grade_level_id,
      grade_level_code: gl?.code ?? null,
      grade_level_display: gl?.display_name ?? null,
      created_by: data.created_by,
      is_premium: data.is_premium,
      view_count: data.view_count,
      download_count: data.download_count,
      tags: data.tags,
      created_at: data.created_at,
    };

    return transformedNote;
  } catch (error) {
    console.error("Error in getTutorNoteById:", error);
    throw error;
  }
}

/**
 * Create a new tutor note
 */
export async function createTutorNote(
  noteData: CreateTutorNoteData,
  userId: string
): Promise<TutorNote> {
  try {
    const { data, error } = await supabase
      .from("tutor_notes")
      .insert({
        title: noteData.title.trim(),
        description: noteData.description?.trim() || null,
        content: noteData.content?.trim() || null,
        subject_id: noteData.subjectId || null,
        grade_level_id: noteData.gradeLevelId || null,
        created_by: userId,
        is_premium: noteData.isPremium,
        tags: noteData.tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating tutor note:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in createTutorNote:", error);
    throw error;
  }
}

/**
 * Update a tutor note
 */
export async function updateTutorNote(
  id: string,
  noteData: UpdateTutorNoteData
): Promise<TutorNote> {
  try {
    const updateData: any = {};

    if (noteData.title !== undefined) updateData.title = noteData.title.trim();
    if (noteData.description !== undefined)
      updateData.description = noteData.description?.trim() || null;
    if (noteData.content !== undefined)
      updateData.content = noteData.content?.trim() || null;
    if (noteData.subjectId !== undefined)
      updateData.subject_id = noteData.subjectId;
    if (noteData.gradeLevelId !== undefined)
      updateData.grade_level_id = noteData.gradeLevelId;
    if (noteData.isPremium !== undefined)
      updateData.is_premium = noteData.isPremium;
    if (noteData.tags !== undefined) updateData.tags = noteData.tags;

    const { data, error } = await supabase
      .from("tutor_notes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating tutor note:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in updateTutorNote:", error);
    throw error;
  }
}

/**
 * Delete a tutor note
 */
export async function deleteTutorNote(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("tutor_notes").delete().eq("id", id);

    if (error) {
      console.error("Error deleting tutor note:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteTutorNote:", error);
    throw error;
  }
}

/**
 * Upload file for tutor note
 */
export async function uploadTutorNoteFile(
  file: File,
  noteId: string
): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
  try {
    // Get the current user ID for the folder structure
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${noteId}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/tutor-notes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("tutor-materials")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("tutor-materials").getPublicUrl(filePath);

    // Update the note with file information
    const { error: updateError } = await supabase
      .from("tutor_notes")
      .update({
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
      })
      .eq("id", noteId);

    if (updateError) {
      console.error("Error updating note with file info:", updateError);
      throw updateError;
    }

    return {
      fileUrl: publicUrl,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (error) {
    console.error("Error in uploadTutorNoteFile:", error);
    throw error;
  }
}

/**
 * Increment the view count for a tutor note
 */
export async function incrementTutorNoteViewCount(
  noteId: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc("increment_tutor_note_view_count", {
      note_id: noteId,
    });

    if (error) {
      console.error("Error incrementing tutor note view count:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in incrementTutorNoteViewCount:", error);
    throw error;
  }
}

/**
 * Increment the view count for a tutor note (unique per user)
 * Only counts one view per user per note
 */
export async function incrementTutorNoteViewCountUnique(
  noteId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc(
      "increment_tutor_note_view_count_unique",
      {
        note_id: noteId,
        user_id: userId,
      }
    );

    if (error) {
      console.error("Error incrementing unique tutor note view count:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in incrementTutorNoteViewCountUnique:", error);
    throw error;
  }
}

/**
 * Increment the download count for a tutor note
 */
export async function incrementTutorNoteDownloadCount(
  noteId: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc(
      "increment_tutor_note_download_count",
      {
        note_id: noteId,
      }
    );

    if (error) {
      console.error("Error incrementing tutor note download count:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in incrementTutorNoteDownloadCount:", error);
    throw error;
  }
}

/**
 * Transform tutor note data for card display
 */
export function transformTutorNoteForCard(
  note: TutorNoteWithDetails
): TutorNoteCardProps {
  return {
    id: note.id,
    title: note.title,
    description: note.description,
    subjectName: note.subject_name,
    subjectDisplayName: note.subject_display_name,
    subjectColor: note.subject_color,
    gradeLevelDisplay: note.grade_level_display,
    isPremium: note.is_premium,
    viewCount: note.view_count,
    downloadCount: note.download_count,
    fileUrl: note.file_url,
    fileName: note.file_name,
    fileSize: note.file_size,
    createdAt: note.created_at,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Format date for display
 */
export function formatTutorNoteDate(dateString: string | null): string {
  if (!dateString) {
    return "Recently";
  }

  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return "Recently";
  }

  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const diffInMinutes = Math.max(0, Math.floor(diffInHours * 60));
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
export function getTutorNoteSubjectColor(color: string | null): string {
  return color || "#3B82F6"; // Default blue
}

/**
 * Truncate text for card display
 */
export function truncateTutorNoteText(
  text: string,
  maxLength: number = 120
): string {
  if (!text || text.length <= maxLength) return text || "";
  return text.substring(0, maxLength).trim() + "...";
}
