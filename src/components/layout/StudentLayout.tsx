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
  const appliedClassRef = useRef<string | null>(null);

  // Set body background to match the inner wrapper background (non-destructive)
  useEffect(() => {
    const body = document.body;
    const prevClass = appliedClassRef.current;

    // Remove previous background class if it exists and is different
    if (prevClass && prevClass !== backgroundClass) {
      // Split prevClass by spaces to handle multiple classes
      const prevClasses = prevClass.split(/\s+/).filter(Boolean);
      prevClasses.forEach((cls) => body.classList.remove(cls));
    }

    // Add new background class if it exists and isn't already applied
    if (backgroundClass) {
      // Split backgroundClass by spaces to handle multiple classes (e.g., gradients)
      const classes = backgroundClass.split(/\s+/).filter(Boolean);

      // Check if all classes are already applied
      const allClassesApplied = classes.every((cls) =>
        body.classList.contains(cls)
      );

      if (!allClassesApplied) {
        // Remove any existing background classes first
        const existingClasses = Array.from(body.classList).filter(
          (cls) =>
            cls.startsWith("bg-") ||
            cls.startsWith("from-") ||
            cls.startsWith("via-") ||
            cls.startsWith("to-")
        );
        existingClasses.forEach((cls) => body.classList.remove(cls));

        // Add new classes
        classes.forEach((cls) => body.classList.add(cls));
      }
    }

    // Update ref to track the currently applied class
    appliedClassRef.current = backgroundClass;

    // Cleanup: remove the background class when component unmounts
    return () => {
      if (appliedClassRef.current) {
        // Split backgroundClass by spaces to handle multiple classes
        const classes = appliedClassRef.current.split(/\s+/).filter(Boolean);
        classes.forEach((cls) => body.classList.remove(cls));
        appliedClassRef.current = null;
      }
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
