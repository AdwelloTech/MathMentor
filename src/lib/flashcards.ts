import { supabase } from "@/lib/supabase";
import type {
  FlashcardSet,
  Flashcard,
  CreateFlashcardSetData,
  UpdateFlashcardSetData,
} from "@/types/flashcards";

export const flashcards = {
  // Tutor-side operations
  sets: {
    async create(
      tutorProfileId: string,
      input: CreateFlashcardSetData
    ): Promise<FlashcardSet> {
      const { data: set, error: setError } = await supabase
        .from("flashcard_sets")
        .insert({
          tutor_id: tutorProfileId,
          title: input.title,
          subject: input.subject,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (setError) throw setError;

      if (input.cards?.length) {
        const rows = input.cards.map((c) => ({
          set_id: set.id,
          front_text: c.front_text,
          back_text: c.back_text,
          card_order: c.card_order,
        }));
        const { error: cardsError } = await supabase
          .from("flashcards")
          .insert(rows);
        if (cardsError) throw cardsError;
      }

      return set as FlashcardSet;
    },

    async update(
      setId: string,
      input: UpdateFlashcardSetData
    ): Promise<FlashcardSet> {
      const { data, error } = await supabase
        .from("flashcard_sets")
        .update(input)
        .eq("id", setId)
        .select()
        .single();
      if (error) throw error;
      return data as FlashcardSet;
    },

    async byTutor(tutorProfileId: string): Promise<FlashcardSet[]> {
      const { data, error } = await supabase
        .from("flashcard_sets")
        .select("*, tutor:profiles(id, full_name, email), cards:flashcards(id)")
        .eq("tutor_id", tutorProfileId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as FlashcardSet[];
    },

    async withCards(
      setId: string
    ): Promise<FlashcardSet & { cards: Flashcard[] }> {
      const { data: set, error: setError } = await supabase
        .from("flashcard_sets")
        .select("*, tutor:profiles(id, full_name, email)")
        .eq("id", setId)
        .single();
      if (setError) throw setError;

      const { data: cards, error: cardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("set_id", setId)
        .order("card_order", { ascending: true });
      if (cardsError) throw cardsError;
      return { ...(set as FlashcardSet), cards: (cards || []) as Flashcard[] };
    },

    async remove(setId: string): Promise<void> {
      const { error } = await supabase
        .from("flashcard_sets")
        .delete()
        .eq("id", setId);
      if (error) throw error;
    },
  },

  // Student-side queries
  student: {
    async listAvailable(subject?: string): Promise<FlashcardSet[]> {
      const query = supabase
        .from("flashcard_sets")
        .select("*, tutor:profiles(id, full_name, email)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (subject) {
        (query as any).eq("subject", subject);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FlashcardSet[];
    },

    async getSet(
      setId: string
    ): Promise<FlashcardSet & { cards: Flashcard[] }> {
      return flashcards.sets.withCards(setId);
    },
  },
};
