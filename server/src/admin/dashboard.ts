import { Request, Response } from "express";
import { Profile, StudyNote, FlashcardSet, Quiz, QuizAttempt } from "../core";

function roleFilter(kind: "student" | "tutor" | "admin") {
  const patterns: Record<string, RegExp> = {
    student: /student|learner|pupil/i,
    tutor: /tutor|teacher|instructor/i,
    admin: /admin|administrator/i,
  };
  const rx = patterns[kind];
  return {
    $or: [{ role: rx }, { role_name: rx }, { user_role: rx }, { user_type: rx }, { type: rx }],
  } as any;
}

function createdSince(when: Date) {
  return { $or: [{ createdAt: { $gte: when } }, { created_at: { $gte: when } }] } as any;
}

/* ---------- Admin Dashboard ---------- */
export async function getAdminDashboardSummary(_req: Request, res: Response) {
  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * 86400000);

  const [totalStudents, totalTutors, totalAdmins] = await Promise.all([
    Profile.countDocuments(roleFilter("student")),
    Profile.countDocuments(roleFilter("tutor")),
    Profile.countDocuments(roleFilter("admin")),
  ]);

  const [totalStudyNotes, totalFlashcardSets, totalQuizzes] =
    await Promise.all([
      StudyNote.countDocuments({}),
      FlashcardSet.countDocuments({}),
      Quiz.countDocuments({}),
    ]);

  const [newUsers7, quizAttempts7] = await Promise.all([
    Profile.countDocuments(createdSince(last7) as any),
    QuizAttempt.countDocuments(createdSince(last7) as any),
  ]);

  res.json({
    totals: {
      students: totalStudents,
      tutors: totalTutors,
      admins: totalAdmins,
      study_notes: totalStudyNotes,
      flashcard_sets: totalFlashcardSets,
      quizzes: totalQuizzes,
    },
    last_7_days: { new_users: newUsers7, quiz_attempts: quizAttempts7 },
  });
}

export async function getAdminDashboardRecent(_req: Request, res: Response) {
  const recentUsers = await Profile.find({}).sort({ createdAt: -1 }).limit(10).lean();
  res.json({
    recentUsers,
  });
}
