// apps/web/src/lib/classesService.ts
const API_BASES = ["", "http://localhost:8080", "http://localhost:8000"] as const;
function withParams(path: string, params?: Record<string, any>) {
  const u = new URL(path, "http://x"); if (params) for (const [k,v] of Object.entries(params)) u.searchParams.set(k, typeof v==="string"? v : JSON.stringify(v));
  return u.pathname + (u.search ? u.search : "");
}
async function tryFetch(url: string) { try { const r = await fetch(url, { cache: "no-store" }); return r.ok ? r : null; } catch { return null; } }
async function getJSON(variants: Array<{ path: string; params?: Record<string, any> }>) {
  for (const base of API_BASES) for (const v of variants) {
    const res = await tryFetch(base + withParams(v.path, v.params)); if (!res) continue;
    try { const j = await res.json(); const arr = Array.isArray(j)? j : (Array.isArray(j?.data)? j.data : (Array.isArray(j?.items)? j.items : null)); if (arr) return arr; } catch {}
  } return [];
}
export type ClassItem = { id: string; tutor_id?: string; subject_id?: string; starts_at?: string; ends_at?: string };
export const classesService = {
  async getByTutor(tutorId: string): Promise<ClassItem[]> {
    const items = await getJSON([
      { path: "/api/classes", params: { q: { tutor_id: tutorId }, sort: { starts_at: 1 }, limit: 500 } },
      { path: `/api/classes/by-tutor/${encodeURIComponent(tutorId)}` },
      { path: "/api/tutor/classes", params: { tutorId } },
    ]);
    return (items as any[]).map(c => ({
      id: String(c?.id ?? c?._id ?? c?.uuid ?? ""),
      tutor_id: c?.tutor_id ?? c?.tutorId,
      subject_id: c?.subject_id ?? c?.subjectId,
      starts_at: c?.starts_at ?? c?.startsAt,
      ends_at: c?.ends_at ?? c?.endsAt,
    }));
  }
};
export default classesService;