import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useAdmin } from "./contexts/AdminContext";
import Math3DSpinner from "./components/ui/Math3DSpinner";

// Auth pages - load immediately as they're entry points
import LoginPage from "./pages/auth/LoginPage";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";

// Layouts - load immediately
import DashboardLayout from "./components/layout/DashboardLayout";
import AdminLayout from "./components/layout/AdminLayout";
import StudentLayout from "./components/layout/StudentLayout";
import ParentLayout from "./components/layout/ParentLayout";
import TutorLayout from "./components/layout/TutorLayout";

// Landing pages - load immediately as they're entry points
import LandingHome from "./pages/landing/LandingHome";
import LandingAbout from "./pages/landing/LandingAbout";
import LandingStudent from "./pages/landing/LandingStudent";
import LandingTutor from "./pages/landing/LandingTutor";

// Lazy load all other pages for code splitting
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminDashboard = lazy(() => import("./pages/dashboards/AdminDashboard"));
const ManageStudentsPage = lazy(() => import("./pages/admin/ManageStudentsPage"));
const ManageTutorsPage = lazy(() => import("./pages/admin/ManageTutorsPage"));
const ManageTutorApplicationsPage = lazy(() => import("./pages/admin/ManageTutorApplicationsPage"));
const ManageIDVerificationsPage = lazy(() => import("./pages/admin/ManageIDVerificationsPage"));
const ManageQuizPdfsPage = lazy(() => import("./pages/admin/ManageQuizPdfsPage"));
const AdminManageFlashcardsPage = lazy(() => import("./pages/admin/ManageFlashcardsPage"));
const ManageSubjectsPage = lazy(() => import("./pages/admin/ManageSubjectsPage"));

const PrincipalDashboard = lazy(() => import("./pages/dashboards/PrincipalDashboard"));
const TeacherDashboard = lazy(() => import("./pages/dashboards/TeacherDashboard"));
const ScheduleClassPage = lazy(() => import("./components/classScheduling/ClassSchedulingPage"));
const TutorManageClassesPage = lazy(() => import("./pages/TutorManageClassesPage"));

const QuizManagementPage = lazy(() => import("./pages/quiz/QuizManagementPage"));
const CreateQuizPage = lazy(() => import("./pages/quiz/CreateQuizPage"));
const QuizViewPage = lazy(() => import("./pages/quiz/QuizViewPage"));
const EditQuizPage = lazy(() => import("./pages/quiz/EditQuizPage"));
const QuizResponsesPage = lazy(() => import("./pages/quiz/QuizResponsesPage"));
const QuizAttemptReviewPage = lazy(() => import("./pages/quiz/QuizAttemptReviewPage"));
const StudentQuizDashboard = lazy(() => import("./pages/student/StudentQuizDashboard"));
const StudentAIGenerateQuizPage = lazy(() => import("./pages/student/StudentAIGenerateQuizPage"));
const TakeQuizPage = lazy(() => import("./pages/student/TakeQuizPage"));
const QuizResultsPage = lazy(() => import("./pages/student/QuizResultsPage"));

const ManageMaterialsPage = lazy(() => import("./pages/tutor/ManageMaterialsPage"));
const ManageFlashcardsPage = lazy(() => import("./pages/tutor/ManageFlashcardsPage"));
const CreateEditFlashcardSetPage = lazy(() => import("./pages/tutor/CreateEditFlashcardSetPage"));
const TutorRatingsPage = lazy(() => import("./pages/tutor/TutorRatingsPage"));
const FlashcardsListPage = lazy(() => import("./pages/student/FlashcardsListPage"));
const FlashcardStudyPage = lazy(() => import("./pages/student/FlashcardStudyPage"));

const StudentDashboard = lazy(() => import("./pages/dashboards/StudentDashboard"));
const BookSessionPage = lazy(() => import("./pages/BookSessionPage"));
const BookConsultationPage = lazy(() => import("./pages/BookConsultationPage"));
const ManageSessionsPage = lazy(() => import("./pages/ManageSessionsPage"));
const InstantSessionPage = lazy(() => import("./pages/student/InstantSessionPage"));
const PackagesPage = lazy(() => import("./pages/PackagesPage"));
const NotesPage = lazy(() => import("./pages/notes/NotesPage"));
const CreateNotePage = lazy(() => import("./pages/notes/CreateNotePage"));
const TutorMaterialsPage = lazy(() => import("./pages/student/TutorMaterialsPage"));

const ParentDashboardOverview = lazy(() => import("./pages/parent/ParentDashboardOverview"));
const ParentQuizProgress = lazy(() => import("./pages/parent/ParentQuizProgress"));
const ParentSessionProgress = lazy(() => import("./pages/parent/ParentSessionProgress"));
const ParentManageStudents = lazy(() => import("./pages/parent/ParentManageStudents"));

