import { supabase } from "./supabase";
import type { Database } from "@/types/database";

// Types
export type StudentTutorMaterial =
  Database["public"]["Functions"]["get_student_tutor_materials"]["Returns"][0];
export type StudentTutorMaterialWithAccess =
  Database["public"]["Functions"]["get_student_tutor_material_by_id"]["Returns"][0];

export interface StudentTutorMaterialsSearchParams {
  searchTerm?: string;
  subjectFilter?: string;
}

export interface StudentTutorMaterialCardProps {
  id: string;
  title: string;
  description: string | null;
  subjectName: string | null;
  subjectDisplayName: string | null;
  subjectColor: string | null;
  gradeLevelDisplay: string | null;
  tutorName: string | null;
  isPremium: boolean;
  viewCount: number;
  downloadCount: number;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
  hasAccess: boolean;
}

// Service functions
export const getStudentTutorMaterials = async (
  studentId: string,
  params?: StudentTutorMaterialsSearchParams
): Promise<StudentTutorMaterial[]> => {
  const { data, error } = await supabase.rpc("get_student_tutor_materials", {
    p_student_id: studentId,
    p_search_term: params?.searchTerm || null,
    p_subject_filter: params?.subjectFilter || null,
  });

  if (error) {
    console.error("Error fetching student tutor materials:", error);
    throw error;
  }

  return data || [];
};

export const getStudentTutorMaterialById = async (
  studentId: string,
  materialId: string
): Promise<StudentTutorMaterialWithAccess | null> => {
  const { data, error } = await supabase.rpc(
    "get_student_tutor_material_by_id",
    {
      p_student_id: studentId,
      p_material_id: materialId,
    }
  );

  if (error) {
    console.error("Error fetching student tutor material:", error);
    throw error;
  }

  return data?.[0] || null;
};

export const checkStudentPremiumAccess = async (
  studentId: string
): Promise<boolean> => {
  const { data, error } = await supabase.rpc("student_has_premium_access", {
    p_student_id: studentId,
  });

  if (error) {
    console.error("Error checking student premium access:", error);
    throw error;
  }

  return data || false;
};

// Utility functions
export const transformStudentTutorMaterialForCard = (
  material: StudentTutorMaterial,
  hasAccess: boolean = true
): StudentTutorMaterialCardProps => {
  return {
    id: material.id,
    title: material.title,
    description: material.description,
    subjectName: material.subject_name,
    subjectDisplayName: material.subject_display_name,
    subjectColor: material.subject_color,
    gradeLevelDisplay: material.grade_level_display,
    tutorName: material.tutor_name,
    isPremium: material.is_premium,
    viewCount: material.view_count,
    downloadCount: material.download_count,
    fileUrl: material.file_url,
    fileName: material.file_name,
    fileSize: material.file_size,
    createdAt: material.created_at,
    hasAccess: hasAccess,
  };
};

export const formatStudentTutorMaterialDate = (
  dateString: string | null
): string => {
  if (!dateString) return "Recently";

  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.max(0, Math.floor(diffInMs / (1000 * 60)));
  const diffInHours = Math.max(0, Math.floor(diffInMs / (1000 * 60 * 60)));
  const diffInDays = Math.max(0, Math.floor(diffInMs / (1000 * 60 * 60 * 24)));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export const getStudentTutorMaterialSubjectColor = (
  color: string | null
): string => {
  return color || "#6B7280";
};

export const truncateStudentTutorMaterialText = (
  text: string | null,
  maxLength: number
): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// View tracking functions
export const incrementStudentTutorMaterialViewCount = async (
  materialId: string
): Promise<void> => {
  const { error } = await supabase.rpc("increment_tutor_note_view_count", {
    note_id: materialId,
  });

  if (error) {
    console.error("Error incrementing view count:", error);
    throw error;
  }
};

export const incrementStudentTutorMaterialViewCountUnique = async (
  materialId: string,
  studentId: string
): Promise<void> => {
  try {
    // Try the unique view tracking first
    const { error } = await supabase.rpc(
      "increment_tutor_note_view_count_unique",
      {
        note_id: materialId,
        user_id: studentId,
      }
    );

    if (error) {
      console.error(
        "Unique view tracking failed, falling back to simple tracking:",
        error
      );
      // Fallback to simple view tracking
      const { error: simpleError } = await supabase.rpc(
        "increment_tutor_note_view_count",
        {
          note_id: materialId,
        }
      );

      if (simpleError) {
        console.error("Simple view tracking also failed:", simpleError);
        throw simpleError;
      }
    }
  } catch (error) {
    console.error("Error in view tracking:", error);
    throw error;
  }
};

export const incrementStudentTutorMaterialDownloadCount = async (
  materialId: string
): Promise<void> => {
  const { error } = await supabase.rpc("increment_tutor_note_download_count", {
    note_id: materialId,
  });

  if (error) {
    console.error("Error incrementing download count:", error);
    throw error;
  }
};
