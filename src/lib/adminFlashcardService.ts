import { supabase } from "./supabase";
import type { FlashcardSet } from "@/types/flashcards";

export interface AdminFlashcardSet extends FlashcardSet {
  tutor: {
    id: string;
    full_name: string;
    email: string;
  };
  card_count: number;
}

export interface FlashcardStats {
  total: number;
  active: number;
  inactive: number;
  total_cards: number;
  by_subject: Record<string, number>;
}

export class AdminFlashcardService {
  // Fetch all flashcard sets from all tutors
  static async getAllFlashcardSets(): Promise<AdminFlashcardSet[]> {
    try {
      console.log("Fetching all flashcard sets with admin service...");

      const { data, error } = await supabase
        .from("flashcard_sets")
        .select(
          `
          *,
          tutor:profiles(id, full_name, email)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching flashcard sets:", error);
        throw error;
      }

      if (!data) return [];

      // Get card counts for each set using the known working table name
      const setsWithCounts = await Promise.all(
        data.map(async (set) => {
          const { count, error: countError } = await supabase
            .from("flashcards")
            .select("*", { count: "exact", head: true })
            .eq("set_id", set.id);

          if (countError) {
            console.error(
              "Error fetching card count for set:",
              set.id,
              countError
            );
          }

          return {
            ...set,
            card_count: count || 0,
          } as AdminFlashcardSet;
        })
      );

      console.log(
        "Flashcard sets fetched with admin service:",
        setsWithCounts.length
      );
      return setsWithCounts;
    } catch (error) {
      console.error("Error in getAllFlashcardSets:", error);
      throw error;
    }
  }

  // Get flashcard statistics
  static async getFlashcardStats(): Promise<FlashcardStats> {
    try {
      // Get total sets and active/inactive counts
      const { data: sets, error: setsError } = await supabase
        .from("flashcard_sets")
        .select("is_active, subject");

      if (setsError) throw setsError;

      const total = sets?.length || 0;
      const active = sets?.filter((s) => s.is_active).length || 0;
      const inactive = total - active;

      // Count by subject
      const bySubject: Record<string, number> = {};
      sets?.forEach((set) => {
        bySubject[set.subject] = (bySubject[set.subject] || 0) + 1;
      });

      // Get total cards across all sets
      const { count: totalCards } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true });

      return {
        total,
        active,
        inactive,
        total_cards: totalCards || 0,
        by_subject: bySubject,
      };
    } catch (error) {
      console.error("Error getting flashcard stats:", error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        total_cards: 0,
        by_subject: {},
      };
    }
  }

  // Delete a flashcard set (and all its cards)
  static async deleteFlashcardSet(setId: string): Promise<boolean> {
    try {
      console.log("Starting flashcard set deletion for:", setId);

      // Use admin RPC function to bypass RLS restrictions
      const { data, error } = await supabase.rpc("admin_delete_flashcard_set", {
        set_id_param: setId,
      });

      if (error) {
        console.error("Error deleting flashcard set via RPC:", error);
        throw new Error(`Failed to delete flashcard set: ${error.message}`);
      }

      console.log("Flashcard set deleted successfully via admin function");
      return true;
    } catch (error) {
      console.error("Error in deleteFlashcardSet:", error);
      throw error;
    }
  }

  // Get flashcard set details with cards
  static async getFlashcardSetDetails(
    setId: string
  ): Promise<AdminFlashcardSet | null> {
    try {
      const { data, error } = await supabase
        .from("flashcard_sets")
        .select(
          `
          *,
          tutor:profiles(id, full_name, email),
          cards:flashcards(
            id,
            front_text,
            back_text,
            card_order
          )
        `
        )
        .eq("id", setId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        card_count: data.cards?.length || 0,
      } as AdminFlashcardSet;
    } catch (error) {
      console.error("Error getting flashcard set details:", error);
      throw error;
    }
  }
}
