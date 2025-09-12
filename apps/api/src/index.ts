// apps/api/src/index.ts
import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import mongoose, { Schema, model, Types } from "mongoose";
import bcrypt from "bcryptjs";

/* ================================
   MongoDB Connection
================================== */
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://adwello204_db_user:Adwello2025@cluster0.n7krmxe.mongodb.net/mathmentor?retryWrites=true&w=majority";

mongoose.set("strictQuery", false);

async function connectWithRetry() {
  try {
    console.log("🧩 Connecting to Mongo:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connect failed. Retrying in 3s...", err);
    setTimeout(connectWithRetry, 3000);
  }
}
connectWithRetry();

/* ================================
   Schemas / Models
================================== */
const ProfileSchema = new Schema(
  {
    user_id: { type: String, index: true },
    email: { type: String, index: true },
    full_name: String,
    avatar_url: String,
    role: { type: String, enum: ["student", "tutor", "admin"], default: "student" },

    // premium flags
    plan: { type: String, default: "free" }, // "free" | "premium" | "pro" | "paid"
    is_premium: { type: Boolean, default: false },
    premium_until: { type: Date, default: null },

    // tutorial flags
    tutorial_started: { type: Boolean, default: false },
    tutorial_completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const SubjectSchema = new Schema(
  {
    name: String,
    code: String,
    color: String,
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const GradeLevelSchema = new Schema(
  { code: String, label: String, is_active: { type: Boolean, default: true } },
  { timestamps: true }
);

const FlashcardSetSchema = new Schema(
  {
    tutor_profile_id: String,
    title: String,
    subject_id: { type: Schema.Types.ObjectId, ref: "Subject" },
    grade_level_code: String,
    description: String,
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FlashcardSchema = new Schema(
  {
    set_id: { type: Schema.Types.ObjectId, ref: "FlashcardSet" },
    front_text: String,
    back_text: String,
    card_order: Number,
  },
  { timestamps: true }
);

const StudyNoteSchema = new Schema(
  {
    title: String,
    description: String,
    subject_id: { type: Schema.Types.ObjectId, ref: "Subject" },
    grade_level_code: String,
    file_url: String,
    file_name: String,
    file_size: Number,
    view_count: { type: Number, default: 0 },
    download_count: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const TutorMaterialSchema = new Schema(
  {
    title: String,
    description: String,
    subject_id: { type: Schema.Types.ObjectId, ref: "Subject" },
    file_url: String,
    is_active: { type: Boolean, default: true },
    student_ids: [String],
    download_count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SessionBookingSchema = new Schema(
  {
    student_id: String,
    tutor_id: String,
    subject_id: { type: Schema.Types.ObjectId, ref: "Subject" },
    starts_at: Date,
    ends_at: Date,
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
    notes: String,
  },
  { timestamps: true }
);

/* ---------- Quizzes ---------- */
const QuizSchema = new Schema(
  {
    tutor_id: String,
    tutor_name: String, // helps UI show tutor.full_name without extra join
    title: String,
    description: String,
    subject: String, // e.g., "Algebra"
    time_limit_minutes: { type: Number, default: 30 },
    total_questions: { type: Number, default: 10 },
    is_active: { type: Boolean, default: true },
    assigned_student_ids: { type: [String], default: [] }, // restrict to specific students
  },
  { timestamps: true }
);

const QuizAttemptSchema = new Schema(
  {
    quiz_id: { type: Schema.Types.ObjectId, ref: "Quiz" },
    student_id: String,
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    started_at: Date,
    completed_at: Date,
    answers: Array,
    score: Number,
  },
  { timestamps: true }
);

/* ---------- Admin + Package pricing ---------- */
const AdminUserSchema = new Schema(
  {
    email: { type: String, unique: true, index: true },
    password_hash: String,
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PackagePricingSchema = new Schema(
  {
    package_type: { type: String, index: true }, // e.g. "free", "pro"
    price: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    is_active: { type: Boolean, default: true },
    features: [String],
  },
  { timestamps: true }
);

// explicit collection names
const Profile       = model("Profile",       ProfileSchema,      "profiles");
const Subject       = model("Subject",       SubjectSchema,      "subjects");
const GradeLevel    = model("GradeLevel",    GradeLevelSchema,   "grade_levels");
const FlashcardSet  = model("FlashcardSet",  FlashcardSetSchema, "flashcard_sets");
const Flashcard     = model("Flashcard",     FlashcardSchema,    "flashcards");
const StudyNote     = model("StudyNote",     StudyNoteSchema,    "study_notes");
const TutorMaterial = model("TutorMaterial", TutorMaterialSchema,"tutor_materials");
const SessionBooking= model("SessionBooking",SessionBookingSchema,"session_bookings");
const Quiz          = model("Quiz",          QuizSchema,         "quizzes");
const QuizAttempt   = model("QuizAttempt",   QuizAttemptSchema,  "quiz_attempts");
const AdminUser     = model("AdminUser",     AdminUserSchema,    "admin_users");
const PackagePricing= model("PackagePricing",PackagePricingSchema,"package_pricing");

// expose profiles list endpoint
expose(Profile, "profile");


/* ================================
   App / Middleware
================================== */
const app = express();

// CORS and logging
app.use(cors({ origin: "http://localhost:3000" }));
app.use(morgan("dev"));

// ✅ JSON parser (pick ONE, here we use express built-in)
app.use(express.json({ limit: "5mb", strict: true }));

// ✅ URL-encoded form parser
app.use(express.urlencoded({ extended: true, limit: "2mb" }));



// avoid 304/stale bodies in dev
app.set("etag", false);
app.use((_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});


app.use((req, _res, next) => {
  if (req.originalUrl.startsWith("/api/auth/admin/login")) {
    console.log("[REQ] %s %s ct=%s", req.method, req.originalUrl, req.get("content-type"));
  }
  next();
});

app.post("/_echo", (req, res) => res.json({ body: req.body, url: req.originalUrl }));


// Admin login route for frontend compatibility
app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "email and password required" });
    }
    const emailLc = String(email).toLowerCase().trim();

    // 1) ENV-based admin shortcut (dev)
    const envEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const envPass = process.env.ADMIN_PASSWORD || "";
    if (envEmail && emailLc === envEmail) {
      let ok = false;
      if (envPass.startsWith("$2")) ok = await bcrypt.compare(password, envPass);
      else ok = password === envPass;

      if (ok) {
        const prof = await Profile.findOneAndUpdate(
          { email: emailLc },
          {
            $setOnInsert: {
              email: emailLc,
              user_id: emailLc.replace(/[^a-z0-9]/gi, "") + "-id",
              full_name: emailLc.split("@")[0],
              role: "admin",
              plan: "pro",
              is_premium: true,
            },
          },
          { new: true, upsert: true }
        ).lean();
        return res.json({
          ok: true,
          user: {
            id: prof.user_id,
            email: prof.email,
            role: "admin",
            profile: prof,
          },
        });
      }
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    // 2) DB-based admin
    const adm = await AdminUser.findOne({ email: emailLc, is_active: true }).lean();
    if (!adm?.password_hash) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }
    const match = await bcrypt.compare(String(password), String(adm.password_hash));
    if (!match) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const prof = await Profile.findOneAndUpdate(
      { email: emailLc },
      {
        $setOnInsert: {
          email: emailLc,
          user_id: emailLc.replace(/[^a-z0-9]/gi, "") + "-id",
          full_name: emailLc.split("@")[0],
          role: "admin",
          plan: "pro",
          is_premium: true,
        },
      },
      { new: true, upsert: true }
    ).lean();

    res.json({
      ok: true,
      user: {
        id: prof.user_id,
        email: prof.email,
        role: "admin",
        profile: prof,
      },
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


/* ================================
   Helpers
================================== */
function parseJSON<T>(s?: string | null): T | undefined {
  if (!s) return undefined;
  try { return JSON.parse(s); } catch { return undefined; }
}
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function buildSubjectMatch(subjectFilter?: string | null) {
  if (!subjectFilter) return null;
  const s = String(subjectFilter).trim();
  if (!s) return null;

  const or: any[] = [{ subject_id: s }];

  if (Types.ObjectId.isValid(s)) {
    const oid = new Types.ObjectId(s);
    or.push({ subject_id: oid }, { "subject._id": oid });
  }

  const exact = new RegExp(`^${escapeRegExp(s)}$`, "i");
  or.push({ "subject.name": exact }, { "subject.code": exact });

  return { $or: or };
}
function buildStudyNotesPipeline(opts: {
  searchTerm?: string;
  subjectFilter?: string;
  gradeFilter?: string;
  limit?: number;
}) {
  const { searchTerm, subjectFilter, gradeFilter, limit } = opts;

  const pipeline: any[] = [
    { $match: { is_active: true, ...(gradeFilter ? { grade_level_code: gradeFilter } : {}) } },
    { $lookup: { from: "subjects", localField: "subject_id", foreignField: "_id", as: "subject" } },
    { $addFields: { subject: { $arrayElemAt: ["$subject", 0] } } },
  ];

  const subjMatch = buildSubjectMatch(subjectFilter);
  if (subjMatch) pipeline.push({ $match: subjMatch });

  if (searchTerm && String(searchTerm).trim()) {
    const rx = new RegExp(escapeRegExp(String(searchTerm).trim()), "i");
    pipeline.push({
      $match: {
        $or: [
          { title: rx },
          { description: rx },
          { "subject.name": rx },
          { "subject.code": rx },
        ],
      },
    });
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $limit: Math.min(Number(limit ?? 100), 200) },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        grade_level_code: 1,
        file_url: 1,
        file_name: 1,
        file_size: 1,
        view_count: 1,
        download_count: 1,
        createdAt: 1,
        subject_id: { $ifNull: ["$subject._id", "$subject_id"] },
        subject_name: { $ifNull: ["$subject.name", null] },
        subject_color: { $ifNull: ["$subject.color", null] },
      },
    }
  );

  return pipeline;
}

async function dynamicFind(res: Response, Model: any, options: any = {}) {
  const { q, sort, limit, offset, select, populate } = options;
  try {
    const query = Model.find(q || {});
    if (select) query.select(select);
    if (sort) query.sort(sort);
    if (typeof limit === "number") query.limit(Math.min(limit, 500));
    if (typeof offset === "number") query.skip(offset);
    if (populate) query.populate(populate);
    const rows = await query.exec();
    res.json({ ok: true, data: rows });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

/* ================================
   Routes
================================== */
// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

/* ---------- Admin ---------- */
app.post("/api/admin/upsert", async (req, res) => {
  try {
    const { email, password, is_active = true } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "email and password required" });
    }
    const emailLc = String(email).toLowerCase().trim();
    const hash = await bcrypt.hash(String(password), 10);

    await AdminUser.updateOne(
      { email: emailLc },
      { $set: { email: emailLc, password_hash: hash, is_active: !!is_active } },
      { upsert: true }
    );

    // ensure admin profile exists
    const user_id = emailLc.replace(/[^a-z0-9]/gi, "") + "-id";
    await Profile.updateOne(
      { email: emailLc },
      {
        $set: {
          email: emailLc,
          user_id,
          full_name: emailLc.split("@")[0],
          role: "admin",
          is_premium: true,
          plan: "pro",
        },
      },
      { upsert: true }
    );

    res.json({ ok: true, success: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/admin/verify_credentials", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, success: false, error: "email and password required" });
    }
    const emailLc = String(email).toLowerCase().trim();

    // 1) ENV-based admin shortcut (dev)
    const envEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const envPass = process.env.ADMIN_PASSWORD || "";
    if (envEmail && emailLc === envEmail) {
      let ok = false;
      if (envPass.startsWith("$2")) ok = await bcrypt.compare(password, envPass);
      else ok = password === envPass;

      if (ok) {
        const prof = await Profile.findOneAndUpdate(
          { email: emailLc },
          {
            $setOnInsert: {
              email: emailLc,
              user_id: emailLc.replace(/[^a-z0-9]/gi, "") + "-id",
              full_name: emailLc.split("@")[0],
              role: "admin",
              plan: "pro",
              is_premium: true,
            },
          },
          { new: true, upsert: true }
        ).lean();
        return res.json({ ok: true, success: true, data: { valid: true, profile: prof } });
      }
      return res.json({ ok: true, success: false, data: { valid: false } });
    }

    // 2) DB-based admin
    const adm = await AdminUser.findOne({ email: emailLc, is_active: true }).lean();
    if (!adm?.password_hash) {
      return res.json({ ok: true, success: false, data: { valid: false } });
    }
    const match = await bcrypt.compare(String(password), String(adm.password_hash));
    if (!match) return res.json({ ok: true, success: false, data: { valid: false } });

    const prof = await Profile.findOneAndUpdate(
      { email: emailLc },
      {
        $setOnInsert: {
          email: emailLc,
          user_id: emailLc.replace(/[^a-z0-9]/gi, "") + "-id",
          full_name: emailLc.split("@")[0],
          role: "admin",
          plan: "pro",
          is_premium: true,
        },
      },
      { new: true, upsert: true }
    ).lean();

    res.json({ ok: true, success: true, data: { valid: true, profile: prof } });
  } catch (e: any) {
    res.status(500).json({ ok: false, success: false, error: e.message });
  }
});

/* ---------- Profiles ---------- */
app.patch("/api/profiles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patch = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const filter = /^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { user_id: id };
    const updated = await Profile.findOneAndUpdate(filter, { $set: patch }, { new: true }).lean();
    if (!updated) return res.status(404).json({ ok: false, error: "Profile not found" });
    res.json({ ok: true, data: updated });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message || "Invalid body" });
  }
});

app.get("/api/profiles", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, Profile, { q, sort, limit, offset });
});

app.get("/api/profiles/:id", async (req, res) => {
  const { id } = req.params;
  let doc = null;
  if (/^[0-9a-fA-F]{24}$/.test(id)) doc = await Profile.findById(id);
  else doc = await Profile.findOne({ user_id: id });
  if (!doc) return res.status(404).json({ ok: false, error: "Profile not found" });
  res.json({ ok: true, data: doc });
});

app.post("/api/profiles", async (req, res) => {
  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    // Drop non-ObjectId _id (e.g., UUID) so Mongoose can generate one
    if (payload && typeof payload._id === "string" && !Types.ObjectId.isValid(payload._id)) {
      delete payload._id;
    }
    const created = await Profile.create(payload);
    res.json({ ok: true, data: created });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message || "Invalid body" });
  }
});

