import React, { useEffect } from "react";
import { useStudentBackground } from "@/contexts/StudentBackgroundContext";

interface StudentPageWrapperProps {
  children: React.ReactNode;
  backgroundClass?: string;
  className?: string;
}

/**
 * Wrapper component for student pages that automatically sets the background
 * to match between the body and inner wrapper for seamless appearance.
 *
 * @param backgroundClass - Tailwind background class (e.g., "bg-gray-50", "bg-blue-100")
 * @param className - Additional CSS classes for the wrapper
 * @param children - Page content
 */
const StudentPageWrapper: React.FC<StudentPageWrapperProps> = ({
  children,
  backgroundClass = "bg-gray-50",
  className = "",
}) => {
  const { setBackgroundClass } = useStudentBackground();

  useEffect(() => {
    // Set the background class in the context on mount
    setBackgroundClass(backgroundClass);

    // Cleanup: reset to default background when component unmounts
    // This prevents background leakage into non-student pages
    return () => {
      setBackgroundClass("bg-gray-50");
    };
  }, [backgroundClass, setBackgroundClass]);

  return <div className={`min-h-screen ${backgroundClass} ${className}`}>{children}</div>;
};

export default StudentPageWrapper;
