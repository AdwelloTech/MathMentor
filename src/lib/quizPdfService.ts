import { supabase } from "./supabase";
import type {
  QuizPdf,
  CreateQuizPdfData,
  UpdateQuizPdfData,
  QuizPdfFilters,
} from "@/types/quizPdf";

export const quizPdfService = {
  // Create a new quiz PDF
  async create(pdfData: CreateQuizPdfData): Promise<QuizPdf> {
    const { data, error } = await supabase
      .from("quiz_pdfs")
      .insert([pdfData])
      .select(
        `
        *,
        grade_level:grade_levels(id, display_name, code),
        subject:subjects(id, display_name, name),
        uploaded_by_profile:profiles(id, full_name, email)
      `
      )
      .single();

    if (error) throw error;
    return data as QuizPdf;
  },

  // Get all quiz PDFs with optional filters
  async list(filters?: QuizPdfFilters): Promise<QuizPdf[]> {
    let query = supabase
      .from("quiz_pdfs")
      .select(
        `
        *,
        grade_level:grade_levels(id, display_name, code),
        subject:subjects(id, display_name, name),
        uploaded_by_profile:profiles(id, full_name, email)
      `
      )
      .order("created_at", { ascending: false });

    if (filters?.grade_level_id) {
      query = query.eq("grade_level_id", filters.grade_level_id);
    }
    if (filters?.subject_id) {
      query = query.eq("subject_id", filters.subject_id);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as QuizPdf[];
  },

  // Get quiz PDFs by grade and subject (for student selection)
  async getByGradeAndSubject(
    gradeLevelId: string,
    subjectId: string
  ): Promise<QuizPdf[]> {
    const { data, error } = await supabase
      .from("quiz_pdfs")
      .select(
        `
        id,
        file_name,
        file_path,
        file_size,
        grade_level_id,
        subject_id,
        is_active,
        created_at
      `
      )
      .or(`grade_level_id.eq.${gradeLevelId},grade_level_id.is.null`)
      .eq("subject_id", subjectId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as QuizPdf[];
  },

  // Get a single quiz PDF by ID
  async getById(id: string): Promise<QuizPdf | null> {
    const { data, error } = await supabase
      .from("quiz_pdfs")
      .select(
        `
        *,
        grade_level:grade_levels(id, display_name, code),
        subject:subjects(id, display_name, name),
        uploaded_by_profile:profiles(id, full_name, email)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as QuizPdf;
  },

  // Update a quiz PDF
  async update(id: string, updates: UpdateQuizPdfData): Promise<QuizPdf> {
    const { data, error } = await supabase
      .from("quiz_pdfs")
      .update(updates)
      .eq("id", id)
      .select(
        `
        *,
        grade_level:grade_levels(id, display_name, code),
        subject:subjects(id, display_name, name),
        uploaded_by_profile:profiles(id, full_name, email)
      `
      )
      .single();

    if (error) throw error;
    return data as QuizPdf;
  },

  // Delete a quiz PDF
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("quiz_pdfs").delete().eq("id", id);
    if (error) throw error;
  },

  // Toggle active status
  async toggleActive(id: string): Promise<QuizPdf> {
    const { data: current, error: fetchError } = await supabase
      .from("quiz_pdfs")
      .select("is_active")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from("quiz_pdfs")
      .update({ is_active: !current.is_active })
      .eq("id", id)
      .select(
        `
        *,
        grade_level:grade_levels(id, display_name, code),
        subject:subjects(id, display_name, name),
        uploaded_by_profile:profiles(id, full_name, email)
      `
      )
      .single();

    if (error) throw error;
    return data as QuizPdf;
  },
};
