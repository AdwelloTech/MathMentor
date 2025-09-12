import axios from "axios";

export type Flashcard = {
  _id?: string;
  set_id: string;
  front_text: string;
  back_text: string;
  card_order?: number;
};
export type FlashcardSet = {
  _id?: string;
  tutor_profile_id?: string;
  title: string;
  subject_id?: string;
  grade_level_code?: string;
  description?: string;
  is_active?: boolean;
};

function getBaseUrl() {
  const url =
    (typeof import.meta !== "undefined" &&
      (import.meta as any)?.env?.VITE_API_URL) ||
    (typeof process !== "undefined"
      ? (process as any)?.env?.VITE_API_URL ||
        (process as any)?.env?.NEXT_PUBLIC_API_URL
      : "") ||
    "http://localhost:8000";
  return (url || "http://localhost:8000").replace(/\/$/, "");
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

export async function listFlashcardSets(filter: any = {}, limit = 200) {
  const res = await api.get("/api/flashcard_sets", {
    params: {
      q: JSON.stringify(filter),
      sort: JSON.stringify({ createdAt: -1 }),
      limit,
    },
  });
  return res.data?.data ?? [];
}

export async function createFlashcardSet(payload: FlashcardSet) {
  const res = await api.post("/api/flashcard_sets", payload);
  return res.data?.data;
}

export async function listFlashcards(setId: string) {
  const res = await api.get("/api/flashcards", {
    params: {
      q: JSON.stringify({ set_id: setId }),
      sort: JSON.stringify({ card_order: 1 }),
      limit: 500,
    },
  });
  return res.data?.data ?? [];
}

export async function upsertFlashcards(cards: Flashcard[]) {
  const res = await api.post("/api/flashcards", cards);
  return res.data?.data ?? [];
}

export async function updateFlashcard(id: string, patch: Partial<Flashcard>) {
  const res = await api.patch(`/api/flashcards/${id}`, patch);
  return res.data?.data;
}
