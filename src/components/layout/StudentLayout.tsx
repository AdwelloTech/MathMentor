import React, { useEffect, useRef } from "react";
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

  // Set body background to match the inner wrapper background (non-destructive)
  const prevClassesRef = useRef<string[]>([]);
  useEffect(() => {
    // Cleanup from previous render on update
    prevClassesRef.current.forEach((c) => document.body.classList.remove(c));

    // Only add classes if backgroundClass is non-empty
    if (backgroundClass && backgroundClass.trim()) {
      const classes = backgroundClass.trim().split(/\s+/).filter(Boolean);
      classes.forEach((c) => document.body.classList.add(c));
      prevClassesRef.current = classes;
    } else {
      prevClassesRef.current = [];
    }

    return () => {
      // Remove classes when unmounting
      prevClassesRef.current.forEach((c) => document.body.classList.remove(c));
      prevClassesRef.current = [];
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
