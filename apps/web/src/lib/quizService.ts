// apps/web/src/lib/quizService.ts
const API_BASES = ["", "http://localhost:8080", "http://localhost:8000"] as const;

function withParams(path: string, params?: Record<string, any>) {
  const u = new URL(path, "http://x");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      u.searchParams.set(k, typeof v === "string" ? v : JSON.stringify(v));
    }
  }
  return u.pathname + (u.search ? u.search : "");
}

async function tryFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const r = await fetch(url, { credentials: "omit", cache: "no-store", ...(init || {}) });
    return r.ok ? r : null;
  } catch { return null; }
}

async function getJSON(variants: Array<{ path: string; params?: Record<string, any> }>): Promise<any[]> {
  for (const base of API_BASES) {
    for (const v of variants) {
      const res = await tryFetch(base + withParams(v.path, v.params));
      if (!res) continue;
      try {
        const j = await res.json();
        const arr = Array.isArray(j?.items) ? j.items : (Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : null));
        if (arr) return arr;
      } catch {}
    }
  }
  return [];
}

export type StudentQuiz = { id: string; title: string; subject_id?: string; questions?: any[]; is_active?: boolean };

export const quizService = {
  studentQuizzes: {
    async getAvailableQuizzes(_userId: string) {
      // Back-compat: userId not required server-side
      return await quizService.getAvailableQuizzes();
    },
  },

  async getAvailableQuizzes(): Promise<StudentQuiz[]> {
    const items = await getJSON([
      { path: "/api/quizzes", params: { q: { is_active: true }, limit: 500 } },
      { path: "/api/quiz", params: { q: { is_active: true }, limit: 500 } },
      { path: "/api/v1/quizzes", params: { q: { is_active: true }, limit: 500 } },
    ]);
    return (items as any[]).map((q: any) => ({
      id: String(q?.id ?? q?._id ?? q?.uuid ?? ""),
      title: q?.title ?? q?.name ?? "Quiz",
      subject_id: q?.subject_id ?? q?.subjectId,
      questions: q?.questions ?? q?.items ?? [],
      is_active: q?.is_active ?? q?.active ?? true,
    }));
  },
};

export default quizService;
