import React, { useEffect } from "react";

interface TutorPageWrapperProps {
  children: React.ReactNode;
  backgroundClass?: string;
  className?: string;
}

/**
 * Wrapper component for tutor pages that provides consistent styling
 * similar to the student side but with tutor-appropriate theming.
 *
 * @param backgroundClass - Tailwind background class (e.g., "bg-gradient-to-br from-slate-50 to-slate-100")
 * @param className - Additional CSS classes for the wrapper
 * @param children - Page content
 */
const TutorPageWrapper: React.FC<TutorPageWrapperProps> = ({
  children,
  backgroundClass = "bg-gradient-to-br from-slate-50 to-slate-100",
  className = "",
}) => {
  useEffect(() => {
    // Set the background class on the body element for seamless appearance
    document.body.className = backgroundClass;

    // Cleanup: remove the background when component unmounts
    return () => {
      document.body.className = "";
    };
  }, [backgroundClass]);

  return <div className={`min-h-screen ${className}`}>{children}</div>;
};

export default TutorPageWrapper;
