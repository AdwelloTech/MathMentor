// adminFlashcardService.ts - Axios version for MongoDB API
import type { AxiosInstance } from "axios";
import { getApi, ListResp, q, sort } from "./api";

export type FlashcardSet = {
  id?: string; _id?: any;
  title?: string;
  subject?: string;
  grade?: string;
  is_active?: boolean;
  created_at?: string | Date; updated_at?: string | Date;
  // optional embedded cards
  cards?: Array<{ q: string; a: string; order?: number; is_active?: boolean }>;
};

export type Flashcard = {
  id?: string; _id?: any;
  set_id: string;
  q: string;
  a: string;
  order?: number;
  is_active?: boolean;
};

class AdminFlashcardService {
  private api: AxiosInstance;
  constructor(api?: AxiosInstance) { this.api = api ?? getApi(); }

  async listSets(params?: { query?: any; limit?: number; offset?: number; sortBy?: any }): Promise<ListResp<FlashcardSet>> {
    const { query, limit=100, offset=0, sortBy } = params || {};
    const res = await this.api.get("/api/flashcard_sets", {
      params: { q: q(query), limit, offset, sort: sort(sortBy || { createdAt: -1 }) },
    });
    return res.data as ListResp<FlashcardSet>;
  }

  async getSetById(id: string): Promise<FlashcardSet | null> {
    const resp = await this.listSets({ query: { $or: [{ _id: id }, { id }, { slug: id }, { set_uuid: id }] }, limit: 1 });
    return (resp.items && resp.items[0]) || null;
  }

  async listCardsBySet(setId: string, limit=500): Promise<ListResp<Flashcard>> {
    const res = await this.api.get("/api/flashcards", {
      params: { q: q({ set_id: setId, is_active: true }), limit, sort: sort({ order: 1, createdAt: 1 }) },
    });
    return res.data as ListResp<Flashcard>;
  }

  // The current server exposes read-only list endpoints.
  // We still provide create/update/delete that attempt common REST paths and throw a helpful error if 404.
  private notSupported(name: string): never {
    throw new Error(`${name} is not supported by the current API (read-only). Add server routes for writes.`);
  }

  async createSet(_input: Partial<FlashcardSet>): Promise<FlashcardSet> { return this.notSupported("createSet"); }
  async updateSet(_id: string, _updates: Partial<FlashcardSet>): Promise<FlashcardSet> { return this.notSupported("updateSet"); }
  async deleteSet(_id: string): Promise<void> { return this.notSupported("deleteSet"); }

  async createCard(_input: Partial<Flashcard>): Promise<Flashcard> { return this.notSupported("createCard"); }
  async updateCard(_id: string, _updates: Partial<Flashcard>): Promise<Flashcard> { return this.notSupported("updateCard"); }
  async deleteCard(_id: string): Promise<void> { return this.notSupported("deleteCard"); }
}

export const adminFlashcardService = new AdminFlashcardService();
