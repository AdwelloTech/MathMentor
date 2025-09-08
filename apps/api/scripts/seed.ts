/**
 * Seed Mongo with demo data so the app shows real content.
 * Run with:  npm run seed
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose, { Schema, model } from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://adwello204_db_user:Adwello2025@cluster0.n7krmxe.mongodb.net/mathmentor?retryWrites=true&w=majority";

mongoose.set("strictQuery", false);

// ---- Schemas (mirror apps/api/src/index.ts) ----
const Subject = model(
  "Subject",
  new Schema(
    { name: String, code: String, color: String, is_active: { type: Boolean, default: true } },
    { timestamps: true }
  )
);

const GradeLevel = model(
  "GradeLevel",
  new Schema(
    { code: String, label: String, is_active: { type: Boolean, default: true } },
    { timestamps: true }
  )
);

const Profile = model(
  "Profile",
  new Schema(
    {
      user_id: { type: String, index: true },
      email: { type: String, index: true },
      full_name: String,
      avatar_url: String,
      role: { type: String, enum: ["student", "tutor", "admin"], default: "student" },
      plan: { type: String, default: "free" },
      is_premium: { type: Boolean, default: false },
      premium_until: { type: Date, default: null },
      tutorial_started: { type: Boolean, default: false },
      tutorial_completed: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

const FlashcardSet = model(
  "FlashcardSet",
  new Schema(
    {
      tutor_profile_id: String,
      title: String,
      subject_id: { type: Schema.Types.ObjectId, ref: "Subject" },
      grade_level_code: String,
      description: String,
      is_active: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

const Flashcard = model(
  "Flashcard",
  new Schema(
    { set_id: { type: Schema.Types.ObjectId, ref: "FlashcardSet" }, front_text: String, back_text: String, card_order: Number },
    { timestamps: true }
  )
);

const StudyNote = model(
  "StudyNote",
  new Schema(
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
  )
);

const TutorMaterial = model(
  "TutorMaterial",
  new Schema(
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
  )
);

const SessionBooking = model(
  "SessionBooking",
  new Schema(
    {
      student_id: String,
      tutor_id: String,
      subject_id: { type: Schema.Types.ObjectId, ref: "Subject" },
      starts_at: Date,
      ends_at: Date,
      status: { type: String, enum: ["pending", "confirmed", "cancelled", "completed"], default: "pending" },
      notes: String,
      // optional payment fields your UI reads:
      payment_amount: Number,
      payment_status: String,
      stripe_payment_intent_id: String,
      class_id: String,
      tutor_name: String,
      subject_name: String,
      price_per_session: Number,
    },
    { timestamps: true }
  )
);

// ---- helpers ----
const upsertOne = async (Model: any, where: any, set: any) => {
  const doc = await Model.findOneAndUpdate(where, { $set: set }, { upsert: true, new: true });
  return doc;
};

(async () => {
  console.log("🧩 Connecting to", MONGODB_URI);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log("✅ Connected");

  // 1) Subjects
  const subjects = [
    { name: "Mathematics", code: "MATH", color: "#2563EB" },
    { name: "Physics", code: "PHYS", color: "#059669" },
    { name: "Chemistry", code: "CHEM", color: "#D97706" },
  ];
  const subjectDocs: Record<string, any> = {};
  for (const s of subjects) {
    subjectDocs[s.code] = await upsertOne(Subject, { code: s.code }, s);
  }

  // 2) Grade levels
  const grades = [
    { code: "G08", label: "Grade 8" },
    { code: "G09", label: "Grade 9" },
    { code: "G10", label: "Grade 10" },
    { code: "G11", label: "Grade 11" },
    { code: "AL", label: "A/L" },
  ];
  for (const g of grades) await upsertOne(GradeLevel, { code: g.code }, g);

  // 3) Profiles (student + tutor)
  const studentEmail = "jackshanan95@gmail.com";
  const studentUserId = "jackshanan95gmailcom-id"; // matches your earlier logs
  const student = await upsertOne(
    Profile,
    { email: studentEmail },
    {
      user_id: studentUserId,
      email: studentEmail,
      full_name: "jackshanan vignarajah",
      role: "student",
      plan: "free",
      tutorial_started: true,
      tutorial_completed: false,
    }
  );

  const tutor = await upsertOne(
    Profile,
    { email: "tutor@example.com" },
    {
      user_id: "tutor-example-id",
      email: "tutor@example.com",
      full_name: "Ms. Kumar",
      role: "tutor",
      plan: "paid",
      is_premium: true,
    }
  );

  // 4) Study Notes
  await StudyNote.deleteMany({});
  await StudyNote.insertMany([
    {
      title: "Algebra Basics",
      description: "Linear equations and inequalities (quick revision).",
      subject_id: subjectDocs.MATH._id,
      grade_level_code: "G10",
      file_url: "https://example.com/notes/algebra-basics.pdf",
      is_active: true,
    },
    {
      title: "Newton’s Laws Summary",
      description: "Concise notes with examples.",
      subject_id: subjectDocs.PHYS._id,
      grade_level_code: "G11",
      file_url: "https://example.com/notes/newton-laws.pdf",
      is_active: true,
    },
  ]);

  // 5) Tutor Materials (public + assigned to this student)
  await TutorMaterial.deleteMany({});
  await TutorMaterial.insertMany([
    {
      title: "Trigonometry Worksheet",
      description: "Sine, Cosine, Tangent practice problems.",
      subject_id: subjectDocs.MATH._id,
      file_url: "https://example.com/materials/trig-worksheet.pdf",
      is_active: true,
      student_ids: [], // public
    },
    {
      title: "Kinematics Problems Set",
      description: "SUVAT problems for practice.",
      subject_id: subjectDocs.PHYS._id,
      file_url: "https://example.com/materials/kinematics.pdf",
      is_active: true,
      student_ids: [studentUserId], // visible to this student
    },
  ]);

  // 6) Flashcards
  await FlashcardSet.deleteMany({});
  await Flashcard.deleteMany({});
  const set = await FlashcardSet.create({
    tutor_profile_id: tutor.user_id,
    title: "Quadratic Equations",
    subject_id: subjectDocs.MATH._id,
    grade_level_code: "G11",
    description: "Roots, discriminant, vertex form",
    is_active: true,
  });
  await Flashcard.insertMany(
    [
      ["What is the quadratic formula?", "x = (-b ± √(b²−4ac)) / (2a)"],
      ["Discriminant > 0 means…", "Two distinct real roots"],
      ["Discriminant = 0 means…", "One real root (double root)"],
      ["Discriminant < 0 means…", "Complex roots"],
    ].map(([front_text, back_text], i) => ({
      set_id: set._id,
      front_text,
      back_text,
      card_order: i + 1,
    }))
  );

  // 7) Future session bookings (so lists render)
  await SessionBooking.deleteMany({});
  const now = new Date();
  const oneHour = 60 * 60 * 1000;
  const sessions = [
    {
      student_id: student.user_id,
      tutor_id: tutor.user_id,
      subject_id: subjectDocs.MATH._id,
      starts_at: new Date(now.getTime() + 2 * oneHour),
      ends_at: new Date(now.getTime() + 3 * oneHour),
      status: "confirmed",
      notes: "Algebra practice",
      payment_amount: 1500,
      payment_status: "paid",
      class_id: "MATH-ALG-101",
      tutor_name: tutor.full_name,
      subject_name: "Mathematics",
      price_per_session: 1500,
    },
    {
      student_id: student.user_id,
      tutor_id: tutor.user_id,
      subject_id: subjectDocs.PHYS._id,
      starts_at: new Date(now.getTime() + 26 * oneHour),
      ends_at: new Date(now.getTime() + 27 * oneHour),
      status: "pending",
      notes: "Newton laws recap",
      payment_amount: 1800,
      payment_status: "pending",
      class_id: "PHYS-FUN-201",
      tutor_name: tutor.full_name,
      subject_name: "Physics",
      price_per_session: 1800,
    },
  ];
  await SessionBooking.insertMany(sessions);

  console.log("✅ Seed complete.");
  await mongoose.disconnect();
  process.exit(0);
})().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
