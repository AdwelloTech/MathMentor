
export type CreateTutorNoteData = {
  title: string;
  description?: string;
  content?: string;
  subjectId?: string;
  isPremium?: boolean;
};

// apps/web/src/lib/tutorNotes.ts
const API_BASES = ["", "http://localhost:8080","http://localhost:8080"] as const;
function withParams(path: string, params?: Record<string, any>) {
  const u = new URL(path, "http://x");
  if (params) for (const [k, v] of Object.entries(params)) { if (v==null) continue; u.searchParams.set(k, typeof v === "string" ? v : JSON.stringify(v)); }
  return u.pathname + (u.search ? u.search : "");
}
async function tryFetch(url: string, init?: RequestInit) {
  try { const r = await fetch(url, { cache: "no-store", credentials: "omit", ...init }); return r.ok ? r : null; } catch { return null; }
}
async function getJSON(variants: Array<{ path: string; params?: Record<string, any> }>) {
  for (const base of API_BASES) for (const v of variants) {
    const res = await tryFetch(base + withParams(v.path, v.params));
    if (!res) continue;
    try {
      const j = await res.json();
      const arr = Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : (Array.isArray(j?.items) ? j.items : null));
      if (arr) return arr;
      return j;
    } catch {}
  }
  return [];
}
export async function getNoteSubjects(): Promise<any[]> {
  const res = await getJSON([
    { path: "/api/note_subjects", params: { q: { is_active: true }, sort: { sort_order: 1 }, limit: 500 } },
    { path: "/api/subjects", params: { q: { is_active: true }, sort: { display_name: 1, name: 1, sort_order: 1, createdAt: 1 }, limit: 500 } },
  ]);
  
  const arr = Array.isArray(res) ? res : [];
  return arr.map((s: any) => ({
    id: String(s?.id ?? s?._id ?? s?.uuid ?? s?.slug ?? ""),
    name: s?.name ?? s?.display_name ?? s?.displayName ?? s?.title ?? "Untitled",
    display_name: s?.display_name ?? s?.displayName ?? s?.name ?? s?.title ?? "Untitled",
    color: s?.color ?? "#94a3b8",
  }));
}
export function resolveNoteSubjectIdFromSubject(subjectOrId: any): string | undefined {
  if (!subjectOrId) return undefined;
  if (typeof subjectOrId === "string") return subjectOrId;
  return String(subjectOrId?.id ?? subjectOrId?._id ?? subjectOrId?.uuid ?? subjectOrId?.slug ?? "");
}
export async function createTutorNote(payload: any): Promise<any> {
  const body = JSON.stringify(payload ?? {});
  for (const base of API_BASES) {
    const res = await tryFetch(base + "/api/tutor_notes", { method: "POST", headers: { "Content-Type": "application/json" }, body });
    if (res) return await res.json().catch(()=> ({}));
  }
  return {};
}
export async function updateTutorNote(id: string, patch: any): Promise<any> {
  const body = JSON.stringify(patch ?? {});
  for (const base of API_BASES) {
    const res = await tryFetch(base + `/api/tutor_notes/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body });
    if (res) return await res.json().catch(()=> ({}));
  }
  return {};
}
export async function getTutorNoteSecureFile(id: string): Promise<any> {
  for (const base of API_BASES) {
    const res = await tryFetch(base + `/api/tutor_notes/${encodeURIComponent(id)}/file`);
    if (res) { try { return await res.json(); } catch { return {}; } }
  }
  return {};
}
export async function incrementTutorNoteDownloadCount(id: string): Promise<void> {
  for (const base of API_BASES) {
    const res = await tryFetch(base + `/api/tutor_notes/${encodeURIComponent(id)}/download`, { method: "POST" });
    if (res) return;
  }
}
export async function uploadTutorNoteFile(file: File): Promise<{ url?: string }> {
  const form = new FormData();
  form.append("file", file);
  for (const base of API_BASES) {
    const res = await tryFetch(base + "/api/storage/tutor-note", { method: "POST", body: form as any });
    if (res) { try { return await res.json(); } catch { return {}; } }
  }
  return {};
}
export default {
  getNoteSubjects,
  resolveNoteSubjectIdFromSubject,
  createTutorNote,
  updateTutorNote,
  getTutorNoteSecureFile,
  incrementTutorNoteDownloadCount,
  uploadTutorNoteFile,
};


export function formatTutorNoteDate(iso?: string): string {
  if (!iso) return "";
  try { const d = new Date(iso); return d.toLocaleDateString(); } catch { return String(iso); }
}
export function getTutorNoteSubjectColor(subject?: any): string {
  return subject?.color || (subject?.display_name && "#60a5fa") || "#94a3b8";
}
export function truncateTutorNoteText(t?: string, max = 140): string {
  if (!t) return ""; if (t.length <= max) return t; return t.slice(0, max - 1) + "…";
}
export async function incrementTutorNoteViewCountUnique(id: string): Promise<void> {
  const endpoints = [ `/api/tutor_notes/${encodeURIComponent(id)}/view-unique`, `/api/tutor_notes/${encodeURIComponent(id)}/views` ];
  for (const base of API_BASES) for (const p of endpoints) { try { const r = await fetch(base + p, { method: "POST" }); if (r.ok) return; } catch {} }
}
export async function searchTutorNotes(params: { q?: any; limit?: number; sort?: any } = {}): Promise<any[]> {
  const variants = [
    { path: "/api/tutor_notes" }, //params removed from request from /api/tutor_notes --- IGNORE --- to
    { path: "/api/notes", params },
  ];
  // reuse getJSON from file
  // @ts-ignore
  return await getJSON(variants);
}
export async function getTutorNotesByTutorId(tutorId: string): Promise<any[]> {
  return await searchTutorNotes({ q: { tutor_id: tutorId }, limit: 500, sort: { createdAt: -1 } });
}
export async function deleteTutorNote(id: string): Promise<{ ok: boolean }>{ 
  const paths = [ `/api/tutor_notes/${encodeURIComponent(id)}`, `/api/notes/${encodeURIComponent(id)}` ];
  for (const base of API_BASES) for (const p of paths) { try { const r = await fetch(base + p, { method: "DELETE" }); if (r.ok) return { ok: true }; } catch {} }
  return { ok: false };
}
export function transformTutorNoteForCard(n: any) {
  return {
    id: String(n?.id ?? n?._id ?? ""),
    title: n?.title ?? n?.name ?? "Untitled",
    description: n?.description ?? n?.summary ?? "",
    subject: n?.subject ?? n?.subject_name ?? n?.subjectId ?? n?.subject_id,
    subject_display_name: n?.subject_display_name ?? n?.subject?.display_name ?? n?.subject?.name ?? n?.subject_name,
    color: n?.subject?.color ?? n?.color ?? getTutorNoteSubjectColor(n?.subject),
    createdAt: n?.createdAt ?? n?.created_at ?? n?.updatedAt ?? n?.updated_at,
    downloads: n?.download_count ?? 0,
    views: n?.view_count ?? 0,
    file_url: n?.file_url ?? n?.url,
  };
}
