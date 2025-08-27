/**
 * SECURITY NOTICE: This file has been refactored to eliminate public URL exposure
 *
 * ⚠️  TEMPORARY IMPLEMENTATION - DATABASE MIGRATION REQUIRED ⚠️
 *
 * CHANGES MADE:
 * - Removed getPublicUrl() calls that exposed premium content
 * - Prepared for file_path storage instead of file_url persistence
 * - Implemented signed URL generation for secure file access
 * - Added getTutorNoteFileUrl() for on-demand secure access
 * - Updated all data transformations to never expose URLs
 *
 * ⚠️  CURRENT STATE: Using file_url fallback until migration completes ⚠️
 *
 * CRITICAL: This code will crash at runtime if deployed without the database migration!
 * The code expects a file_path column that doesn't exist yet.
 *
 * IMMEDIATE ACTIONS REQUIRED:
 * 1. Add file_path column to tutor_notes table
 * 2. Migrate existing file_url data to file_path
 * 3. Update UI components to use getTutorNoteFileUrl()
 * 4. Remove file_url column after migration
 *
 * SECURITY BENEFITS (after migration):
 * - Premium content no longer accessible via public URLs
 * - File access requires authentication and generates short-lived URLs
 * - Prevents entitlement bypass attacks
 */

import { supabase } from "./supabase";
import type { Database } from "@/types/database";

