// adminTutorService.ts - Axios version for MongoDB API
import type { AxiosInstance } from "axios";
import { getApi, ListResp, q, sort } from "./api";

export type Profile = {
  id?: string; _id?: any;
  user_id?: string;
  email?: string;
  name?: string;
  role?: string;
  is_active?: boolean;
  subjects?: string[];
  created_at?: string | Date;
};

export type TutorStats = {
  totalTutors: number;
  pendingApplications: number;
  recentRegistrations: number;
  active?: number;
  inactive?: number;
};

class AdminTutorService {
  private api: AxiosInstance;
  constructor(api?: AxiosInstance) { this.api = api ?? getApi(); }

  async listTutors(params?: { search?: string; limit?: number; offset?: number; onlyActive?: boolean }): Promise<ListResp<Profile>> {
    const { search, limit=100, offset=0, onlyActive=false } = params || {};
    const rx = search ? { $or: [{ email: search }, { name: search }, { user_id: search }] } : {};
    const query: any = { ...rx, $or: [{ role: /tutor/i }, { role_name: /tutor/i }, { user_role: /tutor/i }, { user_type: /tutor/i }, { type: /tutor/i }] };
    if (onlyActive) query.is_active = true;
    const res = await this.api.get("/api/profiles", {
      params: { q: q(query), limit, offset, sort: sort({ createdAt: -1 }) },
    });
    return res.data as ListResp<Profile>;
  }

  async getTutorStats(): Promise<TutorStats> {
    // Prefer using the server aggregate if available
    const agg = await this.api.get("/api/admin/dashboard/summary");
    const totals = agg.data?.totals || {};
    const recent = agg.data?.last_7_days || {};
    return {
      totalTutors: Number(totals.tutors ?? 0),
      pendingApplications: Number(totals.tutor_applications_pending ?? 0),
      recentRegistrations: Number(recent.new_users ?? 0),
      active: undefined,
      inactive: undefined,
    };
  }
}

export const adminTutorService = new AdminTutorService();
