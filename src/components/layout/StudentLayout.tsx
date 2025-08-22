import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  StudentBackgroundProvider,
  useStudentBackground,
} from "@/contexts/StudentBackgroundContext";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import StudentDashboard from "@/pages/dashboards/StudentDashboard";

// Inner component that uses the context
const StudentLayoutContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { backgroundClass } = useStudentBackground();

  // Set body background to match the inner wrapper background
  useEffect(() => {
    // Apply the background to the body element
    document.body.className = backgroundClass;

    // Cleanup: remove the background when component unmounts
    return () => {
      document.body.className = "";
    };
  }, [backgroundClass]);

  // If we're on the main student route, show the dashboard
  if (location.pathname === "/student" || location.pathname === "/student/") {
    return <StudentDashboard />;
  }

  // For nested routes, show the specific page
  return (
    <div className={`min-h-screen ${backgroundClass}`}>
      {/* Page content */}
      <Outlet />
    </div>
  );
};

// Wrapper component that provides the context
const StudentLayout: React.FC = () => {
  return (
    <StudentBackgroundProvider>
      <StudentLayoutContent />
    </StudentBackgroundProvider>
  );
};

export default StudentLayout;
