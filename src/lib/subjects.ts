import { supabase } from "@/lib/supabase";
import type {
  Subject,
  CreateSubjectData,
  UpdateSubjectData,
} from "@/types/subject";

export const subjectsService = {
  async listActive(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("is_active", true)
      .order("display_name", { ascending: true });
    if (error) throw error;
    return data as Subject[];
  },

  async listAll(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("display_name", { ascending: true });
    if (error) throw error;
    return data as Subject[];
  },

  async create(input: CreateSubjectData): Promise<Subject> {
    const payload = {
      name: input.name.trim().toLowerCase(),
      display_name: input.display_name.trim(),
      color: input.color ?? null,
      is_active: input.is_active ?? true,
    };

    const { data, error } = await supabase
      .from("subjects")
      .insert([payload])
      .select("*")
      .single();
    if (error) throw error;
    return data as Subject;
  },

  async update(id: string, input: UpdateSubjectData): Promise<Subject> {
    const updates: Partial<UpdateSubjectData> = {};
    if (input.name !== undefined) updates.name = input.name.trim().toLowerCase();
    if (input.display_name !== undefined)
      updates.display_name = input.display_name.trim();
    if (input.color !== undefined) updates.color = input.color;
    if (input.is_active !== undefined) updates.is_active = input.is_active;
    
    const { data, error } = await supabase
      .from("subjects")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Subject;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async getById(id: string): Promise<Subject | null> {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116") return null; // No rows returned
      throw error;
    }
    return data as Subject;
  },
};


