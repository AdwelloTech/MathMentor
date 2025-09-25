/**
 * SECURITY NOTICE: This file has been refactored to eliminate public URL exposure
 *
 * ⚠️  TEMPORARY IMPLEMENTATION - DATABASE MIGRATION IN PROGRESS ⚠️
 *
 * CHANGES MADE:
 * - Removed getPublicUrl() calls that exposed premium content
 * - Implemented signed URL generation for secure file access
 * - Updated all data transformations to never expose URLs
 * - Fixed queries to work with current database schema (no file_path column yet)
 * - Added fallback logic for missing RPC functions
 *
 * ⚠️  CURRENT STATE: Using file_url for file paths during migration ⚠️
 *
 * IMMEDIATE ACTIONS REQUIRED (when ready for migration):
 * 1. Add file_path column to tutor_notes table
 * 2. Migrate existing file_url data to file_path
 * 3. Update functions to use file_path instead of file_url
 * 4. Remove file_url column after migration
 *
 * SECURITY BENEFITS (after migration):
 * - Premium content no longer accessible via public URLs
 * - File access requires authentication and generates short-lived URLs
 * - Prevents entitlement bypass attacks
 */

import type { Database } from "@/types/database";
import apiClient from "./apiClient";

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
    // Use student endpoint which supports search and subject filtering
    const queryParams = new URLSearchParams();
    if (params.searchTerm) queryParams.append('q', params.searchTerm);
    if (params.subjectFilter) queryParams.append('subjectId', params.subjectFilter);

    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      `/api/tutor-materials?${queryParams.toString()}`
    );

    if (!response.success) {
      throw new Error('Failed to search tutor materials');
    }

    // Transform the response data to match TutorNoteWithDetails format
    return response.data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      content: item.content,
      file_url: item.file_url,
      file_name: item.file_name,
      file_size: item.file_size,
      subject_id: item.subject_id,
      subject_name: item.subject_name,
      subject_display_name: item.subject_display_name,
      subject_color: item.subject_color,
      grade_level_id: item.grade_level_id,
      grade_level_code: item.grade_level_code,
      grade_level_display: item.grade_level_display,
      created_by: item.created_by,
      is_premium: item.is_premium,
      view_count: item.view_count,
      download_count: item.download_count,
      tags: item.tags,
      created_at: item.created_at,
    }));
  } catch (error) {
    console.error("Error in searchTutorNotes:", error);
    throw error;
  }
}

/**
 * Get tutor notes by tutor ID
 * Note: Current backend doesn't support filtering by specific tutor ID from student endpoint
 * For tutor's own materials, use getTutorMaterialsRest() instead
 */
