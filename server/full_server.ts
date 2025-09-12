import * as dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

// ---------------- Env ----------------
const PORT = Number(process.env.PORT || 8000);
const MONGODB_URI =
  process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb://127.0.0.1:27017/mathmentor";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "admin@mathmentor.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const ADMIN_PASSWORDS = (process.env.ADMIN_PASSWORDS || process.env.ADMIN_PASSWORD || "admin123")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ---------------- App ----------------
const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

// ---------------- Helpers ----------------
function parseJSONSafe(raw: any): any {
  if (!raw) return undefined;
  try {
    return JSON.parse(String(raw));
  } catch {
    return undefined;
  }
}
function snakeToCamelKey(k: string) {
  return k.replace(/_([a-z])/g, (_m: any, c: string) => c.toUpperCase());
}
function camelToSnakeKey(k: string) {
  return k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}
function normalizeSort(input: any) {
  if (!input || typeof input !== "object") return input;
  const out: any = {};
  for (const [k, v] of Object.entries(input)) out[snakeToCamelKey(k)] = v as any;
  return out;
}
function buildQueryFromQ(q: any) {
  if (!q || typeof q !== "object") return {};
  const out: any = {};
  for (const [k, v] of Object.entries(q)) {
    if (
      ["set_id", "quiz_id", "class_id", "user_id", "tutor_id", "student_id", "email", "tutor_email", "student_email", "status", "id", "_id"].includes(
        k
      )
    ) {
      out[k] = v;
      continue;
    }
    if (typeof v === "string") out[k] = { $regex: v as string, $options: "i" };
    else out[k] = v;
  }
  return out;
}
function toSupabaseLike(doc: any) {
  if (!doc || typeof doc !== "object") return doc;
  const out: any = {};
  for (const [k, v] of Object.entries(doc)) {
    if (k === "_id") {
      out["id"] = typeof v === "object" ? String(v) : v;
      out["_id"] = v;
      continue;
    }
    if (k === "createdAt") {
      out["created_at"] = v;
      out[k] = v;
      continue;
    }
    if (k === "updatedAt") {
      out["updated_at"] = v;
      out[k] = v;
      continue;
    }
    out[k] = v;
    out[camelToSnakeKey(k)] = v;
  }
  return out;
}
function mapArraySupabaseLike(items: any[]) {
  return items.map(toSupabaseLike);
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
function dateGteFilter(fieldNames: string[], when: Date) {
  return { $or: fieldNames.map((f) => ({ [f]: { $gte: when } })) };
}
function createdSince(when: Date) {
  return { $or: [{ createdAt: { $gte: when } }, { created_at: { $gte: when } }] } as any;
}
function asArray<T = any>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v === undefined || v === null) return [];
  return [v as T];
}
function normStr(s: any) {
  return String(s || "").trim();
}
function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ---------------- Schemas (loose) ----------------
const loose = { strict: false, timestamps: true };

const ProfileSchema = new Schema(
  { user_id: String, email: String, name: String, role: String, avatar_url: String, is_active: Boolean, subjects: [String] },
  loose
);
const AdminUserSchema = new Schema({ email: String, password_hash: String }, loose);
const SubjectsSchema = new Schema({ name: String, is_active: Boolean, sort_order: Number, code: String, slug: String }, loose);
const GradeSchema = new Schema({ code: String, title: String, is_active: Boolean }, loose);
const StudyNoteSchema = new Schema({ title: String, subject: String, grade: String, tags: [String], is_active: Boolean, views: Number, downloads: Number }, loose);
StudyNoteSchema.index({ title: "text", subject: "text", grade: "text", tags: "text" });
const FlashcardSetSchema = new Schema({ title: String, subject: String, grade: String, is_active: Boolean, cards: [{ q: String, a: String, order: Number }] }, loose);
const FlashcardSchema = new Schema({ set_id: Schema.Types.Mixed, q: String, a: String, order: Number, is_active: Boolean }, loose);

