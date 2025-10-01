import { GradeLevel, IGradeLevel } from '../models/GradeLevel';

export class GradeLevelService {
  /**
   * Get all active grade levels
   */
  static async getActiveGradeLevels(): Promise<IGradeLevel[]> {
    try {
      return await GradeLevel.find({ isActive: true })
        .sort({ sortOrder: 1 });
    } catch (error) {
      console.error('Error getting active grade levels:', error);
      throw error;
    }
  }

  /**
   * Get grade level by ID
   */
  static async getGradeLevelById(gradeLevelId: string): Promise<IGradeLevel | null> {
    try {
      return await GradeLevel.findById(gradeLevelId);
    } catch (error) {
      console.error('Error getting grade level by ID:', error);
      throw error;
    }
  }

  /**
   * Get grade levels by category
   */
  static async getGradeLevelsByCategory(category: string): Promise<IGradeLevel[]> {
    try {
      return await GradeLevel.find({ category, isActive: true })
        .sort({ sortOrder: 1 });
    } catch (error) {
      console.error('Error getting grade levels by category:', error);
      throw error;
    }
  }

  /**
   * Get grade level by code
   */
  static async getGradeLevelByCode(code: string): Promise<IGradeLevel | null> {
    try {
      return await GradeLevel.findOne({ code: code.toUpperCase(), isActive: true });
    } catch (error) {
      console.error('Error getting grade level by code:', error);
      throw error;
    }
  }

  /**
   * Create a new grade level
   */
  static async createGradeLevel(gradeLevelData: Partial<IGradeLevel>): Promise<IGradeLevel> {
    try {
      const gradeLevel = new GradeLevel(gradeLevelData);
      return await gradeLevel.save();
    } catch (error) {
      console.error('Error creating grade level:', error);
      throw error;
    }
  }

  /**
   * Update grade level
   */
  static async updateGradeLevel(gradeLevelId: string, updates: Partial<IGradeLevel>): Promise<IGradeLevel | null> {
    try {
      return await GradeLevel.findByIdAndUpdate(gradeLevelId, updates, { new: true });
    } catch (error) {
      console.error('Error updating grade level:', error);
      throw error;
    }
  }

  /**
   * Delete grade level (soft delete by setting isActive to false)
   */
  static async deleteGradeLevel(gradeLevelId: string): Promise<IGradeLevel | null> {
    try {
      return await GradeLevel.findByIdAndUpdate(gradeLevelId, { isActive: false }, { new: true });
    } catch (error) {
      console.error('Error deleting grade level:', error);
      throw error;
    }
  }

  /**
   * Initialize default grade levels if none exist
   */
  static async initializeDefaultGradeLevels(): Promise<void> {
    try {
      const count = await GradeLevel.countDocuments();
      if (count === 0) {
        console.log('Initializing default grade levels...');
        const { DEFAULT_GRADE_LEVELS } = await import('../models/GradeLevel');
        await GradeLevel.insertMany(DEFAULT_GRADE_LEVELS);
        console.log('Default grade levels initialized');
      }
    } catch (error) {
      console.error('Error initializing default grade levels:', error);
      throw error;
    }
  }
}
