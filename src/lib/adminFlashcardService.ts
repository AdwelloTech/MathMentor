import apiClient from "./apiClient";
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

      const data = await apiClient.get<any[]>("/api/flashcards");

      if (!data || !Array.isArray(data)) {
        return [];
      }

      // Transform backend data to match expected format
      const flashcardSets: AdminFlashcardSet[] = data.map((set: any) => ({
        _id: set._id,
        tutorId: set.tutorId,
        title: set.title,
        subject: set.subject,
        topic: set.topic,
        description: set.description,
        difficulty: set.difficulty,
        gradeLevelId: set.gradeLevelId,
        isPublic: set.isPublic,
        isActive: set.isActive,
        tags: set.tags || [],
        viewCount: set.viewCount || 0,
        studyCount: set.studyCount || 0,
        averageRating: set.averageRating,
        totalRatings: set.totalRatings || 0,
        createdAt: set.createdAt,
        updatedAt: set.updatedAt,
        tutor: set.tutor || {
          id: set.tutorId,
          full_name: 'Unknown',
          email: ''
        },
        card_count: set.cardCount || 0
      }));

      console.log(
        "Flashcard sets fetched with admin service:",
        flashcardSets.length
      );
      return flashcardSets;
    } catch (error) {
      console.error("Error in getAllFlashcardSets:", error);
      throw error;
    }
  }

  // Get flashcard statistics
  static async getFlashcardStats(): Promise<FlashcardStats> {
    try {
      const sets = await this.getAllFlashcardSets();

      const total = sets.length;
      const active = sets.filter(s => s.isActive).length;
      const inactive = total - active;

      // Count by subject
      const bySubject: Record<string, number> = {};
      sets.forEach(set => {
        bySubject[set.subject] = (bySubject[set.subject] || 0) + 1;
      });

      // Total cards
      const totalCards = sets.reduce((sum, set) => sum + (set.card_count || 0), 0);

      return {
        total,
        active,
        inactive,
        total_cards: totalCards,
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

      await apiClient.delete(`/api/flashcards/${setId}`);

      console.log("Flashcard set deleted successfully");
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
      const data = await apiClient.get<any>(`/api/flashcards/${setId}`);

      if (!data) return null;

      return {
        _id: data._id,
        tutorId: data.tutorId,
        title: data.title,
        subject: data.subject,
        topic: data.topic,
        description: data.description,
        difficulty: data.difficulty,
        gradeLevelId: data.gradeLevelId,
        isPublic: data.isPublic,
        isActive: data.isActive,
        tags: data.tags || [],
        viewCount: data.viewCount || 0,
        studyCount: data.studyCount || 0,
        averageRating: data.averageRating,
        totalRatings: data.totalRatings || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        tutor: data.tutor || {
          id: data.tutorId,
          full_name: 'Unknown',
          email: ''
        },
        card_count: data.cards?.length || 0
      } as AdminFlashcardSet;
    } catch (error) {
      console.error("Error getting flashcard set details:", error);
      throw error;
    }
  }
}
