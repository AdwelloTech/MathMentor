import apiClient from "./apiClient";
import type {
  FlashcardSet,
  Flashcard,
  CreateFlashcardSetData,
  UpdateFlashcardSetData,
} from "@/types/flashcards";

// Note: Supabase operations have been migrated to backend API calls
// All operations now use REST API endpoints

export const flashcards = {
  // Tutor-side operations (migrated to backend endpoints)
  sets: {
    async create(
      tutorProfileId: string,
      input: CreateFlashcardSetData
    ): Promise<FlashcardSet> {
      // Transform frontend format to backend format
      const backendData = {
        title: input.title,
        subject: input.subject,
        topic: input.topic,
        description: input.description,
        difficulty: input.difficulty,
        gradeLevelId: input.grade_level_id,
        isPublic: input.is_public,
        flashcards: input.flashcards?.map(card => ({
          frontText: card.front_text,
          backText: card.back_text,
          difficulty: card.difficulty,
          tags: card.tags,
        })) || [],
      };

      const result = await apiClient.post<FlashcardSet>('/api/flashcards/sets', backendData);
      return result;
    },

    async update(
      setId: string,
      input: UpdateFlashcardSetData
    ): Promise<FlashcardSet> {
      // Transform frontend format to backend format
      const backendData = {
        title: input.title,
        subject: input.subject,
        topic: input.topic,
        description: input.description,
        difficulty: input.difficulty,
        gradeLevelId: input.grade_level_id,
        isPublic: input.is_public,
      };

      const result = await apiClient.put<FlashcardSet>(`/api/flashcards/sets/${setId}`, backendData);
      return result;
    },

    async byTutor(tutorProfileId: string): Promise<FlashcardSet[]> {
      const sets = await apiClient.get<FlashcardSet[]>(`/api/flashcards/sets?tutorId=${tutorProfileId}`);
      return sets;
    },

    async withCards(
      setId: string
    ): Promise<FlashcardSet & { cards: Flashcard[] }> {
      const set = await apiClient.get<FlashcardSet & { cards: Flashcard[] }>(`/api/flashcards/sets/${setId}`);
      return set;
    },

    async remove(setId: string): Promise<void> {
      await apiClient.delete(`/api/flashcards/sets/${setId}`);
    },
  },

  // Student-side queries (migrated to backend endpoints)
  student: {
    async listAvailable(studentId?: string, subject?: string): Promise<FlashcardSet[]> {
      if (!studentId) {
        throw new Error("Student ID is required for listing available flashcard sets");
      }

      const params = subject ? `?subject=${encodeURIComponent(subject)}` : '';
      const sets = await apiClient.get<FlashcardSet[]>(`/api/flashcards/student/available/${studentId}${params}`);
      return sets;
    },

    async getSet(
      setId: string
    ): Promise<FlashcardSet & { cards: Flashcard[] }> {
      return flashcards.sets.withCards(setId);
    },
  },
};
