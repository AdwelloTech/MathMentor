// apps/web/src/lib/tutorCompatServices.ts
// Fallback-safe services for Tutor pages in Mongo mode (or when older services are missing).
// They probe multiple API bases (proxy / 8080 / 8080) and multiple route shapes.
type Json = any;

const API_BASES = ["", "http://localhost:8080", "http://localhost:8080"] as const;

async function tryFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try { const r = await fetch(url, { ...init, credentials: "omit" }); return r.ok ? r : null; } catch { return null; }
}

function withParams(path: string, params?: Record<string, any>) {
  if (!params) return path;
  const u = new URL(path, "http://x");
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    u.searchParams.set(k, typeof v === "string" ? v : JSON.stringify(v));
  }
  return u.pathname + (u.search ? u.search : "");
}

async function getJSON(path: string, params?: Record<string, any>): Promise<Json> {
  const p = withParams(path, params);
  for (const base of API_BASES) {
    const r = await tryFetch(base + p);
    if (r) { try { return await r.json(); } catch { return null; } }
  }
  return null;
}

export const tutorCompatServices = {
  flashcards: {
    async byTutor(tutorId: string) {
      const q1 = await getJSON("/api/flashcard_sets", { q: { tutor_id: tutorId } });
      if (Array.isArray(q1)) return q1;
      const q2 = await getJSON("/api/flashcard_sets", { by_tutor: tutorId });
      if (Array.isArray(q2)) return q2;
      const q3 = await getJSON("/api/tutor/flashcard-sets", { tutorId });
      if (Array.isArray(q3)) return q3;
      return [];
    },
  },
  classTypes: {
    async getAll() {
      const a = await getJSON("/api/class-types");
      if (Array.isArray(a)) return a;
      const b = await getJSON("/api/tutor/class-types");
      if (Array.isArray(b)) return b;
      return [];
    }
  },
  classes: {
    async getAll(tutorId?: string) {
      const a = await getJSON("/api/classes", tutorId ? { by_tutor: tutorId } : undefined);
      if (Array.isArray(a)) return a;
      const b = await getJSON("/api/tutor/classes", tutorId ? { tutorId } : undefined);
      if (Array.isArray(b)) return b;
      return [];
    }
  },
  notes: {
    async getTutorNotesByTutorId(tutorId: string) {
      const a = await getJSON("/api/tutor-notes", { by_tutor: tutorId });
      if (Array.isArray(a)) return a;
      const b = await getJSON("/api/notes", { q: { tutor_id: tutorId } });
      if (Array.isArray(b)) return b;
      const c = await getJSON("/api/tutor/notes", { tutorId });
      if (Array.isArray(c)) return c;
      return [];
    }
  }
};
export default tutorCompatServices;
