import React, { useEffect } from "react";
import { getRoleContainerClass } from "@/utils/roleStyles";

interface TutorPageWrapperProps {
  children: React.ReactNode;
  backgroundClass?: string;
  className?: string;
}

/**
 * Wrapper component for tutor pages that automatically sets the background
 * to match between the body and inner wrapper for seamless appearance.
 * Uses additive class management to avoid clobbering other body classes.
 *
 * @param backgroundClass - Tailwind background class (e.g., "bg-green-50", "bg-blue-100")
 * @param className - Additional CSS classes for the wrapper
 * @param children - Page content
 */
const TutorPageWrapper: React.FC<TutorPageWrapperProps> = ({
  children,
  backgroundClass,
  className = "",
}) => {
  useEffect(() => {
    // Only add classes if backgroundClass is non-empty
    if (backgroundClass && backgroundClass.trim()) {
      const classes = backgroundClass.trim().split(/\s+/).filter(Boolean);
      classes.forEach((cls) => {
        document.body.classList.add(cls);
      });

      // Cleanup: remove the classes when component unmounts
      return () => {
        classes.forEach((cls) => {
          document.body.classList.remove(cls);
        });
      };
    }
  }, [backgroundClass]);

  const containerClass = backgroundClass
    ? `${getRoleContainerClass("tutor")} ${backgroundClass} ${className}`.trim()
    : `${getRoleContainerClass("tutor")} ${className}`.trim();

  return (
    <div className={containerClass}>
      {children}
    </div>
  );
};

export default TutorPageWrapper;
