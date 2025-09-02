export interface QuizPdf {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  grade_level_id: string;
  subject_id: string;
  uploaded_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  grade_level?: {
    id: string;
    display_name: string;
    code: string;
  };
  subject?: {
    id: string;
    display_name: string;
    name: string;
  };
  uploaded_by_profile?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface CreateQuizPdfData {
  file_name: string;
  file_path: string;
  file_size: number;
  grade_level_id?: string;
  subject_id: string;
  uploaded_by?: string;
  is_active?: boolean;
}

export interface UpdateQuizPdfData {
  file_name?: string;
  file_path?: string;
  file_size?: number;
  grade_level_id?: string;
  subject_id?: string;
  is_active?: boolean;
}

export interface QuizPdfFilters {
  grade_level_id?: string;
  subject_id?: string;
  is_active?: boolean;
}
