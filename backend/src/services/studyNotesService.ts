import mongoose from 'mongoose';
import { StudyNote, IStudyNote } from '../models/StudyNote';

export interface CreateStudyNoteData {
  title: string;
  description?: string;
  content: string;
  subjectId?: string;
  gradeLevelId?: string;
  isPublic?: boolean;
  tags?: string[];
  attachments?: string[];
}

export interface UpdateStudyNoteData {
  title?: string;
  description?: string;
  content?: string;
  subjectId?: string;
  gradeLevelId?: string;
  isPublic?: boolean;
  tags?: string[];
  attachments?: string[];
}

export interface StudyNoteFilters {
  searchTerm?: string;
  subjectId?: string;
  gradeLevelId?: string;
  createdBy?: string;
  isPublic?: boolean;
  userId?: string;
  limit?: number;
  skip?: number;
}

export class StudyNotesService {
  // Create a new study note
  static async createStudyNote(userId: string, noteData: CreateStudyNoteData): Promise<IStudyNote> {
    const studyNote = new StudyNote({
      ...noteData,
      createdBy: new mongoose.Types.ObjectId(userId),
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      isActive: true,
    });

    return await studyNote.save();
  }

  // Get study note by ID
  static async getStudyNoteById(noteId: string, userId?: string): Promise<IStudyNote | null> {
    const query: any = { _id: noteId, isActive: true };

    // If userId provided, check if note is public or created by user
    if (userId) {
      query.$or = [
        { isPublic: true },
        { createdBy: new mongoose.Types.ObjectId(userId) }
      ];
    } else {
      query.isPublic = true;
    }

    const note = await StudyNote.findOne(query)
      .populate('createdBy', 'firstName lastName fullName avatarUrl')
      .populate('subjectId', 'name displayName color')
      .populate('gradeLevelId', 'displayName');

    // Increment view count if found
    if (note) {
      await (note as any).incrementViewCount();
    }

    return note;
  }

  // Get study notes with filters and search
  static async getStudyNotes(filters: StudyNoteFilters): Promise<{ notes: IStudyNote[]; total: number }> {
    const query: any = { isActive: true };

    // Apply filters
    if (filters.subjectId) {
      query.subjectId = new mongoose.Types.ObjectId(filters.subjectId);
    }

    if (filters.gradeLevelId) {
      query.gradeLevelId = new mongoose.Types.ObjectId(filters.gradeLevelId);
    }

    // User-specific filters
    if (filters.userId) {
      if (filters.createdBy && filters.createdBy !== filters.userId) {
        // If filtering by another user's notes, only show public ones
        query.isPublic = true;
        query.createdBy = new mongoose.Types.ObjectId(filters.createdBy);
      } else {
        // Show user's own notes or public notes
        query.$or = [
          { createdBy: new mongoose.Types.ObjectId(filters.userId) },
          { isPublic: true }
        ];
      }
    } else {
      // No user context, only public notes
      query.isPublic = true;
    }

    if (filters.isPublic !== undefined) {
      query.isPublic = filters.isPublic;
    }

    const limit = filters.limit || 20;
    const skip = filters.skip || 0;

    let queryBuilder = StudyNote.find(query);

    // Apply text search if search term provided
    if (filters.searchTerm) {
      queryBuilder = queryBuilder
        .find({ $text: { $search: filters.searchTerm } })
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      queryBuilder = queryBuilder.sort({ createdAt: -1 });
    }

    const [notes, total] = await Promise.all([
      queryBuilder
        .populate('createdBy', 'firstName lastName fullName avatarUrl')
        .populate('subjectId', 'name displayName color')
        .populate('gradeLevelId', 'displayName')
        .limit(limit)
        .skip(skip),
      StudyNote.countDocuments(query)
    ]);

    return { notes, total };
  }