const TutorApplicationSchema = new Schema({}, loose);
const TutorAvailabilitySchema = new Schema({}, loose);
const TutorNoteSchema = new Schema({}, loose);
const TutorNoteViewSchema = new Schema({}, loose);

const ClassSchema = new Schema({}, loose);
const ClassEnrollmentSchema = new Schema({}, loose);
const ClassBookingSchema = new Schema({}, loose);
const BookingSchema = new Schema({}, loose);

const QuizSchema = new Schema({}, loose);
const QuizQuestionSchema = new Schema({}, loose);
const QuizAnswerSchema = new Schema({}, loose);
const QuizAttemptSchema = new Schema({}, loose);

const AdminNotificationSchema = new Schema({}, loose);
const AdminReportSchema = new Schema({}, loose);
const AdminActivityLogSchema = new Schema({}, loose);

const SubscriptionSchema = new Schema({}, loose);
const PackagePricingSchema = new Schema({}, loose);
const PaymentHistorySchema = new Schema({}, loose);

const JitsiMeetingSchema = new Schema({}, loose);
const InstantRequestSchema = new Schema({}, loose);

// Models
const Profiles = mongoose.model("profiles", ProfileSchema, "profiles");
const AdminUsers = mongoose.model("admin_users", AdminUserSchema, "admin_users");
const Subjects = mongoose.model("subjects", SubjectsSchema, "subjects");
const GradeLevels = mongoose.model("grade_levels", GradeSchema, "grade_levels");
const StudyNotes = mongoose.model("study_notes", StudyNoteSchema, "study_notes");
const FlashcardSets = mongoose.model("flashcard_sets", FlashcardSetSchema, "flashcard_sets");
const Flashcards = mongoose.model("flashcards", FlashcardSchema, "flashcards");

const TutorApplications = mongoose.model("tutor_applications", TutorApplicationSchema, "tutor_applications");
const TutorAvailability = mongoose.model("tutor_availability", TutorAvailabilitySchema, "tutor_availability");
const TutorNotes = mongoose.model("tutor_notes", TutorNoteSchema, "tutor_notes");
const TutorNoteViews = mongoose.model("tutor_note_views", TutorNoteViewSchema, "tutor_note_views");

const Classes = mongoose.model("classes", ClassSchema, "classes");
const ClassEnrollments = mongoose.model("class_enrollments", ClassEnrollmentSchema, "class_enrollments");
const ClassBookings = mongoose.model("class_bookings", ClassBookingSchema, "class_bookings");
const Bookings = mongoose.model("bookings", BookingSchema, "bookings");

const Quizzes = mongoose.model("quizzes", QuizSchema, "quizzes");
const QuizQuestions = mongoose.model("quiz_questions", QuizQuestionSchema, "quiz_questions");
const QuizAnswers = mongoose.model("quiz_answers", QuizAnswerSchema, "quiz_answers");
const QuizAttempts = mongoose.model("quiz_attempts", QuizAttemptSchema, "quiz_attempts");

const AdminNotifications = mongoose.model("admin_notifications", AdminNotificationSchema, "admin_notifications");
const AdminReports = mongoose.model("admin_reports", AdminReportSchema, "admin_reports");
const AdminActivityLog = mongoose.model("admin_activity_log", AdminActivityLogSchema, "admin_activity_log");

const Subscriptions = mongoose.model("subscriptions", SubscriptionSchema, "subscriptions");
const PackagePricing = mongoose.model("package_pricing", PackagePricingSchema, "package_pricing");
const PaymentHistory = mongoose.model("payment_history", PaymentHistorySchema, "payment_history");

const JitsiMeetings = mongoose.model("jitsi_meetings", JitsiMeetingSchema, "jitsi_meetings");
const InstantRequests = mongoose.model("instant_requests", InstantRequestSchema, "instant_requests");



