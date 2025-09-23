import { Request, Response } from "express";
import { Profile, ClassEnrollment, TutorNote, TutorApplication } from "../core";

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

function dateGteFilter(fieldNames: string[], when: Date) {
  return { $or: fieldNames.map((f) => ({ [f]: { $gte: when } })) };
}

/* ---------- Tutor Dashboard ---------- */
export async function getTutorDashboard(req: Request, res: Response) {
  const userId = String(req.query.user_id || "");
  const email = String(req.query.email || "");
  if (!userId && !email) return res.status(400).json({ ok: false, error: "user_id or email required" });
  const tutorMatch: any = userId ? { $or: [{ tutor_id: userId }, { user_id: userId }] } : { $or: [{ tutor_email: email }, { email }] };
  const now = new Date();
  const [profile, myEnrollments, myNotes, myApps] = await Promise.all([
    Profile.findOne({ $or: [{ user_id: userId }, { email }] }).lean(),
    ClassEnrollment.countDocuments({ tutor_id: userId } as any),
    TutorNote.find({ $or: [{ user_id: userId }, { email }] } as any).sort({ createdAt: -1 }).limit(5).lean(),
    TutorApplication.find({ $or: [{ user_id: userId }, { email }] } as any).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  res.json({
    profile,
    counts: { enrollments: myEnrollments },
    recent_notes: myNotes,
    recent_applications: myApps,
  });
}
