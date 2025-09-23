import express from "express";
import { setupMiddleware, setupErrorHandler, connectWithRetry } from "./core";

// Import all route modules
import * as authRoutes from "./auth";
import * as contentRoutes from "./content";
import * as sessionRoutes from "./session";
import * as studentRoutes from "./student";
import * as tutorRoutes from "./tutor";
import * as adminRoutes from "./admin";
import * as paymentRoutes from "./payment";

const app = express();

// Setup middleware
setupMiddleware(app);

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Register all routes

// Admin auth routes
app.post("/api/admin/upsert", authRoutes.upsertAdmin);
app.post("/api/admin/verify_credentials", authRoutes.verifyAdminCredentials);

// Profile routes
app.patch("/api/profiles/:id", authRoutes.updateProfile);
app.get("/api/profiles", authRoutes.getProfiles);
app.get("/api/profiles/:id", authRoutes.getProfile);
app.post("/api/profiles", authRoutes.createProfile);

// Content routes
app.get("/api/subjects", contentRoutes.getSubjects);
app.get("/api/note_subjects", contentRoutes.getNoteSubjects);
app.post("/api/subjects", contentRoutes.createSubject);
app.get("/api/grade_levels", contentRoutes.getGradeLevels);

app.get("/api/flashcard_sets", contentRoutes.getFlashcardSets);
app.post("/api/flashcard_sets", contentRoutes.createFlashcardSet);
app.get("/api/flashcards", contentRoutes.getFlashcards);
app.post("/api/flashcards", contentRoutes.createFlashcards);
app.patch("/api/flashcards/:id", contentRoutes.updateFlashcard);

app.get("/api/study_notes", contentRoutes.getStudyNotes);
app.post("/api/search_study_notes", contentRoutes.searchStudyNotes);
app.get("/api/study-notes/search", contentRoutes.searchStudyNotesGet);
app.post("/api/study_notes/:id/views", contentRoutes.incrementStudyNoteViews);
app.post("/api/study_notes/:id/downloads", contentRoutes.incrementStudyNoteDownloads);

app.get("/api/tutor_materials", contentRoutes.getTutorMaterials);
app.get("/api/get_student_tutor_materials", contentRoutes.getStudentTutorMaterials);
app.get("/api/get_student_tutor_material_by_id/:id", contentRoutes.getStudentTutorMaterialById);
app.post("/api/increment_tutor_note_download_count", contentRoutes.incrementTutorNoteDownloadCount);
app.post("/api/tutor_materials", contentRoutes.createTutorMaterial);

app.get("/api/quizzes", contentRoutes.getQuizzes);
app.post("/api/quizzes", contentRoutes.createQuiz);
app.get("/api/quizzes/available", contentRoutes.getAvailableQuizzes);
app.post("/api/quizzes/:id/attempts", contentRoutes.startQuizAttempt);

// Session routes
app.post("/api/session_bookings", sessionRoutes.createSessionBooking);
app.get("/api/session_bookings", sessionRoutes.getSessionBookings);

app.get("/api/instant/subjects", sessionRoutes.getInstantSubjects);
app.get("/api/instant/tutors", sessionRoutes.getInstantTutors);
app.post("/api/instant/requests", sessionRoutes.createInstantRequest);

// Student routes
app.get("/api/student/dashboard/summary", studentRoutes.getStudentDashboard);
app.get("/api/tutorial_status", studentRoutes.getTutorialStatus);
app.post("/api/tutorial_status", studentRoutes.updateTutorialStatus);

// Tutor routes
app.get("/api/tutor/dashboard/summary", tutorRoutes.getTutorDashboard);

// Admin routes
app.get("/api/admin/dashboard/summary", adminRoutes.getAdminDashboardSummary);
app.get("/api/admin/dashboard/recent", adminRoutes.getAdminDashboardRecent);

// Payment routes
app.get("/api/check_premium_access", paymentRoutes.checkPremiumAccess);
app.get("/api/package_pricing", paymentRoutes.getPackagePricing);

// Setup error handler
setupErrorHandler(app);

const PORT = Number(process.env.PORT || 8080);

// Connect to database and start server
connectWithRetry().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Modular API listening on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