/* ---------- Quizzes ---------- */
// generic list (handy for admin)


app.get("/api/quizzes", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, Quiz, { q, sort, limit, offset });
});

// create quiz
app.post("/api/quizzes", async (req, res) => {
  try {
    const doc = await Quiz.create(req.body || {});
    res.json({ ok: true, data: doc });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// CREATE subject
app.post("/api/subjects", async (req, res) => {
  try {
    const doc = await Subject.create(req.body || {});
    res.json({ ok: true, data: doc });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});





// available quizzes for a student
app.get("/api/quizzes/available", async (req, res) => {
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
});

// start (or resume) a quiz attempt
app.post("/api/quizzes/:id/attempts", async (req, res) => {
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
});




/* ---------- Subjects / Grade Levels ---------- */
app.get("/api/subjects", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { name: 1 };
  const limit = req.query.limit ? Number(req.query.limit) : 200;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, Subject, { q, sort, limit, offset });
});

// Alias used by notes UI
app.get("/api/note_subjects", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || { is_active: true };
  const sort = parseJSON<any>(req.query.sort as string) || { sort_order: 1, name: 1 };
  const limit = req.query.limit ? Number(req.query.limit) : 200;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, Subject, { q, sort, limit, offset });
});

app.get("/api/grade_levels", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || { is_active: true };
  const sort = parseJSON<any>(req.query.sort as string) || { code: 1 };
  const limit = req.query.limit ? Number(req.query.limit) : 200;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, GradeLevel, { q, sort, limit, offset });
});

