import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/ui/LoadingSpinner';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import PrincipalDashboard from './pages/dashboards/PrincipalDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import TutorDashboard from './pages/dashboards/TutorDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import ParentDashboard from './pages/dashboards/ParentDashboard';
import HRDashboard from './pages/dashboards/HRDashboard';
import FinanceDashboard from './pages/dashboards/FinanceDashboard';
import SupportDashboard from './pages/dashboards/SupportDashboard';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

function App() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
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
        {!user ? (
          <>
            <Route path="/login" element={<LoginPage />} />
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
              
              {/* Admin routes */}
              <Route 
                path="admin/*" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
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
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              
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
              
              {/* Error routes */}
              <Route path="unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            
            {/* Redirect auth routes to dashboard */}
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/register" element={<Navigate to="/dashboard" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/dashboard" replace />} />
            {/* Note: /reset-password is handled separately above */}
          </>
        )}
      </Routes>
    </div>
  );
}

// Dashboard route component that redirects to appropriate dashboard
function DashboardRoute() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to role-specific dashboard
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'principal':
      return <Navigate to="/principal" replace />;
    case 'teacher':
      return <Navigate to="/teacher" replace />;
    case 'tutor':
      return <Navigate to="/tutor" replace />;
    case 'student':
      return <Navigate to="/student" replace />;
    case 'parent':
      return <Navigate to="/parent" replace />;
    case 'hr':
      return <Navigate to="/hr" replace />;
    case 'finance':
      return <Navigate to="/finance" replace />;
    case 'support':
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
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
}

export default App; 