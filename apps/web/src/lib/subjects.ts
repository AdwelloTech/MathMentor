// src/services/subjectsService.ts
import { api } from "@/lib/subjects.api";
import type { Subject, CreateSubjectData, UpdateSubjectData } from "@/types/subject";

/** Normalize server docs into the UI's Subject shape */
function normalizeSubject(raw: any): Subject {
  const id = String(raw?.id ?? raw?._id ?? "");
  const name = raw?.name ?? "";
  const display_name =
    raw?.display_name ??
    (typeof name === "string" ? name.charAt(0).toUpperCase() + name.slice(1) : name);

  return {
    // required / common
    id,
    name,
    display_name,

    // passthroughs
    code: raw?.code ?? null,
    color: raw?.color ?? null,
    is_active: raw?.is_active ?? true,
    sort_order: raw?.sort_order ?? 0,

    // timestamps (optional)
    createdAt: raw?.createdAt ?? raw?.created_at ?? null,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? null,
  } as Subject;
}

function unwrapItems<T = any>(data: any): T[] {
  if (!data) return [];
  // raw array
  if (Array.isArray(data)) return data as T[];
  // common wrappers
  if (Array.isArray(data.items)) return data.items as T[];
  if (Array.isArray(data.data)) return data.data as T[]; // ← handle { ok, data: [...] }

  // some backends use { item } or { result }
  if (Array.isArray(data.result)) return data.result as T[];

  // nothing matched
  return [];
}

function unwrapSingle<T = any>(data: any): T | null {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as T) ?? null;
  if (data?.item) return (data.item as T) ?? null;
  if (data?.data && !Array.isArray(data.data)) return (data.data as T) ?? null;
  return (data as T) ?? null;
}

const q = (obj: any) => ({ q: JSON.stringify(obj) });
// keep server sort stable on fields that exist in your schema
const sort = (obj: any) => ({ sort: JSON.stringify(obj) });

export const subjectsService = {
  // READ: active subjects
  async listActive(): Promise<Subject[]> {
    try {
      const res = await api.get("/api/subjects", {
        params: {
          ...q({ is_active: true }),
          // your DB has no display_name; sort by fields that exist
          ...sort({ sort_order: 1, name: 1, createdAt: 1 }),
          limit: 500,
        },
        // this endpoint doesn’t need cookies
        withCredentials: false,
      });

      const raw = unwrapItems<any>(res.data);
      return raw.map(normalizeSubject);
    } catch (err: any) {
      // fallback alias if your FE used /api/note_subjects
      if (err?.response?.status === 404) {
        const res2 = await api.get("/api/note_subjects", {
          params: {
            ...q({ is_active: true }),
            ...sort({ sort_order: 1, name: 1 }),
            limit: 500,
          },
          withCredentials: false,
        });
        const raw = unwrapItems<any>(res2.data);
        return raw.map(normalizeSubject);
      }
      throw err;
    }
  },

  // READ: all subjects
  async listAll(): Promise<Subject[]> {
    try {
      const res = await api.get("/api/subjects", {
        params: {
          ...sort({ sort_order: 1, name: 1, createdAt: 1 }),
          limit: 1000,
        },
        withCredentials: false,
      });
      const raw = unwrapItems<any>(res.data);
      return raw.map(normalizeSubject);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const res2 = await api.get("/api/note_subjects", {
          params: { ...sort({ sort_order: 1, name: 1 }), limit: 1000 },
          withCredentials: false,
        });
        const raw = unwrapItems<any>(res2.data);
        return raw.map(normalizeSubject);
      }
      throw err;
    }
  },

  // CREATE
  async create(input: CreateSubjectData): Promise<Subject> {
    const payload = {
      name: input.name.trim().toLowerCase(),
      // DB schema doesn’t have display_name; we still send it in case you add it later
      display_name: input.display_name.trim(),
      color: input.color ?? null,
      is_active: input.is_active ?? true,
    };
    const res = await api.post("/api/subjects", payload, { withCredentials: false });
    const doc = unwrapSingle<any>(res.data) ?? res.data?.data ?? res.data;
    return normalizeSubject(doc);
  },

  // UPDATE
  async update(id: string, input: UpdateSubjectData): Promise<Subject> {
    const updates: any = {};
    if (input.name !== undefined) updates.name = input.name.trim().toLowerCase();
    if (input.display_name !== undefined) updates.display_name = input.display_name.trim();
    if (input.color !== undefined) updates.color = input.color;
    if (input.is_active !== undefined) updates.is_active = input.is_active;

    const res = await api.patch(`/api/subjects/${encodeURIComponent(id)}`, updates, {
      withCredentials: false,
    });
    const doc = unwrapSingle<any>(res.data) ?? res.data?.data ?? res.data;
    return normalizeSubject(doc);
  },

  // DELETE
  async remove(id: string): Promise<void> {
    await api.delete(`/api/subjects/${encodeURIComponent(id)}`, { withCredentials: false });
  },

  // READ by id/slug/code
  async getById(id: string): Promise<Subject | null> {
    try {
      const res = await api.get("/api/subjects", {
        params: {
          ...q({ $or: [{ _id: id }, { id }, { slug: id }, { code: id }] }),
          limit: 1,
        },
        withCredentials: false,
      });
      const items = unwrapItems<any>(res.data).map(normalizeSubject);
      return items[0] ?? null;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },
};
