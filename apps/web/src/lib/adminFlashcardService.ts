// adminFlashcardService.ts - Complete admin flashcard service for MongoDB API
import { getApi } from "./api";
import type { AxiosInstance } from "axios";

// Types based on the database structure you provided
export interface AdminFlashcardSet {
  id: string;
  _id?: string;
  tutor_id: string;
  title: string;
  subject: string;
  topic?: string;
  grade_level?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tutor?: {
    id: string;
    full_name: string;
    email: string;
  };
  card_count?: number;
  cards?: AdminFlashcard[];
}

export interface AdminFlashcard {
  id: string;
  _id?: string;
  set_id: string;
  front_text: string;
  back_text: string;
  card_order: number;
  created_at: string;
  updated_at: string;
}

export interface FlashcardStats {
  total: number;
  active: number;
  inactive: number;
  total_cards: number;
  by_subject: { [key: string]: number };
}

class AdminFlashcardServiceClass {
  private api: AxiosInstance;

  constructor(api?: AxiosInstance) {
    this.api = api ?? getApi();
  }

  async getAllFlashcardSets(): Promise<AdminFlashcardSet[]> {
    try {
      const response = await this.api.get('/api/flashcard_sets', {
        params: {
          sort: JSON.stringify({ created_at: -1 })
        }
      });

      const sets = response.data?.items || [];
      
      // For each set, get tutor information and card count
      const setsWithDetails = await Promise.all(
        sets.map(async (set: any) => {
          try {
            // Get tutor profile
            const tutorResponse = await this.api.get('/api/profiles', {
              params: {
                q: JSON.stringify({ user_id: set.tutor_id }),
                limit: 1
              }
            });
            const tutor = tutorResponse.data?.items?.[0] || null;

            // Get card count - try both id and _id
            let cards: any[] = [];
            try {
              const cardsResponse = await this.api.get('/api/flashcards', {
                params: {
                  q: JSON.stringify({ set_id: set.id }),
                  limit: 1000
                }
              });
              cards = cardsResponse.data?.items || [];
            } catch (error) {
              console.warn('Error fetching cards by id for set:', set.id, error);
              cards = [];
            }

            // If no cards found by id, try by _id
            if (cards.length === 0 && set._id) {
              try {
                const cardsResponse = await this.api.get('/api/flashcards', {
                  params: {
                    q: JSON.stringify({ set_id: set._id }),
                    limit: 1000
                  }
                });
                cards = cardsResponse.data?.items || [];
              } catch (error) {
                console.warn('Error fetching cards by _id for set:', set._id, error);
                cards = [];
              }
            }

            return {
              ...set,
              is_active: set.is_active === true || set.is_active === 't' || set.is_active === 'true',
              tutor: tutor ? {
                id: tutor.id,
                full_name: tutor.full_name || 'Unknown',
                email: tutor.email || 'No email'
              } : {
                id: set.tutor_id,
                full_name: 'Unknown Tutor',
                email: 'No email'
              },
              card_count: cards.length,
              cards: cards.map((card: any) => ({
                ...card,
                card_order: typeof card.card_order === 'string' ? parseInt(card.card_order) : card.card_order
              }))
            };
          } catch (error) {
            console.warn('Error fetching details for flashcard set:', set.id, error);
            return {
              ...set,
              is_active: set.is_active === true || set.is_active === 't' || set.is_active === 'true',
              tutor: {
                id: set.tutor_id,
                full_name: 'Unknown Tutor',
                email: 'No email'
              },
              card_count: 0,
              cards: []
            };
          }
        })
      );

      return setsWithDetails;
    } catch (error) {
      console.error('Error in getAllFlashcardSets:', error);
      throw error;
    }
  }

  async getFlashcardSetDetails(setId: string): Promise<AdminFlashcardSet | null> {
    try {
      // Get set details from the list (since individual endpoint doesn't exist)
      // Try by id first
      let setResponse = await this.api.get('/api/flashcard_sets', {
        params: {
          q: JSON.stringify({ id: setId }),
          limit: 1
        }
      });
      let set = setResponse.data?.items?.[0];

      // If not found by id, try by _id
      if (!set) {
        setResponse = await this.api.get('/api/flashcard_sets', {
          params: {
            q: JSON.stringify({ _id: setId }),
            limit: 1
          }
        });
        set = setResponse.data?.items?.[0];
      }

      if (!set) return null;

      // Get tutor information
      const tutorResponse = await this.api.get('/api/profiles', {
        params: {
          q: JSON.stringify({ user_id: set.tutor_id }),
          limit: 1
        }
      });
      const tutor = tutorResponse.data?.items?.[0] || null;

      // Get cards for this set - try both id and _id
      let cards: any[] = [];
      try {
        const cardsResponse = await this.api.get('/api/flashcards', {
          params: {
            q: JSON.stringify({ set_id: setId }),
            sort: JSON.stringify({ card_order: 1 })
          }
        });
        cards = cardsResponse.data?.items || [];
      } catch (error) {
        console.warn('Error fetching cards by id for set:', setId, error);
        cards = [];
      }

      // If no cards found by id, try by _id
      if (cards.length === 0 && set._id) {
        try {
          const cardsResponse = await this.api.get('/api/flashcards', {
            params: {
              q: JSON.stringify({ set_id: set._id }),
              sort: JSON.stringify({ card_order: 1 })
            }
          });
          cards = cardsResponse.data?.items || [];
        } catch (error) {
          console.warn('Error fetching cards by _id for set:', set._id, error);
          cards = [];
        }
      }

      return {
        ...set,
        is_active: set.is_active === true || set.is_active === 't' || set.is_active === 'true',
        tutor: tutor ? {
          id: tutor.id,
          full_name: tutor.full_name || 'Unknown',
          email: tutor.email || 'No email'
        } : {
          id: set.tutor_id,
          full_name: 'Unknown Tutor',
          email: 'No email'
        },
        card_count: cards.length,
        cards: cards.map((card: any) => ({
          ...card,
          card_order: typeof card.card_order === 'string' ? parseInt(card.card_order) : card.card_order
        }))
      };
    } catch (error) {
      console.error('Error in getFlashcardSetDetails:', error);
      throw error;
    }
  }

