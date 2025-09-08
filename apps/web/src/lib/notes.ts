// src/lib/notesApi.ts
import axios, { AxiosError } from "axios";
import type { Database } from "@/types/database";

type StudyNote = Database["public"]["Tables"]["study_notes"]["Row"];
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

/* ----------------------------------------------------------------------------
   Axios client
---------------------------------------------------------------------------- */
function getBaseUrl() {
  const url =
    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_URL) ||
    (typeof process !== "undefined"
      ? (process as any)?.env?.VITE_API_URL || (process as any)?.env?.NEXT_PUBLIC_API_URL
      : "") ||
    "http://localhost:8000";
  return (url || "http://localhost:8000").replace(/\/$/, "");
}

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials:
    typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_SEND_CREDENTIALS === "true",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError<any>) =>
    Promise.reject({
      status: err.response?.status ?? 0,
      data: err.response?.data ?? null,
      message: err.message,
    })
);

const unwrap = (r: any) => r?.data?.data ?? r?.data ?? r;
const asArray = <T>(x: any): T[] => (Array.isArray(x) ? x : x ? [x] : []);

/* ----------------------------------------------------------------------------
   Subjects
---------------------------------------------------------------------------- */
export async function getNoteSubjects(): Promise<NoteSubject[]> {
  // Preferred: GET /api/note_subjects?q={"is_active":true}&sort={"sort_order":1}
  try {
    const res = await api.get(`/api/note_subjects`, {
      params: {
        q: JSON.stringify({ is_active: true }),
        sort: JSON.stringify({ sort_order: 1 }),
      },
    });
    return asArray<NoteSubject>(unwrap(res));
  } catch (e: any) {
    // Fallback: plain list endpoint
    const res = await api.get(`/api/note_subjects`);
    const all = asArray<NoteSubject>(unwrap(res));
    return all
      .filter((s: any) => s?.is_active !== false)
      .sort((a: any, b: any) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0));
  }
}

async function getSubjectsMap(): Promise<Map<string, NoteSubject>> {
  const subs = await getNoteSubjects();
  const m = new Map<string, NoteSubject>();
  subs.forEach((s: any) => {
    const id = (s?.id ?? s?._id ?? s?.uuid ?? "").toString();
    if (id) m.set(id, s);
  });
  return m;
}

/* ----------------------------------------------------------------------------
   Search & list
---------------------------------------------------------------------------- */
export async function searchStudyNotes(
  params: NotesSearchParams = {}
): Promise<StudyNoteWithDetails[]> {
  const { searchTerm = "", subjectFilter = null, gradeFilter = null } = params;

  // 1) If your server kept the RPC, use it first
  try {
    const r = await api.post(`/api/search_study_notes`, {
      search_term: searchTerm,
      subject_filter: subjectFilter,
      grade_filter: gradeFilter,
    });
    return asArray<StudyNoteWithDetails>(unwrap(r));
  } catch (e: any) {
    // 2) Fallback to REST query on /api/study_notes
    const q: any = {};
    if (subjectFilter) q.subject_id = subjectFilter;
    if (gradeFilter) q.grade_level_code = gradeFilter;
    if (searchTerm) {
      const regex = { $regex: searchTerm.replace(/[%]/g, ".*"), $options: "i" };
      q.$or = [{ title: regex }, { description: regex }];
    }

    const res = await api.get(`/api/study_notes`, {
      params: {
        q: Object.keys(q).length ? JSON.stringify(q) : undefined,
        sort: JSON.stringify({ created_at: -1 }),
        limit: 100,
      },
    });
    const notes = asArray<any>(unwrap(res));

    // enrich with subject details (to match StudyNoteWithDetails)
    const subMap = await getSubjectsMap();
    const out: StudyNoteWithDetails[] = notes.map((n) => {
      const id = (n?.id ?? n?._id ?? "").toString();
      const sid = (n?.subject_id ?? n?.subject?.id ?? n?.subject?._id ?? null) as
        | string
        | null;
      const s = sid ? subMap.get(sid) : undefined;

      return {
        id,
        title: n.title,
        description: n.description ?? null,
        content: n.content ?? null,
        subject_name: (s as any)?.name ?? null,
        subject_display_name: (s as any)?.display_name ?? null,
        subject_color: (s as any)?.color ?? null,
        grade_level_code: n.grade_level_code ?? null,
        grade_level_display: n.grade_level_display ?? null, // or compute from code if you have a map
        created_by: n.created_by ?? null,
        is_public: n.is_public ?? true,
        view_count: n.view_count ?? 0,
        created_at: n.created_at ?? new Date().toISOString(),
      };
    });

    return out;
  }
}

