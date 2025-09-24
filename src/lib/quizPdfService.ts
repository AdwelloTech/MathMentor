import apiClient from "@/lib/apiClient";
import type {
  QuizPdf,
  CreateQuizPdfData,
  UpdateQuizPdfData,
  QuizPdfFilters,
} from "@/types/quizPdf";

export const quizPdfService = {
  // Create a new quiz PDF
  async create(pdfData: CreateQuizPdfData): Promise<QuizPdf> {
    const payload = {
      fileName: pdfData.file_name,
      filePath: pdfData.file_path,
      fileSize: pdfData.file_size,
      gradeLevelId: pdfData.grade_level_id,
      subjectId: pdfData.subject_id,
      uploadedBy: pdfData.uploaded_by,
      isActive: pdfData.is_active ?? true,
    };

    const data = await apiClient.post<any>("/api/quiz-pdfs", payload);

    // Transform response to match frontend interface
    return {
      id: data._id || data.id,
      file_name: data.fileName || data.file_name,
      file_path: data.filePath || data.file_path,
      file_size: data.fileSize || data.file_size,
      grade_level_id: data.gradeLevelId || data.grade_level_id,
      subject_id: data.subjectId || data.subject_id,
      uploaded_by: data.uploadedBy || data.uploaded_by,
      is_active: data.isActive !== undefined ? data.isActive : data.is_active,
      created_at: data.createdAt || data.created_at,
      updated_at: data.updatedAt || data.updated_at,
      grade_level: data.gradeLevelId ? {
        id: data.gradeLevelId._id || data.gradeLevelId.id,
        display_name: data.gradeLevelId.displayName || data.gradeLevelId.display_name,
        code: data.gradeLevelId.code,
      } : undefined,
      subject: {
        id: data.subjectId._id || data.subjectId.id,
        display_name: data.subjectId.displayName || data.subjectId.display_name,
        name: data.subjectId.name,
      },
      uploaded_by_profile: {
        id: data.uploadedBy._id || data.uploadedBy.id,
        full_name: data.uploadedBy.fullName || data.uploadedBy.full_name || `${data.uploadedBy.firstName || ''} ${data.uploadedBy.lastName || ''}`.trim(),
        email: data.uploadedBy.email,
      },
    };
  },

  // Get all quiz PDFs with optional filters
  async list(filters?: QuizPdfFilters): Promise<QuizPdf[]> {
    const params = new URLSearchParams();
    if (filters?.grade_level_id) params.append('gradeLevelId', filters.grade_level_id);
    if (filters?.subject_id) params.append('subjectId', filters.subject_id);
    if (filters?.is_active !== undefined) params.append('isActive', filters.is_active.toString());

    const endpoint = `/api/quiz-pdfs${params.toString() ? `?${params.toString()}` : ''}`;
    const data = await apiClient.get<any[]>(endpoint);

    // Transform response to match frontend interface
    return data.map(item => ({
      id: item._id || item.id,
      file_name: item.fileName || item.file_name,
      file_path: item.filePath || item.file_path,
      file_size: item.fileSize || item.file_size,
      grade_level_id: item.gradeLevelId || item.grade_level_id,
      subject_id: item.subjectId || item.subject_id,
      uploaded_by: item.uploadedBy || item.uploaded_by,
      is_active: item.isActive !== undefined ? item.isActive : item.is_active,
      created_at: item.createdAt || item.created_at,
      updated_at: item.updatedAt || item.updated_at,
      grade_level: item.gradeLevelId ? {
        id: item.gradeLevelId._id || item.gradeLevelId.id,
        display_name: item.gradeLevelId.displayName || item.gradeLevelId.display_name,
        code: item.gradeLevelId.code,
      } : undefined,
      subject: {
        id: item.subjectId._id || item.subjectId.id,
        display_name: item.subjectId.displayName || item.subjectId.display_name,
        name: item.subjectId.name,
      },
      uploaded_by_profile: {
        id: item.uploadedBy._id || item.uploadedBy.id,
        full_name: item.uploadedBy.fullName || item.uploadedBy.full_name || `${item.uploadedBy.firstName || ''} ${item.uploadedBy.lastName || ''}`.trim(),
        email: item.uploadedBy.email,
      },
    }));
  },

  // Get quiz PDFs by grade and subject (for student selection)
  async getByGradeAndSubject(
    gradeLevelId: string,
    subjectId: string
  ): Promise<QuizPdf[]> {
    const data = await apiClient.get<any[]>(`/api/quiz-pdfs/by-grade-subject/${gradeLevelId}/${subjectId}`);

    // Transform response to match frontend interface
    return data.map(item => ({
      id: item._id || item.id,
      file_name: item.fileName || item.file_name,
      file_path: item.filePath || item.file_path,
      file_size: item.fileSize || item.file_size,
      grade_level_id: item.gradeLevelId || item.grade_level_id,
      subject_id: item.subjectId || item.subject_id,
      uploaded_by: item.uploadedBy || item.uploaded_by,
      is_active: item.isActive !== undefined ? item.isActive : item.is_active,
      created_at: item.createdAt || item.created_at,
      updated_at: item.updatedAt || item.updated_at,
      grade_level: item.gradeLevelId ? {
        id: item.gradeLevelId._id || item.gradeLevelId.id,
        display_name: item.gradeLevelId.displayName || item.gradeLevelId.display_name,
        code: item.gradeLevelId.code,
      } : undefined,
      subject: {
        id: item.subjectId._id || item.subjectId.id,
        display_name: item.subjectId.displayName || item.subjectId.display_name,
        name: item.subjectId.name,
      },
    }));
  },

  // Get a single quiz PDF by ID
  async getById(id: string): Promise<QuizPdf | null> {
    try {
      const data = await apiClient.get<any>(`/api/quiz-pdfs/${id}`);

      // Transform response to match frontend interface
      return {
        id: data._id || data.id,
        file_name: data.fileName || data.file_name,
        file_path: data.filePath || data.file_path,
        file_size: data.fileSize || data.file_size,
        grade_level_id: data.gradeLevelId || data.grade_level_id,
        subject_id: data.subjectId || data.subject_id,
        uploaded_by: data.uploadedBy || data.uploaded_by,
        is_active: data.isActive !== undefined ? data.isActive : data.is_active,
        created_at: data.createdAt || data.created_at,
        updated_at: data.updatedAt || data.updated_at,
        grade_level: data.gradeLevelId ? {
          id: data.gradeLevelId._id || data.gradeLevelId.id,
          display_name: data.gradeLevelId.displayName || data.gradeLevelId.display_name,
          code: data.gradeLevelId.code,
        } : undefined,
        subject: {
          id: data.subjectId._id || data.subjectId.id,
          display_name: data.subjectId.displayName || data.subjectId.display_name,
          name: data.subjectId.name,
        },
        uploaded_by_profile: {
          id: data.uploadedBy._id || data.uploadedBy.id,
          full_name: data.uploadedBy.fullName || data.uploadedBy.full_name || `${data.uploadedBy.firstName || ''} ${data.uploadedBy.lastName || ''}`.trim(),
          email: data.uploadedBy.email,
        },
      };
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  },

  // Update a quiz PDF
  async update(id: string, updates: UpdateQuizPdfData): Promise<QuizPdf> {
    const payload: any = {};
    if (updates.file_name !== undefined) payload.fileName = updates.file_name;
    if (updates.file_path !== undefined) payload.filePath = updates.file_path;
    if (updates.file_size !== undefined) payload.fileSize = updates.file_size;
    if (updates.grade_level_id !== undefined) payload.gradeLevelId = updates.grade_level_id;
    if (updates.subject_id !== undefined) payload.subjectId = updates.subject_id;
    if (updates.is_active !== undefined) payload.isActive = updates.is_active;

    const data = await apiClient.put<any>(`/api/quiz-pdfs/${id}`, payload);

    // Transform response to match frontend interface
    return {
      id: data._id || data.id,
      file_name: data.fileName || data.file_name,
      file_path: data.filePath || data.file_path,
      file_size: data.fileSize || data.file_size,
      grade_level_id: data.gradeLevelId || data.grade_level_id,
      subject_id: data.subjectId || data.subject_id,
      uploaded_by: data.uploadedBy || data.uploaded_by,
      is_active: data.isActive !== undefined ? data.isActive : data.is_active,
      created_at: data.createdAt || data.created_at,
      updated_at: data.updatedAt || data.updated_at,
      grade_level: data.gradeLevelId ? {
        id: data.gradeLevelId._id || data.gradeLevelId.id,
        display_name: data.gradeLevelId.displayName || data.gradeLevelId.display_name,
        code: data.gradeLevelId.code,
      } : undefined,
      subject: {
        id: data.subjectId._id || data.subjectId.id,
        display_name: data.subjectId.displayName || data.subjectId.display_name,
        name: data.subjectId.name,
      },
      uploaded_by_profile: {
        id: data.uploadedBy._id || data.uploadedBy.id,
        full_name: data.uploadedBy.fullName || data.uploadedBy.full_name || `${data.uploadedBy.firstName || ''} ${data.uploadedBy.lastName || ''}`.trim(),
        email: data.uploadedBy.email,
      },
    };
  },

  // Delete a quiz PDF
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/quiz-pdfs/${id}`);
  },

  // Toggle active status
  async toggleActive(id: string): Promise<QuizPdf> {
    // Custom implementation for PATCH request since ApiClient doesn't have patch method
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token exists
    try {
      const tokens = localStorage.getItem('mathmentor_tokens');
      if (tokens) {
        const parsed = JSON.parse(tokens);
        headers['Authorization'] = `Bearer ${parsed.accessToken}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token for toggle active:', error);
    }

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${baseURL}/api/quiz-pdfs/${id}/toggle-active`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const responseData = await response.json();
    const data = responseData.data;

    // Transform response to match frontend interface
    return {
      id: data._id || data.id,
      file_name: data.fileName || data.file_name,
      file_path: data.filePath || data.file_path,
      file_size: data.fileSize || data.file_size,
      grade_level_id: data.gradeLevelId || data.grade_level_id,
      subject_id: data.subjectId || data.subject_id,
      uploaded_by: data.uploadedBy || data.uploaded_by,
      is_active: data.isActive !== undefined ? data.isActive : data.is_active,
      created_at: data.createdAt || data.created_at,
      updated_at: data.updatedAt || data.updated_at,
      grade_level: data.gradeLevelId ? {
        id: data.gradeLevelId._id || data.gradeLevelId.id,
        display_name: data.gradeLevelId.displayName || data.gradeLevelId.display_name,
        code: data.gradeLevelId.code,
      } : undefined,
      subject: {
        id: data.subjectId._id || data.subjectId.id,
        display_name: data.subjectId.displayName || data.subjectId.display_name,
        name: data.subjectId.name,
      },
      uploaded_by_profile: {
        id: data.uploadedBy._id || data.uploadedBy.id,
        full_name: data.uploadedBy.fullName || data.uploadedBy.full_name || `${data.uploadedBy.firstName || ''} ${data.uploadedBy.lastName || ''}`.trim(),
        email: data.uploadedBy.email,
      },
    };
  },
};
