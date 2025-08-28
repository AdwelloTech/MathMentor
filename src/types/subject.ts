export interface Subject {
  id: string;
  name: string; // machine-friendly key, e.g., "mathematics"
  display_name: string; // human-readable, e.g., "Mathematics"
  color?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSubjectData {
  name: string;
  display_name: string;
  color?: string | null;
  is_active?: boolean;
}

export interface UpdateSubjectData {
  name?: string;
  display_name?: string;
  color?: string | null;
  is_active?: boolean;
}


