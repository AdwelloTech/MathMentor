// apps/web/src/lib/flashcards.ts
import axios from "axios";
import type { FlashcardSet, Flashcard } from "@/types/flashcards";

function getBaseUrl() {
  const url =
    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_URL) ||
    (typeof process !== "undefined"
      ? (process as any)?.env?.VITE_API_URL || (process as any)?.env?.NEXT_PUBLIC_API_URL
      : "") ||
    "http://localhost:8080";
  return (url || "http://localhost:8080").replace(/\/$/, "");
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

const unwrap = (r: any) => r?.data?.data ?? r?.data ?? r;
const asArr = <T>(x: any): T[] => (Array.isArray(x) ? x : []);

function mapSet(r: any): FlashcardSet {
  return {
    id: (r._id ?? r.id ?? "").toString(),
    tutor_id: r.tutor_profile_id ?? r.tutor_id ?? "",
    title: r.title ?? "",
    subject: r.subject ?? r.subject_name ?? "General",
    topic: r.topic ?? null,
    grade_level: r.grade_level_code ?? r.grade_level ?? "G11",
    is_active: r.is_active ?? true,
    created_at: r.createdAt ?? new Date().toISOString(),
    updated_at: r.updatedAt ?? new Date().toISOString(),
    tutor: r.tutor
      ? { id: r.tutor?.id ?? r.tutor_profile_id ?? "", full_name: r.tutor?.full_name ?? "Tutor", email: r.tutor?.email ?? "" }
      : undefined,
  };
}

function mapCard(r: any): Flashcard {
  return {
    id: (r._id ?? r.id ?? "").toString(),
    set_id: (r.set_id?._id ?? r.set_id ?? "").toString(),
    front_text: r.front_text ?? "",
    back_text: r.back_text ?? "",
    card_order: Number(r.card_order ?? 0),
    created_at: r.createdAt ?? new Date().toISOString(),
    updated_at: r.updatedAt ?? new Date().toISOString(),
  };
}

export const flashcards = {
  // Student view used by dashboard
  student: {
    async listAvailable(): Promise<FlashcardSet[]> {
      // Prefer an API if you added it; otherwise fall back to a generic collection read
      try {
        const res = await api.get("/api/flashcard_sets", {
          params: { q: JSON.stringify({ is_active: true }), sort: JSON.stringify({ createdAt: -1 }), limit: 20 },
        });
        return asArr<any>(unwrap(res)).map(mapSet);
      } catch {
        // If you don’t have the route yet, return empty (dashboard handles empty safely)
        return [];
      }
    },
  },

  // Optional helpers (used on set page if you have it)
  sets: {
    async withCards(setId: string): Promise<FlashcardSet & { cards: Flashcard[] }> {
      const [setRes, cardsRes] = await Promise.all([
        api.get(`/api/flashcard_sets/${encodeURIComponent(setId)}`),
        api.get(`/api/flashcards`, { params: { q: JSON.stringify({ set_id: setId }), sort: JSON.stringify({ card_order: 1 }) } }),
      ]);
      const set = mapSet(unwrap(setRes));
      const cards = asArr<any>(unwrap(cardsRes)).map(mapCard);
      return { ...set, cards };
    },
  },
};
