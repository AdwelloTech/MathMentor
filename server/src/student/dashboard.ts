import { Request, Response } from "express";
import { Profile, QuizAttempt, ClassEnrollment, StudyNote, FlashcardSet } from "../core";

/* ---------- Student Dashboard ---------- */
export async function getStudentDashboard(req: Request, res: Response) {
  const userId = String(req.query.user_id || "");
  const email = String(req.query.email || "");
  if (!userId && !email) return res.status(400).json({ ok: false, error: "user_id or email required" });
  const studentMatch: any = userId ? { $or: [{ student_id: userId }, { user_id: userId }] } : { $or: [{ student_email: email }, { email }] };
  const [profile, upcomingEnrollments, attempts, recentNotes, recentSets] = await Promise.all([
    Profile.findOne({ $or: [{ user_id: userId }, { email }] }).lean(),
    ClassEnrollment.find(studentMatch as any).sort({ createdAt: -1 }).limit(5).lean(),
    QuizAttempt.find({ $or: [{ user_id: userId }, { email }] } as any).sort({ createdAt: -1 }).limit(5).lean(),
    StudyNote.find({ is_active: true }).sort({ createdAt: -1 }).limit(6).lean(),
    FlashcardSet.find({ is_active: true }).sort({ createdAt: -1 }).limit(6).lean(),
  ]);
  res.json({
    profile,
    upcoming_enrollments: upcomingEnrollments,
    recent_quiz_attempts: attempts,
    suggestions: { notes: recentNotes, flashcard_sets: recentSets },
  });
}
