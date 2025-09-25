import { FlashcardSet, Flashcard, User } from '../models';
import { Types } from 'mongoose';

export interface CreateFlashcardSetData {
  title: string;
  subject: string;
  topic?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  gradeLevelId?: string;
  isPublic?: boolean;
  flashcards: CreateFlashcardData[];
}

export interface CreateFlashcardData {
  frontText: string;
  backText: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

export interface UpdateFlashcardSetData {
  title?: string;
  subject?: string;
  topic?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  gradeLevelId?: string;
  isPublic?: boolean;
}

export interface StudySessionResult {
  flashcardId: string;
  correct: boolean;
  timeSpent?: number;
}

export class FlashcardService {
  /**
   * Create a new flashcard set with flashcards
   */
  static async createSet(userId: string, data: CreateFlashcardSetData): Promise<any> {
    const user = await User.findById(userId);
    if (!user || user.role !== 'tutor') {
      throw new Error('Only tutors can create flashcard sets');
    }

    // Create the flashcard set
    const flashcardSet = new FlashcardSet({
      tutorId: userId,
      title: data.title,
      subject: data.subject,
      topic: data.topic,
      description: data.description,
      difficulty: data.difficulty || 'medium',
      gradeLevelId: data.gradeLevelId,
      isPublic: data.isPublic || false
    });

    await flashcardSet.save();

    // Create flashcards
    const flashcards = data.flashcards.map((card, index) =>
      new Flashcard({
        setId: flashcardSet._id,
        frontText: card.frontText,
        backText: card.backText,
        cardOrder: index,
        difficulty: card.difficulty || data.difficulty || 'medium',
        tags: card.tags
      })
    );

    await Flashcard.insertMany(flashcards);

    // Return the complete set with flashcards
    return await this.getSetById(flashcardSet._id.toString(), userId);
  }

  /**
   * Get flashcard set by ID with flashcards
   */
  static async getSetById(setId: string, userId?: string): Promise<any> {
    const set = await FlashcardSet.findById(setId)
      .populate('tutorId', 'firstName lastName fullName')
      .populate('gradeLevelId', 'displayName');

    if (!set || !set.isActive) {
      throw new Error('Flashcard set not found');
    }

    // Check if user can access (private sets can only be viewed by creator)
    if (!set.isPublic && (!userId || !set.tutorId.equals(userId))) {
      throw new Error('Access denied to private flashcard set');
    }

    const flashcards = await Flashcard.find({ setId: set._id })
      .sort({ cardOrder: 1 });

    const setObj = set.toObject();
    return {
      id: setObj._id.toString(),
      tutor_id: setObj.tutorId,
      title: setObj.title,
      subject: setObj.subject,
      topic: setObj.topic,
      grade_level: setObj.gradeLevelId,
      is_public: setObj.isPublic,
      is_active: setObj.isActive,
      created_at: setObj.createdAt,
      updated_at: setObj.updatedAt,
      tutor: setObj.tutorId && typeof setObj.tutorId === 'object' && 'fullName' in setObj.tutorId ? {
        id: (setObj.tutorId as any)._id?.toString() || setObj.tutorId.toString(),
        full_name: (setObj.tutorId as any).fullName || `${(setObj.tutorId as any).firstName} ${(setObj.tutorId as any).lastName}`,
        email: (setObj.tutorId as any).email
      } : undefined,
      cards: flashcards.map(card => ({
        id: card._id.toString(),
        set_id: card.setId.toString(),
        front_text: card.frontText,
        back_text: card.backText,
        card_order: card.cardOrder,
        created_at: card.createdAt
      }))
    };
  }

  /**
   * Get flashcard sets with filtering
   */
  static async getSets(filters: {
    tutorId?: string;
    subject?: string;
    difficulty?: string;
    gradeLevelId?: string;
    isPublic?: boolean;
    userId?: string; // for access control
    limit?: number;
    skip?: number;
  }): Promise<any[]> {
    const query: any = { isActive: true };

    if (filters.tutorId) {
      query.tutorId = filters.tutorId;
    }

    if (filters.subject) {
      query.subject = filters.subject;
    }

    if (filters.difficulty) {
      query.difficulty = filters.difficulty;
    }

    if (filters.gradeLevelId) {
      query.gradeLevelId = filters.gradeLevelId;
    }

    if (filters.isPublic !== undefined) {
      query.isPublic = filters.isPublic;
    } else if (filters.userId) {
      // If no public filter specified and we have userId, show both public and user's private sets
      query.$or = [
        { isPublic: true },
        { tutorId: filters.userId }
      ];
    } else {
      // Default to public only
      query.isPublic = true;
    }

    const sets = await FlashcardSet.find(query)
      .populate('tutorId', 'firstName lastName fullName')
      .populate('gradeLevelId', 'displayName')
      .sort({ createdAt: -1 })
      .skip(filters.skip || 0)
      .limit(filters.limit || 20);

    // Add flashcard count to each set
    const setsWithCount = await Promise.all(
      sets.map(async (set) => {
        const count = await Flashcard.countDocuments({ setId: set._id });
        const setObj = set.toObject();
        return {
          id: setObj._id.toString(),
          tutor_id: setObj.tutorId,
          title: setObj.title,
          subject: setObj.subject,
          topic: setObj.topic,
          grade_level: setObj.gradeLevelId,
          is_public: setObj.isPublic,
          is_active: setObj.isActive,
          created_at: setObj.createdAt,
          updated_at: setObj.updatedAt,
          tutor: setObj.tutorId && typeof setObj.tutorId === 'object' && 'fullName' in setObj.tutorId ? {
            id: (setObj.tutorId as any)._id?.toString() || setObj.tutorId.toString(),
            full_name: (setObj.tutorId as any).fullName || `${(setObj.tutorId as any).firstName} ${(setObj.tutorId as any).lastName}`,
            email: (setObj.tutorId as any).email
          } : undefined,
          flashcardCount: count
        };
      })
    );

    return setsWithCount;
  }

