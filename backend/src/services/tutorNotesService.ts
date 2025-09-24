import mongoose from 'mongoose';
import TutorNote from '../models/TutorNote';
import User from '../models/User';
import Subject from '../models/Subject';

export class TutorNotesService {
  /**
   * Get tutor materials for a student with search and filtering
   */
  static async getStudentTutorMaterials(
    studentId: string,
    options: {
      searchTerm?: string;
      subjectFilter?: string;
      limit?: number;
      skip?: number;
    } = {}
  ) {
    try {
      const {
        searchTerm,
        subjectFilter,
        limit = 50,
        skip = 0
      } = options;

      // Get student to check premium access
      const student = await User.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const hasPremiumAccess = student.package === 'gold' || student.package === 'silver';

      // Build query
      const query: any = { isActive: true };

      // Search functionality
      if (searchTerm && searchTerm.trim()) {
        query.$text = { $search: searchTerm.trim() };
      }

      // Subject filter
      if (subjectFilter && subjectFilter !== 'all') {
        query.subjectId = new mongoose.Types.ObjectId(subjectFilter);
      }

      // Get tutor notes with populated data
      let tutorNotesQuery = TutorNote.find(query)
        .populate('createdBy', 'firstName lastName fullName')
        .populate('subjectId', 'name displayName color')
        .populate('gradeLevelId', 'displayName')
        .sort(searchTerm ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const tutorNotes = await tutorNotesQuery;

      // Transform to match expected frontend format
      const transformedMaterials = tutorNotes.map(note => ({
        id: note._id.toString(),
        title: note.title,
        description: note.description || null,
        content: note.content || null,
        file_url: note.fileUrl || null,
        file_name: note.fileName || null,
        file_size: note.fileSize || null,
        subject_id: note.subjectId?.toString() || null,
        subject_name: note.subjectId?.name || null,
        subject_display_name: note.subjectId?.displayName || null,
        subject_color: note.subjectId?.color || null,
        grade_level_display: note.gradeLevelId?.displayName || null,
        tutor_id: note.createdBy._id.toString(),
        tutor_name: note.createdBy.fullName || `${note.createdBy.firstName} ${note.createdBy.lastName}`,
        is_premium: note.isPremium,
        view_count: note.viewCount,
        download_count: note.downloadCount,
        like_count: note.likeCount,
        tags: note.tags || [],
        price: note.price || null,
        preview_content: note.previewContent || null,
        created_at: note.createdAt.toISOString(),
        updated_at: note.updatedAt.toISOString()
      }));

      return transformedMaterials;
    } catch (error) {
      console.error('Error in getStudentTutorMaterials:', error);
      throw error;
    }
  }

  /**
   * Check if student has premium access
   */
  static async checkStudentPremiumAccess(studentId: string): Promise<boolean> {
    try {
      const student = await User.findById(studentId);
      if (!student) {
        return false;
      }

      // Premium access for gold and silver packages
      return student.package === 'gold' || student.package === 'silver';
    } catch (error) {
      console.error('Error in checkStudentPremiumAccess:', error);
      return false;
    }
  }

  /**
   * Get note subjects (same as subjects for filtering)
   */
  static async getNoteSubjects() {
    try {
      const subjects = await Subject.find({ isActive: true })
        .sort({ sortOrder: 1 })
        .select('id name displayName color');

      return subjects.map(subject => ({
        id: subject._id.toString(),
        name: subject.name,
        display_name: subject.displayName,
        color: subject.color || '#6B7280'
      }));
    } catch (error) {
      console.error('Error in getNoteSubjects:', error);
      throw error;
    }
  }

  /**
   * Get tutor material by ID for a student
   */
  static async getTutorMaterialById(materialId: string, studentId: string) {
    try {
      const material = await TutorNote.findById(materialId)
        .populate('createdBy', 'firstName lastName fullName')
        .populate('subjectId', 'name displayName color')
        .populate('gradeLevelId', 'displayName');

      if (!material || !material.isActive) {
        return null;
      }

      // Get student to check premium access
      const student = await User.findById(studentId);
      const hasPremiumAccess = student ? (student.package === 'gold' || student.package === 'silver') : false;

      // Check if student can access this material
      const canAccess = !material.isPremium || hasPremiumAccess || material.createdBy._id.toString() === studentId;

      return {
        id: material._id.toString(),
        title: material.title,
        description: material.description || null,
        content: material.content || null,
        file_url: material.fileUrl || null,
        file_name: material.fileName || null,
        file_size: material.fileSize || null,
        subject_id: material.subjectId?.toString() || null,
        subject_name: material.subjectId?.name || null,
        subject_display_name: material.subjectId?.displayName || null,
        subject_color: material.subjectId?.color || null,
        grade_level_display: material.gradeLevelId?.displayName || null,
        tutor_id: material.createdBy._id.toString(),
        tutor_name: material.createdBy.fullName || `${material.createdBy.firstName} ${material.createdBy.lastName}`,
        is_premium: material.isPremium,
        view_count: material.viewCount,
        download_count: material.downloadCount,
        like_count: material.likeCount,
        tags: material.tags || [],
        price: material.price || null,
        preview_content: material.previewContent || null,
        created_at: material.createdAt.toISOString(),
        updated_at: material.updatedAt.toISOString(),
        can_access: canAccess,
        has_premium_access: hasPremiumAccess
      };
    } catch (error) {
      console.error('Error in getTutorMaterialById:', error);
      throw error;
    }
  }

  /**
   * Increment view count for a tutor material
   */
  static async incrementViewCount(materialId: string): Promise<void> {
    try {
      await TutorNote.findByIdAndUpdate(materialId, { $inc: { viewCount: 1 } });
    } catch (error) {
      console.error('Error incrementing view count:', error);
      throw error;
    }
  }

  /**
   * Increment download count for a tutor material
   */
  static async incrementDownloadCount(materialId: string): Promise<void> {
    try {
      await TutorNote.findByIdAndUpdate(materialId, { $inc: { downloadCount: 1 } });
    } catch (error) {
      console.error('Error incrementing download count:', error);
      throw error;
    }
  }
}
