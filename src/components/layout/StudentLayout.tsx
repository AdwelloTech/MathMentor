import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import StudentDashboard from "@/pages/dashboards/StudentDashboard";

const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If we're on the main student route, show the dashboard
  if (location.pathname === "/student" || location.pathname === "/student/") {
    return <StudentDashboard />;
  }

  // For nested routes, show the specific page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header for nested pages */}

      {/* Page content */}
      <Outlet />
    </div>
  );
};

export default StudentLayout;
