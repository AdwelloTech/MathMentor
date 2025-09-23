// adminStudentService.ts - Axios version for MongoDB API (UI-compatible)
import type { AxiosInstance } from "axios";
import { getApi, ListResp, q, sort } from "./api";

/** === Types that match your UI === */
export type Student = {
  id?: string;
  student_id?: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  package?: string; // "free" | "silver" | "gold" | ...
  is_active?: boolean;
  profile_image_url?: string;

  phone?: string;
  date_of_birth?: string | null;
  gender?: string | null;
  age?: number | null;
  emergency_contact?: string | null;

  city?: string | null;
  postcode?: string | null;
  address?: string | null;
  school_name?: string | null;

  parent_name?: string | null;
  parent_phone?: string | null;
  parent_email?: string | null;

  current_grade?: string | null;
  academic_set?: string | null;
  has_learning_disabilities?: boolean;
  learning_needs_description?: string | null;

  subscription_status?: string | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;

  last_login?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PackageInfo = {
  package_type: string; // e.g. "free" | "silver" | "gold"
  display_name: string; // e.g. "Free", "Silver", "Gold"
  price_monthly: number; // cents
  features?: string[];
};

export type StudentStats = {
  total: number;
  active?: number;
  inactive?: number;
  recentRegistrations: number;
  byPackage: Record<string, number>;
};

function isAxios404(err: any) {
  return !!(err && err.response && err.response.status === 404);
}

/** === Core class === */
export class AdminStudentServiceClass {
  private api: AxiosInstance;
  constructor(api?: AxiosInstance) {
    this.api = api ?? getApi();
  }

  /** Maps Mongo profile -> UI Student */
  private mapProfileToStudent(p: any): Student {
    const id = String(p?.user_id ?? p?.id ?? p?._id ?? p?.email ?? "");
    const name = String(p?.full_name ?? p?.display_name ?? p?.name ?? "");
    const [first = "", ...rest] = name.split(" ").filter(Boolean);
    const last = rest.join(" ");
    // common/legacy fields
    const pkg = p?.package ?? p?.plan ?? p?.subscription_plan ?? "free";
    const lastLogin =
      p?.last_login ??
      p?.last_login_at ??
      p?.lastLogin ??
      p?.lastLoginAt ??
      null;

    return {
      id,
      student_id: String(p?.student_id ?? p?.user_id ?? p?.email ?? id),
      email: p?.email ?? "",
      full_name:
        name || [p?.first_name, p?.last_name].filter(Boolean).join(" "),
      first_name: p?.first_name ?? first,
      last_name: p?.last_name ?? last,
      package: pkg,
      is_active: p?.is_active ?? true,
      profile_image_url: p?.avatar_url ?? p?.profile_image_url ?? "",

      phone: p?.phone ?? null,
      date_of_birth: p?.date_of_birth ?? null,
      gender: p?.gender ?? null,
      age: typeof p?.age === "number" ? p.age : null,
      emergency_contact: p?.emergency_contact ?? null,

      city: p?.city ?? null,
      postcode: p?.postcode ?? null,
      address: p?.address ?? null,
      school_name: p?.school_name ?? null,

      parent_name: p?.parent_name ?? null,
      parent_phone: p?.parent_phone ?? null,
      parent_email: p?.parent_email ?? null,

      current_grade: p?.current_grade ?? null,
      academic_set: p?.academic_set ?? null,
      has_learning_disabilities: !!p?.has_learning_disabilities,
      learning_needs_description: p?.learning_needs_description ?? null,

      subscription_status: p?.subscription_status ?? null,
      subscription_start_date: p?.subscription_start_date ?? null,
      subscription_end_date: p?.subscription_end_date ?? null,

      last_login: lastLogin,
      created_at:
        (p?.created_at ?? p?.createdAt ?? null) &&
        new Date(p?.created_at ?? p?.createdAt).toISOString(),
      updated_at:
        (p?.updated_at ?? p?.updatedAt ?? null) &&
        new Date(p?.updated_at ?? p?.updatedAt).toISOString(),
    };
  }

  /** === Students (array return to match your UI) === */
  async getAllStudents(params?: {
    search?: string;
    page?: number;
    pageSize?: number;
    onlyActive?: boolean;
  }): Promise<Student[]> {
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

    const studentRoleOr = [
      { role: "student" },
      { role_name: "student" },
      { user_role: "student" },
      { user_type: "student" },
      { type: "student" },
    ];

    const query: any = {
      ...rx,
      $or: studentRoleOr,
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
      return items.map((p) => this.mapProfileToStudent(p));
    } catch (err: any) {
      console.error("Error fetching students:", err);
      return [];
    }
  }

  /** === Package catalog (array) === */
  async getPackages(): Promise<PackageInfo[]> {
    try {
      const res = await this.api.get("/api/package_pricing", {
        params: { limit: 500, sort: sort({ createdAt: -1 }) },
      });
      const items: any[] = res.data?.items ?? [];
      const mapped = items.map((p) => {
        const pkg: PackageInfo = {
          package_type: String(
            p?.code ?? p?.slug ?? p?.name ?? "custom"
          ).toLowerCase(),
          display_name: String(
            p?.display_name ?? p?.title ?? p?.name ?? "Plan"
          ),
          price_monthly: Number(
            p?.price_monthly ?? p?.monthly_price ?? p?.price ?? 0
          ),
          features: Array.isArray(p?.features)
            ? p.features
            : Array.isArray(p?.benefits)
            ? p.benefits
            : undefined,
        };
        return pkg;
      });

      // If nothing in DB, provide defaults so UI keeps working
      if (!mapped.length) {
        return [
          {
            package_type: "free",
            display_name: "Free",
            price_monthly: 0,
            features: ["Basic access"],
          },
          {
            package_type: "silver",
            display_name: "Silver",
            price_monthly: 1999,
            features: ["Notes", "Quizzes"],
          },
          {
            package_type: "gold",
            display_name: "Gold",
            price_monthly: 3999,
            features: ["All features", "Priority support"],
          },
        ];
      }
      return mapped;
    } catch {
      return [
        {
          package_type: "free",
          display_name: "Free",
          price_monthly: 0,
          features: ["Basic access"],
        },
        {
          package_type: "silver",
          display_name: "Silver",
          price_monthly: 1999,
          features: ["Notes", "Quizzes"],
        },
        {
          package_type: "gold",
          display_name: "Gold",
          price_monthly: 3999,
          features: ["All features", "Priority support"],
        },
      ];
    }
  }

  /** === Legacy alias: if called WITHOUT args, return catalog (array) === */
  async getPackageInfo(): Promise<PackageInfo[]> {
    return this.getPackages();
  }

  /** === Stats for dashboard cards === */
  async getStudentStats(): Promise<StudentStats> {
    let total = 0;
    let recent = 0;
    let active: number | undefined;
    let inactive: number | undefined;
    const byPackage: Record<string, number> = {};

    // 1) Use admin summary if available
    try {
      const dash = await this.api.get("/api/admin/dashboard/summary");
      total = Number(dash.data?.totals?.students ?? 0);
      recent = Number(dash.data?.last_7_days?.new_users ?? 0);
    } catch {
      /* ignore */
    }

    // 2) Active/inactive via /api/profiles if available
    const studentRoleOr = [
      { role: "student" },
      { role_name: "student" },
      { user_role: "student" },
      { user_type: "student" },
      { type: "student" },
    ];
    try {
      const [aRes, iRes] = await Promise.all([
        this.api.get("/api/profiles", {
          params: {
            q: q({ $or: studentRoleOr, is_active: true }),
            limit: 1,
            offset: 0,
          },
        }),
        this.api.get("/api/profiles", {
          params: {
            q: q({ $or: studentRoleOr, is_active: false }),
            limit: 1,
            offset: 0,
          },
        }),
      ]);
      active = Number(aRes.data?.total ?? 0);
      inactive = Number(iRes.data?.total ?? 0);
    } catch (err: any) {
      if (!isAxios404(err)) throw err;
    }

    // 3) By package via /api/subscriptions if present
    try {
      const subsRes = await this.api.get("/api/subscriptions", {
        params: { limit: 5000, sort: sort({ createdAt: -1 }) },
      });
      const subs: any[] = subsRes.data?.items ?? [];
      for (const s of subs) {
        const key = String(
          s?.plan_id ?? s?.package_id ?? s?.plan ?? s?.package ?? "free"
        ).toLowerCase();
        byPackage[key] = (byPackage[key] ?? 0) + 1;
      }
    } catch {
      /* ignore */
    }

    return { total, active, inactive, recentRegistrations: recent, byPackage };
  }
}

// Singleton & legacy adapter
export const adminStudentService = new AdminStudentServiceClass();
export const AdminStudentService = {
  // keep your current calls working
  getAllStudents: (
    p?: Parameters<AdminStudentServiceClass["getAllStudents"]>[0]
  ) => adminStudentService.getAllStudents(p),
  getPackages: () => adminStudentService.getPackages(),
  getPackageInfo: () => adminStudentService.getPackageInfo(),
  getStudentStats: () => adminStudentService.getStudentStats(),
};
export default AdminStudentService;
