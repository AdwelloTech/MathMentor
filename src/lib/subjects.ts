import apiClient from "@/lib/apiClient";
import type {
  Subject,
  CreateSubjectData,
  UpdateSubjectData,
} from "@/types/subject";

export const subjectsService = {
  async listActive(): Promise<Subject[]> {
    const data = await apiClient.get<any[]>("/api/subjects");

    // Transform backend data to match frontend interface
    return data.map(item => ({
      id: item._id || item.id,
      name: item.name,
      display_name: item.displayName || item.display_name,
      color: item.color,
      is_active: item.isActive !== undefined ? item.isActive : item.is_active,
      created_at: item.createdAt || item.created_at,
      updated_at: item.updatedAt || item.updated_at,
    }));
  },

  async listAll(): Promise<Subject[]> {
    // For now, just return active subjects since the backend only returns active ones
    return this.listActive();
  },

  async create(input: CreateSubjectData): Promise<Subject> {
    const payload = {
      name: input.name.trim().toLowerCase(),
      displayName: input.display_name.trim(),
      color: input.color ?? "#3B82F6",
      isActive: input.is_active ?? true,
    };

    const data = await apiClient.post<any>("/api/subjects", payload);

    // Transform response to match frontend interface
    return {
      id: data._id || data.id,
      name: data.name,
      display_name: data.displayName || data.display_name,
      color: data.color,
      is_active: data.isActive !== undefined ? data.isActive : data.is_active,
      created_at: data.createdAt || data.created_at,
      updated_at: data.updatedAt || data.updated_at,
    };
  },

  async update(id: string, input: UpdateSubjectData): Promise<Subject> {
    const updates: any = {};
    if (input.name !== undefined)
      updates.name = input.name.trim().toLowerCase();
    if (input.display_name !== undefined)
      updates.displayName = input.display_name.trim();
    if (input.color !== undefined) updates.color = input.color;
    if (input.is_active !== undefined) updates.isActive = input.is_active;

    const data = await apiClient.put<any>(`/api/subjects/${id}`, updates);

    // Transform response to match frontend interface
    return {
      id: data._id || data.id,
      name: data.name,
      display_name: data.displayName || data.display_name,
      color: data.color,
      is_active: data.isActive !== undefined ? data.isActive : data.is_active,
      created_at: data.createdAt || data.created_at,
      updated_at: data.updatedAt || data.updated_at,
    };
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/subjects/${id}`);
  },

  async getById(id: string): Promise<Subject | null> {
    try {
      const data = await apiClient.get<any>(`/api/subjects/${id}`);

      // Transform response to match frontend interface
      return {
        id: data._id || data.id,
        name: data.name,
        display_name: data.displayName || data.display_name,
        color: data.color,
        is_active: data.isActive !== undefined ? data.isActive : data.is_active,
        created_at: data.createdAt || data.created_at,
        updated_at: data.updatedAt || data.updated_at,
      };
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  },
};
