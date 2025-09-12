// adminTutorService.ts - Axios version for MongoDB API
import type { AxiosInstance } from "axios";
import { getApi, ListResp, q, sort } from "./api";

export type Tutor = {
  id?: string;
  _id?: any;
  user_id?: string;
  email?: string;
  full_name?: string;
  name?: string;
  role?: string;
  is_active?: boolean;
  subjects?: string[];
  phone?: string;
  application_status?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
};

export type Profile = {
  id?: string;
  _id?: any;
  user_id?: string;
  email?: string;
  name?: string;
  role?: string;
  is_active?: boolean;
  subjects?: string[];
  created_at?: string | Date;
};

export type TutorClass = {
  id?: string;
  title?: string;
  subject?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  student_count?: number;
};

export type TutorStats = {
  totalTutors: number;
  pendingApplications: number;
  recentRegistrations: number;
  active?: number;
  inactive?: number;
};

export class AdminTutorService {
  private api: AxiosInstance;
  constructor(api?: AxiosInstance) {
    this.api = api ?? getApi();
  }

  /** Maps profile data to Tutor type */
  private mapProfileToTutor(p: any): Tutor {
    const id = String(p?.user_id ?? p?.id ?? p?._id ?? p?.email ?? "");
    const name = String(p?.full_name ?? p?.display_name ?? p?.name ?? "");

    return {
      id,
      user_id: String(p?.user_id ?? p?.email ?? id),
      email: p?.email ?? "",
      full_name:
        name || [p?.first_name, p?.last_name].filter(Boolean).join(" "),
      name: name,
      role: p?.role ?? "tutor",
      is_active: p?.is_active ?? true,
      subjects: Array.isArray(p?.subjects) ? p.subjects : [],
      phone: p?.phone ?? null,
      application_status: p?.application_status ?? p?.status ?? "pending",
      created_at:
        (p?.created_at ?? p?.createdAt ?? null) &&
        new Date(p?.created_at ?? p?.createdAt).toISOString(),
      updated_at:
        (p?.updated_at ?? p?.updatedAt ?? null) &&
        new Date(p?.updated_at ?? p?.updatedAt).toISOString(),
    };
  }

  /** Get all tutors (array return to match UI) */
  async getAllTutors(params?: {
    search?: string;
    page?: number;
    pageSize?: number;
    onlyActive?: boolean;
  }): Promise<Tutor[]> {
    const page = Math.max(1, Number(params?.page ?? 1));
    const pageSize = Math.max(1, Number(params?.pageSize ?? 50));
    const offset = (page - 1) * pageSize;

    const rx = params?.search
      ? {
          $or: [
            { email: params.search },
            { name: params.search },
            { user_id: params.search },
          ],
        }
      : {};

    const tutorRoleOr = [
      { role: "tutor" },
      { role_name: "tutor" },
      { user_role: "tutor" },
      { user_type: "tutor" },
      { type: "tutor" },
    ];

    const query: any = {
      ...rx,
      $or: tutorRoleOr,
      ...(params?.onlyActive ? { is_active: true } : {}),
    };

    try {
      const res = await this.api.get("/api/profiles", {
        params: {
          q: q(query),
          limit: pageSize,
          offset,
          sort: sort({ createdAt: -1 }),
        },
      });
      const items: any[] = res.data?.items ?? res.data?.data ?? [];
      return items.map((p) => this.mapProfileToTutor(p));
    } catch (err: any) {
      console.error("Error fetching tutors:", err);
      return [];
    }
  }

  async listTutors(params?: {
    search?: string;
    limit?: number;
    offset?: number;
    onlyActive?: boolean;
  }): Promise<ListResp<Profile>> {
    const {
      search,
      limit = 100,
      offset = 0,
      onlyActive = false,
    } = params || {};
    const rx = search
      ? { $or: [{ email: search }, { name: search }, { user_id: search }] }
      : {};
    const query: any = {
      ...rx,
      $or: [
        { role: /tutor/i },
        { role_name: /tutor/i },
        { user_role: /tutor/i },
        { user_type: /tutor/i },
        { type: /tutor/i },
      ],
      ...(onlyActive ? { is_active: true } : {}),
    };
    const res = await this.api.get("/api/profiles", {
      params: { q: q(query), limit, offset, sort: sort({ createdAt: -1 }) },
    });
    return res.data as ListResp<Profile>;
  }

  async getTutorStats(): Promise<TutorStats> {
    try {
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
    } catch (err: any) {
      console.error("Error fetching tutor stats:", err);
      return {
        totalTutors: 0,
        pendingApplications: 0,
        recentRegistrations: 0,
        active: undefined,
        inactive: undefined,
      };
    }
  }

  /** Get tutor classes */
  async getTutorClasses(tutorId: string): Promise<TutorClass[]> {
    try {
      const res = await this.api.get("/api/classes", {
        params: {
          q: q({ tutor_id: tutorId }),
          limit: 100,
          sort: sort({ createdAt: -1 }),
        },
      });
      const items: any[] = res.data?.items ?? res.data?.data ?? [];
      return items.map((c: any) => ({
        id: String(c?._id ?? c?.id ?? ""),
        title: c?.title ?? c?.name ?? "",
        subject: c?.subject ?? "",
        start_time: c?.start_time ?? c?.start_at ?? "",
        end_time: c?.end_time ?? c?.end_at ?? "",
        status: c?.status ?? "active",
        student_count: c?.student_count ?? 0,
      }));
    } catch (err: any) {
      console.error("Error fetching tutor classes:", err);
      return [];
    }
  }

  /** Update tutor status */
  async updateTutorStatus(tutorId: string, isActive: boolean): Promise<void> {
    try {
      await this.api.patch(`/api/profiles/${tutorId}`, {
        is_active: isActive,
      });
    } catch (err: any) {
      console.error("Error updating tutor status:", err);
      throw err;
    }
  }

  /** Delete tutor */
  async deleteTutor(tutorId: string): Promise<void> {
    try {
      await this.api.delete(`/api/profiles/${tutorId}`);
    } catch (err: any) {
      console.error("Error deleting tutor:", err);
      throw err;
    }
  }
}

export const adminTutorService = new AdminTutorService();
export default adminTutorService;
