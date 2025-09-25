// apps/web/src/lib/flashcardService.ts
import axios from "axios";
import { getPublicEnv } from "./env";

const BASE = getPublicEnv("API_BASE_URL", "http://localhost:8080");

type FlashcardSet = {
  id: string;
  title: string;
  subject?: string;
  grade_level_id?: string;
  tutor_id?: string;
  is_active?: boolean;
  created_at?: string;
};

type FlashcardCard = {
  id: string;
  set_id: string;
  question: string;
  answer: string;
};

function normSet(doc: any): FlashcardSet {
  return {
    id: doc.id ?? doc._id ?? "",
    title: doc.title ?? doc.name ?? "",
    subject: doc.subject,
    grade_level_id: doc.grade_level_id ?? doc.gradeLevelId,
    tutor_id: doc.tutor_id ?? doc.tutorId,
    is_active: doc.is_active ?? true,
    created_at: doc.createdAt ?? doc.created_at,
  };
}

function normCard(doc: any): FlashcardCard {
  return {
    id: doc.id ?? doc._id ?? "",
    set_id: doc.set_id ?? doc.setId ?? "",
    question: doc.question ?? "",
    answer: doc.answer ?? "",
  };
}

async function listSets(params: Record<string, any>) {
  const { data } = await axios.get(`${BASE}/api/flashcard_sets`, { params });
  const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
  return items.map(normSet);
}

export const flashcardService = {
  sets: {
    async byTutor(tutorId: string, opts?: { onlyActive?: boolean; limit?: number; offset?: number }) {
      const q: any = { tutor_id: tutorId };
      if (opts?.onlyActive) q.is_active = true;
      return listSets({
        q: JSON.stringify(q),
        sort: JSON.stringify({ created_at: -1 }),
        limit: opts?.limit ?? 200,
        offset: opts?.offset ?? 0,
      });
    },

    async search(filter: Record<string, any> = {}, limit = 50, offset = 0) {
      return listSets({
        q: JSON.stringify(filter),
        sort: JSON.stringify({ created_at: -1 }),
        limit, offset,
      });
    },

    async byId(id: string) {
      const { data } = await axios.get(`${BASE}/api/flashcard_sets/${id}`);
      return normSet(data);
    },

    async create(payload: Partial<FlashcardSet>) {
      const { data } = await axios.post(`${BASE}/api/flashcard_sets`, payload);
      return normSet(data);
    },

    async update(id: string, payload: Partial<FlashcardSet>) {
      const { data } = await axios.put(`${BASE}/api/flashcard_sets/${id}`, payload);
      return normSet(data);
    },

    async remove(id: string) {
      await axios.delete(`${BASE}/api/flashcard_sets/${id}`);
      return { ok: true };
    },
  },

  cards: {
    async bySetId(setId: string, limit = 500, offset = 0) {
      const { data } = await axios.get(`${BASE}/api/flashcards`, {
        params: {
          q: JSON.stringify({ set_id: setId }),
          sort: JSON.stringify({ created_at: 1 }),
          limit, offset,
        },
      });
      const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      return items.map(normCard);
    },
  },
};

export default flashcardService;