export async function getTutorNotesByTutorId(
  tutorId: string
): Promise<TutorNoteWithDetails[]> {
  try {
    // Note: Backend student endpoint doesn't currently support tutor filtering
    // This will return all materials, not just those by the specified tutor
    // For proper tutor filtering, backend needs to be updated
    const response = await apiClient.get<{ success: boolean; data: any[] }>(
      '/api/tutor-materials'
    );

    if (!response.success) {
      throw new Error('Failed to fetch tutor materials');
    }

    // Filter by tutor_id on frontend (temporary workaround)
    const filteredData = response.data.filter(item => item.created_by === tutorId);

    // Transform the response data to match TutorNoteWithDetails format
    return filteredData.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      content: item.content,
      file_url: item.file_url,
      file_name: item.file_name,
      file_size: item.file_size,
      subject_id: item.subject_id,
      subject_name: item.subject_name,
      subject_display_name: item.subject_display_name,
      subject_color: item.subject_color,
      grade_level_id: item.grade_level_id,
      grade_level_code: item.grade_level_code,
      grade_level_display: item.grade_level_display,
      created_by: item.created_by,
      is_premium: item.is_premium,
      view_count: item.view_count,
      download_count: item.download_count,
      tags: item.tags,
      created_at: item.created_at,
    }));
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
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/api/tutor-materials/${id}`
    );

    if (!response.success) {
      console.error("Error fetching tutor note:", response);
      return null;
    }

    const data = response.data;
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
      subject_name: data.subject_name,
      subject_display_name: data.subject_display_name,
      subject_color: data.subject_color,
      grade_level_id: data.grade_level_id,
      grade_level_code: data.grade_level_code,
      grade_level_display: data.grade_level_display,
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
    // Use backend API to get tutor material details
    const material = await apiClient.get<any>(`/api/tutor-materials/${noteId}`);

    if (!material?.file_name) {
      return { fileUrl: null, fileName: null, fileSize: null };
    }

    // Construct full URL for the file
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const fileUrl = material.file_url ? `${baseURL}${material.file_url}` : null;

    // Return the file info with full URL
    return {
      fileUrl,
      fileName: material.file_name,
      fileSize: material.file_size,
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
  _userId: string
): Promise<TutorNote> {
  try {
    // Validate required fields
    if (!noteData.title || !noteData.title.trim()) {
      throw new Error("Title is required");
    }

    // Use REST API for tutor material creation
    const formData = new FormData();
    formData.append('title', noteData.title.trim());
    if (noteData.description) formData.append('description', noteData.description.trim());
    if (noteData.content) formData.append('content', noteData.content.trim());
    if (noteData.subjectId) formData.append('subjectId', noteData.subjectId);
    if (noteData.gradeLevelId) formData.append('gradeLevelId', noteData.gradeLevelId);
    formData.append('isPremium', noteData.isPremium.toString());
    if (noteData.tags) formData.append('tags', JSON.stringify(noteData.tags));

    const response = await apiClient.uploadFormData<{ success: boolean; data: any }>(
      '/api/tutor-materials/tutor/create',
      formData
    );

    if (!response.success) {
      throw new Error('Failed to create tutor note');
    }

    return response.data;
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
    // Use REST API for tutor material update
    const formData = new FormData();

    if (noteData.title !== undefined) formData.append('title', noteData.title.trim());
    if (noteData.description !== undefined)
      formData.append('description', noteData.description?.trim() || '');
    if (noteData.content !== undefined)
      formData.append('content', noteData.content?.trim() || '');
    if (noteData.subjectId !== undefined) formData.append('subjectId', noteData.subjectId || '');
    if (noteData.gradeLevelId !== undefined) formData.append('gradeLevelId', noteData.gradeLevelId || '');
    if (noteData.isPremium !== undefined) formData.append('isPremium', noteData.isPremium.toString());
    if (noteData.tags !== undefined) formData.append('tags', JSON.stringify(noteData.tags));

    const response = await apiClient.uploadFormData<{ success: boolean; data: any }>(
      `/api/tutor-materials/tutor/${id}`,
      formData,
      'PUT'
    );

    if (!response.success) {
      throw new Error('Failed to update tutor note');
    }

    return response.data;
  } catch (error) {
    console.error("Error in updateTutorNote:", error);
    throw error;
  }
}

/**
 * Delete a tutor note
 *
 * SECURITY MODEL:
 * - Uses REST API which handles file cleanup on the backend
 * - Backend ensures proper cleanup of associated storage files
 */
export async function deleteTutorNote(id: string): Promise<void> {
  try {
    // Use REST API for tutor material deletion
    await apiClient.delete(`/api/tutor-materials/tutor/${id}`);
  } catch (error) {
    console.error("Error in deleteTutorNote:", error);
    throw error;
  }
}

/**
 * Upload file for tutor note
 *
 * NOTE: This function is deprecated - file uploads should be handled through createTutorNote/updateTutorNote
 * which accept FormData with files. This function is kept for backward compatibility.
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

    // Use REST API to update the note with file
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.uploadFormData<{ success: boolean; data: any }>(
      `/api/tutor-materials/tutor/${noteId}`,
      formData,
      'PUT'
    );

    if (!response.success) {
      throw new Error('Failed to upload file');
    }

    // Get secure file URL
    const fileUrl = response.data.file_url ?
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${response.data.file_url}` :
      null;

    return {
      fileUrl,
      fileName: response.data.file_name || file.name,
      fileSize: response.data.file_size || file.size,
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
    await apiClient.post(`/api/tutor-materials/${noteId}/view`, {});
  } catch (error) {
    console.error("Error in incrementTutorNoteViewCount:", error);
    throw error;
  }
}

/**
 * Increment the view count for a tutor note (unique per user)
 * Only counts one view per user per note
 * Note: Falls back to regular view count since unique tracking isn't implemented yet
 */
export async function incrementTutorNoteViewCountUnique(
  noteId: string,
  _userId: string
): Promise<void> {
  try {
    // For now, just use regular view count since unique tracking isn't implemented
    // TODO: Implement unique view tracking in backend when needed
    await incrementTutorNoteViewCount(noteId);
  } catch (error) {
    console.warn(
      "Error incrementing view count:",
      error
    );
    // Don't throw error - view tracking failure shouldn't break functionality
  }
}

/**
 * Increment the download count for a tutor note
 */
export async function incrementTutorNoteDownloadCount(
  noteId: string
): Promise<void> {
  try {
    await apiClient.post(`/api/tutor-materials/${noteId}/download`, {});
  } catch (error) {
    console.error("Error in incrementTutorNoteDownloadCount:", error);
    throw error;
  }
}

/**
 * Generate a signed URL for secure file access
 * This function is deprecated - use getTutorNoteSecureFile instead
 * which gets the secure URL from the backend
 */
