import express from 'express';
import { crudRouter } from './crud.js';

// Import all models
import AdminActivityLog from '../db/models/AdminActivityLog.js';
import AdminCredentials from '../db/models/AdminCredentials.js';
import AdminDashboardStats from '../db/models/AdminDashboardStats.js';
import AdminNotifications from '../db/models/AdminNotifications.js';
import AdminReports from '../db/models/AdminReports.js';
import AdminSessions from '../db/models/AdminSessions.js';
import Bookings from '../db/models/Bookings.js';
import ClassBookings from '../db/models/ClassBookings.js';
import ClassEnrollments from '../db/models/ClassEnrollments.js';
import Classes from '../db/models/Classes.js';
import ClassReviews from '../db/models/ClassReviews.js';
import ClassTypes from '../db/models/ClassTypes.js';
import Flashcards from '../db/models/Flashcards.js';
import FlashcardSets from '../db/models/FlashcardSets.js';
import GradeLevels from '../db/models/GradeLevels.js';
import IdVerifications from '../db/models/IdVerifications.js';
import InstantRequests from '../db/models/InstantRequests.js';
import JitsiMeetings from '../db/models/JitsiMeetings.js';
import NoteSubjects from '../db/models/NoteSubjects.js';
import PackagePricing from '../db/models/PackagePricing.js';
import PaymentHistory from '../db/models/PaymentHistory.js';
import ProfileImages from '../db/models/ProfileImages.js';
import Profiles from '../db/models/Profiles.js';
import QuizAnswers from '../db/models/QuizAnswers.js';
import QuizAttempts from '../db/models/QuizAttempts.js';
import QuizPdfs from '../db/models/QuizPdfs.js';
import QuizQuestions from '../db/models/QuizQuestions.js';
import Quizzes from '../db/models/Quizzes.js';
import StudentAnswers from '../db/models/StudentAnswers.js';
import StudentQuizGenerations from '../db/models/StudentQuizGenerations.js';
import StudyNotes from '../db/models/StudyNotes.js';
import Subjects from '../db/models/Subjects.js';
import Subscriptions from '../db/models/Subscriptions.js';
import TutorApplications from '../db/models/TutorApplications.js';
import TutorAvailability from '../db/models/TutorAvailability.js';
import TutorClasses from '../db/models/TutorClasses.js';
import TutorNoteViews from '../db/models/TutorNoteViews.js';
import TutorNotes from '../db/models/TutorNotes.js';

// Add more as needed...

const router = express.Router();

// Register CRUD endpoints for each model
router.use('/admin_activity_log', crudRouter(AdminActivityLog));
router.use('/admin_credentials', crudRouter(AdminCredentials));
router.use('/admin_dashboard_stats', crudRouter(AdminDashboardStats));
router.use('/admin_notifications', crudRouter(AdminNotifications));
router.use('/admin_reports', crudRouter(AdminReports));
router.use('/admin_sessions', crudRouter(AdminSessions));
router.use('/bookings', crudRouter(Bookings));
router.use('/class_bookings', crudRouter(ClassBookings));
router.use('/class_enrollments', crudRouter(ClassEnrollments));
router.use('/classes', crudRouter(Classes));
router.use('/class_reviews', crudRouter(ClassReviews));
router.use('/class_types', crudRouter(ClassTypes));
router.use('/flashcards', crudRouter(Flashcards));
router.use('/flashcard_sets', crudRouter(FlashcardSets));
router.use('/grade_levels', crudRouter(GradeLevels));
router.use('/id_verifications', crudRouter(IdVerifications));
router.use('/instant_requests', crudRouter(InstantRequests));
router.use('/jitsi_meetings', crudRouter(JitsiMeetings));
router.use('/note_subjects', crudRouter(NoteSubjects));
router.use('/package_pricing', crudRouter(PackagePricing));
router.use('/payment_history', crudRouter(PaymentHistory));
router.use('/profile_images', crudRouter(ProfileImages));
router.use('/profiles', crudRouter(Profiles));
router.use('/quiz_answers', crudRouter(QuizAnswers));
router.use('/quiz_attempts', crudRouter(QuizAttempts));
router.use('/quiz_pdfs', crudRouter(QuizPdfs));
router.use('/quiz_questions', crudRouter(QuizQuestions));
router.use('/quizzes', crudRouter(Quizzes));
router.use('/student_answers', crudRouter(StudentAnswers));
router.use('/student_quiz_generations', crudRouter(StudentQuizGenerations));
router.use('/study_notes', crudRouter(StudyNotes));
router.use('/subjects', crudRouter(Subjects));
router.use('/subscriptions', crudRouter(Subscriptions));
router.use('/tutor_applications', crudRouter(TutorApplications));
router.use('/tutor_availability', crudRouter(TutorAvailability));
router.use('/tutor_classes', crudRouter(TutorClasses));
router.use('/tutor_note_views', crudRouter(TutorNoteViews));
router.use('/tutor_notes', crudRouter(TutorNotes));

// Example of a custom route (keep your custom logic here)
router.get('/grade-levels/active', async (_req, res, next) => {
  try {
    res.json(await GradeLevels.find({ is_active: true }).sort({ sort_order: 1 }).lean());
  } catch (e) {
    next(e);
  }
});

// Custom search route for study notes
router.get('/search_study_notes', async (req, res, next) => {
  try {
    const { q } = req.query;
    const query = q
      ? {
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { content: { $regex: q, $options: 'i' } }
          ]
        }
      : {};

    const notes = await StudyNotes.find(query).sort({ created_at: -1 }).lean();
    res.json(notes);
  } catch (e) {
    next(e);
  }
});

router.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

export { router };
