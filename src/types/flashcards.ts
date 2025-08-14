export interface FlashcardSet {
  id: string;
  tutor_id: string; // profiles.id of tutor
  title: string;
  subject: string;
  grade_level: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tutor?: { id: string; full_name: string; email: string };
  cards?: Flashcard[];
}

export interface Flashcard {
  id: string;
  set_id: string;
  front_text: string;
  back_text: string;
  card_order: number;
  created_at: string;
}

export interface CreateFlashcardData {
  front_text: string;
  back_text: string;
  card_order: number;
}

export interface CreateFlashcardSetData {
  title: string;
  subject: string;
  grade_level: string;
  is_active?: boolean;
  cards: CreateFlashcardData[];
}

export interface UpdateFlashcardSetData {
  title?: string;
  subject?: string;
  grade_level: string;
  is_active?: boolean;
}
