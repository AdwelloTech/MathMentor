import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

/* ================================
   MongoDB Connection
================================== */
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://adwello204_db_user:Adwello2025@cluster0.n7krmxe.mongodb.net/mathmentor?retryWrites=true&w=majority";

mongoose.set("strictQuery", false);

export async function connectWithRetry() {
  try {
    console.log("🧩 Connecting to Mongo:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connect failed. Retrying in 3s...", err);
    setTimeout(connectWithRetry, 3000);
  }
}

/* ================================
   Schemas / Models
================================== */
export const ProfileSchema = new Schema(
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

export const SubjectSchema = new Schema(
  {
    name: String,
    code: String,
    color: String,
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const GradeLevelSchema = new Schema(
  { code: String, label: String, is_active: { type: Boolean, default: true } },
  { timestamps: true }
);

export const FlashcardSetSchema = new Schema(
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

export const FlashcardSchema = new Schema(
  {
    set_id: { type: Schema.Types.ObjectId, ref: "FlashcardSet" },
    front_text: String,
    back_text: String,
    card_order: Number,
  },
  { timestamps: true }
);

export const StudyNoteSchema = new Schema(
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

export const TutorMaterialSchema = new Schema(
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

export const SessionBookingSchema = new Schema(
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
export const QuizSchema = new Schema(
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

export const QuizAttemptSchema = new Schema(
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
export const AdminUserSchema = new Schema(
  {
    email: { type: String, unique: true, index: true },
    password_hash: String,
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PackagePricingSchema = new Schema(
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
export const Profile       = model("Profile",       ProfileSchema,      "profiles");
export const Subject       = model("Subject",       SubjectSchema,      "subjects");
export const GradeLevel    = model("GradeLevel",    GradeLevelSchema,   "grade_levels");
export const FlashcardSet  = model("FlashcardSet",  FlashcardSetSchema, "flashcard_sets");
export const Flashcard     = model("Flashcard",     FlashcardSchema,    "flashcards");
export const StudyNote     = model("StudyNote",     StudyNoteSchema,    "study_notes");
export const TutorMaterial = model("TutorMaterial", TutorMaterialSchema,"tutor_materials");
export const SessionBooking= model("SessionBooking",SessionBookingSchema,"session_bookings");
export const Quiz          = model("Quiz",          QuizSchema,         "quizzes");
export const QuizAttempt   = model("QuizAttempt",   QuizAttemptSchema,  "quiz_attempts");
export const AdminUser     = model("AdminUser",     AdminUserSchema,    "admin_users");
export const PackagePricing= model("PackagePricing",PackagePricingSchema,"package_pricing");
