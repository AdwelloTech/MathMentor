// apps/web/src/lib/studentService.ts
import { getApi } from "./api";

export const studentService = {
  async getStudentStats(studentId: string): Promise<any> {
    const api = getApi();
    // Try dedicated stats route if present
    try {
      const r = await api.get("/api/student/stats", { params: { student_id: studentId } });
      if (r?.data) return r.data;
    } catch {}
    // Compute from available endpoints as a fallback
    const [materials, flashcards, quizzes, bookings] = await Promise.allSettled([
      api.get("/api/tutor_materials", { params: { q: { is_active: true }, limit: 1 } }),
      api.get("/api/flashcard_sets", { params: { q: { is_active: true }, limit: 1 } }),
      api.get("/api/quizzes", { params: { q: { is_active: true }, limit: 1 } }),
      api.get("/api/session_bookings", { params: { q: { student_id: studentId }, limit: 1 } }),
    ]);
    const ok = (x: any) => x.status === "fulfilled" && x.value?.status === 200;
    return {
      ok: true,
      tutor_materials_enabled: ok(materials),
      flashcards_enabled: ok(flashcards),
      quizzes_enabled: ok(quizzes),
      has_bookings: ok(bookings),
    };
  },
};

export default studentService;