  // Update study note
  static async updateStudyNote(noteId: string, userId: string, updateData: UpdateStudyNoteData): Promise<IStudyNote> {
    const note = await StudyNote.findOne({
      _id: noteId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!note) {
      throw new Error('Study note not found or access denied');
    }

    Object.assign(note, updateData);
    return await note.save();
  }

  // Delete study note (soft delete)
  static async deleteStudyNote(noteId: string, userId: string): Promise<void> {
    const note = await StudyNote.findOne({
      _id: noteId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!note) {
      throw new Error('Study note not found or access denied');
    }

    note.isActive = false;
    await note.save();
  }

  // Duplicate study note
  static async duplicateStudyNote(noteId: string, userId: string, newTitle?: string): Promise<IStudyNote> {
    const originalNote = await StudyNote.findOne({
      _id: noteId,
      isActive: true,
      $or: [
        { isPublic: true },
        { createdBy: new mongoose.Types.ObjectId(userId) }
      ]
    });

    if (!originalNote) {
      throw new Error('Study note not found or access denied');
    }

    // Create duplicate note
    const duplicateNote = new StudyNote({
      title: newTitle || `${originalNote.title} (Copy)`,
      description: originalNote.description,
      content: originalNote.content,
      subjectId: originalNote.subjectId,
      gradeLevelId: originalNote.gradeLevelId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isPublic: false, // Duplicates are private by default
      tags: originalNote.tags,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      attachments: originalNote.attachments,
      isActive: true,
    });

    return await duplicateNote.save();
  }

  // Toggle like on study note
  static async toggleLike(noteId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const note = await StudyNote.findOne({
      _id: noteId,
      isActive: true,
      isPublic: true // Only public notes can be liked
    });

    if (!note) {
      throw new Error('Study note not found or not accessible');
    }

    // In a real implementation, you'd check a likes collection
    // For now, we'll just increment the count
    const liked = await (note as any).toggleLike(new mongoose.Types.ObjectId(userId));

    return {
      liked,
      likeCount: note.likeCount
    };
  }

  // Get popular study notes
  static async getPopularNotes(limit: number = 10): Promise<IStudyNote[]> {
    return await (StudyNote as any).getPopular(limit);
  }

  // Get user's study notes
  static async getUserNotes(userId: string, limit: number = 20, skip: number = 0): Promise<{ notes: IStudyNote[]; total: number }> {
    const query = {
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    };

    const [notes, total] = await Promise.all([
      StudyNote.find(query)
        .populate('subjectId', 'name displayName color')
        .populate('gradeLevelId', 'displayName')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .skip(skip),
      StudyNote.countDocuments(query)
    ]);

    return { notes, total };
  }

  // Search study notes
  static async searchStudyNotes(searchData: {
    query?: string;
    subjectId?: string;
    gradeLevelId?: string;
    userId?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ notes: IStudyNote[]; total: number }> {
    const filters: StudyNoteFilters = {
      searchTerm: searchData.query,
      subjectId: searchData.subjectId,
      gradeLevelId: searchData.gradeLevelId,
      userId: searchData.userId,
      limit: searchData.limit,
      skip: searchData.skip,
    };

    return await this.getStudyNotes(filters);
  }

  // Bulk update tags
  static async updateTags(noteId: string, userId: string, tags: string[]): Promise<IStudyNote> {
    const note = await StudyNote.findOne({
      _id: noteId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!note) {
      throw new Error('Study note not found or access denied');
    }

    note.tags = tags;
    return await note.save();
  }

  // Publish/unpublish study note
  static async togglePublishStatus(noteId: string, userId: string): Promise<IStudyNote> {
    const note = await StudyNote.findOne({
      _id: noteId,
      createdBy: new mongoose.Types.ObjectId(userId),
      isActive: true
    });

    if (!note) {
      throw new Error('Study note not found or access denied');
    }

    note.isPublic = !note.isPublic;
    return await note.save();
  }

  // Get study notes statistics
  static async getStats(userId?: string): Promise<{
    totalNotes: number;
    publicNotes: number;
    totalViews: number;
    totalLikes: number;
  }> {
    const matchQuery: any = { isActive: true };

    if (userId) {
      matchQuery.createdBy = new mongoose.Types.ObjectId(userId);
    }

    const stats = await StudyNote.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          publicNotes: { $sum: { $cond: ['$isPublic', 1, 0] } },
          totalViews: { $sum: '$viewCount' },
          totalLikes: { $sum: '$likeCount' }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        totalNotes: 0,
        publicNotes: 0,
        totalViews: 0,
        totalLikes: 0
      };
    }

    return stats[0];
  }

  // Get study notes by subject
  static async getNotesBySubject(subjectId: string, userId?: string, limit: number = 20): Promise<IStudyNote[]> {
    const query: any = {
      subjectId: new mongoose.Types.ObjectId(subjectId),
      isActive: true,
      isPublic: true
    };

    // Include user's private notes if userId provided
    if (userId) {
      query.$or = [
        { isPublic: true },
        { createdBy: new mongoose.Types.ObjectId(userId) }
      ];
    }

    return await StudyNote.find(query)
      .populate('createdBy', 'firstName lastName fullName avatarUrl')
      .populate('gradeLevelId', 'displayName')
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(limit);
  }

  // Get recent study notes
  static async getRecentNotes(userId?: string, limit: number = 10): Promise<IStudyNote[]> {
    const query: any = { isActive: true };

    if (userId) {
      query.$or = [
        { isPublic: true },
        { createdBy: new mongoose.Types.ObjectId(userId) }
      ];
    } else {
      query.isPublic = true;
    }

    return await StudyNote.find(query)
      .populate('createdBy', 'firstName lastName fullName avatarUrl')
      .populate('subjectId', 'name displayName color')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}
