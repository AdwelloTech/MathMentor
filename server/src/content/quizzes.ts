import { Request, Response } from "express";
import { Quiz, QuizAttempt, SessionBooking, dynamicFind, parseJSON } from "../core";

/* ---------- Quizzes ---------- */
export async function getQuizzes(req: Request, res: Response) {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, Quiz, { q, sort, limit, offset });
}

export async function createQuiz(req: Request, res: Response) {
  try {
    const doc = await Quiz.create(req.body || {});
    res.json({ ok: true, data: doc });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

export async function getAvailableQuizzes(req: Request, res: Response) {
  try {
    const student_id = String(req.query.student_id || "").trim();
    if (!student_id) return res.json({ ok: true, data: [] });

    const tutorIds = await SessionBooking.distinct("tutor_id", {
      student_id,
      status: { $ne: "cancelled" },
    });

    const quizzes = await Quiz.find({
      is_active: true,
      $or: [
        { assigned_student_ids: student_id },
        { assigned_student_ids: { $size: 0 } },
        { tutor_id: { $in: tutorIds } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const attempts = await QuizAttempt.find({
      student_id,
      quiz_id: { $in: quizzes.map((q: any) => q._id) },
    }).lean();

    const attemptByQuiz = new Map<string, any>();
    for (const a of attempts) {
      const key = String(a.quiz_id);
      // prefer completed attempt if exists; else latest in_progress
      if (!attemptByQuiz.has(key) || attemptByQuiz.get(key)?.status !== "completed") {
        attemptByQuiz.set(key, a);
      }
    }

    const out = quizzes.map((q: any) => {
      const a = attemptByQuiz.get(String(q._id));
      const attempt_status = a ? a.status : "not_started";
      return {
        id: String(q._id),
        title: q.title,
        description: q.description,
        subject: q.subject,
        time_limit_minutes: q.time_limit_minutes,
        total_questions: q.total_questions,
        tutor: { id: q.tutor_id ?? null, full_name: q.tutor_name ?? "" },
        attempt_status,
        attempt_id: a?._id ? String(a._id) : null,
      };
    });

    res.json({ ok: true, data: out });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

export async function startQuizAttempt(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const student_id = String(body.student_id || "").trim();
    if (!student_id) return res.status(400).json({ ok: false, error: "student_id required" });

    const quiz = await Quiz.findById(id).lean();
    if (!quiz) return res.status(404).json({ ok: false, error: "Quiz not found" });

    let attempt = await QuizAttempt.findOne({ quiz_id: id, student_id, status: "in_progress" });
    if (!attempt) {
      attempt = await QuizAttempt.create({
        quiz_id: id,
        student_id,
        status: "in_progress",
        started_at: new Date(),
      });
    }

    res.json({ ok: true, data: { id: String(attempt._id), quiz_id: id, status: attempt.status } });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}