/* ---------- Flashcards ---------- */
app.get("/api/flashcard_sets", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 200;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, FlashcardSet, {
    q, sort, limit, offset, populate: [{ path: "subject_id", model: Subject }],
  });
});

app.post("/api/flashcard_sets", async (req, res) => {
  try {
    const doc = await FlashcardSet.create(req.body || {});
    res.json({ ok: true, data: doc });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.get("/api/flashcards", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { card_order: 1 };
  const limit = req.query.limit ? Number(req.query.limit) : 500;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, Flashcard, { q, sort, limit, offset });
});

app.post("/api/flashcards", async (req, res) => {
  try {
    let cards = req.body;
    if (!Array.isArray(cards)) cards = [cards];
    const docs = await Flashcard.insertMany(cards);
    res.json({ ok: true, data: docs });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.patch("/api/flashcards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Flashcard.updateOne({ _id: id }, { $set: req.body || {} });
    const updated = await Flashcard.findById(id);
    res.json({ ok: true, data: updated });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

/* ---------- Study Notes ---------- */
// list
app.get("/api/study_notes", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, StudyNote, {
    q, sort, limit, offset, populate: [{ path: "subject_id", model: Subject }],
  });
});

// search (POST compat)
app.post("/api/search_study_notes", async (req, res) => {
  try {
    const { search_term, subject_filter, grade_filter, limit } = req.body || {};
    const pipeline = buildStudyNotesPipeline({
      searchTerm: search_term,
      subjectFilter: subject_filter,
      gradeFilter: grade_filter,
      limit,
    });
    const rows = await StudyNote.aggregate(pipeline).exec();

    const out = rows.map((n: any) => ({
      id: n._id?.toString(),
      title: n.title,
      description: n.description,
      subject_id: n.subject_id?.toString?.() ?? n.subject_id ?? null,
      subject_name: n.subject_name ?? null,
      subject_color: n.subject_color ?? null,
      grade_level_code: n.grade_level_code ?? null,
      file_url: n.file_url ?? null,
      file_name: n.file_name ?? null,
      file_size: n.file_size ?? null,
      view_count: n.view_count ?? 0,
      download_count: n.download_count ?? 0,
      created_at: n.createdAt,
    }));

    res.json({ ok: true, data: out });
  } catch (e: any) {
    console.error("search_study_notes error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// search (GET alias)
app.get("/api/study-notes/search", async (req, res) => {
  try {
    const search_term = (req.query.q as string) || (req.query.search_term as string) || "";
    const subject_filter = (req.query.subject as string) || (req.query.subject_filter as string) || "";
    const grade_filter = (req.query.grade as string) || (req.query.grade_filter as string) || "";
    const limit = Number(req.query.limit ?? 100);

    const pipeline = buildStudyNotesPipeline({
      searchTerm: search_term,
      subjectFilter: subject_filter,
      gradeFilter: grade_filter,
      limit,
    });
    const rows = await StudyNote.aggregate(pipeline).exec();

    const out = rows.map((n: any) => ({
      id: n._id?.toString(),
      title: n.title,
      description: n.description,
      subject_id: n.subject_id?.toString?.() ?? n.subject_id ?? null,
      subject_name: n.subject_name ?? null,
      subject_color: n.subject_color ?? null,
      grade_level_code: n.grade_level_code ?? null,
      file_url: n.file_url ?? null,
      file_name: n.file_name ?? null,
      file_size: n.file_size ?? null,
      view_count: n.view_count ?? 0,
      download_count: n.download_count ?? 0,
      created_at: n.createdAt,
    }));

    res.json({ ok: true, data: out });
  } catch (e: any) {
    console.error("study-notes/search (GET) error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// counters
app.post("/api/study_notes/:id/views", async (req, res) => {
  try {
    const { id } = req.params;
    await StudyNote.updateOne(
      { _id: id },
      { $inc: { view_count: 1 }, $set: { updated_at: new Date().toISOString() } }
    ).exec();
    const doc = await StudyNote.findById(id).lean().exec();
    res.json({ ok: true, data: doc });
  } catch (e: any) {
    console.error("study_notes views error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/study_notes/:id/downloads", async (req, res) => {
  try {
    const { id } = req.params;
    await StudyNote.updateOne(
      { _id: id },
      { $inc: { download_count: 1 }, $set: { updated_at: new Date().toISOString() } }
    ).exec();
    const doc = await StudyNote.findById(id).lean().exec();
    res.json({ ok: true, data: doc });
  } catch (e: any) {
    console.error("study_notes downloads error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ---------- Tutor Materials ---------- */
app.get("/api/tutor_materials", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, TutorMaterial, {
    q, sort, limit, offset, populate: [{ path: "subject_id", model: Subject }],
  });
});

app.get("/api/get_student_tutor_materials", async (req, res) => {
  try {
    const student_id = String(req.query.student_id || "").trim();
    const extra = parseJSON<any>(req.query.q as string) || {};
    const q: any = { is_active: true, ...extra };
    if (student_id) q.student_ids = student_id;

    const rows = await TutorMaterial.find(q)
      .populate({ path: "subject_id", model: Subject })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();

    const out = rows.map((r: any) => ({
      id: (r._id ?? r.id)?.toString(),
      title: r.title,
      description: r.description,
      subject_id: r.subject_id?._id?.toString?.() ?? r.subject_id,
      subject_name: r.subject_id?.name ?? null,
      subject_color: r.subject_id?.color ?? null,
      file_url: r.file_url ?? null,
      download_count: r.download_count ?? 0,
      created_at: r.createdAt,
    }));
    res.json({ ok: true, data: out });
  } catch (e: any) {
    console.error("get_student_tutor_materials error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/get_student_tutor_material_by_id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await TutorMaterial.findById(id)
      .populate({ path: "subject_id", model: Subject })
      .lean()
      .exec();
    if (!doc) return res.status(404).json({ ok: false, error: "Not found" });

    const out = {
      id: (doc._id ?? doc.id)?.toString(),
      title: doc.title,
      description: doc.description,
      subject_id: doc.subject_id?._id?.toString?.() ?? doc.subject_id,
      subject_name: doc.subject_id?.name ?? null,
      subject_color: doc.subject_id?.color ?? null,
      file_url: doc.file_url ?? null,
      download_count: doc.download_count ?? 0,
      created_at: doc.createdAt,
    };
    res.json({ ok: true, data: out });
  } catch (e: any) {
    console.error("get_student_tutor_material_by_id error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/tutor_materials/:id/downloads", async (_req, res) => {
  res.json({ ok: true }); // kept simple; you also have increment route below
});

app.post("/api/increment_tutor_note_download_count", async (req, res) => {
  try {
    const { note_id } = req.body || {};
    if (!note_id) return res.status(400).json({ ok: false, error: "note_id required" });
    await TutorMaterial.updateOne({ _id: note_id }, { $inc: { download_count: 1 } });
    res.json({ ok: true });
  } catch (e: any) {
    console.error("increment_tutor_note_download_count error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- add under the "Tutor Materials" section ---
// CREATE tutor material
app.post("/api/tutor_materials", async (req, res) => {
  try {
    const payload =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const doc = await TutorMaterial.create(payload);
    res.json({ ok: true, data: doc });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

/* ---------- Session Bookings ---------- */
app.post("/api/session_bookings", async (req, res) => {
  try {
    const booking = await SessionBooking.create(req.body || {});
    res.json({ ok: true, data: booking });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.get("/api/session_bookings", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, SessionBooking, {
    q, sort, limit, offset, populate: [{ path: "subject_id", model: Subject }],
  });
});

/* ---------- Tutorial status ---------- */
app.get("/api/tutorial_status", async (req, res) => {
  try {
    const user_id = String(req.query.user_id || "").trim();
    if (!user_id) {
      return res.json({ ok: true, data: { started: false, completed: false } });
    }
    const prof: any = await Profile.findOne({ user_id }).lean().exec();
    res.json({
      ok: true,
      data: {
        started: !!prof?.tutorial_started,
        completed: !!prof?.tutorial_completed,
      },
    });
  } catch (e: any) {
    console.error("tutorial_status error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/tutorial_status", async (req, res) => {
  try {
    const { user_id, started, completed } = req.body || {};
    if (!user_id) return res.status(400).json({ ok: false, error: "user_id required" });
    const patch: any = {};
    if (typeof started === "boolean") patch.tutorial_started = started;
    if (typeof completed === "boolean") patch.tutorial_completed = completed;

    const doc = await Profile.findOneAndUpdate(
      { user_id },
      { $set: patch },
      { new: true, upsert: true }
    ).lean();

    res.json({
      ok: true,
      data: {
        started: !!doc?.tutorial_started,
        completed: !!doc?.tutorial_completed,
      },
    });
  } catch (e: any) {
    console.error("tutorial_status POST error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ---------- Premium access ---------- */
app.get("/api/check_premium_access", async (req, res) => {
  try {
    const user_id = String(req.query.user_id || "").trim();
    if (!user_id) {
      return res.json({
        ok: true,
        data: { premium: false, has_access: false, plan: "free", premium_until: null },
      });
    }
    const prof: any = await Profile.findOne({ user_id }).lean().exec();
    const now = new Date();
    const plan = (prof?.plan || "free").toString().toLowerCase();
    const premiumUntil = prof?.premium_until ? new Date(prof.premium_until) : null;
    const premium =
      !!prof?.is_premium ||
      ["premium", "pro", "paid"].includes(plan) ||
      (premiumUntil && premiumUntil > now);

    res.json({
      ok: true,
      data: {
        premium,
        has_access: premium,
        plan: prof?.plan || "free",
        premium_until: prof?.premium_until || null,
      },
    });
  } catch (e: any) {
    console.error("check_premium_access error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ---------- Package pricing (UI calls) ---------- */
app.get("/api/package_pricing", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { package_type: 1 };
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, PackagePricing, { q, sort, limit, offset });
});

/* ================================
   Error Handler & Start
================================== */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }
  res.status(500).json({ ok: false, error: "Server error" });
});

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => {
  console.log(`🚀 API listening on http://localhost:${PORT}`);
});
