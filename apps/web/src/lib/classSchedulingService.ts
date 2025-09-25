// apps/web/src/lib/classSchedulingService.ts
const API_BASES = ["http://localhost:8080", "http://localhost:8080"] as const;

async function tryFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const r = await fetch(url, { credentials: "omit", ...init });
    return r.ok ? r : null;
  } catch { return null; }
}

function withParams(path: string, params?: Record<string, any>) {
  const u = new URL(path, "http://x");
  if (params) for (const [k,v] of Object.entries(params))
    u.searchParams.set(k, typeof v === "string" ? v : JSON.stringify(v));
  return u.pathname + (u.search ? u.search : "");
}

async function getJSON(path: string, params?: Record<string, any>) {
  for (const base of API_BASES) {
    const res = await tryFetch(base + withParams(path, params));
    if (!res) continue;
    try {
      const j = await res.json();
      const arr = Array.isArray(j?.items) ? j.items
                : Array.isArray(j?.data)  ? j.data
                : Array.isArray(j)        ? j
                : null;
      if (arr) return arr;
    } catch {}
  }
  return [];
}

async function postJSON(path: string, payload: any) {
  for (const base of API_BASES) {
    const res = await tryFetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res) continue;
    try { return await res.json(); } catch { return null; }
  }
  return null;
}

export const classSchedulingService = {
  classTypes: {
    async getAll(): Promise<any[]> {
      const a = await getJSON("/api/class_types", { limit: 200 });
      if (Array.isArray(a)) return a;
      const b = await getJSON("/api/v1/class-types", { limit: 200 });
      if (Array.isArray(b)) return b;
      return [];
    },
  },

  classes: {
    async getAvailableClasses(): Promise<any[]> {
      //const list = await getJSON("/api/classes", { q: { is_active: true }, limit: 200 });
      const list = await getJSON("/api/classes");
      if (Array.isArray(list)) return list;
      const alt  = await getJSON("/api/v1/classes", { is_active: true });
      if (Array.isArray(alt)) return alt;
      return [];
    },

    async getByTutorId(tutorId: string): Promise<any[]> {
      //const a = await getJSON("/api/classes", { by_tutor: tutorId });
       const a = await getJSON("/api/classes");
      if (Array.isArray(a)) return a;
      const b = await getJSON("/api/tutor/classes", { tutorId });
      if (Array.isArray(b)) return b;
      return [];
    },

    async create(payload: any): Promise<any> {
      try { return await postJSON("/api/classes", payload); }
      catch { return await postJSON("/api/tutor/classes", payload); }
    },
  },

  bookings: {
    async getByStudentId(studentId: string): Promise<any[]> {
      const list = await getJSON("/api/session_bookings", {
        q: { student_id: studentId }, sort: { createdAt: -1 }, limit: 200
      });
      if (Array.isArray(list)) return list;
      const alt  = await getJSON("/api/bookings", { studentId });
      if (Array.isArray(alt)) return alt;
      return [];
    },
  },
};

export default classSchedulingService;
