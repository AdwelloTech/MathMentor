// src/lib/flashcards.ts
import api from "@/lib/adminAuth";

// ---- Types (adjust if your backend differs) ----
export type FlashcardSet = {
  _id?: string;                 // allow either _id or id (or other)
  id?: string;
  uuid?: string;
  slug?: string;
  set_uuid?: string;
  title: string;
  subject?: string;
  grade?: string;
  topic?: string;
  is_active?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
};

export type Flashcard = {
  _id?: string;
  id?: string;
  set_id: string;               // FK to FlashcardSet (change to set_uuid if needed)
  question?: string;            // some datasets use question/answer
  answer?: string;
  front_text?: string;          // some datasets use front/back
  back_text?: string;
  is_active?: boolean;
  order?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
};

type ListParams = {
  searchTerm?: string;
  subjectFilter?: string;
  gradeFilter?: string;
  is_active?: boolean;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  page?: number;
};

// Build server query: q / sort / limit / page (JSON-encoded for q & sort)
function buildQuery(params: ListParams = {}) {
  const q: Record<string, any> = {};
  if (params.searchTerm) q.$text = { $search: params.searchTerm };
  if (params.subjectFilter) q.subject = params.subjectFilter;
  if (params.gradeFilter) q.grade = params.gradeFilter;
  if (typeof params.is_active === "boolean") q.is_active = params.is_active;

  const out: Record<string, any> = {};
  if (Object.keys(q).length) out.q = JSON.stringify(q);
  if (params.sort) out.sort = JSON.stringify(params.sort);
  if (params.limit) out.limit = params.limit;
  if (params.page) out.page = params.page;
  return out;
}

// Normalize list responses to a plain array
function normalizeList<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && Array.isArray(raw.items)) return raw.items as T[];
  if (raw && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}

export const flashcards = {
  student: {
    /**
     * Get a single set by an unknown identifier safely.
     * Tries several common fields server-side; if no match, fetches a small page and matches client-side.
     */
    async getSet(setId: string): Promise<FlashcardSet> {
      if (!setId) throw new Error("Missing setId");

      const OR = [
        { _id: setId },
        { id: setId },
        { uuid: setId },
        { slug: setId },
        { set_uuid: setId },
      ];

      // 1) Server-side OR query
      const { data } = await api.get(`/api/flashcard_sets`, {
        params: { q: JSON.stringify({ $or: OR }), limit: 1 },
      });
      const arr = normalizeList<FlashcardSet>(data);
      if (arr.length) return arr[0];

      // 2) Fallback: fetch a slice and try to match client-side
      const page = await api.get(`/api/flashcard_sets`, {
        params: { q: JSON.stringify({ is_active: true }), limit: 200 },
      });
      const pool = normalizeList<FlashcardSet>(page.data);
      const hit =
        pool.find((s) => s._id === setId) ||
        pool.find((s) => s.id === setId) ||
        (pool as any[]).find((s: any) => s.uuid === setId) ||
        (pool as any[]).find((s: any) => s.slug === setId) ||
        (pool as any[]).find((s: any) => s.set_uuid === setId);

      if (hit) return hit;

      throw new Error("Flashcard set not found");
    },

    /** List sets (general) — always returns an array */
    async listSets(params: ListParams = {}): Promise<FlashcardSet[]> {
      const query = buildQuery(params);
      const { data } = await api.get(`/api/flashcard_sets`, { params: query });
      return normalizeList<FlashcardSet>(data);
    },

    /**
     * List only available (active) sets — always returns an array.
     * Alias around listSets with is_active=true.
     */
    async listAvailable(params: Omit<ListParams, "is_active"> = {}): Promise<FlashcardSet[]> {
      return this.listSets({ ...params, is_active: true });
    },

    /** Get cards for a set (active by default) — always returns an array */
    async getCards(
      setId: string,
      opts: { includeInactive?: boolean } = {}
    ): Promise<Flashcard[]> {
      if (!setId) throw new Error("Missing setId for cards");

      const query = buildQuery({
        is_active: !opts.includeInactive, // default true
      });

      // Ensure we filter by the FK your DB uses.
      // If your DB uses set_uuid instead of set_id, switch the key below.
      const q = query.q ? JSON.parse(query.q) : {};
      q.set_id = setId; // <-- change to q.set_uuid = setId; if that's your schema
      query.q = JSON.stringify(q);

      const { data } = await api.get(`/api/flashcards`, { params: query });
      return normalizeList<Flashcard>(data);
    },
  },

  // Optional admin helpers used elsewhere
  admin: {
    async createSet(payload: Partial<FlashcardSet>): Promise<FlashcardSet> {
      const { data } = await api.post(`/api/flashcard_sets`, payload);
      return data as FlashcardSet;
    },

    /**
     * Safe update: find the set first (by any identifier), then PATCH by its real _id/id.
     * This avoids 404s on /:id when your server doesn't support path-style updates.
     */
    async updateSet(setId: string, patch: Partial<FlashcardSet>): Promise<FlashcardSet> {
      const found = await flashcards.student.getSet(setId);
      const realId = (found as any)._id ?? found.id;
      if (!realId) throw new Error("Cannot resolve set identifier for update");

      const { data } = await api.patch(`/api/flashcard_sets/${realId}`, patch);
      return data as FlashcardSet;
    },

    async createCard(payload: Partial<Flashcard>): Promise<Flashcard> {
      const { data } = await api.post(`/api/flashcards`, payload);
      return data as Flashcard;
    },

    async updateCard(cardId: string, patch: Partial<Flashcard>): Promise<Flashcard> {
      const { data } = await api.patch(`/api/flashcards/${cardId}`, patch);
      return data as Flashcard;
    },
  },
};

export default flashcards;
