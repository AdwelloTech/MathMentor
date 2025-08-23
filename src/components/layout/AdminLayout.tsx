import React from "react";
import {
  Outlet,
  useNavigate,
  useLocation,
  Routes,
  Route,
} from "react-router-dom";
import { motion } from "framer-motion";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";
import ManageStudentsPage from "@/pages/admin/ManageStudentsPage";
import ManageTutorApplicationsPage from "@/pages/admin/ManageTutorApplicationsPage";
import ManageTutorsPage from "@/pages/admin/ManageTutorsPage";
import ManageIDVerificationsPage from "@/pages/admin/ManageIDVerificationsPage";
import ManageQuizzesPage from "@/pages/admin/ManageQuizzesPage";
import AdminManageFlashcardsPage from "@/pages/admin/ManageFlashcardsPage";

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If we're on the main admin route, show the dashboard
  if (location.pathname === "/admin" || location.pathname === "/admin/") {
    return <AdminDashboard />;
  }

  // For nested routes, show the specific page
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
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
        <Route path="quizzes" element={<ManageQuizzesPage />} />
        <Route path="flashcards" element={<AdminManageFlashcardsPage />} />
      </Routes>
    </div>
  );
};

export default AdminLayout;
