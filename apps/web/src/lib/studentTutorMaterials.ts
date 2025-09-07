// apps/web/src/lib/studentTutorMaterials.ts
import axios from "axios";
import { getBaseUrl } from "@/lib/supabase";

// Types kept minimal to what the UI needs
export interface StudentTutorMaterial {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  subject_name: string | null;
  subject_display_name: string | null;
  subject_color: string | null;
  grade_level_display: string | null;
  tutor_name: string | null;
  is_premium: boolean;
  view_count: number;
  download_count: number;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
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

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { "Content-Type": "application/json" },
  withCredentials:
    typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_SEND_CREDENTIALS === "true",
});

api.interceptors.request.use((c) => {
  if ((c.method || "get").toLowerCase() === "get") {
    c.params = { ...(c.params || {}), _ts: Date.now() };
    c.headers = { ...(c.headers || {}), "Cache-Control": "no-cache" };
  }
  return c;
});

const unwrap = (r: any) => r?.data?.data ?? r?.data ?? r;
const asArray = <T>(x: any): T[] => (Array.isArray(x) ? x : x ? [x] : []);

// ---------------------------------------------------------------------------
// Fetch list for the student
// ---------------------------------------------------------------------------
export const getStudentTutorMaterials = async (
  studentId: string,
  params?: StudentTutorMaterialsSearchParams
): Promise<StudentTutorMaterial[]> => {
  const res = await api.get("/api/get_student_tutor_materials", {
    params: {
      student_id: studentId,
      // server may ignore these; included for future server-side filtering
      search: params?.searchTerm || "",
      subject_id: params?.subjectFilter || "",
    },
  });
  return asArray<StudentTutorMaterial>(unwrap(res));
};

// Optional: fetch one by id (used by the viewer)
export const getStudentTutorMaterialById = async (
  studentId: string,
  materialId: string
): Promise<StudentTutorMaterial | null> => {
  // Try dedicated endpoint if you add it; for now query list and pick one
  const list = await getStudentTutorMaterials(studentId);
  return list.find((m) => m.id === materialId) ?? null;
};

// ---------------------------------------------------------------------------
// Premium access
// ---------------------------------------------------------------------------
export async function checkStudentPremiumAccess(userId: string): Promise<boolean> {
  const r = await api.get("/api/check_premium_access", {
    params: { user_id: userId },
  });
  const body = unwrap(r);
  // Accept several shapes: {has_access:true} or {ok:true} etc.
  return Boolean(body?.has_access ?? body?.access ?? body?.ok ?? false);
}

// ---------------------------------------------------------------------------
// UI helpers the card/page already imports
// ---------------------------------------------------------------------------
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
    viewCount: material.view_count ?? 0,
    downloadCount: material.download_count ?? 0,
    fileUrl: material.file_url,
    fileName: material.file_name,
    fileSize: material.file_size,
    createdAt: material.created_at,
    hasAccess,
  };
};

export const formatStudentTutorMaterialDate = (dateString: string | null): string => {
  if (!dateString) return "Recently";
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export const getStudentTutorMaterialSubjectColor = (color: string | null): string =>
  color || "#6B7280";

export const truncateStudentTutorMaterialText = (text: string | null, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