const HRDashboard = lazy(() => import("./pages/dashboards/HRDashboard"));
const FinanceDashboard = lazy(() => import("./pages/dashboards/FinanceDashboard"));
const SupportDashboard = lazy(() => import("./pages/dashboards/SupportDashboard"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const TutorApplicationPage = lazy(() => import("./pages/TutorApplicationPage"));
const IDVerificationPage = lazy(() => import("./pages/IDVerificationPage"));

function App() {
  const { user, loading, profile } = useAuth();
  const { isAdminLoggedIn, loading: adminLoading } = useAdmin();
  const location = useLocation();

  // Check if user is fully authenticated (both user and profile exist)
  const isUserAuthenticated = user && profile;

  // Show loading spinner while checking authentication
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Math3DSpinner size="xl" text="Loading..." />
      </div>
    );
  }

  // If on admin login, always show it (it's a public route)
  if (location.pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Math3DSpinner size="xl" text="Loading page..." />
        </div>
      }>
        <Routes>
        {/* Public Landing Page routes - always accessible */}
        <Route path="/" element={<LandingHome />} />
        <Route path="/about" element={<LandingAbout />} />
        <Route path="/for-students" element={<LandingStudent />} />
        <Route path="/for-tutors" element={<LandingTutor />} />
        
        {/* Public auth routes - always accessible */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Handle authentication-based routing for protected routes */}
        {!isUserAuthenticated && !isAdminLoggedIn ? (
          // Redirect to login for protected routes when no user is logged in
          <>
            <Route path="/dashboard" element={<Navigate to="/login" replace />} />
            <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
            <Route path="/student/*" element={<Navigate to="/login" replace />} />
            <Route path="/tutor/*" element={<Navigate to="/login" replace />} />
            <Route path="/parent/*" element={<Navigate to="/login" replace />} />
            <Route path="/teacher/*" element={<Navigate to="/login" replace />} />
            <Route path="/principal/*" element={<Navigate to="/login" replace />} />
            <Route path="/hr/*" element={<Navigate to="/login" replace />} />
            <Route path="/finance/*" element={<Navigate to="/login" replace />} />
            <Route path="/support/*" element={<Navigate to="/login" replace />} />
            {/* Allow 404 for other routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          // Show protected routes when user is authenticated
          <>
            {/* Main application routes */}
            <Route path="/dashboard-app" element={<DashboardLayout />}>
              <Route index element={<DashboardRoute />} />
            </Route>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardRoute />} />
              <Route path="schedule-class" element={<ScheduleClassPage />} />
              <Route
                path="manage-classes"
                element={<TutorManageClassesPage />}
              />

              <Route path="quizzes" element={<QuizManagementPage />} />
              <Route path="create-quiz" element={<CreateQuizPage />} />
              <Route path="quiz/:quizId" element={<QuizViewPage />} />
              <Route path="edit-quiz/:quizId" element={<EditQuizPage />} />
              <Route
                path="quiz/:quizId/responses"
                element={<QuizResponsesPage />}
              />
              <Route
                path="quiz/attempt/:attemptId"
                element={<QuizAttemptReviewPage />}
              />

              {/* View flashcards set - accessible to any logged-in role */}
              <Route
                path="flashcards/:setId"
                element={<FlashcardStudyPage />}
              />

              <Route path="profile" element={<ProfilePage />} />
              <Route path="id-verification" element={<IDVerificationPage />} />

              {/* Admin routes with nested structure */}
              <Route
                path="admin/*"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="students" element={<ManageStudentsPage />} />
                <Route
                  path="tutor-applications"
                  element={<ManageTutorApplicationsPage />}
                />
                <Route path="tutors" element={<ManageTutorsPage />} />
                <Route
                  path="id-verifications"
                  element={<ManageIDVerificationsPage />}
                />
                <Route path="quiz-pdfs" element={<ManageQuizPdfsPage />} />
                <Route
                  path="flashcards"
                  element={<AdminManageFlashcardsPage />}
                />
                <Route path="subjects" element={<ManageSubjectsPage />} />
              </Route>

              {/* Principal routes */}
              <Route
                path="principal/*"
                element={
                  <ProtectedRoute requiredRole="principal">
                    <PrincipalDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Teacher routes */}
              <Route
                path="teacher/*"
                element={
                  <ProtectedRoute requiredRole="teacher">
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Tutor routes */}
              <Route
                path="tutor/*"
                element={
                  <ProtectedRoute requiredRole="tutor">
                    <TutorLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="ratings" element={<TutorRatingsPage />} />
                <Route
                  path="manage-materials"
                  element={<ManageMaterialsPage />}
                />
                <Route path="flashcards" element={<ManageFlashcardsPage />} />
                <Route
                  path="flashcards/create"
                  element={<CreateEditFlashcardSetPage />}
                />
                <Route
                  path="flashcards/edit/:setId"
                  element={<CreateEditFlashcardSetPage />}
                />
              </Route>

              {/* Student routes */}
              <Route
                path="student/*"
                element={
                  <ProtectedRoute requiredRole="student">
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StudentDashboard />} />
                <Route path="book-session" element={<BookSessionPage />} />
                <Route
                  path="instant-session"
                  element={<InstantSessionPage />}
                />
                <Route
                  path="book-consultation"
                  element={<BookConsultationPage />}
                />
                <Route
                  path="manage-sessions"
                  element={<ManageSessionsPage />}
                />
                <Route path="packages" element={<PackagesPage />} />
                <Route
                  path="tutor-materials"
                  element={<TutorMaterialsPage />}
                />
                <Route path="notes" element={<NotesPage />} />
                <Route path="notes/create" element={<CreateNotePage />} />
                <Route path="notes/edit/:noteId" element={<CreateNotePage />} />
                <Route path="quizzes" element={<StudentQuizDashboard />} />
                <Route
                  path="ai-generate-quiz"
                  element={<StudentAIGenerateQuizPage />}
                />
                <Route path="flashcards" element={<FlashcardsListPage />} />
                <Route
                  path="flashcards/:setId"
                  element={<FlashcardStudyPage />}
                />
                <Route path="take-quiz/:attemptId" element={<TakeQuizPage />} />
                <Route path="quiz-results" element={<QuizResultsPage />} />
                <Route
                  path="quiz-results/:attemptId"
                  element={<QuizResultsPage />}
                />
              </Route>

              {/* Parent routes */}
              <Route
                path="parent/*"
                element={
                  <ProtectedRoute requiredRole="parent">
                    <ParentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/parent/dashboard" replace />} />
                <Route path="dashboard" element={<ParentDashboardOverview />} />
                <Route path="quiz-progress" element={<ParentQuizProgress />} />
                <Route path="session-progress" element={<ParentSessionProgress />} />
                <Route path="manage" element={<ParentManageStudents />} />
              </Route>

              {/* HR routes */}
              <Route
                path="hr/*"
                element={
                  <ProtectedRoute requiredRole="hr">
                    <HRDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Finance routes */}
              <Route
                path="finance/*"
                element={
                  <ProtectedRoute requiredRole="finance">
                    <FinanceDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Support routes */}
              <Route
                path="support/*"
                element={
                  <ProtectedRoute requiredRole="support">
                    <SupportDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Tutor application route - accessible to all logged-in users */}
              <Route path="apply-tutor" element={<TutorApplicationPage />} />

              {/* Error routes */}
              <Route path="unauthorized" element={<UnauthorizedPage />} />
            </Route>

            {/* Standalone error route */}
            <Route path="*" element={<NotFoundPage />} />
          </>
        )}
        </Routes>
      </Suspense>
    </div>
  );
}

