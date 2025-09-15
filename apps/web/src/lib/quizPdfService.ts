// quizPdfService.ts - Updated for MongoDB API
import { getApi } from "./api";
import type { AxiosInstance } from "axios";
import type {
  QuizPdf,
  CreateQuizPdfData,
  UpdateQuizPdfData,
  QuizPdfFilters,
} from "@/types/quizPdf";

class QuizPdfService {
  private api: AxiosInstance;

  constructor(api?: AxiosInstance) {
    this.api = api ?? getApi();
  }

  // Create a new quiz PDF
  async create(pdfData: CreateQuizPdfData): Promise<QuizPdf> {
    try {
      const response = await this.api.post('/api/quiz_pdfs', pdfData);
      return response.data;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  // Get all quiz PDFs with optional filters
  async list(filters?: QuizPdfFilters): Promise<QuizPdf[]> {
    try {
      const params: any = {
        sort: JSON.stringify({ created_at: -1 })
      };

      if (filters?.grade_level_id) {
        params.q = JSON.stringify({ grade_level_id: filters.grade_level_id });
      }
      if (filters?.subject_id) {
        params.q = JSON.stringify({ subject_id: filters.subject_id });
      }
      if (filters?.is_active !== undefined) {
        params.q = JSON.stringify({ is_active: filters.is_active });
      }

      const response = await this.api.get('/api/quiz_pdfs', { params });
      const pdfs = response.data?.items || [];

      // For each PDF, get related data
      const pdfsWithDetails = await Promise.all(
        pdfs.map(async (pdf: any) => {
          try {
            // Get grade level information
            let gradeLevel = null;
            if (pdf.grade_level_id) {
              const gradeResponse = await this.api.get('/api/grade_levels', {
                params: {
                  q: JSON.stringify({ id: pdf.grade_level_id }),
                  limit: 1
                }
              });
              gradeLevel = gradeResponse.data?.items?.[0] || null;
            }

            // Get subject information
            let subject = null;
            if (pdf.subject_id) {
              const subjectResponse = await this.api.get('/api/subjects', {
                params: {
                  q: JSON.stringify({ id: pdf.subject_id }),
                  limit: 1
                }
              });
              subject = subjectResponse.data?.items?.[0] || null;
            }

            // Get uploaded by profile information
            let uploadedByProfile = null;
            if (pdf.uploaded_by) {
              const profileResponse = await this.api.get('/api/profiles', {
                params: {
                  q: JSON.stringify({ user_id: pdf.uploaded_by }),
                  limit: 1
                }
              });
              uploadedByProfile = profileResponse.data?.items?.[0] || null;
            }

            return {
              ...pdf,
              grade_level: gradeLevel,
              subject: subject,
              uploaded_by_profile: uploadedByProfile
            };
          } catch (error) {
            console.warn('Error fetching details for PDF:', pdf.id, error);
            return pdf;
          }
        })
      );

      return pdfsWithDetails;
    } catch (error) {
      console.error('Error in list:', error);
      throw error;
    }
  }

  // Get quiz PDFs by grade and subject (for student selection)
  async getByGradeAndSubject(
    gradeLevelId: string,
    subjectId: string
  ): Promise<QuizPdf[]> {
    try {
      const response = await this.api.get('/api/quiz_pdfs', {
        params: {
          q: JSON.stringify({
            subject_id: subjectId,
            is_active: true,
            $or: [
              { grade_level_id: gradeLevelId },
              { grade_level_id: null }
            ]
          }),
          sort: JSON.stringify({ created_at: -1 })
        }
      });

      const pdfs = response.data?.items || [];
      return pdfs.map((pdf: any) => ({
        id: pdf.id,
        file_name: pdf.file_name,
        file_path: pdf.file_path,
        file_size: pdf.file_size,
        grade_level_id: pdf.grade_level_id,
        subject_id: pdf.subject_id,
        is_active: pdf.is_active,
        created_at: pdf.created_at
      }));
    } catch (error) {
      console.error('Error in getByGradeAndSubject:', error);
      throw error;
    }
  }

  // Get a single quiz PDF by ID
  async getById(id: string): Promise<QuizPdf | null> {
    try {
      const response = await this.api.get(`/api/quiz_pdfs/${id}`);
      const pdf = response.data;

      if (!pdf) return null;

      // Get related data
      let gradeLevel = null;
      if (pdf.grade_level_id) {
        const gradeResponse = await this.api.get('/api/grade_levels', {
          params: {
            q: JSON.stringify({ id: pdf.grade_level_id }),
            limit: 1
          }
        });
        gradeLevel = gradeResponse.data?.items?.[0] || null;
      }

      let subject = null;
      if (pdf.subject_id) {
        const subjectResponse = await this.api.get('/api/subjects', {
          params: {
            q: JSON.stringify({ id: pdf.subject_id }),
            limit: 1
          }
        });
        subject = subjectResponse.data?.items?.[0] || null;
      }

      let uploadedByProfile = null;
      if (pdf.uploaded_by) {
        const profileResponse = await this.api.get('/api/profiles', {
          params: {
            q: JSON.stringify({ user_id: pdf.uploaded_by }),
            limit: 1
          }
        });
        uploadedByProfile = profileResponse.data?.items?.[0] || null;
      }

      return {
        ...pdf,
        grade_level: gradeLevel,
        subject: subject,
        uploaded_by_profile: uploadedByProfile
      };
    } catch (error) {
      console.error('Error in getById:', error);
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  // Update a quiz PDF
  async update(id: string, updates: UpdateQuizPdfData): Promise<QuizPdf> {
    try {
      const response = await this.api.patch(`/api/quiz_pdfs/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  // Delete a quiz PDF
  async delete(id: string): Promise<void> {
    try {
      await this.api.delete(`/api/quiz_pdfs/${id}`);
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // Toggle active status
  async toggleActive(id: string): Promise<QuizPdf> {
    try {
      // Get current PDF to check is_active status
      const currentResponse = await this.api.get(`/api/quiz_pdfs/${id}`);
      const current = currentResponse.data;

      if (!current) {
        throw new Error('PDF not found');
      }

      // Toggle the is_active status
      const newStatus = !current.is_active;
      const response = await this.api.patch(`/api/quiz_pdfs/${id}`, {
        is_active: newStatus
      });

      return response.data;
    } catch (error) {
      console.error('Error in toggleActive:', error);
      throw error;
    }
  }
}

export const quizPdfService = new QuizPdfService();
export default quizPdfService;