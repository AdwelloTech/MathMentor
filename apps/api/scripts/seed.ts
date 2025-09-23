/**
 * Seeds MathMentor data into MongoDB:
 * - subjects
 * - quizzes
 * - flashcard_sets
 * - tutor_materials
 *
 * Idempotent: upserts by `slug`.
 *
 * Run (PowerShell):
 *   cd "<repo>\apps\api"
 *   $env:MONGO_URI="mongodb://127.0.0.1:27017/mathmentor"
 *   npx tsx scripts/seed.ts
 */

import "dotenv/config";
import mongoose, { Schema, model } from "mongoose";

// ---------- Connection ----------
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://adwello204_db_user:Adwello2025@cluster0.n7krmxe.mongodb.net/mathmentor?retryWrites=true&w=majority";
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:8080";

// ---------- Inline Models ----------
const SubjectSchema = new Schema(
  {
    slug: { type: String, unique: true, index: true }, // e.g. "mathematics"
    name: { type: String, index: true },
    display_name: { type: String, index: true },
    is_active: { type: Boolean, default: true, index: true },
    sort_order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
SubjectSchema.pre("save", function (next) {
  (this as any).updatedAt = new Date();
  next();
});
const Subject = model("subjects", SubjectSchema);

type QuizQuestion = {
  q: string;
  options: string[];
  correctIndex: number; // 0-based
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
};

const QuizSchema = new Schema(
  {
    slug: { type: String, unique: true, index: true },
    title: { type: String, required: true, index: true },
    subject_id: { type: String, required: true, index: true }, // keep as string for consistency
    grade: { type: String, index: true },                      // "10","11","AL"
    is_active: { type: Boolean, default: true, index: true },
    time_limit_sec: { type: Number, default: 900 },
    questions: [
      {
        q: { type: String, required: true },
        options: { type: [String], required: true },
        correctIndex: { type: Number, required: true },
        explanation: String,
        difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
        tags: [String],
      },
    ],
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
QuizSchema.pre("save", function (next) {
  (this as any).updatedAt = new Date();
  next();
});
const Quiz = model("quizzes", QuizSchema);

const FlashcardSetSchema = new Schema(
  {
    slug: { type: String, unique: true, index: true },
    title: { type: String, index: true },
    subject_id: { type: String, index: true },
    is_active: { type: Boolean, default: true, index: true },
    cards: [{ q: String, a: String, tags: [String] }],
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
FlashcardSetSchema.pre("save", function (next) {
  (this as any).updatedAt = new Date();
  next();
});
const FlashcardSet = model("flashcard_sets", FlashcardSetSchema);

const TutorMaterialSchema = new Schema(
  {
    slug: { type: String, unique: true, index: true },
    title: { type: String, required: true, index: true },
    subject_id: { type: String, required: true, index: true },
    grade: { type: String, index: true }, // "10","11","AL"
    type: { type: String, enum: ["pdf", "video", "link", "slides"], default: "pdf", index: true },
    url: { type: String, required: true },
    description: String,
    tags: [String],
    is_active: { type: Boolean, default: true, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
TutorMaterialSchema.pre("save", function (next) {
  (this as any).updatedAt = new Date();
  next();
});
const TutorMaterial = model("tutor_materials", TutorMaterialSchema);

// ---------- Seeds ----------
const SUBJECTS = [
  { slug: "mathematics", name: "mathematics", display_name: "Mathematics", sort_order: 1 },
  { slug: "physics",     name: "physics",     display_name: "Physics",     sort_order: 2 },
];

const QUIZ_SEEDS: Array<{
  slug: string;
  title: string;
  subjectSlug: string;
  grade: string;
  time_limit_sec?: number;
  questions: QuizQuestion[];
}> = [
  {
    slug: "algebra-linear-equations-g10",
    title: "Algebra — Linear Equations (Grade 10)",
    subjectSlug: "mathematics",
    grade: "10",
    time_limit_sec: 900,
    questions: [
      {
        q: "Solve 2x + 5 = 17",
        options: ["5", "6", "7", "8"],
        correctIndex: 1,
        explanation: "2x = 12 → x = 6",
        difficulty: "easy",
        tags: ["algebra", "linear"],
      },
      {
        q: "Solve 3x - 4 = 2x + 5",
        options: ["9", "7", "5", "1"],
        correctIndex: 3,
        explanation: "3x - 2x = 5 + 4 → x = 9",
        difficulty: "easy",
        tags: ["algebra", "linear"],
      },
      {
        q: "If x + y = 10 and x - y = 2, find x.",
        options: ["4", "5", "6", "8"],
        correctIndex: 2,
        explanation: "Add equations: 2x = 12 → x = 6",
        difficulty: "medium",
        tags: ["simultaneous"],
      },
    ],
  },
  {
    slug: "trigonometry-basics-g11",
    title: "Trigonometry — Basics (Grade 11)",
    subjectSlug: "mathematics",
    grade: "11",
    time_limit_sec: 900,
    questions: [
      {
        q: "sin(30°) equals",
        options: ["0.5", "√3/2", "1", "√2/2"],
        correctIndex: 0,
        explanation: "sin 30° = 1/2.",
        tags: ["trig"],
      },
      {
        q: "In a right triangle, tan θ equals?",
        options: ["hypotenuse/opposite", "opposite/adjacent", "adjacent/opposite", "1/cos θ"],
        correctIndex: 1,
        explanation: "tan θ = opposite / adjacent.",
        tags: ["trig", "ratios"],
      },
    ],
  },
  {
    slug: "physics-kinematics-g11",
    title: "Physics — Kinematics (Grade 11)",
    subjectSlug: "physics",
    grade: "11",
    time_limit_sec: 1200,
    questions: [
      {
        q: "Displacement after constant velocity v for time t is:",
        options: ["s = ut + 1/2 at^2", "s = vt", "v = u + at", "KE = 1/2 mv^2"],
        correctIndex: 1,
        explanation: "Constant velocity v → s = v·t.",
        difficulty: "easy",
        tags: ["kinematics"],
      },
      {
        q: "If u=0, a=2 m/s², t=3 s, then v = ?",
        options: ["2 m/s", "3 m/s", "5 m/s", "6 m/s"],
        correctIndex: 3,
        explanation: "v = u + at = 0 + 2·3 = 6 m/s.",
        tags: ["kinematics"],
      },
    ],
  },
];

const FLASHCARD_SETS = [
  {
    slug: "algebra-basics-fc",
    title: "Algebra Basics",
    subjectSlug: "mathematics",
    cards: [
      { q: "Solve 2x=10", a: "x=5", tags: ["algebra"] },
      { q: "Expand (a+b)^2", a: "a^2 + 2ab + b^2", tags: ["algebra", "binomial"] },
      { q: "Factor x^2 - 9", a: "(x-3)(x+3)", tags: ["factorization"] },
    ],
  },
  {
    slug: "trigonometry-identities-fc",
    title: "Trigonometry Identities",
    subjectSlug: "mathematics",
    cards: [
      { q: "sin^2 θ + cos^2 θ =", a: "1", tags: ["trig", "identity"] },
      { q: "tan θ =", a: "sin θ / cos θ", tags: ["trig", "ratio"] },
    ],
  },
  {
    slug: "physics-units-fc",
    title: "Physics Units",
    subjectSlug: "physics",
    cards: [
      { q: "Unit of Force", a: "Newton (N)", tags: ["units"] },
      { q: "Unit of Work", a: "Joule (J)", tags: ["units"] },
    ],
  },
];

const TUTOR_MATERIALS = [
  {
    slug: "g10-algebra-cheatsheet",
    title: "Grade 10 Algebra Cheat Sheet (PDF)",
    subjectSlug: "mathematics",
    grade: "10",
    type: "pdf",
    url: `${PUBLIC_BASE_URL}/uploads/tutor-materials/g10-algebra-cheatsheet.pdf`,
    description: "Key formulas and worked examples for linear equations and factorization.",
    tags: ["algebra", "grade10", "cheatsheet"],
  },
  {
    slug: "g11-trigonometry-formulas",
    title: "Grade 11 Trigonometry Formula Sheet (PDF)",
    subjectSlug: "mathematics",
    grade: "11",
    type: "pdf",
    url: `${PUBLIC_BASE_URL}/uploads/tutor-materials/g11-trig-formulas.pdf`,
    description: "Common trigonometric identities with triangle diagrams.",
    tags: ["trig", "grade11"],
  },
  {
    slug: "physics-kinematics-notes",
    title: "Physics Kinematics Notes (Video)",
    subjectSlug: "physics",
    grade: "11",
    type: "video",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Velocity, displacement, and acceleration basics + solved problems.",
    tags: ["physics", "kinematics"],
  },
];

// ---------- Helpers ----------
async function upsertSubject(slug: string, display_name: string, sort_order = 0) {
  const doc = await Subject.findOneAndUpdate(
    { slug },
    {
      $set: {
        slug,
        name: slug,
        display_name,
        is_active: true,
        sort_order,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { new: true, upsert: true }
  ).lean();
  return doc!;
}
async function mapSubjectSlugToId(slug: string): Promise<string> {
  const doc = await Subject.findOne({ slug }).lean();
  if (!doc?._id) throw new Error(`Subject not found for slug="${slug}"`);
  return String(doc._id);
}

// ---------- Main ----------
async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected →", MONGO_URI);

  // subjects
  for (const s of SUBJECTS) {
    await upsertSubject(s.slug, s.display_name, s.sort_order);
    console.log(`Subject ready: ${s.slug}`);
  }

  // quizzes
  for (const q of QUIZ_SEEDS) {
    const subject_id = await mapSubjectSlugToId(q.subjectSlug);
    await Quiz.updateOne(
      { slug: q.slug },
      {
        $set: {
          title: q.title,
          subject_id,
          grade: q.grade,
          is_active: true,
          time_limit_sec: q.time_limit_sec ?? 900,
          questions: q.questions,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log(`Upserted quiz: ${q.slug}`);
  }

  // flashcards
  for (const s of FLASHCARD_SETS) {
    const subject_id = await mapSubjectSlugToId(s.subjectSlug);
    await FlashcardSet.updateOne(
      { slug: s.slug },
      {
        $set: {
          title: s.title,
          subject_id,
          is_active: true,
          cards: s.cards,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log(`Upserted flashcard set: ${s.slug}`);
  }

  // tutor materials
  for (const m of TUTOR_MATERIALS) {
    const subject_id = await mapSubjectSlugToId(m.subjectSlug);
    await TutorMaterial.updateOne(
      { slug: m.slug },
      {
        $set: {
          title: m.title,
          subject_id,
          grade: m.grade,
          type: m.type,
          url: m.url,
          description: m.description,
          tags: m.tags,
          is_active: true,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log(`Upserted tutor material: ${m.slug}`);
  }

  console.log("✅ Seeding complete.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
