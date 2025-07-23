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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <button
              onClick={() => navigate("/student")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page content */}
      <Outlet />
    </div>
  );
};

export default StudentLayout;
