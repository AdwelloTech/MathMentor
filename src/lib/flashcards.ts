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
          ...(input.topic !== undefined ? { topic: input.topic } : {}),
          grade_level: input.grade_level,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (setError) throw setError;

      if (input.cards?.length) {
        // Filter out empty cards and validate that both front and back are provided
        const validCards = input.cards
          .filter((c) => {
            const hasFront = c.front_text?.trim();
            const hasBack = c.back_text?.trim();

            // If one is filled, both must be filled
            if (hasFront && !hasBack) {
              throw new Error(
                `Card ${
                  c.card_order + 1
                }: Answer is required when question is provided`
              );
            }
            if (!hasFront && hasBack) {
              throw new Error(
                `Card ${
                  c.card_order + 1
                }: Question is required when answer is provided`
              );
            }

            // Only include cards where both front and back are filled
            return hasFront && hasBack;
          })
          .map((c, index) => ({
            set_id: set.id,
            front_text: c.front_text.trim(),
            back_text: c.back_text.trim(),
            card_order: index, // Reorder to remove gaps
          }));

        if (validCards.length > 0) {
          const { error: cardsError } = await supabase
            .from("flashcards")
            .insert(validCards);
          if (cardsError) throw cardsError;
        }
      }

      return set as FlashcardSet;
    },

    async update(
      setId: string,
      input: UpdateFlashcardSetData
    ): Promise<FlashcardSet> {
      const { data, error } = await supabase
        .from("flashcard_sets")
        .update({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.subject !== undefined ? { subject: input.subject } : {}),
          ...(input.topic !== undefined ? { topic: input.topic } : {}),
          grade_level: input.grade_level,
          ...(input.is_active !== undefined
            ? { is_active: input.is_active }
            : {}),
        })
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

      // Filter out empty cards and reorder
      const validCards = (cards || [])
        .filter((card) => {
          const hasFront = card.front_text?.trim();
          const hasBack = card.back_text?.trim();
          return hasFront && hasBack;
        })
        .map((card, index) => ({
          ...card,
          card_order: index, // Reorder to remove gaps
        })) as Flashcard[];

      return { ...(set as FlashcardSet), cards: validCards };
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
      let query = supabase
        .from("flashcard_sets")
        .select("*, tutor:profiles(id, full_name, email)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (subject) {
        query = query.eq("subject", subject);
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
