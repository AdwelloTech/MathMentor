import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import ManageTutorsPage from "./pages/admin/ManageTutorsPage";
import ManageTutorApplicationsPage from "./pages/admin/ManageTutorApplicationsPage";
import ManageIDVerificationsPage from "./pages/admin/ManageIDVerificationsPage";
import ManageQuizzesPage from "./pages/admin/ManageQuizzesPage";
import AdminManageFlashcardsPage from "./pages/admin/ManageFlashcardsPage";
import ManageSubjectsPage from "./pages/admin/ManageSubjectsPage";

import AdminLayout from "./components/layout/AdminLayout";
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
import TutorRatingsPage from "./pages/tutor/TutorRatingsPage";
import FlashcardsListPage from "./pages/student/FlashcardsListPage";
import FlashcardStudyPage from "./pages/student/FlashcardStudyPage";

import StudentLayout from "./components/layout/StudentLayout";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import BookSessionPage from "./pages/BookSessionPage";
import BookConsultationPage from "./pages/BookConsultationPage";
import ManageSessionsPage from "./pages/ManageSessionsPage";
import InstantSessionPage from "./pages/student/InstantSessionPage";
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
import TutorLayout from "./components/layout/TutorLayout";

function App() {
  const { user, loading, profile } = useAuth();
  const { isAdminLoggedIn, loading: adminLoading } = useAdmin();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Check if user is fully authenticated (both user and profile exist)
  const isUserAuthenticated = user && profile;
  
  // Check if we're on admin routes
  const isOnAdminRoute = location.pathname.startsWith("/admin");
  
  // List of public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/admin/login", 
    "/register", 
    "/forgot-password", 
    "/reset-password"
  ];
  const isOnPublicRoute = publicRoutes.includes(location.pathname);

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

  // Special handling for admin routes
  if (isOnAdminRoute && location.pathname !== "/admin/login") {
    // For admin routes (except login), check admin authentication
    if (!isAdminLoggedIn) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen">
      <Routes>
        {/* Public routes - always accessible */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        
        {/* Handle authentication-based routing */}
        {!isUserAuthenticated && !isAdminLoggedIn ? (
          // Show auth pages when no user is logged in
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            {/* Redirect any other route to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          // Show protected routes when user is authenticated
          <>
            {/* Main application routes */}
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

              {/* View flashcards set - accessible to any logged-in role */}
              <Route
                path="flashcards/:setId"
                element={<FlashcardStudyPage />}
              />

              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
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
                <Route path="tutor-applications" element={<ManageTutorApplicationsPage />} />
                <Route path="tutors" element={<ManageTutorsPage />} />
                <Route path="id-verifications" element={<ManageIDVerificationsPage />} />
                <Route path="quizzes" element={<ManageQuizzesPage />} />
                <Route path="flashcards" element={<AdminManageFlashcardsPage />} />
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

              {/* Error routes */}
              <Route path="unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Redirect auth routes to dashboard when already logged in */}
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
          </>
        )}
      </Routes>
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
        <LoadingSpinner size="lg" />
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
        <LoadingSpinner size="lg" />
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

  // Wait for both auth contexts to finish loading
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // For admin routes, check admin session
  if (requiredRole === "admin") {
    if (adminLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner size="lg" />
        </div>
      );
    }
    if (!isAdminLoggedIn) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  // For other routes, check regular user session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
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