  /**
   * Update flashcard set
   */
  static async updateSet(setId: string, userId: string, data: UpdateFlashcardSetData): Promise<any> {
    const set = await FlashcardSet.findById(setId);

    if (!set || !set.isActive) {
      throw new Error('Flashcard set not found');
    }

    // Check ownership
    if (!set.tutorId.equals(userId)) {
      throw new Error('Only the creator can update this flashcard set');
    }

    // Update fields
    Object.assign(set, data);
    await set.save();

    return await this.getSetById(setId, userId);
  }

  /**
   * Delete flashcard set (soft delete)
   */
  static async deleteSet(setId: string, userId: string): Promise<void> {
    const set = await FlashcardSet.findById(setId);

    if (!set || !set.isActive) {
      throw new Error('Flashcard set not found');
    }

    // Check ownership
    if (!set.tutorId.equals(userId)) {
      throw new Error('Only the creator can delete this flashcard set');
    }

    // Soft delete
    set.isActive = false;
    await set.save();

    // Also deactivate all flashcards in the set
    await Flashcard.updateMany(
      { setId: set._id },
      { isActive: false }
    );
  }

  /**
   * Add flashcards to a set
   */
  static async addFlashcards(setId: string, userId: string, flashcards: CreateFlashcardData[]): Promise<any> {
    const set = await FlashcardSet.findById(setId);

    if (!set || !set.isActive) {
      throw new Error('Flashcard set not found');
    }

    // Check ownership
    if (!set.tutorId.equals(userId)) {
      throw new Error('Only the creator can add flashcards to this set');
    }

    // Get current max order
    const maxOrder = await Flashcard.findOne({ setId: set._id })
      .sort({ cardOrder: -1 })
      .select('cardOrder');
    const nextOrder = (maxOrder?.cardOrder || 0) + 1;

    // Create new flashcards
    const newFlashcards = flashcards.map((card, index) =>
      new Flashcard({
        setId: set._id,
        frontText: card.frontText,
        backText: card.backText,
        cardOrder: nextOrder + index,
        difficulty: card.difficulty || set.difficulty,
        tags: card.tags
      })
    );

    await Flashcard.insertMany(newFlashcards);

    return await this.getSetById(setId, userId);
  }

  /**
   * Update a flashcard
   */
  static async updateFlashcard(flashcardId: string, userId: string, data: Partial<CreateFlashcardData>): Promise<any> {
    const flashcard = await Flashcard.findById(flashcardId);

    if (!flashcard || !flashcard.isActive) {
      throw new Error('Flashcard not found');
    }

    // Check ownership via set
    const set = await FlashcardSet.findById(flashcard.setId);
    if (!set || !set.tutorId.equals(userId)) {
      throw new Error('Only the creator can update this flashcard');
    }

    Object.assign(flashcard, data);
    await flashcard.save();

    return flashcard;
  }

  /**
   * Delete a flashcard
   */
  static async deleteFlashcard(flashcardId: string, userId: string): Promise<void> {
    const flashcard = await Flashcard.findById(flashcardId);

    if (!flashcard || !flashcard.isActive) {
      throw new Error('Flashcard not found');
    }

    // Check ownership via set
    const set = await FlashcardSet.findById(flashcard.setId);
    if (!set || !set.tutorId.equals(userId)) {
      throw new Error('Only the creator can delete this flashcard');
    }

    flashcard.isActive = false;
    await flashcard.save();
  }

