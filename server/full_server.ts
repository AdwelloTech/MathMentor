import * as dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

// ---------- Env ----------
const PORT = Number(process.env.PORT || 8000);
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || "mongodb+srv://adwello204_db_user:Adwello2025@cluster0.n7krmxe.mongodb.net/mathmentor?retryWrites=true&w=majority";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "admin@mathmentor.com")
  .split(",").map(s => s.trim()).filter(Boolean);
const ADMIN_PASSWORDS = (process.env.ADMIN_PASSWORDS || process.env.ADMIN_PASSWORD || "admin123")
  .split(",").map(s => s.trim()).filter(Boolean);

// ---------- App ----------
const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
  ],
  credentials: true,
}));

// ---------- DB ----------
mongoose.set("strictQuery", false);

const maskedUri = (() => {
  const str = MONGODB_URI || "";
  const at = str.lastIndexOf("@");
  if (at > -1) return str.slice(0, 12) + "***@" + str.slice(at + 1);
  return str.startsWith("mongodb+srv") ? "mongodb+srv://***" : str;
})();
console.log("🔌 Using Mongo URI:", maskedUri);

mongoose.connect(MONGODB_URI).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
});

// ---------- Schemas ----------
const ProfileSchema = new Schema({
  user_id: { type: String, index: true, unique: true, sparse: true }, // prevent null duplicates via non-null setOnInsert
  email:   { type: String, index: true, unique: true, sparse: true },
  name: String,
  role: { type: String, enum: ["admin", "student", "tutor"], default: "student" },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

const AdminUserSchema = new Schema({
  email: { type: String, unique: true },
  password_hash: String,
}, { timestamps: true });

const SubjectSchema = new Schema({
  name: { type: String, unique: true },
  is_active: { type: Boolean, default: true },
  sort_order: { type: Number, default: 0 }, // supports ?sort={"sort_order":1}
}, { timestamps: true });

const GradeLevelSchema = new Schema({
  code: { type: String, unique: true }, // e.g., G10
  title: String,
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

const StudyNoteSchema = new Schema({
  title: String,
  subject: String,
  grade: String,
  tags: [String],
  is_active: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
}, { timestamps: true });

const FlashcardSetSchema = new Schema({
  title: String,
  subject: String,
  grade: String,
  is_active: { type: Boolean, default: true },
  cards: [{ q: String, a: String }],
}, { timestamps: true });

const TutorMaterialSchema = new Schema({
  title: String,
  subject: String,
  grade: String,
  url: String,
  is_active: { type: Boolean, default: true },
  download_count: { type: Number, default: 0 },
}, { timestamps: true });

// ---------- Models ----------
const Profile = model("profiles", ProfileSchema);
const AdminUser = model("admin_users", AdminUserSchema);
const Subject = model("subjects", SubjectSchema);
const GradeLevel = model("grade_levels", GradeLevelSchema);
const StudyNote = model("study_notes", StudyNoteSchema);
const FlashcardSet = model("flashcard_sets", FlashcardSetSchema);
const TutorMaterial = model("tutor_materials", TutorMaterialSchema);

// ---------- Utils ----------
function parseJSONSafe(str?: string) {
  if (!str) return undefined;
  try { return JSON.parse(str); } catch { return undefined; }
}

function buildQueryFromQ(q: any) {
  if (!q || typeof q !== "object") return {};
  const out: any = {};
  for (const [k, v] of Object.entries(q)) {
    if (typeof v === "string") out[k] = { $regex: v, $options: "i" };
    else out[k] = v;
  }
  return out;
}

// ---------- Health ----------
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "full_server_plus", port: PORT });
});

// ---------- Admin Login (aliases) ----------
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
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "email and password required" });
  }

  // 1) Env bootstrap
  for (let i = 0; i < Math.max(ADMIN_EMAILS.length, ADMIN_PASSWORDS.length); i++) {
    const e = ADMIN_EMAILS[i] || ADMIN_EMAILS[0];
    const p = ADMIN_PASSWORDS[i] || ADMIN_PASSWORDS[0];
    if (email === e && password === p) {
      await Profile.updateOne(
        { email },
        { $setOnInsert: { email, role: "admin", is_active: true, user_id: email } },
        { upsert: true }
      );
      return res.json({ ok: true, user: { email, role: "admin", source: "env" }, token: "ok_env" });
    }
  }

  // 2) DB admin
  const admin = await AdminUser.findOne({ email });
  if (!admin) return res.status(401).json({ ok: false, error: "Invalid credentials" });
  const ok = admin.password_hash && await bcrypt.compare(password, admin.password_hash);
  if (!ok) return res.status(401).json({ ok: false, error: "Invalid credentials" });

  await Profile.updateOne(
    { email },
    { $setOnInsert: { email, role: "admin", is_active: true, user_id: email } },
    { upsert: true }
  );

  return res.json({ ok: true, user: { email, role: "admin", source: "db" }, token: "ok_db" });
};

