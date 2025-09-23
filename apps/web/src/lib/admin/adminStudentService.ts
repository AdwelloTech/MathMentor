// adminStudentService.ts - Axios version for MongoDB API
import type { AxiosInstance } from "axios";
import { getApi, ListResp, q, sort } from "./api";

export type Profile = {
  id?: string; _id?: any;
  user_id?: string;
  email?: string;
  name?: string;
  role?: string;
  is_active?: boolean;
  created_at?: string | Date;
};

class AdminStudentService {
  private api: AxiosInstance;
  constructor(api?: AxiosInstance) { this.api = api ?? getApi(); }

  async listStudents(params?: { search?: string; limit?: number; offset?: number; onlyActive?: boolean }): Promise<ListResp<Profile>> {
    const { search, limit=100, offset=0, onlyActive=false } = params || {};
    const rx = search ? { $or: [{ email: search }, { name: search }, { user_id: search }] } : {};
    const query: any = { ...rx, ...(onlyActive ? { is_active: true } : {}) };
    // Rely on server's /api/profiles (observed in logs). If not present, ensure your server exposes it.
    const res = await this.api.get("/api/profiles", {
      params: { q: q(query), limit, offset, sort: sort({ createdAt: -1 }) },
    });
    return res.data as ListResp<Profile>;
  }

  async getByEmail(email: string): Promise<Profile | null> {
    const res = await this.api.get("/api/profiles", { params: { q: q({ email }), limit: 1 } });
    return (res.data?.items && res.data.items[0]) || null;
  }

  async getById(userId: string): Promise<Profile | null> {
    const res = await this.api.get("/api/profiles", { params: { q: q({ user_id: userId }), limit: 1 } });
    return (res.data?.items && res.data.items[0]) || null;
  }
}

export const adminStudentService = new AdminStudentService();