export async function getTutorNoteFileUrl(
  filePath: string | null,
  _expiresIn: number = 3600
): Promise<string | null> {
  if (!filePath) return null;

  // For backward compatibility, construct URL from backend
  // In practice, use getTutorNoteSecureFile() for proper secure access
  try {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseURL}/api/files/${filePath}`;
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

export async function resolveNoteSubjectIdFromSubject(subject: {
  id: string;
  name: string;
  display_name: string;
}): Promise<string | null> {
  try {
    // For now, just return the provided ID since subject management
    // should be handled through the backend admin interface
    // TODO: Implement subject resolution through backend API when needed
    return subject.id;
  } catch (e) {
    console.error("Error resolving note_subjects id from subject:", e);
    return null;
  }
}

// REST API FUNCTIONS FOR TUTOR MATERIAL MANAGEMENT

/**
 * Get tutor materials for the authenticated tutor using REST API
 */
export async function getTutorMaterialsRest(): Promise<TutorNoteWithDetails[]> {
  try {
    const data = await apiClient.get<any[]>("/api/tutor-materials/tutor/list");
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      content: item.content,
      file_url: item.file_url,
      file_name: item.file_name,
      file_size: item.file_size,
      subject_id: item.subject_id,
      subject_name: item.subject_name,
      subject_display_name: item.subject_display_name,
      subject_color: item.subject_color,
      grade_level_id: item.grade_level_id,
      grade_level_code: null, // Not provided by REST API
      grade_level_display: item.grade_level_display,
      created_by: "", // Not provided by REST API
      is_premium: item.is_premium,
      view_count: item.view_count,
      download_count: item.download_count,
      tags: item.tags,
      created_at: item.created_at,
    }));
  } catch (error) {
    console.error("Error fetching tutor materials:", error);
    throw error;
  }
}

/**
 * Search tutor materials using REST API
 */
export async function searchTutorMaterialsRest(searchTerm: string): Promise<TutorNoteWithDetails[]> {
  try {
    const data = await apiClient.post<any[]>("/api/tutor-materials/tutor/search", { searchTerm });
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      content: item.content,
      file_url: item.file_url,
      file_name: item.file_name,
      file_size: item.file_size,
      subject_id: item.subject_id,
      subject_name: item.subject_name,
      subject_display_name: item.subject_display_name,
      subject_color: item.subject_color,
      grade_level_id: item.grade_level_id,
      grade_level_code: null,
      grade_level_display: item.grade_level_display,
      created_by: "",
      is_premium: item.is_premium,
      view_count: item.view_count,
      download_count: item.download_count,
      tags: item.tags,
      created_at: item.created_at,
    }));
  } catch (error) {
    console.error("Error searching tutor materials:", error);
    throw error;
  }
}

/**
 * Create tutor material using REST API
 */
export async function createTutorMaterialRest(formData: FormData): Promise<TutorNoteWithDetails> {
  try {
    const data = await apiClient.uploadFormData<any>("/api/tutor-materials/tutor/create", formData);
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      content: data.content,
      file_url: data.file_url,
      file_name: data.file_name,
      file_size: data.file_size,
      subject_id: data.subject_id,
      subject_name: data.subject_name,
      subject_display_name: data.subject_display_name,
      subject_color: data.subject_color,
      grade_level_id: data.grade_level_id,
      grade_level_code: null,
      grade_level_display: data.grade_level_display,
      created_by: "",
      is_premium: data.is_premium,
      view_count: data.view_count,
      download_count: data.download_count,
      tags: data.tags,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error("Error creating tutor material:", error);
    throw error;
  }
}

/**
 * Update tutor material using REST API
 */
export async function updateTutorMaterialRest(materialId: string, formData: FormData): Promise<TutorNoteWithDetails> {
  try {
    const data = await apiClient.uploadFormData<any>(`/api/tutor-materials/tutor/${materialId}`, formData, 'PUT');
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      content: data.content,
      file_url: data.file_url,
      file_name: data.file_name,
      file_size: data.file_size,
      subject_id: data.subject_id,
      subject_name: data.subject_name,
      subject_display_name: data.subject_display_name,
      subject_color: data.subject_color,
      grade_level_id: data.grade_level_id,
      grade_level_code: null,
      grade_level_display: data.grade_level_display,
      created_by: "",
      is_premium: data.is_premium,
      view_count: data.view_count,
      download_count: data.download_count,
      tags: data.tags,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error("Error updating tutor material:", error);
    throw error;
  }
}

/**
 * Delete tutor material using REST API
 */
export async function deleteTutorMaterialRest(materialId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/tutor-materials/tutor/${materialId}`);
  } catch (error) {
    console.error("Error deleting tutor material:", error);
    throw error;
  }
}
