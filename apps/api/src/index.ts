// apps/api/src/index.ts
import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import mongoose, { Schema, model } from "mongoose";

/* ================================
   MongoDB Connection
================================== */
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:8000/mentoring_app?directConnection=true";
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
  { name: String, code: String, color: String, is_active: { type: Boolean, default: true } },
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
  { set_id: { type: Schema.Types.ObjectId, ref: "FlashcardSet" }, front_text: String, back_text: String, card_order: Number },
  { timestamps: true }
);

const StudyNoteSchema = new Schema(
  {
    title: String,
    description: String,
    subject_id: { type: Schema.Types.ObjectId, ref: "Subject" },
    grade_level_code: String,
    file_url: String,
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

const Profile = model("Profile", ProfileSchema);
const Subject = model("Subject", SubjectSchema);
const GradeLevel = model("GradeLevel", GradeLevelSchema);
const FlashcardSet = model("FlashcardSet", FlashcardSetSchema);
const Flashcard = model("Flashcard", FlashcardSchema);
const StudyNote = model("StudyNote", StudyNoteSchema);
const TutorMaterial = model("TutorMaterial", TutorMaterialSchema);
const SessionBooking = model("SessionBooking", SessionBookingSchema);

/* ================================
   App / Middleware
================================== */
const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "5mb", strict: true }));
app.use(bodyParser.text({ type: ["text/*", "application/x-www-form-urlencoded"], limit: "2mb" }));

/* ================================
   Helpers
================================== */
function parseJSON<T>(s?: string | null): T | undefined {
  if (!s) return undefined;
  try { return JSON.parse(s); } catch { return undefined; }
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

/* Profiles */
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
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const created = await Profile.create(payload || {});
    res.json({ ok: true, data: created });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message || "Invalid body" });
  }
});

/* Subjects / Grade Levels */
app.get("/api/subjects", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { name: 1 };
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

/* Flashcards */
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

/* Study Notes */
app.get("/api/study_notes", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, StudyNote, {
    q, sort, limit, offset, populate: [{ path: "subject_id", model: Subject }],
  });
});

app.post("/api/increment_note_view_count", async (req, res) => {
  const { note_id } = req.body || {};
  if (!note_id) return res.status(400).json({ ok: false, error: "note_id required" });
  await StudyNote.updateOne({ _id: note_id }, { $inc: { view_count: 1 } });
  res.json({ ok: true });
});

app.post("/api/study_notes/:id/views", async (req, res) => {
  const { id } = req.params;
  await StudyNote.updateOne({ _id: id }, { $inc: { view_count: 1 } });
  res.json({ ok: true });
});

/* Tutor Materials */
app.get("/api/tutor_materials", async (req, res) => {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, TutorMaterial, {
    q, sort, limit, offset, populate: [{ path: "subject_id", model: Subject }],
  });
});

app.post("/api/tutor_materials/:id/downloads", async (req, res) => {
  const { id } = req.params;
  await TutorMaterial.updateOne({ _id: id }, { $inc: { download_count: 1 } });
  res.json({ ok: true });
});

/* Session Bookings */
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

/* ===== Compat endpoints (match existing client calls) ===== */
// Search study notes
app.post("/api/search_study_notes", async (req, res) => {
  try {
    const { search_term, subject_filter, grade_filter } = req.body || {};
    const q: any = { is_active: true };
    if (subject_filter) q.subject_id = subject_filter;
    if (grade_filter) q.grade_level_code = grade_filter;
    if (search_term && String(search_term).trim().length > 0) {
      const regex = { $regex: String(search_term).replace(/[%]/g, ".*"), $options: "i" };
      q.$or = [{ title: regex }, { description: regex }];
    }
    const rows = await StudyNote.find(q)
      .populate({ path: "subject_id", model: Subject })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();
    const out = rows.map((n: any) => ({
      id: (n._id ?? n.id)?.toString(),
      title: n.title,
      description: n.description,
      subject_id: n.subject_id?._id?.toString?.() ?? n.subject_id,
      subject_name: n.subject_id?.name ?? null,
      subject_color: n.subject_id?.color ?? null,
      grade_level_code: n.grade_level_code ?? null,
      file_url: n.file_url ?? null,
      view_count: n.view_count ?? 0,
      created_at: n.createdAt,
    }));
    res.json({ ok: true, data: out });
  } catch (e: any) {
    console.error("search_study_notes error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Student tutor materials (list)
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

// Student tutor materials (by id)
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

// Increment tutor note downloads
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

/* Tutorial status */
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

/* Premium access */
app.get("/api/check_premium_access", async (req, res) => {
  try {
    const user_id = String(req.query.user_id || "").trim();
    if (!user_id) {
      return res.json({ ok: true, data: { premium: false, plan: "free", premium_until: null } });
    }
    const prof: any = await Profile.findOne({ user_id }).lean().exec();
    const now = new Date();
    const plan = (prof?.plan || "free").toString().toLowerCase();
    const premiumUntil = prof?.premium_until ? new Date(prof.premium_until) : null;
    const premium =
      !!prof?.is_premium ||
      ["premium", "pro", "paid"].includes(plan) ||
      (premiumUntil && premiumUntil > now);
    res.json({ ok: true, data: { premium, plan: prof?.plan || "free", premium_until: prof?.premium_until || null } });
  } catch (e: any) {
    console.error("check_premium_access error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
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