// ---------------- Shared list route ----------------
function listRoute(model: any, collectionName: string, defaultSort: any = { createdAt: -1 }, maxLimit = 500) {
  return async (req: Request, res: Response) => {
    try {
      const q = buildQueryFromQ(parseJSONSafe(req.query.q) || {});
      const sort = normalizeSort(parseJSONSafe(req.query.sort) || defaultSort);
      const limit = Math.min(Number(req.query.limit) || 50, maxLimit);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const [items, total] = await Promise.all([model.find(q).sort(sort).skip(offset).limit(limit).lean(), model.countDocuments(q)]);
      const supaItems = mapArraySupabaseLike(items);
      res.json({ items: supaItems, total, limit, offset, collection: collectionName });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message, collection: collectionName });
    }
  };
}

// ---------------- Health ----------------
app.get("/health", async (_req, res) => {
  const state = mongoose.connection.readyState;
  const dbName = (mongoose.connection.db as any)?.databaseName;
  res.json({ ok: state === 1, service: "full_server_supabase_compat_cjs_instant_v3", port: PORT, db: dbName, state });
});

// ---------------- Auth (aliases) ----------------
const loginPaths = [
  "/api/auth/admin/login",
  "/api/admin/login",
  "/api/admin/verify_credentials",
  "/api/v1/auth/admin/login",
  "/api/v1/admin/login",
  "/api/v1/auth/login",
  "/api/auth/login",
  "/auth/admin/login",
  "/auth/login",
  "/api/session/login",
  "/api/login",
  "/login",
  "/api/auth/token",
  "/auth/token",
];
const verifyAdminHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: "email and password required" });
  for (let i = 0; i < Math.max(ADMIN_EMAILS.length, ADMIN_PASSWORDS.length); i++) {
    const e = ADMIN_EMAILS[i] || ADMIN_EMAILS[0];
    const p = ADMIN_PASSWORDS[i] || ADMIN_PASSWORDS[0];
    if (email === e && password === p) {
      await Profiles.updateOne({ email }, { $setOnInsert: { email, role: "admin", is_active: true, user_id: email } }, { upsert: true });
      const user = await Profiles.findOne({ email }).lean();
      return res.json({ ok: true, user: toSupabaseLike(user), token: "ok_env" });
    }
  }
  const admin = await AdminUsers.findOne({ email }).lean();
  if (!admin?.password_hash) return res.status(401).json({ ok: false, error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return res.status(401).json({ ok: false, error: "Invalid credentials" });
  await Profiles.updateOne({ email }, { $setOnInsert: { email, role: "admin", is_active: true, user_id: email } }, { upsert: true });
  const user = await Profiles.findOne({ email }).lean();
  res.json({ ok: true, user: toSupabaseLike(user), token: "ok_db" });
};
for (const p of loginPaths) app.post(p, verifyAdminHandler);

// ---------------- Content ----------------
app.get("/api/note_subjects", listRoute(Subjects, "subjects", { sort_order: 1, createdAt: 1 }));
app.get("/api/subjects", listRoute(Subjects, "subjects", { sort_order: 1, createdAt: 1 }));
app.get("/api/grade_levels", listRoute(GradeLevels, "grade_levels"));
app.get("/api/study_notes", listRoute(StudyNotes, "study_notes"));
app.get("/api/flashcard_sets", listRoute(FlashcardSets, "flashcard_sets"));

app.get("/api/flashcards", async (req: Request, res: Response) => {
  try {
    const q = buildQueryFromQ(parseJSONSafe(req.query.q) || {});
    const sort = normalizeSort(parseJSONSafe(req.query.sort) || { order: 1, createdAt: 1 });
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const [items, total] = await Promise.all([
      Flashcards.find(q).sort(sort).skip(offset).limit(limit).lean(),
      Flashcards.countDocuments(q),
    ]);
    if (total > 0) {
      return res.json({ items: mapArraySupabaseLike(items), total, limit, offset, source: "collection" });
    }

    const setId = (q as any).set_id;
    if (setId) {
      const setDoc = await FlashcardSets.findOne({
        $or: [{ _id: setId }, { id: setId }, { uuid: setId }, { slug: setId }, { set_uuid: setId }],
      }).lean();
      if (setDoc && Array.isArray(setDoc.cards) && setDoc.cards.length) {
        const derived = setDoc.cards
          .filter((c: any) => c && (c.is_active === undefined || c.is_active === true))
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          .map((c: any, idx: number) =>
            toSupabaseLike({
              _id: `${setDoc._id}-${idx}`,
              set_id: String(setDoc._id),
              q: c.q,
              a: c.a,
              order: c.order ?? idx,
              is_active: c.is_active ?? true,
              createdAt: setDoc.createdAt,
              updatedAt: setDoc.updatedAt,
            })
          );
        const sliced = derived.slice(offset, offset + limit);
        return res.json({ items: sliced, total: derived.length, limit, offset, source: "embedded" });
      }
    }
    return res.json({ items: [], total: 0, limit, offset, source: "none" });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message, collection: "flashcards" });
  }
});

