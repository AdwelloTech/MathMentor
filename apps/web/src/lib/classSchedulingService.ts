// apps/web/src/lib/classSchedulingService.ts
import axios from "axios";
import type {
  ClassType,
  TutorClass,
  ClassBooking,
  BookingFilters,
  TutorDashboardStats,
  StudentDashboardStats,
  ClassSearchResult,
} from "@/types/classScheduling";

function getBaseUrl() {
  const url =
    (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_URL) ||
    (typeof process !== "undefined"
      ? (process as any)?.env?.VITE_API_URL || (process as any)?.env?.NEXT_PUBLIC_API_URL
      : "") ||
    "http://localhost:8080";
  return (url || "http://localhost:8080").replace(/\/$/, "");
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

const asArr = <T>(x: any): T[] => (Array.isArray(x) ? x : []);
const idStr = (x: any) => (x?._id ?? x?.id ?? x ?? "").toString();

function toDateParts(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const MM = pad(d.getMinutes());
  return { date: `${yyyy}-${mm}-${dd}`, time: `${HH}:${MM}` };
}
function minutesBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

function mapBookingToClass(r: any): TutorClass {
  const start = new Date(r.starts_at ?? r.startsAt ?? Date.now());
  const end = new Date(r.ends_at ?? r.endsAt ?? start.getTime() + 60 * 60000);
  const sp = toDateParts(start);
  const ep = toDateParts(end);
  return {
    id: idStr(r.class_id) || idStr(r._id),
    title: r.subject_name ?? "Session",
    description: r.notes ?? "",
    class_type_id: idStr(r.subject_id) || "GEN",
    class_type: { id: idStr(r.subject_id) || "GEN", name: r.subject_name ?? "General" } as any,
    date: sp.date,
    start_time: sp.time,
    end_time: ep.time,
    duration_minutes: minutesBetween(start, end),
    price_per_session: Number(r.price_per_session ?? r.payment_amount ?? 0),
    status: (r.status ?? "pending") as any,
    tutor: r.tutor_id
      ? { id: r.tutor_id, full_name: r.tutor_name ?? "Tutor" } as any
      : undefined,
    subject: r.subject_id
      ? { id: idStr(r.subject_id), name: r.subject_name ?? "Subject" } as any
      : undefined,
    created_at: r.createdAt ?? new Date().toISOString(),
    updated_at: r.updatedAt ?? new Date().toISOString(),
  } as TutorClass;
}

function mapToClassSearchResult(r: any): ClassSearchResult {
  const cls = mapBookingToClass(r);
  const start = new Date(r.starts_at ?? r.startsAt ?? Date.now());
  const future = start.getTime() > Date.now();
  return {
    class: cls,
    tutor: {
      id: r.tutor_id ?? "tutor",
      full_name: r.tutor_name ?? "Tutor",
      rating: Number(r.tutor_rating ?? 0),
      total_reviews: Number(r.tutor_reviews ?? 0),
      subjects: cls.subject?.name ? [cls.subject.name] : [],
    },
    available_slots: Number(r.available_slots ?? r.max_students ?? 1),
    is_bookable: future && (r.status ?? "").toLowerCase() !== "cancelled",
  };
}

function mapRowToBooking(r: any): ClassBooking {
  const cls = mapBookingToClass(r);
  return {
    id: idStr(r),
    class_id: cls.id,
    student_id: r.student_id ?? "",
    booking_status: (r.status ?? "pending") as ClassBooking["booking_status"],
    payment_status: (r.payment_status ?? "pending") as ClassBooking["payment_status"],
    payment_amount: Number(r.payment_amount ?? 0),
    stripe_payment_intent_id: r.stripe_payment_intent_id ?? undefined,
    notes: r.notes ?? undefined,
    class: cls,
    created_at: r.createdAt ?? new Date().toISOString(),
    updated_at: r.updatedAt ?? new Date().toISOString(),
  };
}

export const classSchedulingService = {
  classTypes: {
    // subjects → ClassType[]
    getAll: async (): Promise<ClassType[]> => {
      const res = await api.get("/api/subjects", {
        params: { sort: JSON.stringify({ name: 1 }), limit: 500 },
      });
      const rows = asArr<any>(res.data?.data);
      return rows.map((s) => ({
        id: idStr(s),
        name: s.name ?? "",
        description: s.description ?? "",
        duration_minutes: s.duration_minutes ?? 60,
        max_students: s.max_students ?? 10,
        is_active: s.is_active ?? true,
        price_per_session: Number(s.price_per_session ?? 0),
        created_at: s.createdAt ?? new Date().toISOString(),
        updated_at: s.updatedAt ?? new Date().toISOString(),
      }));
    },
  },

  classes: {
    // sessions the student can book (future, not cancelled)
    getAvailableClasses: async (): Promise<ClassSearchResult[]> => {
      const now = new Date().toISOString();
      const res = await api.get("/api/session_bookings", {
        params: {
          q: JSON.stringify({ status: { $ne: "cancelled" }, starts_at: { $gte: now } }),
          sort: JSON.stringify({ starts_at: 1 }),
          limit: 200,
        },
      });
      const rows = asArr<any>(res.data?.data);
      return rows.map(mapToClassSearchResult);
    },
  },

  bookings: {
    create: async (classId: string, studentId: string, paymentAmount: number, stripePaymentIntentId?: string) => {
      const now = new Date();
      const res = await api.post("/api/session_bookings", {
        student_id: studentId,
        class_id: classId,
        starts_at: now.toISOString(),
        ends_at: new Date(now.getTime() + 60 * 60000).toISOString(),
        status: "pending",
        notes: `booking for class ${classId}`,
        payment_amount: paymentAmount ?? 0,
        payment_status: "pending",
        stripe_payment_intent_id: stripePaymentIntentId ?? null,
      });
      return res.data?.data;
    },

    getByStudentId: async (studentId: string, _filters?: BookingFilters): Promise<ClassBooking[]> => {
      const res = await api.get("/api/session_bookings", {
        params: {
          q: JSON.stringify({ student_id: studentId }),
          sort: JSON.stringify({ starts_at: -1 }),
          limit: 500,
        },
      });
      return asArr<any>(res.data?.data).map(mapRowToBooking);
    },
  },

  stats: {
    getStudentStats: async (studentId: string): Promise<StudentDashboardStats> => {
      const res = await api.get("/api/session_bookings", {
        params: {
          q: JSON.stringify({ student_id: studentId }),
          sort: JSON.stringify({ starts_at: -1 }),
          limit: 1000,
        },
      });
      const rows = asArr<any>(res.data?.data);
      const now = new Date();

      const upcoming = rows.filter((r) => (r.status ?? "pending") !== "cancelled" && new Date(r.starts_at ?? 0) >= now);
      const completed = rows.filter((r) => (r.status ?? "").toLowerCase() === "completed");

      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const thisMonth = rows.filter((r) => {
        const d = new Date(r.starts_at ?? 0);
        return d >= firstDay && d <= lastDay;
      });

      const sum = (arr: any[], f: (x: any) => number) => arr.reduce((n, x) => n + (Number(f(x)) || 0), 0);

      return {
        total_bookings: rows.length,
        upcoming_bookings: upcoming.length,
        completed_bookings: completed.length,
        total_spent: sum(rows, (r) => r.payment_amount ?? 0),
        average_rating: 0,
        total_tutors: new Set(rows.map((r) => r.tutor_id).filter(Boolean)).size,
        bookings_this_month: thisMonth.length,
        spent_this_month: sum(thisMonth, (r) => r.payment_amount ?? 0),
        hours_learned: sum(completed, () => 1),
      };
    },

    getTutorStats: async (tutorId: string): Promise<TutorDashboardStats> => {
      const res = await api.get("/api/session_bookings", {
        params: {
          q: JSON.stringify({ tutor_id: tutorId }),
          sort: JSON.stringify({ starts_at: -1 }),
          limit: 1000,
        },
      });
      const rows = asArr<any>(res.data?.data);

      const scheduled = rows.filter((r) => (r.status ?? "") === "confirmed").length;
      const completed = rows.filter((r) => (r.status ?? "") === "completed").length;
      const earnings = rows.reduce((n, r) => n + Number(r.payment_amount ?? 0), 0);

      return {
        total_classes: rows.length,
        upcoming_classes: scheduled,
        completed_classes: completed,
        total_earnings: earnings,
        average_rating: 0,
        total_students: new Set(rows.map((r) => r.student_id).filter(Boolean)).size,
        classes_this_month: 0,
        earnings_this_month: 0,
      };
    },
  },
};

export default classSchedulingService;
