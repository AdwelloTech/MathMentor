// adminTutorApplicationService.ts - Axios version for MongoDB API
import type { AxiosInstance } from "axios";
import { getApi, ListResp, q, sort } from "./api";

export type TutorApplication = {
  id?: string; _id?: any;
  user_id?: string; email?: string; name?: string;
  status?: "pending" | "under_review" | "approved" | "rejected" | string;
  created_at?: string | Date;
};

class AdminTutorApplicationService {
  private api: AxiosInstance;
  constructor(api?: AxiosInstance) { this.api = api ?? getApi(); }

  async listAll(params?: { status?: string; limit?: number; offset?: number }): Promise<ListResp<TutorApplication>> {
    const { status, limit=100, offset=0 } = params || {};
    const query: any = status ? { $or: [{ status }, { status_text: status }] } : {};
    const res = await this.api.get("/api/tutor_applications", {
      params: { q: q(query), limit, offset, sort: sort({ createdAt: -1 }) },
    });
    return res.data as ListResp<TutorApplication>;
  }

  async approve(_id: string): Promise<void> {
    // Not supported by current server; provide a client-only guard.
    throw new Error("approve() not supported by the current API. Please add a PATCH /api/tutor_applications/:id route on the server.");
  }

  async reject(_id: string, _reason?: string): Promise<void> {
    throw new Error("reject() not supported by the current API. Please add a PATCH /api/tutor_applications/:id route on the server.");
  }
}

export const adminTutorApplicationService = new AdminTutorApplicationService();