for (const p of loginPaths) {
  app.post(p, verifyAdminHandler);
}

// ---------- Subjects & Note Subjects ----------
app.get("/api/subjects", async (req: Request, res: Response) => {
  const q = buildQueryFromQ(parseJSONSafe(String(req.query.q || "")));
  const sort = parseJSONSafe(String(req.query.sort || "")) || { sort_order: 1, createdAt: 1 };
  const items = await Subject.find(q).sort(sort as any).lean();
  res.json(items);
});

// alias used by your UI
app.get("/api/note_subjects", async (req: Request, res: Response) => {
  const q = buildQueryFromQ(parseJSONSafe(String(req.query.q || "")));
  const sort = parseJSONSafe(String(req.query.sort || "")) || { sort_order: 1, createdAt: 1 };
  const items = await Subject.find(q).sort(sort as any).lean();
  res.json(items);
});

// ---------- Grade Levels ----------
app.get("/api/grade_levels", async (req: Request, res: Response) => {
  const q = buildQueryFromQ(parseJSONSafe(String(req.query.q || "")));
  const items = await GradeLevel.find(q).sort({ createdAt: -1 }).lean();
  res.json(items);
});

// ---------- Study Notes search + counters ----------
app.get("/api/study-notes/search", async (req: Request, res: Response) => {
  const { searchTerm, subjectFilter, gradeFilter, limit } = req.query as any;
  const q: any = { is_active: true };
  if (searchTerm) q.$text = { $search: String(searchTerm) };
  if (subjectFilter) q.subject = String(subjectFilter);
  if (gradeFilter) q.grade = String(gradeFilter);

  const lim = Math.min(Number(limit) || 20, 100);
  const items = await StudyNote.find(q).sort({ createdAt: -1 }).limit(lim).lean();
  res.json(items);
});

app.post("/api/study_notes/:id/views", async (req: Request, res: Response) => {
  const { id } = req.params;
  await StudyNote.updateOne({ _id: id }, { $inc: { views: 1 } });
  res.json({ ok: true });
});

app.post("/api/study_notes/:id/downloads", async (req: Request, res: Response) => {
  const { id } = req.params;
  await StudyNote.updateOne({ _id: id }, { $inc: { downloads: 1 } });
  res.json({ ok: true });
});

// ---------- Flashcard sets: dynamic grid ----------
app.get("/api/flashcard_sets", async (req: Request, res: Response) => {
  const q = buildQueryFromQ(parseJSONSafe(String(req.query.q || ""))) || {};
  const sort = parseJSONSafe(String(req.query.sort || "")) || { createdAt: -1 };
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const itemsPromise = FlashcardSet.find(q).sort(sort as any).skip(offset).limit(limit).lean();
  const totalPromise = FlashcardSet.countDocuments(q);

  const [items, total] = await Promise.all([itemsPromise, totalPromise]);
  res.json({ items, total, limit, offset });
});

// ---------- Tutor materials ----------
app.get("/api/tutor_materials", async (req: Request, res: Response) => {
  const q = buildQueryFromQ(parseJSONSafe(String(req.query.q || ""))) || {};
  const items = await TutorMaterial.find(q).sort({ createdAt: -1 }).lean();
  res.json(items);
});
app.post("/api/tutor_materials", async (req: Request, res: Response) => {
  const doc = await TutorMaterial.create(req.body || {});
  res.json(doc);
});
app.post("/api/increment_tutor_note_download_count", async (req: Request, res: Response) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: "id required" });
  await TutorMaterial.updateOne({ _id: id }, { $inc: { download_count: 1 } });
  res.json({ ok: true });
});

// ---------- Profiles ----------
app.get("/api/profiles", async (_req: Request, res: Response) => {
  const items = await Profile.find({}).sort({ createdAt: -1 }).lean();
  res.json(items);
});
app.post("/api/profiles", async (req: Request, res: Response) => {
  const updates = req.body || {};
  if (!updates.email && updates.user_id) {
    // allow upserting by user_id as well
    const doc = await Profile.findOneAndUpdate(
      { user_id: updates.user_id },
      { $set: updates },
      { new: true, upsert: true }
    );
    return res.json(doc);
  }
  const doc = await Profile.findOneAndUpdate(
    { email: updates.email },
    { $set: updates, $setOnInsert: { user_id: updates.email || updates.user_id || new mongoose.Types.ObjectId().toString() } },
    { new: true, upsert: true }
  );
  res.json(doc);
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`✅ full_server_plus listening on http://localhost:${PORT}`);
  console.log(`   Health:  curl http://localhost:${PORT}/health`);
});
