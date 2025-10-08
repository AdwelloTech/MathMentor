import { Subject, ISubject } from '../models/Subject';

export class SubjectService {
  /**
   * Get all active subjects
   */
  static async getActiveSubjects(): Promise<ISubject[]> {
    try {
      return await Subject.find({ isActive: true })
        .sort({ sortOrder: 1, displayName: 1 });
    } catch (error) {
      console.error('Error getting active subjects:', error);
      throw error;
    }
  }

  /**
   * Get subject by ID
   */
  static async getSubjectById(subjectId: string): Promise<ISubject | null> {
    try {
      return await Subject.findById(subjectId);
    } catch (error) {
      console.error('Error getting subject by ID:', error);
      throw error;
    }
  }

  /**
   * Get subjects by category
   */
  static async getSubjectsByCategory(category: string): Promise<ISubject[]> {
    try {
      return await Subject.find({ category, isActive: true })
        .sort({ sortOrder: 1, displayName: 1 });
    } catch (error) {
      console.error('Error getting subjects by category:', error);
      throw error;
    }
  }

  /**
   * Get subjects by names array
   */
  static async getSubjectsByNames(names: string[]): Promise<ISubject[]> {
    try {
      if (names.length === 0) return [];

      return await Subject.find({
        name: { $in: names },
        isActive: true
      }).sort({ sortOrder: 1, displayName: 1 });
    } catch (error) {
      console.error('Error getting subjects by names:', error);
      throw error;
    }
  }

  /**
   * Create a new subject
   */
  static async createSubject(subjectData: Partial<ISubject>): Promise<ISubject> {
    try {
      const subject = new Subject(subjectData);
      return await subject.save();
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  }

  /**
   * Update subject
   */
  static async updateSubject(subjectId: string, updates: Partial<ISubject>): Promise<ISubject | null> {
    try {
      return await Subject.findByIdAndUpdate(subjectId, updates, { new: true });
    } catch (error) {
      console.error('Error updating subject:', error);
      throw error;
    }
  }

  /**
   * Delete subject (soft delete by setting isActive to false)
   */
  static async deleteSubject(subjectId: string): Promise<ISubject | null> {
    try {
      return await Subject.findByIdAndUpdate(subjectId, { isActive: false }, { new: true });
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  }

  /**
   * Initialize default subjects if none exist
   */
  static async initializeDefaultSubjects(): Promise<void> {
    try {
      const count = await Subject.countDocuments();
      if (count === 0) {
        console.log('Initializing default subjects...');
        const { DEFAULT_SUBJECTS } = await import('../models/Subject');
        await Subject.insertMany(DEFAULT_SUBJECTS);
        console.log('Default subjects initialized');
      }
    } catch (error) {
      console.error('Error initializing default subjects:', error);
      throw error;
    }
  }
}