type TutorNote = Database["public"]["Tables"]["tutor_notes"]["Row"];
export type TutorNoteWithDetails =
  Database["public"]["Functions"]["search_tutor_notes"]["Returns"][0];

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
        note_subjects(
          id,
          name,
          display_name,
          color
        ),
        grade_levels(
          id,
          code,
          display_name
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching tutor note:", error);
      throw error;
    }

    if (!data) {
      return null;
    }

    // Transform the data to match the TutorNoteWithDetails format
    // SECURE: Don't expose file_url, use file_path for secure access
    const transformedNote: TutorNoteWithDetails = {
      id: data.id,
      title: data.title,
      description: data.description,
      content: data.content,
      file_url: null, // SECURE: Never expose public URLs
      file_name: data.file_name,
      file_size: data.file_size,
      subject_id: data.subject_id,
      subject_name: data.note_subjects?.name || null,
      subject_display_name: data.note_subjects?.display_name || null,
      subject_color: data.note_subjects?.color || null,
      grade_level_id: data.grade_level_id,
      grade_level_code: data.grade_levels?.code || null,
      grade_level_display: data.grade_levels?.display_name || null,
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
 * Get secure file access for a tutor note
 * This function generates signed URLs on-demand for secure file access
 *
 * SECURITY MODEL:
 * - Public functions (getTutorNoteById) sanitize file_url to prevent URL exposure
 * - Internal secure functions fetch raw data to reconstruct storage paths
 * - This separation ensures security while maintaining functionality
 *
 * IMPLEMENTATION:
 * - Fetches raw file_path and file_url directly from database
 * - Prefers file_path when present (future secure approach)
 * - Falls back to parsing legacy file_url for backward compatibility
 * - Generates short-lived signed URLs for secure access
 */
export async function getTutorNoteSecureFile(noteId: string): Promise<{
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
}> {
  try {
    // Fetch raw row fields, not the sanitized view.
    const { data, error } = await supabase
      .from("tutor_notes")
      .select("file_path, file_url, file_name, file_size")
      .eq("id", noteId)
      .single();

    if (error) {
      console.error("Error fetching note file fields:", error);
      return { fileUrl: null, fileName: null, fileSize: null };
    }
    if (!data?.file_name) {
      return { fileUrl: null, fileName: null, fileSize: null };
    }

    // Preferred: signed URL from private file_path
    if (data.file_path) {
      const { data: signed, error: signErr } = await supabase.storage
        .from("tutor-materials")
        .createSignedUrl(data.file_path, 3600);
      if (signErr) {
        console.error("Error generating signed URL (file_path):", signErr);
        return {
          fileUrl: null,
          fileName: data.file_name,
          fileSize: data.file_size,
        };
      }
      return {
        fileUrl: signed.signedUrl,
        fileName: data.file_name,
        fileSize: data.file_size,
      };
    }

    // Legacy: reconstruct path from file_url if present (during migration)
    if (data.file_url) {
      try {
        const url = new URL(data.file_url);
        const pathParts = url.pathname.split("/").filter(Boolean);
        // Assuming last 3 segments = '<userId>/tutor-notes/<fileName>'
        const filePath = pathParts.slice(-3).join("/");
        const { data: signed, error: signErr } = await supabase.storage
          .from("tutor-materials")
          .createSignedUrl(filePath, 3600);
        if (signErr) {
          console.error("Error generating signed URL (legacy):", signErr);
          return {
            fileUrl: null,
            fileName: data.file_name,
            fileSize: data.file_size,
          };
        }
        return {
          fileUrl: signed.signedUrl,
          fileName: data.file_name,
          fileSize: data.file_size,
        };
      } catch (e) {
        console.error("Error parsing legacy file_url:", e);
      }
    }

    return {
      fileUrl: null,
      fileName: data.file_name,
      fileSize: data.file_size,
    };
  } catch (error) {
    console.error("Error in getTutorNoteSecureFile:", error);
    return { fileUrl: null, fileName: null, fileSize: null };
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
 *
 * SECURITY MODEL:
 * - Fetches raw file_path and file_url directly from database
 * - Prefers file_path when present (future secure approach)
 * - Falls back to parsing legacy file_url for backward compatibility
 * - Ensures proper cleanup of associated storage files
 */
export async function deleteTutorNote(id: string): Promise<void> {
  try {
    // Fetch raw file_path; the public getter intentionally hides it
    const { data: fileData, error: fetchErr } = await supabase
      .from("tutor_notes")
      .select("file_path, file_url")
      .eq("id", id)
      .single();

    if (fetchErr) {
      console.error("Error fetching file_path before delete:", fetchErr);
    } else if (fileData?.file_path) {
      // SECURE: Use stored file_path for direct deletion
      const { error: deleteFileError } = await supabase.storage
        .from("tutor-materials")
        .remove([fileData.file_path]);

      if (deleteFileError) {
        console.error("Error deleting file:", deleteFileError);
        // Continue with note deletion even if file deletion fails
      }
    } else if (fileData?.file_url) {
      // LEGACY: Handle file_url during migration period
      try {
        // Extract storage path from legacy URL
        const url = new URL(fileData.file_url);
        const pathParts = url.pathname.split("/").filter(Boolean);
        // Assuming last 3 segments = '<userId>/tutor-notes/<fileName>'
        const filePath = pathParts.slice(-3).join("/");

        if (filePath) {
          const { error: deleteFileError } = await supabase.storage
            .from("tutor-materials")
            .remove([filePath]);

          if (deleteFileError) {
            console.error("Error deleting legacy file:", deleteFileError);
            // Continue with note deletion even if file deletion fails
          }
        }
      } catch (urlError) {
        console.warn("Error parsing legacy file_url for deletion:", urlError);
        // Continue with note deletion even if we can't parse the URL
      }
    }

    // Delete the note
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
 *
 * NOTE: Returns fileUrl as string | null to handle signed URL generation failures gracefully
 * The file is still uploaded and stored even if signed URL generation fails
 */
export async function uploadTutorNoteFile(
  file: File,
  noteId: string
): Promise<{ fileUrl: string | null; fileName: string; fileSize: number }> {
  try {
    // Basic file validation
    if (!file || file.size === 0) {
      throw new Error("Invalid file: file is empty or undefined");
    }

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
      .upload(filePath, file, {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      throw uploadError;
    }

    // TEMPORARY: Store file_url until file_path migration is complete
    // TODO: Replace with file_path after database migration
    // For now, we'll store the file_path in file_url temporarily
    // This maintains backward compatibility until the migration
    const { error: updateError } = await supabase
      .from("tutor_notes")
      .update({
        file_url: filePath, // TEMPORARY: Store path in file_url until migration
        file_name: file.name,
        file_size: file.size,
      })
      .eq("id", noteId);

    if (updateError) {
      console.error("Error updating note with file info:", updateError);
      throw updateError;
    }

    // Generate a signed URL for immediate use (short-lived)
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("tutor-materials")
        .createSignedUrl(filePath, 3600); // 1-hour TTL

    if (signedUrlError) {
      console.error("Error generating signed URL:", signedUrlError);
      // Still return success since file was uploaded and path stored
      return {
        fileUrl: null,
        fileName: file.name,
        fileSize: file.size,
      };
    }

    return {
      fileUrl: signedUrlData.signedUrl,
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
 * Generate a signed URL for secure file access
 * This replaces the insecure public URL approach
 */
export async function getTutorNoteFileUrl(
  filePath: string | null,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!filePath) return null;

  try {
    const { data, error } = await supabase.storage
      .from("tutor-materials")
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error("Error generating signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error in getTutorNoteFileUrl:", error);
    return null;
  }
}

/**
 * Transform tutor note data for card display
 * Note: fileUrl will be null and should be fetched on-demand using getTutorNoteFileUrl
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
    fileUrl: null, // SECURE: Don't expose URLs in transformed data
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
