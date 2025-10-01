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
        subject_id: (note.subjectId as any)?.toString() || null,
        subject_name: (note.subjectId as any)?.name || null,
        subject_display_name: (note.subjectId as any)?.displayName || null,
        subject_color: (note.subjectId as any)?.color || null,
        grade_level_display: (note.gradeLevelId as any)?.displayName || null,
        tutor_id: (note.createdBy as any)?._id.toString(),
        tutor_name: (note.createdBy as any)?.fullName || `${(note.createdBy as any)?.firstName} ${(note.createdBy as any)?.lastName}`,
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
        subject_id: (material.subjectId as any)?.toString() || null,
        subject_name: (material.subjectId as any)?.name || null,
        subject_display_name: (material.subjectId as any)?.displayName || null,
        subject_color: (material.subjectId as any)?.color || null,
        grade_level_display: (material.gradeLevelId as any)?.displayName || null,
        tutor_id: (material.createdBy as any)?._id.toString(),
        tutor_name: (material.createdBy as any)?.fullName || `${(material.createdBy as any)?.firstName} ${(material.createdBy as any)?.lastName}`,
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

  /**
   * Get tutor materials for a specific tutor
   */
  static async getTutorMaterials(tutorId: string) {
    try {
      const tutorNotes = await TutorNote.find({ createdBy: tutorId, isActive: true })
        .populate('subjectId', 'name displayName color')
        .populate('gradeLevelId', 'displayName')
        .sort({ createdAt: -1 });

      return tutorNotes.map(note => ({
        id: note._id.toString(),
        title: note.title,
        description: note.description || null,
        content: note.content || null,
        file_url: note.fileUrl || null,
        file_name: note.fileName || null,
        file_size: note.fileSize || null,
        subject_id: (note.subjectId as any)?.toString() || null,
        subject_name: (note.subjectId as any)?.name || null,
        subject_display_name: (note.subjectId as any)?.displayName || null,
        subject_color: (note.subjectId as any)?.color || null,
        grade_level_id: (note.gradeLevelId as any)?.toString() || null,
        grade_level_display: (note.gradeLevelId as any)?.displayName || null,
        is_premium: note.isPremium,
        view_count: note.viewCount,
        download_count: note.downloadCount,
        tags: note.tags || [],
        created_at: note.createdAt.toISOString(),
        updated_at: note.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('Error in getTutorMaterials:', error);
      throw error;
    }
  }

  /**
   * Search tutor materials for a specific tutor
   */
  static async searchTutorMaterials(tutorId: string, searchTerm?: string) {
    try {
      let query: any = { createdBy: tutorId, isActive: true };

      if (searchTerm && searchTerm.trim()) {
        query.$text = { $search: searchTerm.trim() };
      }

      const tutorNotes = await TutorNote.find(query)
        .populate('subjectId', 'name displayName color')
        .populate('gradeLevelId', 'displayName')
        .sort(searchTerm ? { score: { $meta: 'textScore' } } : { createdAt: -1 });

      return tutorNotes.map(note => ({
        id: note._id.toString(),
        title: note.title,
        description: note.description || null,
        content: note.content || null,
        file_url: note.fileUrl || null,
        file_name: note.fileName || null,
        file_size: note.fileSize || null,
        subject_id: (note.subjectId as any)?.toString() || null,
        subject_name: (note.subjectId as any)?.name || null,
        subject_display_name: (note.subjectId as any)?.displayName || null,
        subject_color: (note.subjectId as any)?.color || null,
        grade_level_id: (note.gradeLevelId as any)?.toString() || null,
        grade_level_display: (note.gradeLevelId as any)?.displayName || null,
        is_premium: note.isPremium,
        view_count: note.viewCount,
        download_count: note.downloadCount,
        tags: note.tags || [],
        created_at: note.createdAt.toISOString(),
        updated_at: note.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('Error in searchTutorMaterials:', error);
      throw error;
    }
  }

  /**
   * Create a new tutor material
   */
  static async createTutorMaterial(tutorId: string, materialData: any) {
    try {
      const {
        title,
        description,
        content,
        subjectId,
        gradeLevelId,
        isPremium,
        tags,
        file,
      } = materialData;

      let fileUrl = null;
      let fileName = null;
      let fileSize = null;

      // Handle file upload if provided
      if (file) {
        const fs = require('fs').promises;
        const path = require('path');

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads', 'tutor-materials');
        await fs.mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExt}`;
        const filePath = path.join(uploadsDir, uniqueName);

        // Move file to uploads directory
        await fs.writeFile(filePath, file.buffer);

        // Set file URL (relative to uploads directory)
        fileUrl = `/uploads/tutor-materials/${uniqueName}`;
        fileName = file.originalname;
        fileSize = file.size;
      }

      const newNote = new TutorNote({
        title,
        description,
        content,
        subjectId: subjectId ? new mongoose.Types.ObjectId(subjectId) : null,
        gradeLevelId: gradeLevelId ? new mongoose.Types.ObjectId(gradeLevelId) : null,
        createdBy: new mongoose.Types.ObjectId(tutorId),
        isPremium: isPremium || false,
        isActive: true,
        viewCount: 0,
        downloadCount: 0,
        likeCount: 0,
        tags: tags || [],
        fileUrl,
        fileName,
        fileSize,
      });

      const savedNote = await newNote.save();

      // Populate and return
      await savedNote.populate('subjectId', 'name displayName color');
      await savedNote.populate('gradeLevelId', 'displayName');

      return {
        id: savedNote._id.toString(),
        title: savedNote.title,
        description: savedNote.description || null,
        content: savedNote.content || null,
        file_url: savedNote.fileUrl || null,
        file_name: savedNote.fileName || null,
        file_size: savedNote.fileSize || null,
        subject_id: savedNote.subjectId?.toString() || null,
        subject_name: (savedNote.subjectId as any)?.name || null,
        subject_display_name: (savedNote.subjectId as any)?.displayName || null,
        subject_color: (savedNote.subjectId as any)?.color || null,
        grade_level_id: savedNote.gradeLevelId?.toString() || null,
        grade_level_display: (savedNote.gradeLevelId as any)?.displayName || null,
        is_premium: savedNote.isPremium,
        view_count: savedNote.viewCount,
        download_count: savedNote.downloadCount,
        tags: savedNote.tags || [],
        created_at: savedNote.createdAt.toISOString(),
        updated_at: savedNote.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('Error in createTutorMaterial:', error);
      throw error;
    }
  }

  /**
   * Update a tutor material
   */
  static async updateTutorMaterial(materialId: string, tutorId: string, materialData: any) {
    try {
      const {
        title,
        description,
        content,
        subjectId,
        gradeLevelId,
        isPremium,
        tags,
        file,
      } = materialData;

      // First check if material exists and belongs to tutor
      const existingNote = await TutorNote.findOne({
        _id: new mongoose.Types.ObjectId(materialId),
        createdBy: new mongoose.Types.ObjectId(tutorId),
        isActive: true,
      });

      if (!existingNote) {
        return null;
      }

      let fileUrl = existingNote.fileUrl;
      let fileName = existingNote.fileName;
      let fileSize = existingNote.fileSize;

      // Handle file upload if provided
      if (file) {
        const fs = require('fs').promises;
        const path = require('path');

        // Delete old file if exists
        if (existingNote.fileUrl) {
          const oldFilePath = path.join(process.cwd(), existingNote.fileUrl);
          try {
            await fs.unlink(oldFilePath);
          } catch (error) {
            console.warn('Could not delete old file:', error);
          }
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads', 'tutor-materials');
        await fs.mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExt}`;
        const filePath = path.join(uploadsDir, uniqueName);

        // Move file to uploads directory
        await fs.writeFile(filePath, file.buffer);

        // Set file URL (relative to uploads directory)
        fileUrl = `/uploads/tutor-materials/${uniqueName}`;
        fileName = file.originalname;
        fileSize = file.size;
      }

      // Update the note
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (content !== undefined) updateData.content = content;
      if (subjectId !== undefined) {
        updateData.subjectId = subjectId && mongoose.Types.ObjectId.isValid(subjectId) ? new mongoose.Types.ObjectId(subjectId) : null;
      }
      if (gradeLevelId !== undefined) {
        updateData.gradeLevelId = gradeLevelId && mongoose.Types.ObjectId.isValid(gradeLevelId) ? new mongoose.Types.ObjectId(gradeLevelId) : null;
      }
      if (isPremium !== undefined) updateData.isPremium = isPremium;
      if (tags !== undefined) updateData.tags = tags;
      if (file) {
        updateData.fileUrl = fileUrl;
        updateData.fileName = fileName;
        updateData.fileSize = fileSize;
      }

      const updatedNote = await TutorNote.findByIdAndUpdate(
        materialId,
        updateData,
        { new: true }
      )
        .populate('subjectId', 'name displayName color')
        .populate('gradeLevelId', 'displayName');

      if (!updatedNote) {
        return null;
      }

      return {
        id: updatedNote._id.toString(),
        title: updatedNote.title,
        description: updatedNote.description || null,
        content: updatedNote.content || null,
        file_url: updatedNote.fileUrl || null,
        file_name: updatedNote.fileName || null,
        file_size: updatedNote.fileSize || null,
        subject_id: (updatedNote.subjectId as any)?.toString() || null,
        subject_name: (updatedNote.subjectId as any)?.name || null,
        subject_display_name: (updatedNote.subjectId as any)?.displayName || null,
        subject_color: (updatedNote.subjectId as any)?.color || null,
        grade_level_id: (updatedNote.gradeLevelId as any)?.toString() || null,
        grade_level_display: (updatedNote.gradeLevelId as any)?.displayName || null,
        is_premium: updatedNote.isPremium,
        view_count: updatedNote.viewCount,
        download_count: updatedNote.downloadCount,
        tags: updatedNote.tags || [],
        created_at: updatedNote.createdAt.toISOString(),
        updated_at: updatedNote.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('Error in updateTutorMaterial:', error);
      throw error;
    }
  }

  /**
   * Delete a tutor material
   */
  static async deleteTutorMaterial(materialId: string, tutorId: string): Promise<boolean> {
    try {
      // First check if material exists and belongs to tutor
      const existingNote = await TutorNote.findOne({
        _id: new mongoose.Types.ObjectId(materialId),
        createdBy: new mongoose.Types.ObjectId(tutorId),
        isActive: true,
      });

      if (!existingNote) {
        return false;
      }

      // Delete associated file if exists
      if (existingNote.fileUrl) {
        const fs = require('fs').promises;
        const path = require('path');
        const filePath = path.join(process.cwd(), existingNote.fileUrl);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.warn('Could not delete file:', error);
        }
      }

      // Soft delete the note
      await TutorNote.findByIdAndUpdate(materialId, { isActive: false });

      return true;
    } catch (error) {
      console.error('Error in deleteTutorMaterial:', error);
      throw error;
    }
  }
}
