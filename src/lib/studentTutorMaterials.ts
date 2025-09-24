import apiClient from "./apiClient";

// Types
export interface StudentTutorMaterial {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  subject_id: string | null;
  subject_name: string | null;
  subject_display_name: string | null;
  subject_color: string | null;
  grade_level_display: string | null;
  tutor_id: string;
  tutor_name: string;
  is_premium: boolean;
  view_count: number;
  download_count: number;
  like_count: number;
  tags: string[];
  price: number | null;
  preview_content: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentTutorMaterialWithAccess extends StudentTutorMaterial {
  can_access: boolean;
  has_premium_access: boolean;
}

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
  try {
    const queryParams = new URLSearchParams();

    if (params?.searchTerm) {
      queryParams.append('q', params.searchTerm);
    }

    if (params?.subjectFilter && params.subjectFilter !== 'all') {
      queryParams.append('subjectId', params.subjectFilter);
    }

    const queryString = queryParams.toString();
    const url = `/api/tutor-materials${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get(url);
    return response || [];
  } catch (error) {
    console.error("Error fetching student tutor materials:", error);
    throw error;
  }
};

export const getStudentTutorMaterialById = async (
  studentId: string,
  materialId: string
): Promise<StudentTutorMaterialWithAccess | null> => {
  try {
    const response = await apiClient.get(`/api/tutor-materials/${materialId}`);
    return response || null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error("Error fetching student tutor material:", error);
    throw error;
  }
};

export const checkStudentPremiumAccess = async (
  studentId: string
): Promise<boolean> => {
  try {
    const response = await apiClient.get('/api/tutor-materials/premium/check');
    return response?.has_premium_access || false;
  } catch (error) {
    console.error("Error checking student premium access:", error);
    return false;
  }
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
  try {
    await apiClient.post(`/api/tutor-materials/${materialId}/view`);
  } catch (error) {
    console.error("Error incrementing view count:", error);
    // Don't throw error for view tracking to avoid breaking the user experience
  }
};

export const incrementStudentTutorMaterialViewCountUnique = async (
  materialId: string,
  studentId: string
): Promise<void> => {
  try {
    // For now, use simple view tracking
    await apiClient.post(`/api/tutor-materials/${materialId}/view`);
  } catch (error) {
    console.error(
      `View count increment failed for materialId=${materialId}:`,
      error
    );
    // Don't throw error for view tracking to avoid breaking the user experience
  }
};

export const incrementStudentTutorMaterialDownloadCount = async (
  materialId: string
): Promise<void> => {
  try {
    await apiClient.post(`/api/tutor-materials/${materialId}/download`);
  } catch (error) {
    console.error(
      `Download count increment failed for materialId=${materialId}:`,
      error
    );
    // Don't throw error for download tracking to avoid breaking the user experience
  }
};