  async getFlashcardStats(): Promise<FlashcardStats> {
    try {
      // Get all flashcard sets
      const setsResponse = await this.api.get('/api/flashcard_sets');
      const sets = setsResponse.data?.items || [];

      // Get all flashcards
      const cardsResponse = await this.api.get('/api/flashcards');
      const cards = cardsResponse.data?.items || [];

      const total = sets.length;
      const active = sets.filter((s: any) => s.is_active === true || s.is_active === 't' || s.is_active === 'true').length;
      const inactive = total - active;
      const total_cards = cards.length;

      // Calculate by subject
      const by_subject: { [key: string]: number } = {};
      sets.forEach((set: any) => {
        const subject = set.subject || 'Unknown';
        by_subject[subject] = (by_subject[subject] || 0) + 1;
      });

      return {
        total,
        active,
        inactive,
        total_cards,
        by_subject
      };
    } catch (error) {
      console.error('Error in getFlashcardStats:', error);
      throw error;
    }
  }

  async deleteFlashcardSet(setId: string): Promise<void> {
    try {
      console.log('Starting flashcard set deletion for ID:', setId);
      
      // First, get the set to find its _id (MongoDB uses _id for DELETE operations)
      let setResponse = await this.api.get('/api/flashcard_sets', {
        params: {
          q: JSON.stringify({ id: setId }),
          limit: 1
        }
      });
      let set = setResponse.data?.items?.[0];

      // If not found by id, try by _id (in case the passed ID is already an _id)
      if (!set) {
        setResponse = await this.api.get('/api/flashcard_sets', {
          params: {
            q: JSON.stringify({ _id: setId }),
            limit: 1
          }
        });
        set = setResponse.data?.items?.[0];
      }

      if (!set) {
        throw new Error('Flashcard set not found');
      }

      // Delete all cards in this set first
      const cardsResponse = await this.api.get('/api/flashcards', {
        params: {
          q: JSON.stringify({ set_id: setId })
        }
      });
      const cards = cardsResponse.data?.items || [];
      
      for (const card of cards) {
        await this.api.delete(`/api/flashcards/${card.id}`);
      }

      // Finally delete the set
      const mongoId = set._id || setId;
      await this.api.delete(`/api/flashcard_sets/${mongoId}`);
      console.log('Flashcard set deleted successfully using _id:', mongoId);
      
    } catch (error) {
      console.error('Error in deleteFlashcardSet:', error);
      throw error;
    }
  }

  async updateFlashcardSet(setId: string, updates: Partial<AdminFlashcardSet>): Promise<AdminFlashcardSet> {
    try {
      // Since individual PATCH endpoint might not exist, we'll use PUT with the full object
      // First get the current set
      let setResponse = await this.api.get('/api/flashcard_sets', {
        params: {
          q: JSON.stringify({ id: setId }),
          limit: 1
        }
      });
      let currentSet = setResponse.data?.items?.[0];

      // If not found by id, try by _id
      if (!currentSet) {
        setResponse = await this.api.get('/api/flashcard_sets', {
          params: {
            q: JSON.stringify({ _id: setId }),
            limit: 1
          }
        });
        currentSet = setResponse.data?.items?.[0];
      }
      
      if (!currentSet) {
        throw new Error('Flashcard set not found');
      }
      
      // Update the set with new data
      const updatedSet = { ...currentSet, ...updates };
      const response = await this.api.put(`/api/flashcard_sets/${setId}`, updatedSet);
      return response.data;
    } catch (error) {
      console.error('Error in updateFlashcardSet:', error);
      throw error;
    }
  }

  async createFlashcardSet(setData: Partial<AdminFlashcardSet>): Promise<AdminFlashcardSet> {
    try {
      const response = await this.api.post('/api/flashcard_sets', setData);
      return response.data;
    } catch (error) {
      console.error('Error in createFlashcardSet:', error);
      throw error;
    }
  }
}

export const AdminFlashcardService = new AdminFlashcardServiceClass();
export default AdminFlashcardService;