/* ----------------------------------------------------------------------------
   Single item
---------------------------------------------------------------------------- */
export async function getStudyNoteById(
  id: string
): Promise<(StudyNoteWithDetails & { subject_id: string | null }) | null> {
  try {
    // Preferred: GET /api/study_notes/:id
    const r = await api.get(`/api/study_notes/${encodeURIComponent(id)}`);
    const n: any = unwrap(r);
    if (!n) return null;

    // Ensure we have subject details
    let subject: NoteSubject | null = null;
    const sid =
      (n?.subject_id ?? n?.subject?.id ?? n?.subject?._id ?? null) as
        | string
        | null;

    if (sid) {
      try {
        const sr = await api.get(`/api/note_subjects/${encodeURIComponent(sid)}`);
        subject = unwrap(sr);
      } catch {
        // fallback: map from list
        const map = await getSubjectsMap();
        subject = (sid && map.get(sid)) || null;
      }
    }

    const transformed: StudyNoteWithDetails & { subject_id: string | null } = {
      id: (n?.id ?? n?._id ?? "").toString(),
      title: n.title,
      description: n.description ?? null,
      content: n.content ?? null,
      subject_id: sid ?? null,
      subject_name: (subject as any)?.name ?? null,
      subject_display_name: (subject as any)?.display_name ?? null,
      subject_color: (subject as any)?.color ?? null,
      grade_level_code: n.grade_level_code ?? null,
      grade_level_display: n.grade_level_display ?? null,
      created_by: n.created_by ?? null,
      is_public: n.is_public ?? true,
      view_count: n.view_count ?? 0,
      created_at: n.created_at ?? new Date().toISOString(),
    };

    return transformed;
  } catch (e: any) {
    // Fallback: query collection with q filter
    const res = await api.get(`/api/study_notes`, {
      params: { q: JSON.stringify({ id }) },
    });
    const first = asArray<any>(unwrap(res))[0];
    if (!first) return null;
    return getStudyNoteById(first.id ?? first._id);
  }
}

/* ----------------------------------------------------------------------------
   Increment view count
---------------------------------------------------------------------------- */
export async function incrementNoteViewCount(noteId: string): Promise<void> {
  // 1) Try RPC endpoint if your server exposes it
  try {
    await api.post(`/api/increment_note_view_count`, { note_id: noteId });
    return;
  } catch {
    // 2) Try a dedicated REST endpoint if present
    try {
      await api.post(`/api/study_notes/${encodeURIComponent(noteId)}/views`);
      return;
    } catch {
      // 3) Last resort: read-modify-write
      try {
        const r = await api.get(`/api/study_notes/${encodeURIComponent(noteId)}`);
        const note = unwrap(r);
        const next = Math.max(0, Number(note?.view_count ?? 0)) + 1;
        await api.patch(`/api/study_notes/${encodeURIComponent(noteId)}`, {
          view_count: next,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        // swallow (view count isn't critical for UX)
        console.warn("incrementNoteViewCount fallback failed", e);
      }
    }
  }
}

/* ----------------------------------------------------------------------------
   UI helpers (unchanged)
---------------------------------------------------------------------------- */
export function transformNoteForCard(note: StudyNoteWithDetails): NoteCardProps {
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

export function getSubjectColor(color: string | null): string {
  return color || "#3B82F6";
}

export function truncateText(text: string, maxLength: number = 120): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}
