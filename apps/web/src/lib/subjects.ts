// src/services/subjectsService.ts
import { api } from "@/lib/subjects.api";
import type { Subject, CreateSubjectData, UpdateSubjectData } from "@/types/subject";

function unwrapItems<T = any>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data.items)) return data.items as T[];
  return data.items ?? [];
}
function unwrapSingle<T = any>(data: any): T | null {
  if (!data) return null;
  if (!Array.isArray(data)) return (data as T) ?? null;
  return (data[0] as T) ?? null;
}
const q = (obj: any) => ({ q: JSON.stringify(obj) });
const sort = (obj: any) => ({ sort: JSON.stringify(obj) });

export const subjectsService = {
  // READ: active subjects
  async listActive(): Promise<Subject[]> {
    try {
      const res = await api.get("/api/subjects", {
        params: {
          ...q({ is_active: true }),
          ...sort({ display_name: 1, name: 1, sort_order: 1, createdAt: 1 }),
          limit: 500,
        },
      });
      return unwrapItems<Subject>(res.data);
    } catch (err: any) {
      // fallback alias if your FE used /api/note_subjects
      if (err?.response?.status === 404) {
        const res2 = await api.get("/api/note_subjects", {
          params: {
            ...q({ is_active: true }),
            ...sort({ sort_order: 1, display_name: 1, name: 1 }),
            limit: 500,
          },
        });
        return unwrapItems<Subject>(res2.data);
      }
      throw err;
    }
  },

  // READ: all subjects
  async listAll(): Promise<Subject[]> {
    try {
      const res = await api.get("/api/subjects", {
        params: {
          ...sort({ display_name: 1, name: 1, sort_order: 1, createdAt: 1 }),
          limit: 1000,
        },
      });
      return unwrapItems<Subject>(res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        const res2 = await api.get("/api/note_subjects", {
          params: { ...sort({ sort_order: 1, display_name: 1, name: 1 }), limit: 1000 },
        });
        return unwrapItems<Subject>(res2.data);
      }
      throw err;
    }
  },

  // CREATE (requires server route)
  async create(input: CreateSubjectData): Promise<Subject> {
    const payload = {
      name: input.name.trim().toLowerCase(),
      display_name: input.display_name.trim(),
      color: input.color ?? null,
      is_active: input.is_active ?? true,
    };
    const res = await api.post("/api/subjects", payload);
    return (res.data?.item as Subject) ?? unwrapSingle<Subject>(res.data) ?? (res.data as Subject);
  },

  // UPDATE (requires server route)
  async update(id: string, input: UpdateSubjectData): Promise<Subject> {
    const updates: Partial<UpdateSubjectData> = {};
    if (input.name !== undefined) updates.name = input.name.trim().toLowerCase();
    if (input.display_name !== undefined) updates.display_name = input.display_name.trim();
    if (input.color !== undefined) updates.color = input.color;
    if (input.is_active !== undefined) updates.is_active = input.is_active;

    const res = await api.patch(`/api/subjects/${encodeURIComponent(id)}`, updates);
    return (res.data?.item as Subject) ?? unwrapSingle<Subject>(res.data) ?? (res.data as Subject);
  },

  // DELETE (requires server route)
  async remove(id: string): Promise<void> {
    await api.delete(`/api/subjects/${encodeURIComponent(id)}`);
  },

  // READ by id/slug/code (works with our list endpoint)
  async getById(id: string): Promise<Subject | null> {
    try {
      const res = await api.get("/api/subjects", {
        params: {
          ...q({ $or: [{ _id: id }, { id }, { slug: id }, { code: id }] }),
          limit: 1,
        },
      });
      const items = unwrapItems<Subject>(res.data);
      return items[0] ?? null;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },
};