  /**
   * Get flashcards for study session (spaced repetition)
   */
  static async getStudySession(setId: string, userId: string, count: number = 10): Promise<any[]> {
    const set = await FlashcardSet.findById(setId);

    if (!set || !set.isActive) {
      throw new Error('Flashcard set not found');
    }

    // Check access
    if (!set.isPublic && !set.tutorId.equals(userId)) {
      throw new Error('Access denied to private flashcard set');
    }

    // Get due flashcards using spaced repetition logic
    const dueCards = await (Flashcard as any).getDueCards(setId, count);

    // If not enough due cards, get new cards
    if (dueCards.length < count) {
      const newCardsCount = count - dueCards.length;
      const newCards = await Flashcard.find({
        setId: setId,
        nextReviewDate: { $exists: false }
      })
        .limit(newCardsCount)
        .sort({ cardOrder: 1 });

      dueCards.push(...newCards);
    }

    // Increment study count
    await (set as any).incrementStudyCount();

    return dueCards.map((card: any) => ({
      id: card._id,
      frontText: card.frontText,
      backText: card.backText,
      difficulty: card.difficulty,
      tags: card.tags,
      masteryLevel: card.masteryLevel
    }));
  }

  /**
   * Record study session results
   */
  static async recordStudyResults(setId: string, userId: string, results: StudySessionResult[]): Promise<void> {
    const set = await FlashcardSet.findById(setId);

    if (!set || !set.isActive) {
      throw new Error('Flashcard set not found');
    }

    // Check access
    if (!set.isPublic && !set.tutorId.equals(userId)) {
      throw new Error('Access denied to private flashcard set');
    }

    // Update each flashcard
    for (const result of results) {
      const flashcard = await Flashcard.findById(result.flashcardId);
      if (flashcard && flashcard.setId.equals(setId)) {
        await (flashcard as any).recordReview(result.correct);
      }
    }
  }

  /**
   * Reset progress for a flashcard set
   */
  static async resetProgress(setId: string, userId: string): Promise<void> {
    const set = await FlashcardSet.findById(setId);

    if (!set || !set.isActive) {
      throw new Error('Flashcard set not found');
    }

    // Check ownership
    if (!set.tutorId.equals(userId)) {
      throw new Error('Only the creator can reset progress for this set');
    }

    await Flashcard.updateMany(
      { setId: setId },
      {
        $unset: {
          lastReviewed: 1,
          nextReviewDate: 1
        },
        $set: {
          reviewCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          masteryLevel: 0
        }
      }
    );
  }

  /**
   * Get flashcard statistics
   */
  static async getStatistics(setId: string, userId: string): Promise<any> {
    const set = await FlashcardSet.findById(setId);

    if (!set || !set.isActive) {
      throw new Error('Flashcard set not found');
    }

    // Check access
    if (!set.isPublic && !set.tutorId.equals(userId)) {
      throw new Error('Access denied to private flashcard set');
    }

    const stats = await Flashcard.aggregate([
      { $match: { setId: new Types.ObjectId(setId) } },
      {
        $group: {
          _id: null,
          totalCards: { $sum: 1 },
          reviewedCards: {
            $sum: { $cond: [{ $gt: ['$reviewCount', 0] }, 1, 0] }
          },
          masteredCards: {
            $sum: { $cond: [{ $gte: ['$masteryLevel', 80] }, 1, 0] }
          },
          averageMastery: { $avg: '$masteryLevel' },
          totalReviews: { $sum: '$reviewCount' },
          totalCorrect: { $sum: '$correctCount' },
          totalIncorrect: { $sum: '$incorrectCount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalCards: 0,
      reviewedCards: 0,
      masteredCards: 0,
      averageMastery: 0,
      totalReviews: 0,
      totalCorrect: 0,
      totalIncorrect: 0
    };

    result.accuracy = result.totalReviews > 0
      ? (result.totalCorrect / (result.totalCorrect + result.totalIncorrect)) * 100
      : 0;

    return result;
  }

  /**
   * Get available flashcard sets for a student
   */
  static async getAvailableSetsForStudent(studentId: string, subject?: string): Promise<any[]> {
    const query: any = { isActive: true, isPublic: true };

    if (subject) {
      query.subject = new RegExp(subject, 'i');
    }

    const sets = await FlashcardSet.find(query)
      .populate('tutorId', 'firstName lastName fullName')
      .populate('gradeLevelId', 'displayName')
      .sort({ createdAt: -1 })
      .limit(20);

    // Add flashcard count to each set
    const setsWithCount = await Promise.all(
      sets.map(async (set) => {
        const count = await Flashcard.countDocuments({ setId: set._id });
        const setObj = set.toObject();
        return {
          id: setObj._id.toString(),
          tutor_id: setObj.tutorId,
          title: setObj.title,
          subject: setObj.subject,
          topic: setObj.topic,
          grade_level: setObj.gradeLevelId,
          is_public: setObj.isPublic,
          is_active: setObj.isActive,
          created_at: setObj.createdAt,
          updated_at: setObj.updatedAt,
          tutor: setObj.tutorId && typeof setObj.tutorId === 'object' && 'fullName' in setObj.tutorId ? {
            id: (setObj.tutorId as any)._id?.toString() || setObj.tutorId.toString(),
            full_name: (setObj.tutorId as any).fullName || `${(setObj.tutorId as any).firstName} ${(setObj.tutorId as any).lastName}`,
            email: (setObj.tutorId as any).email
          } : undefined,
          flashcardCount: count
        };
      })
    );

    return setsWithCount;
  }
}
