import { Request, Response } from "express";
import { Subject, Profile, TutorAvailability, InstantRequests } from "../core";

function normalizeSubjectName(x: any): string | undefined {
  const s = String(x || "").trim();
  if (!s) return undefined;
  return s.replace(/\s+/g, " ").trim();
}

async function distinctInstantSubjects(): Promise<{ id: string; name: string; slug: string; source: string }[]> {
  const outMap = new Map<string, { id: string; name: string; slug: string; source: string }>();

  // 1) From Subjects collection (active first)
  const subjDocs = await Subject.find({ $or: [{ is_active: true }, { is_active: { $exists: false } }] })
    .sort({ sort_order: 1, name: 1 })
    .lean();
  for (const s of subjDocs) {
    const name = normalizeSubjectName((s as any).name) || normalizeSubjectName((s as any).title) || normalizeSubjectName((s as any).code);
    if (!name) continue;
    const slug = toSlug((s as any).slug || name);
    if (!outMap.has(slug)) outMap.set(slug, { id: String((s as any)._id || (s as any).id || slug), name, slug, source: "subjects" });
  }

  // 2) From TutorAvailability (subject / subjects[] / topic)
  const avail = await TutorAvailability.find({}, { subject: 1, subjects: 1, topic: 1, topics: 1 }).limit(2000).lean();
  for (const a of avail) {
    const candidates = Array.from(
      new Set(
        [
          normalizeSubjectName((a as any).subject),
          ...asArray((a as any).subjects).map(normalizeSubjectName),
          normalizeSubjectName((a as any).topic),
          ...asArray((a as any).topics).map(normalizeSubjectName),
        ].filter(Boolean) as string[]
      )
    );
    for (const name of candidates) {
      const slug = toSlug(name);
      if (!outMap.has(slug)) outMap.set(slug, { id: slug, name, slug, source: "tutor_availability" });
    }
  }

  // 3) From Tutor profiles (subjects[])
  const tutorProfiles = await Profile.find(roleFilter("tutor") as any, { subjects: 1 }).limit(5000).lean();
  for (const p of tutorProfiles) {
    for (const name of (asArray((p as any).subjects).map(normalizeSubjectName).filter(Boolean) as string[])) {
      const slug = toSlug(name);
      if (!outMap.has(slug)) outMap.set(slug, { id: slug, name, slug, source: "profiles" });
    }
  }

  return Array.from(outMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

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

function asArray<T = any>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v === undefined || v === null) return [];
  return [v as T];
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/* ---------- Instant Session endpoints ---------- */
export async function getInstantSubjects(_req: Request, res: Response) {
  try {
    const items = await distinctInstantSubjects();
    res.json({ items, total: items.length });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

export async function getInstantTutors(req: Request, res: Response) {
  try {
    const subjectRaw = String(req.query.subject || req.query.subject_name || "");
    const subject = normalizeSubjectName(subjectRaw);
    if (!subject) return res.status(400).json({ ok: false, error: "subject required" });

    const subjectRx = new RegExp(`^${subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const now = new Date();

    // Collect tutor ids/emails from availability and profiles
    const byAvail = await TutorAvailability.find(
      {
        $or: [{ subject: subjectRx }, { subjects: { $elemMatch: subjectRx } }, { topic: subjectRx }, { topics: { $elemMatch: subjectRx } }],
        $or2: [{ start_time: { $gte: now } }, { start_at: { $gte: now } }, { is_online: true }, { available_now: true }] as any,
      } as any,
      { user_id: 1, tutor_id: 1, email: 1, tutor_email: 1, start_time: 1, start_at: 1 }
    )
      .limit(2000)
      .lean();

    const byProfile = await Profile.find(
      {
        ...(roleFilter("tutor") as any),
        $or: [{ subjects: { $elemMatch: subjectRx } }, { expertise: { $elemMatch: subjectRx } }, { subject: subjectRx }],
      },
      { user_id: 1, email: 1, name: 1, subjects: 1 }
    )
      .limit(2000)
      .lean();

    const seen = new Map<string, any>();
    for (const a of byAvail) {
      const id = String((a as any).user_id || (a as any).tutor_id || (a as any).email || (a as any).tutor_email || JSON.stringify(a));
      if (!seen.has(id))
        seen.set(id, {
          tutor_id: (a as any).user_id || (a as any).tutor_id,
          email: (a as any).email || (a as any).tutor_email,
          next_available_time: (a as any).start_time || (a as any).start_at,
          source: "availability",
        });
    }
    for (const p of byProfile) {
      const id = String((p as any).user_id || (p as any).email || JSON.stringify(p));
      const prev = seen.get(id) || {};
      seen.set(id, {
        ...prev,
        tutor_id: (p as any).user_id || prev.tutor_id,
        email: (p as any).email || prev.email,
        name: (p as any).name,
        subjects: (p as any).subjects || prev.subjects,
        source: prev.source || "profile",
      });
    }

    // Enrich with profiles for display name/avatar
    const entries = Array.from(seen.values());
    const ids = entries.map((e) => e.tutor_id).filter(Boolean);
    const emails = entries.map((e) => e.email).filter(Boolean);
    const profiles = await Profile.find(
      { $or: [{ user_id: { $in: ids } }, { email: { $in: emails } }] },
      { user_id: 1, email: 1, name: 1, avatar_url: 1, subjects: 1 }
    ).lean();
    const profByKey = new Map<string, any>();
    for (const pr of profiles) {
      profByKey.set(String((pr as any).user_id || (pr as any).email), pr);
      profByKey.set(String((pr as any).email || (pr as any).user_id), pr);
    }

    const items = entries.map((e) => {
      const pr = profByKey.get(String(e.tutor_id || e.email)) || {};
      return {
        _id: String(e.tutor_id || e.email || Math.random()),
        tutor_id: e.tutor_id || (pr as any).user_id,
        email: e.email || (pr as any).email,
        name: e.name || (pr as any).name,
        avatar_url: (pr as any).avatar_url,
        subjects: (pr as any).subjects || e.subjects,
        next_available_time: e.next_available_time || null,
        subject_query: subject,
        source: e.source,
      };
    });

    res.json({ subject, items, total: items.length });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

export async function createInstantRequest(req: Request, res: Response) {
  try {
    const { student_email, student_id, subject, notes } = req.body || {};
    if (!subject) return res.status(400).json({ ok: false, error: "subject required" });
    const when = new Date();
    const doc = {
      student_email, student_id,
      subject: (subject || "").toString().trim(),
      notes: notes || "",
      status: "open",
      createdAt: when, updatedAt: when,
    };
    const r = await InstantRequests.insertMany([doc]);
    res.json({ ok: true, request: r[0] });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