// ---------------- Instant Session helpers ----------------
function normalizeSubjectName(x: any): string | undefined {
  const s = normStr(x);
  if (!s) return undefined;
  return s.replace(/\s+/g, " ").trim();
}

async function distinctInstantSubjects(): Promise<{ id: string; name: string; slug: string; source: string }[]> {
  const outMap = new Map<string, { id: string; name: string; slug: string; source: string }>();

  // 1) From Subjects collection (active first)
  const subjDocs = await Subjects.find({ $or: [{ is_active: true }, { is_active: { $exists: false } }] })
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
  const tutorProfiles = await Profiles.find(roleFilter("tutor") as any, { subjects: 1 }).limit(5000).lean();
  for (const p of tutorProfiles) {
    for (const name of (asArray((p as any).subjects).map(normalizeSubjectName).filter(Boolean) as string[])) {
      const slug = toSlug(name);
      if (!outMap.has(slug)) outMap.set(slug, { id: slug, name, slug, source: "profiles" });
    }
  }

  return Array.from(outMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------- Instant Session endpoints ----------------
app.get("/api/instant/subjects", async (_req, res) => {
  try {
    const items = await distinctInstantSubjects();
    res.json({ items, total: items.length });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/instant/tutors", async (req, res) => {
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

    const byProfile = await Profiles.find(
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
    const profiles = await Profiles.find(
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
      return toSupabaseLike({
        _id: String(e.tutor_id || e.email || Math.random()),
        tutor_id: e.tutor_id || (pr as any).user_id,
        email: e.email || (pr as any).email,
        name: e.name || (pr as any).name,
        avatar_url: (pr as any).avatar_url,
        subjects: (pr as any).subjects || e.subjects,
        next_available_time: e.next_available_time || null,
        subject_query: subject,
        source: e.source,
      });
    });

    res.json({ subject, items, total: items.length });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------- Instant Requests (POST aliases + GET alias) ----------
// shared handler
const createInstantRequest = async (req: Request, res: Response) => {
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
    res.json({ ok: true, request: toSupabaseLike(r[0]) });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
};

// both paths registered
app.post("/api/instant/requests", createInstantRequest);
app.post("/api/instant_requests", createInstantRequest);


// Also provide a GET alias at /api/instant/requests (you already have /api/instant_requests via expose)
app.get("/api/instant/subjects", async (_req, res) => {
  try {
    const itemsRaw = await distinctInstantSubjects(); // {id,name,slug,source}
    const items = itemsRaw.map(s => ({
      ...s,
      display_name: s.name,   // <-- ensure display_name
    }));
    res.json({ items, total: items.length });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e.message });
  }
});


// ---------------- Dashboards ----------------
app.get("/api/admin/dashboard/summary", async (_req, res) => {
  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * 86400000);

  const [totalStudents, totalTutors, totalAdmins] = await Promise.all([
    Profiles.countDocuments(roleFilter("student")),
    Profiles.countDocuments(roleFilter("tutor")),
    Profiles.countDocuments(roleFilter("admin")),
  ]);

  const [totalClasses, upcomingClasses, pendingTutorApps, totalStudyNotes, totalFlashcardSets, totalQuizzes, totalPayments] =
    await Promise.all([
      Classes.countDocuments({}),
      Classes.countDocuments(dateGteFilter(["start_time", "start_at", "start", "starts_at", "startDate"], now) as any),
      TutorApplications.countDocuments({ $or: [{ status: /pending|under[_ ]?review|submitted/i }, { is_pending: true }] } as any),
      StudyNotes.countDocuments({}),
      FlashcardSets.countDocuments({}),
      Quizzes.countDocuments({}),
      PaymentHistory.countDocuments({}),
    ]);

  const [newUsers7, classes7, attempts7] = await Promise.all([
    Profiles.countDocuments(createdSince(last7) as any),
    Classes.countDocuments(createdSince(last7) as any),
    QuizAttempts.countDocuments(createdSince(last7) as any),
  ]);

  res.json({
    totals: {
      students: totalStudents,
      tutors: totalTutors,
      admins: totalAdmins,
      classes: totalClasses,
      upcoming_classes: upcomingClasses,
      tutor_applications_pending: pendingTutorApps,
      study_notes: totalStudyNotes,
      flashcard_sets: totalFlashcardSets,
      quizzes: totalQuizzes,
      payments: totalPayments,
    },
    last_7_days: { new_users: newUsers7, new_classes: classes7, quiz_attempts: attempts7 },
  });
});

app.get("/api/admin/dashboard/recent", async (_req, res) => {
  const [recentUsers, recentApps, recentClasses, recentPayments] = await Promise.all([
    Profiles.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    TutorApplications.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    Classes.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    PaymentHistory.find({}).sort({ createdAt: -1 }).limit(10).lean(),
  ]);
  res.json({
    recentUsers: mapArraySupabaseLike(recentUsers),
    recentApps: mapArraySupabaseLike(recentApps),
    recentClasses: mapArraySupabaseLike(recentClasses),
    recentPayments: mapArraySupabaseLike(recentPayments),
  });
});

app.get("/api/tutor/dashboard/summary", async (req, res) => {
  const userId = String(req.query.user_id || "");
  const email = String(req.query.email || "");
  if (!userId && !email) return res.status(400).json({ ok: false, error: "user_id or email required" });
  const tutorMatch: any = userId ? { $or: [{ tutor_id: userId }, { user_id: userId }] } : { $or: [{ tutor_email: email }, { email }] };
  const now = new Date();
  const [profile, upcoming, myClasses, myEnrollments, myNotes, myApps] = await Promise.all([
    Profiles.findOne({ $or: [{ user_id: userId }, { email }] }).lean(),
    Classes.find({ ...tutorMatch, ...dateGteFilter(["start_time", "start_at", "start", "starts_at", "startDate"], now) } as any)
      .sort({ start_time: 1, start_at: 1, start: 1 })
      .limit(5)
      .lean(),
    Classes.countDocuments(tutorMatch as any),
    ClassEnrollments.countDocuments({ tutor_id: userId } as any),
    TutorNotes.find({ $or: [{ user_id: userId }, { email }] } as any).sort({ createdAt: -1 }).limit(5).lean(),
    TutorApplications.find({ $or: [{ user_id: userId }, { email }] } as any).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  res.json({
    profile: toSupabaseLike(profile),
    counts: { classes: myClasses, enrollments: myEnrollments },
    upcoming_classes: mapArraySupabaseLike(upcoming),
    recent_notes: mapArraySupabaseLike(myNotes),
    recent_applications: mapArraySupabaseLike(myApps),
  });
});

app.get("/api/student/dashboard/summary", async (req, res) => {
  const userId = String(req.query.user_id || "");
  const email = String(req.query.email || "");
  if (!userId && !email) return res.status(400).json({ ok: false, error: "user_id or email required" });
  const studentMatch: any = userId ? { $or: [{ student_id: userId }, { user_id: userId }] } : { $or: [{ student_email: email }, { email }] };
  const [profile, upcomingEnrollments, attempts, recentNotes, recentSets] = await Promise.all([
    Profiles.findOne({ $or: [{ user_id: userId }, { email }] }).lean(),
    ClassEnrollments.find(studentMatch as any).sort({ createdAt: -1 }).limit(5).lean(),
    QuizAttempts.find({ $or: [{ user_id: userId }, { email }] } as any).sort({ createdAt: -1 }).limit(5).lean(),
    StudyNotes.find({ is_active: true }).sort({ createdAt: -1 }).limit(6).lean(),
    FlashcardSets.find({ is_active: true }).sort({ createdAt: -1 }).limit(6).lean(),
  ]);
  res.json({
    profile: toSupabaseLike(profile),
    upcoming_enrollments: mapArraySupabaseLike(upcomingEnrollments),
    recent_quiz_attempts: mapArraySupabaseLike(attempts),
    suggestions: { notes: mapArraySupabaseLike(recentNotes), flashcard_sets: mapArraySupabaseLike(recentSets) },
  });
});

// Raw list endpoints (optional)
function expose(model: any, name: string, sort: any = { createdAt: -1 }) {
  app.get(`/api/${name}`, listRoute(model, name, sort));
}
expose(Quizzes, "quizzes");
expose(QuizQuestions, "quiz_questions");
expose(QuizAnswers, "quiz_answers");
expose(QuizAttempts, "quiz_attempts");
expose(Classes, "classes");
expose(ClassEnrollments, "class_enrollments");
expose(ClassBookings, "class_bookings");
expose(Bookings, "bookings");
expose(TutorApplications, "tutor_applications");
expose(TutorAvailability, "tutor_availability");
expose(TutorNotes, "tutor_notes");
expose(TutorNoteViews, "tutor_note_views");
expose(Subscriptions, "subscriptions");
expose(PackagePricing, "package_pricing");
expose(PaymentHistory, "payment_history");
expose(AdminNotifications, "admin_notifications");
expose(AdminReports, "admin_reports");
expose(AdminActivityLog, "admin_activity_log");
expose(JitsiMeetings, "jitsi_meetings");
expose(InstantRequests, "instant_requests");
// expose list endpoint for profiles (add this next to the other expose() calls)
expose(Profiles, "profiles");


// ---------------- Start ----------------
function start() {
  const masked = (() => {
    const str = MONGODB_URI || "";
    const at = str.lastIndexOf("@");
    if (at > -1) return str.slice(0, 12) + "***@" + str.slice(at + 1);
    return str.startsWith("mongodb+srv") ? "mongodb+srv://***" : str;
  })();
  console.log("🔌 Using Mongo URI:", masked);

  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      const dbName = (mongoose.connection.db as any)?.databaseName;
      console.log("✅ Connected to MongoDB DB:", dbName);
      app.listen(PORT, () => {
        console.log(`✅ full_server_supabase_compat_cjs_instant_v3 listening on http://localhost:${PORT}`);
        console.log(`   Health:  curl http://localhost:${PORT}/health`);
        console.log(`   Instant subjects: curl http://localhost:${PORT}/api/instant/subjects`);
        console.log(`   Find tutors: curl "http://localhost:${PORT}/api/instant/tutors?subject=Math"`);
        console.log(`   Create instant request (underscore): curl -X POST http://localhost:${PORT}/api/instant_requests -H "Content-Type: application/json" -d '{"subject":"Math"}'`);
        console.log(`   Create instant request (slash):     curl -X POST http://localhost:${PORT}/api/instant/requests -H "Content-Type: application/json" -d '{"subject":"Math"}'`);
      });
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err?.message || err);
      process.exit(1);
    });
}

start();
