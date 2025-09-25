// apps/web/src/lib/adminQuizService.ts
export type Quiz = { id: string; title: string; subject_id?: string; questions?: any[]; is_active?: boolean; createdAt?: string };
const API_BASES = ["", "http://localhost:8080", "http://localhost:8080"] as const;
function withParams(path: string, params?: Record<string, any>) {
  const u = new URL(path, "http://x");
  if (params) for (const [k,v] of Object.entries(params)) u.searchParams.set(k, typeof v==="string"? v : JSON.stringify(v));
  return u.pathname + (u.search ? u.search : "");
}
async function tryFetch(url: string) { try { const r = await fetch(url, { cache: "no-store" }); return r.ok ? r : null; } catch { return null; } }
async function getJSON(variants: Array<{ path: string; params?: Record<string, any> }>) {
  for (const base of API_BASES) for (const v of variants) {
    const res = await tryFetch(base + withParams(v.path, v.params)); if (!res) continue;
    try { const j = await res.json(); const arr = Array.isArray(j)? j : (Array.isArray(j?.data)? j.data : (Array.isArray(j?.items)? j.items : null)); if (arr) return arr; } catch {}
  } return [];
}
export async function getAllQuizzes(): Promise<Quiz[]> {
  const items = await getJSON([
    { path: "/api/quizzes" },
    { path: "/api/admin/quizzes" },
    { path: "/api/v1/quizzes" },
    { path: "/api/v1/admin/quizzes" },
  ]);
  return (items as any[]).map(q => ({
    id: String(q?.id ?? q?._id ?? q?.uuid ?? ""),
    title: q?.title ?? q?.name ?? "Untitled Quiz",
    subject_id: q?.subject_id ?? q?.subjectId,
    questions: q?.questions ?? q?.items ?? [],
    is_active: q?.is_active ?? q?.active ?? true,
    createdAt: q?.createdAt ?? q?.created_at,
  }));
}
export async function getQuizPdfs(): Promise<any[]> {
  const items = await getJSON([
    { path: "/api/quiz-pdfs" },
    { path: "/api/admin/quiz-pdfs" },
    { path: "/api/quizzes/pdfs" },
  ]);
  return Array.isArray(items) ? items : [];
}
export const AdminQuizService = { getAllQuizzes, getQuizPdfs };
export default AdminQuizService;
export type AdminQuiz = Quiz;
export type QuizStats = { total: number; active?: number; inactive?: number; };
