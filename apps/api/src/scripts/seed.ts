/**
 * apps/api/scripts/seed.ts  (Seeder v4 - slug-only)
 *
 * Seeds subjects, quizzes, flashcard_sets.
 * - Uses only `slug` as identity (unique)
 * - NEVER writes `name`, so unique name_1 (if it exists) won't trip us
 * - Idempotent upserts by `slug`
 *
 * Run:
 *   cd "<repo>\\apps\\api"
 *   $env:MONGO_URI="mongodb+srv://adwello204_db_user:Adwello2025@cluster0.n7krmxe.mongodb.net/mathmentor?retryWrites=true&w=majority"
 *   npx tsx scripts/seed.ts
 */

import "dotenv/config";
import mongoose, { Schema, model } from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://adwello204_db_user:Adwello2025@cluster0.n7krmxe.mongodb.net/mathmentor?retryWrites=true&w=majority://127.0.0.1:27017/mathmentormongodb+srv://adwello204_db_user:Adwello2025@cluster0.n7krmxe.mongodb.net/mathmentor?retryWrites=true&w=majoritymongodb+srv://adwello204_db_user:Adwello2025@cluster0.n7krmxe.mongodb.net/mathmentor?retryWrites=true&w=majority";

console.log("Seeder v4 (slug-only) starting…");

/* ------------------------------ Models ------------------------------ */
const SubjectSchema = new Schema(
  {
    slug: { type: String, unique: true, index: true }, // authoritative key
    display_name: { type: String, index: true },
    is_active: { type: Boolean, default: true, index: true },
    sort_order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
SubjectSchema.pre("save", function (next) { (this as any).updatedAt = new Date(); next(); });
const Subject = model("subjects", SubjectSchema);

type QuizQuestion = {
  q: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
};

const QuizSchema = new Schema(
  {
    slug: { type: String, unique: true, index: true },
    title: { type: String, required: true, index: true },
    subject_id: { type: String, required: true, index: true }, // store as string
    grade: { type: String, index: true },
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
QuizSchema.pre("save", function (next) { (this as any).updatedAt = new Date(); next(); });
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
FlashcardSetSchema.pre("save", function (next) { (this as any).updatedAt = new Date(); next(); });
const FlashcardSet = model("flashcard_sets", FlashcardSetSchema);

/* ------------------------------ Seeds ------------------------------- */
const SUBJECTS = [
  { slug: "mathematics", display_name: "Mathematics", sort_order: 1 },
  { slug: "physics",     display_name: "Physics",     sort_order: 2 },
];

const QUIZ_SEEDS: Array<{
  slug: string; title: string; subjectSlug: string; grade: string; time_limit_sec?: number; questions: QuizQuestion[];
}> = [
  {
    slug: "algebra-linear-equations-g10",
    title: "Algebra — Linear Equations (Grade 10)",
    subjectSlug: "mathematics",
    grade: "10",
    time_limit_sec: 900,
    questions: [
      { q: "Solve 2x + 5 = 17", options: ["5","6","7","8"], correctIndex: 1, explanation: "2x=12 → x=6", difficulty: "easy", tags: ["algebra","linear"] },
      { q: "Solve 3x - 4 = 2x + 5", options: ["9","7","5","1"], correctIndex: 3, explanation: "3x-2x=5+4 → x=9", difficulty: "easy", tags: ["algebra","linear"] },
      { q: "If x+y=10 and x−y=2, find x.", options: ["4","5","6","8"], correctIndex: 2, explanation: "2x=12 → x=6", difficulty: "medium", tags: ["simultaneous"] },
    ],
  },
  {
    slug: "trigonometry-basics-g11",
    title: "Trigonometry — Basics (Grade 11)",
    subjectSlug: "mathematics",
    grade: "11",
    time_limit_sec: 900,
    questions: [
      { q: "sin(30°) equals", options: ["0.5","√3/2","1","√2/2"], correctIndex: 0, explanation: "sin 30° = 1/2.", tags: ["trig"] },
      { q: "In a right triangle, tan θ equals?", options: ["hypotenuse/opposite","opposite/adjacent","adjacent/opposite","1/cos θ"], correctIndex: 1, explanation: "tan θ = opposite/adjacent.", tags: ["trig","ratios"] },
    ],
  },
  {
    slug: "physics-kinematics-g11",
    title: "Physics — Kinematics (Grade 11)",
    subjectSlug: "physics",
    grade: "11",
    time_limit_sec: 1200,
    questions: [
      { q: "Displacement after constant velocity v for time t is:", options: ["s=ut+½at²","s=vt","v=u+at","KE=½mv²"], correctIndex: 1, explanation: "Constant v → s=v·t.", difficulty: "easy", tags: ["kinematics"] },
      { q: "If u=0, a=2 m/s², t=3 s, then v = ?", options: ["2","3","5","6"], correctIndex: 3, explanation: "v=u+at=6 m/s.", tags: ["kinematics"] },
    ],
  },
];

const FLASHCARD_SETS = [
  {
    slug: "algebra-basics-fc",
    title: "Algebra Basics",
    subjectSlug: "mathematics",
    cards: [
      { q: "Solve 2x = 10", a: "x = 5", tags: ["algebra"] },
      { q: "Expand (a+b)^2", a: "a^2 + 2ab + b^2", tags: ["algebra","binomial"] },
      { q: "Factor x^2 − 9", a: "(x − 3)(x + 3)", tags: ["factorization"] },
    ],
  },
  {
    slug: "trigonometry-identities-fc",
    title: "Trigonometry Identities",
    subjectSlug: "mathematics",
    cards: [
      { q: "sin^2 θ + cos^2 θ =", a: "1", tags: ["trig","identity"] },
      { q: "tan θ =", a: "sin θ / cos θ", tags: ["trig","ratio"] },
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

/* ----------------------------- Utils -------------------------------- */
async function ensureUniqueSlug(collName: string) {
  try {
    const coll = mongoose.connection.db.collection(collName);
    await coll.createIndex({ slug: 1 }, { unique: true });
  } catch (e) {
    // ignore if already exists or perms restricted
  }
}

async function subjectIdFromSlug(slug: string): Promise<string> {
  const found = await Subject.findOne({ slug }).lean();
  if (!found?._id) throw new Error(`Subject not found: ${slug}`);
  return String(found._id);
}

/* ------------------------------ Main -------------------------------- */
async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected →", MONGO_URI);

  // Make sure slug is unique (we don’t care about `name`)
  await ensureUniqueSlug("subjects");
  await ensureUniqueSlug("quizzes");
  await ensureUniqueSlug("flashcard_sets");

  // Subjects: upsert by slug (do not touch `name`)
  for (const s of SUBJECTS) {
    await Subject.updateOne(
      { slug: s.slug },
      {
        $set: {
          display_name: s.display_name,
          is_active: true,
          sort_order: s.sort_order,
          updatedAt: new Date(),
        },
        $setOnInsert: { slug: s.slug, createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log(`Subject ready: ${s.slug}`);
  }

  // Quizzes
  for (const q of QUIZ_SEEDS) {
    const subject_id = await subjectIdFromSlug(q.subjectSlug);
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

  // Flashcard sets
  for (const fs of FLASHCARD_SETS) {
    const subject_id = await subjectIdFromSlug(fs.subjectSlug);
    await FlashcardSet.updateOne(
      { slug: fs.slug },
      {
        $set: {
          title: fs.title,
          subject_id,
          is_active: true,
          cards: fs.cards,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log(`Upserted flashcard set: ${fs.slug}`);
  }

  console.log("✅ Seeding complete.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
