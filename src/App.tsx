import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useAdmin } from "./contexts/AdminContext";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import LoginPage from "./pages/auth/LoginPage";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import ManageStudentsPage from "./pages/admin/ManageStudentsPage";
import ManageTutorApplicationsPage from "./pages/admin/ManageTutorApplicationsPage";
import ManageTutorsPage from "./pages/admin/ManageTutorsPage";
import ManageIDVerificationsPage from "./pages/admin/ManageIDVerificationsPage";
import ManageSubjectsPage from "./pages/admin/ManageSubjectsPage";
import PrincipalDashboard from "./pages/dashboards/PrincipalDashboard";
import TeacherDashboard from "./pages/dashboards/TeacherDashboard";
import TutorDashboard from "./pages/dashboards/TutorDashboard";
import ScheduleClassPage from "./components/classScheduling/ClassSchedulingPage";
import TutorManageClassesPage from "./pages/TutorManageClassesPage";

import QuizManagementPage from "./pages/quiz/QuizManagementPage";
import CreateQuizPage from "./pages/quiz/CreateQuizPage";
import QuizViewPage from "./pages/quiz/QuizViewPage";
import EditQuizPage from "./pages/quiz/EditQuizPage";
import QuizResponsesPage from "./pages/quiz/QuizResponsesPage";
import QuizAttemptReviewPage from "./pages/quiz/QuizAttemptReviewPage";
import StudentQuizDashboard from "./pages/student/StudentQuizDashboard";
import TakeQuizPage from "./pages/student/TakeQuizPage";
import QuizResultsPage from "./pages/student/QuizResultsPage";

import ManageMaterialsPage from "./pages/tutor/ManageMaterialsPage";
import ManageFlashcardsPage from "./pages/tutor/ManageFlashcardsPage";
import CreateEditFlashcardSetPage from "./pages/tutor/CreateEditFlashcardSetPage";
import FlashcardsListPage from "./pages/student/FlashcardsListPage";
import FlashcardStudyPage from "./pages/student/FlashcardStudyPage";

import StudentLayout from "./components/layout/StudentLayout";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import BookSessionPage from "./pages/BookSessionPage";
import BookConsultationPage from "./pages/BookConsultationPage";
import ManageSessionsPage from "./pages/ManageSessionsPage";
import PackagesPage from "./pages/PackagesPage";
import NotesPage from "./pages/notes/NotesPage";
import CreateNotePage from "./pages/notes/CreateNotePage";
import TutorMaterialsPage from "./pages/student/TutorMaterialsPage";
import ParentDashboard from "./pages/dashboards/ParentDashboard";
import HRDashboard from "./pages/dashboards/HRDashboard";
import FinanceDashboard from "./pages/dashboards/FinanceDashboard";
import SupportDashboard from "./pages/dashboards/SupportDashboard";
import NotFoundPage from "./pages/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import TutorApplicationPage from "./pages/TutorApplicationPage";
import IDVerificationPage from "./pages/IDVerificationPage";

function App() {
  const { user, loading } = useAuth();
  const { adminSession, isAdminLoggedIn, loading: adminLoading } = useAdmin();

  // Show loading spinner while checking authentication
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Reset password route - always accessible regardless of auth status */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Public routes */}
        {!user && !isAdminLoggedIn ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {/* Protected routes */}
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<DashboardRoute />} />
              <Route path="dashboard" element={<DashboardRoute />} />
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

              <Route
                path="tutor/manage-materials"
                element={<ManageMaterialsPage />}
              />
              <Route
                path="tutor/flashcards"
                element={<ManageFlashcardsPage />}
              />
              <Route
                path="tutor/flashcards/create"
                element={<CreateEditFlashcardSetPage />}
              />
              <Route
                path="tutor/flashcards/edit/:setId"
                element={<CreateEditFlashcardSetPage />}
              />

              {/* View flashcards set - accessible to any logged-in role */}
              <Route
                path="flashcards/:setId"
                element={<FlashcardStudyPage />}
              />

              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="id-verification" element={<IDVerificationPage />} />

              {/* Admin routes */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/students"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ManageStudentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/tutor-applications"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ManageTutorApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/tutors"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ManageTutorsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/id-verifications"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ManageIDVerificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/subjects"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ManageSubjectsPage />
                  </ProtectedRoute>
                }
              />

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
                    <TutorDashboard />
                  </ProtectedRoute>
                }
              />

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
                    <ParentDashboard />
                  </ProtectedRoute>
                }
              />

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

              {/* Student routes */}
              <Route
                path="student"
                element={
                  <ProtectedRoute requiredRole="student">
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StudentDashboard />} />
                <Route path="book-session" element={<BookSessionPage />} />
                <Route
                  path="book-consultation"
                  element={<BookConsultationPage />}
                />
                <Route
                  path="manage-sessions"
                  element={<ManageSessionsPage />}
                />
              </Route>

              {/* Error routes */}
              <Route path="unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Redirect auth routes to dashboard */}
            <Route
              path="/login"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/register"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/forgot-password"
              element={<Navigate to="/dashboard" replace />}
            />
            {/* Note: /reset-password is handled separately above */}
          </>
        )}
      </Routes>
    </div>
  );
}

// Dashboard route component that redirects to appropriate dashboard
function DashboardRoute() {
  const { user, profile, loading } = useAuth();
  const { adminSession, isAdminLoggedIn } = useAdmin();

  // Check for admin session first
  if (isAdminLoggedIn && adminSession) {
    return <Navigate to="/admin" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wait for profile to load before redirecting
  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Use profile.role as primary source, fallback to user.role
  const userRole = profile?.role || user.role;

  // Redirect to role-specific dashboard
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
  const { user } = useAuth();
  const { isAdminLoggedIn } = useAdmin();

  // For admin routes, check admin session
  if (requiredRole === "admin") {
    if (!isAdminLoggedIn) {
      return <Navigate to="/admin/login" replace />;
    }
    return <>{children}</>;
  }

  // For other routes, check regular user session
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export default App;
