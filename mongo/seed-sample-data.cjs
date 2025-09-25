// Run with: node seed-sample-data.cjs
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") }) || dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  "mongodb+srv://adwello204_db_user:Adwello2025@cluster0.n7krmxe.mongodb.net/mathmentor?retryWrites=true&w=majority";

async function createSampleData() {
  try {
    console.log("[seed-sample-data] Connecting to", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    // Create a sample tutor profile if none exists
    const existingProfile = await db
      .collection("profiles")
      .findOne({ role: "tutor" });
    let tutorId;

    if (!existingProfile) {
      const profileResult = await db.collection("profiles").insertOne({
        _id: new mongoose.Types.ObjectId().toString(),
        email: "sample-tutor@mathmentor.com",
        full_name: "Sample Tutor",
        role: "tutor",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      tutorId = profileResult.insertedId.toString();
      console.log(
        `[seed-sample-data] Created sample tutor profile: ${tutorId}`
      );
    } else {
      tutorId = existingProfile._id;
      console.log(
        `[seed-sample-data] Using existing tutor profile: ${tutorId}`
      );
    }

    // Create sample flashcard sets
    const flashcardSets = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        tutor_id: tutorId,
        title: "Basic Algebra",
        subject: "Mathematics",
        topic: "Linear Equations",
        grade_level: "Grade 9",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        tutor_id: tutorId,
        title: "Geometry Basics",
        subject: "Mathematics",
        topic: "Triangles and Angles",
        grade_level: "Grade 8",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        tutor_id: tutorId,
        title: "Chemistry Elements",
        subject: "Chemistry",
        topic: "Periodic Table",
        grade_level: "Grade 10",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Insert flashcard sets
    const flashcardSetsResult = await db
      .collection("flashcard_sets")
      .insertMany(flashcardSets);
    console.log(
      `[seed-sample-data] Created ${flashcardSetsResult.insertedCount} flashcard sets`
    );

    // Create sample flashcards for each set
    const flashcards = [];
    flashcardSets.forEach((set, setIndex) => {
      const sampleCards = [
        { front_text: "What is 2x + 3 = 7?", back_text: "x = 2" },
        { front_text: "What is the slope of y = 2x + 1?", back_text: "2" },
        {
          front_text: "What is the y-intercept of y = 3x - 4?",
          back_text: "-4",
        },
      ];

      sampleCards.forEach((card, cardIndex) => {
        flashcards.push({
          _id: new mongoose.Types.ObjectId().toString(),
          set_id: set._id,
          front_text: card.front_text,
          back_text: card.back_text,
          card_order: cardIndex,
          created_at: new Date(),
          updated_at: new Date(),
        });
      });
    });

    const flashcardsResult = await db
      .collection("flashcards")
      .insertMany(flashcards);
    console.log(
      `[seed-sample-data] Created ${flashcardsResult.insertedCount} flashcards`
    );

    // Create sample quizzes
    const quizzes = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        tutor_id: tutorId,
        title: "Algebra Quiz 1",
        description: "Basic algebra concepts",
        subject: "Mathematics",
        grade_level: "Grade 9",
        time_limit_minutes: 30,
        total_questions: 5,
        total_points: 50,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        tutor_id: tutorId,
        title: "Geometry Quiz 1",
        description: "Basic geometry concepts",
        subject: "Mathematics",
        grade_level: "Grade 8",
        time_limit_minutes: 25,
        total_questions: 4,
        total_points: 40,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        tutor_id: tutorId,
        title: "Chemistry Elements Quiz",
        description: "Periodic table basics",
        subject: "Chemistry",
        grade_level: "Grade 10",
        time_limit_minutes: 20,
        total_questions: 6,
        total_points: 60,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const quizzesResult = await db.collection("quizzes").insertMany(quizzes);
    console.log(
      `[seed-sample-data] Created ${quizzesResult.insertedCount} quizzes`
    );

    // Create sample quiz questions
    const quizQuestions = [];
    quizzes.forEach((quiz, quizIndex) => {
      const sampleQuestions = [
        {
          text: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          correct_answer: "4",
        },
        {
          text: "What is the capital of France?",
          options: ["London", "Paris", "Berlin", "Madrid"],
          correct_answer: "Paris",
        },
        {
          text: "What is the chemical symbol for Gold?",
          options: ["Go", "Gd", "Au", "Ag"],
          correct_answer: "Au",
        },
      ];

      sampleQuestions.forEach((question, questionIndex) => {
        quizQuestions.push({
          _id: new mongoose.Types.ObjectId().toString(),
          quiz_id: quiz._id,
          text: question.text,
          options: question.options,
          correct_answer: question.correct_answer,
          created_at: new Date(),
          updated_at: new Date(),
        });
      });
    });

    const quizQuestionsResult = await db
      .collection("quiz_questions")
      .insertMany(quizQuestions);
    console.log(
      `[seed-sample-data] Created ${quizQuestionsResult.insertedCount} quiz questions`
    );

    console.log("[seed-sample-data] ✅ Done.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("[seed-sample-data] ❌ Error:", err);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
}

createSampleData();

