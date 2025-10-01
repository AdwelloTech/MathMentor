import { QuizPdf, IQuizPdf } from '../models/QuizPdf';
import mongoose from 'mongoose';

interface CreateQuizPdfData {
  fileName: string;
  filePath: string;
  fileSize: number;
  gradeLevelId?: string;
  subjectId: string;
  uploadedBy: string;
  isActive?: boolean;
}

interface UpdateQuizPdfData {
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  gradeLevelId?: string;
  subjectId?: string;
  isActive?: boolean;
}

interface QuizPdfFilters {
  gradeLevelId?: string;
  subjectId?: string;
  isActive?: boolean;
}

export class QuizPdfService {
  /**
   * Create a new quiz PDF
   */
  static async createQuizPdf(pdfData: CreateQuizPdfData): Promise<IQuizPdf> {
    try {
      const quizPdf = new QuizPdf({
        fileName: pdfData.fileName,
        filePath: pdfData.filePath,
        fileSize: pdfData.fileSize,
        gradeLevelId: pdfData.gradeLevelId ? new mongoose.Types.ObjectId(pdfData.gradeLevelId) : undefined,
        subjectId: new mongoose.Types.ObjectId(pdfData.subjectId),
        uploadedBy: new mongoose.Types.ObjectId(pdfData.uploadedBy),
        isActive: pdfData.isActive ?? true,
      });

      return await quizPdf.save();
    } catch (error) {
      console.error('Error creating quiz PDF:', error);
      throw error;
    }
  }

  /**
   * Get all quiz PDFs with optional filters
   */
  static async getQuizPdfs(filters?: QuizPdfFilters): Promise<IQuizPdf[]> {
    try {
      const query: any = {};

      if (filters?.gradeLevelId) {
        query.gradeLevelId = new mongoose.Types.ObjectId(filters.gradeLevelId);
      }
      if (filters?.subjectId) {
        query.subjectId = new mongoose.Types.ObjectId(filters.subjectId);
      }
      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      return await QuizPdf.find(query)
        .populate('gradeLevelId', 'code displayName')
        .populate('subjectId', 'name displayName')
        .populate('uploadedBy', 'firstName lastName fullName email')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting quiz PDFs:', error);
      throw error;
    }
  }

  /**
   * Get quiz PDFs by grade level and subject (for student selection)
   */
  static async getByGradeAndSubject(
    gradeLevelId: string,
    subjectId: string
  ): Promise<IQuizPdf[]> {
    try {
      return await QuizPdf.find({
        $or: [
          { gradeLevelId: new mongoose.Types.ObjectId(gradeLevelId) },
          { gradeLevelId: { $exists: false } }
        ],
        subjectId: new mongoose.Types.ObjectId(subjectId),
        isActive: true
      })
      .select('fileName filePath fileSize gradeLevelId subjectId isActive createdAt')
      .populate('gradeLevelId', 'code displayName')
      .populate('subjectId', 'name displayName')
      .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting quiz PDFs by grade and subject:', error);
      throw error;
    }
  }

  /**
   * Get quiz PDF by ID
   */
  static async getQuizPdfById(quizPdfId: string): Promise<IQuizPdf | null> {
    try {
      return await QuizPdf.findById(quizPdfId)
        .populate('gradeLevelId', 'code displayName')
        .populate('subjectId', 'name displayName')
        .populate('uploadedBy', 'firstName lastName fullName email');
    } catch (error) {
      console.error('Error getting quiz PDF by ID:', error);
      throw error;
    }
  }

  /**
   * Update quiz PDF
   */
  static async updateQuizPdf(quizPdfId: string, updates: UpdateQuizPdfData): Promise<IQuizPdf | null> {
    try {
      const updateData: any = {};

      if (updates.fileName !== undefined) updateData.fileName = updates.fileName;
      if (updates.filePath !== undefined) updateData.filePath = updates.filePath;
      if (updates.fileSize !== undefined) updateData.fileSize = updates.fileSize;
      if (updates.gradeLevelId !== undefined) {
        updateData.gradeLevelId = updates.gradeLevelId ? new mongoose.Types.ObjectId(updates.gradeLevelId) : undefined;
      }
      if (updates.subjectId !== undefined) {
        updateData.subjectId = new mongoose.Types.ObjectId(updates.subjectId);
      }
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

      return await QuizPdf.findByIdAndUpdate(quizPdfId, updateData, { new: true })
        .populate('gradeLevelId', 'code displayName')
        .populate('subjectId', 'name displayName')
        .populate('uploadedBy', 'firstName lastName fullName email');
    } catch (error) {
      console.error('Error updating quiz PDF:', error);
      throw error;
    }
  }

  /**
   * Delete quiz PDF (soft delete by setting isActive to false)
   */
  static async deleteQuizPdf(quizPdfId: string): Promise<IQuizPdf | null> {
    try {
      return await QuizPdf.findByIdAndUpdate(
        quizPdfId,
        { isActive: false },
        { new: true }
      );
    } catch (error) {
      console.error('Error deleting quiz PDF:', error);
      throw error;
    }
  }

  /**
   * Toggle active status of quiz PDF
   */
  static async toggleActive(quizPdfId: string): Promise<IQuizPdf | null> {
    try {
      const currentPdf = await QuizPdf.findById(quizPdfId);
      if (!currentPdf) {
        throw new Error('Quiz PDF not found');
      }

      return await QuizPdf.findByIdAndUpdate(
        quizPdfId,
        { isActive: !currentPdf.isActive },
        { new: true }
      )
      .populate('gradeLevelId', 'code displayName')
      .populate('subjectId', 'name displayName')
      .populate('uploadedBy', 'firstName lastName fullName email');
    } catch (error) {
      console.error('Error toggling quiz PDF active status:', error);
      throw error;
    }
  }
}
