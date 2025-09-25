// apps/web/src/lib/flashcardsService.ts
const API_BASES = ["", "http://localhost:8080", "http://localhost:8080"] as const;
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
export const flashcardsService = {
  async byTutor(tutorId: string) {
    return await getJSON([
      { path: "/api/flashcard_sets", params: { q: { tutor_id: tutorId, is_active: true }, limit: 500 } },
      { path: `/api/flashcards/by-tutor/${encodeURIComponent(tutorId)}` },
      { path: "/api/flashcards", params: { tutorId } },
    ]);
  }
};
export default flashcardsService;