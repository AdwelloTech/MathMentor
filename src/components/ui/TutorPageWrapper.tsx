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
    // Split backgroundClass on whitespace to handle multiple classes
    const classesToAdd = backgroundClass.trim().split(/\s+/).filter(cls => cls.length > 0);

    // Add each class individually to avoid clobbering existing classes
    classesToAdd.forEach(cls => {
      if (cls) {
        document.body.classList.add(cls);
      }
    });

    // Cleanup: remove only the classes we added
    return () => {
      classesToAdd.forEach(cls => {
        if (cls) {
          document.body.classList.remove(cls);
        }
      });
    };
  }, [backgroundClass]);

  return (
    <div className={`min-h-screen ${backgroundClass} ${className} transition-colors duration-200`}>
      {children}
    </div>
  );
};

export default TutorPageWrapper;