// Dashboard route component that redirects to appropriate dashboard
// Dashboard route component that redirects to appropriate dashboard
function DashboardRoute() {
  const { user, profile, loading } = useAuth();
  const { adminSession, isAdminLoggedIn, loading: adminLoading } = useAdmin();
  const location = useLocation();

  // Wait for both auth contexts to finish loading
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Math3DSpinner size="xl" text="Loading dashboard..." />
      </div>
    );
  }

  // Check for admin session first
  if (isAdminLoggedIn && adminSession) {
    return <Navigate to="/admin" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wait for profile to load before redirecting
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Math3DSpinner size="xl" text="Loading profile..." />
      </div>
    );
  }

  // Use profile.role as primary source, fallback to user.role
  const userRole = profile?.role || user.role;

  // Only redirect if user is on the root path or dashboard path
  // This prevents redirecting users who are already on valid sub-routes
  const currentPath = location.pathname;
  const isOnRootOrDashboard =
    currentPath === "/" || currentPath === "/dashboard";

  if (!isOnRootOrDashboard) {
    // User is on a sub-route, don't redirect them
    return null;
  }

  // Redirect to role-specific dashboard only when on root paths
  switch (userRole) {
    case "admin":
      return <Navigate to="/admin" replace />;
    case "principal":
      return <Navigate to="/principal" replace />;
    case "teacher":
      return <Navigate to="/teacher" replace />;
    case "tutor":
      return <Navigate to="/tutor" replace />;
    case "student":
      return <Navigate to="/student" replace />;
    case "parent":
      return <Navigate to="/parent" replace />;
    case "hr":
      return <Navigate to="/hr" replace />;
    case "finance":
      return <Navigate to="/finance" replace />;
    case "support":
      return <Navigate to="/support" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
}

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: string;
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const { isAdminLoggedIn, loading: adminLoading } = useAdmin();
  const location = useLocation();

  // Wait for both auth contexts to finish loading
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Math3DSpinner size="xl" text="Verifying access..." />
      </div>
    );
  }

  // For admin routes, check admin session
  if (requiredRole === "admin") {
    if (!isAdminLoggedIn) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  // For other routes, check regular user session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Math3DSpinner size="xl" text="Verifying access..." />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Use profile.role as primary source, fallback to user.role
  const userRole = profile?.role || user.role;

  if (userRole !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export default App;
