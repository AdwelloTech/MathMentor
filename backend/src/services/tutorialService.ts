import { User } from '../models/User';

export interface TutorialStatus {
  tutorialCompleted: boolean;
  createdAt: Date;
  tutorialDismissedCount: number;
  tutorialLastShown?: Date;
}

export class TutorialService {
  /**
   * Get tutorial status for a user
   */
  static async getTutorialStatus(userId: string): Promise<TutorialStatus | null> {
    try {
      const user = await User.findById(userId).select(
        'tutorialCompleted createdAt tutorialDismissedCount tutorialLastShown'
      );

      if (!user) {
        return null;
      }

      return {
        tutorialCompleted: user.tutorialCompleted || false,
        createdAt: user.createdAt,
        tutorialDismissedCount: user.tutorialDismissedCount || 0,
        tutorialLastShown: user.tutorialLastShown,
      };
    } catch (error) {
      console.error('Error getting tutorial status:', error);
      throw error;
    }
  }

  /**
   * Update tutorial status for a user
   */
  static async updateTutorialStatus(
    userId: string,
    updates: Partial<TutorialStatus>
  ): Promise<TutorialStatus | null> {
    try {
      const updateData: any = {};

      if (updates.tutorialCompleted !== undefined) {
        updateData.tutorialCompleted = updates.tutorialCompleted;
      }

      if (updates.tutorialDismissedCount !== undefined) {
        updateData.tutorialDismissedCount = updates.tutorialDismissedCount;
      }

      if (updates.tutorialLastShown !== undefined) {
        updateData.tutorialLastShown = updates.tutorialLastShown;
      }

      const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select(
        'tutorialCompleted createdAt tutorialDismissedCount tutorialLastShown'
      );

      if (!user) {
        return null;
      }

      return {
        tutorialCompleted: user.tutorialCompleted || false,
        createdAt: user.createdAt,
        tutorialDismissedCount: user.tutorialDismissedCount || 0,
        tutorialLastShown: user.tutorialLastShown,
      };
    } catch (error) {
      console.error('Error updating tutorial status:', error);
      throw error;
    }
  }

  /**
   * Mark tutorial as completed for a user
   */
  static async completeTutorial(userId: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndUpdate(
        userId,
        { tutorialCompleted: true },
        { new: true }
      );

      return !!result;
    } catch (error) {
      console.error('Error completing tutorial:', error);
      throw error;
    }
  }

  /**
   * Dismiss tutorial for a user
   */
  static async dismissTutorial(userId: string): Promise<TutorialStatus | null> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $inc: { tutorialDismissedCount: 1 },
          tutorialLastShown: new Date(),
        },
        { new: true }
      ).select('tutorialCompleted createdAt tutorialDismissedCount tutorialLastShown');

      if (!user) {
        return null;
      }

      return {
        tutorialCompleted: user.tutorialCompleted || false,
        createdAt: user.createdAt,
        tutorialDismissedCount: user.tutorialDismissedCount || 0,
        tutorialLastShown: user.tutorialLastShown,
      };
    } catch (error) {
      console.error('Error dismissing tutorial:', error);
      throw error;
    }
  }
}
