// Role-based styling utilities
export const getRoleBackground = (role?: string) => {
  switch (role) {
    case "tutor":
      return "bg-[#D5FFC5]"; // Green background for tutors
    case "student":
      return ""; // No background for students (inner wrapper handles it)
    case "admin":
    case "principal":
    case "teacher":
    case "parent":
    case "hr":
    case "finance":
    case "support":
      return "bg-[#D5FFC5]"; // Green background for other roles
    default:
      return "bg-gray-50"; // Default fallback
  }
};

export const getRoleContainerClass = (role?: string) => {
  const baseClass = "min-h-screen";
  const backgroundClass = getRoleBackground(role);

  return `${baseClass} ${backgroundClass}`.trim();
};

export const getStudentContentWrapperClass = () => {
  return "min-h-screen bg-gray-50"; // Student pages get background on inner wrapper
};

export const getTutorContentWrapperClass = () => {
  return "min-h-screen"; // Tutor pages get background on outer wrapper
};

// Student page background management utilities
export const getStudentPageBackgroundClass = (customBg?: string) => {
  // If a custom background is provided, use it; otherwise use default
  const backgroundClass = customBg || "bg-gray-50";
  return `min-h-screen ${backgroundClass}`;
};

// Student page specific background constants
export const STUDENT_INSTANT_SESSION_BACKGROUND = "bg-gradient-to-br from-green-50 via-yellow-50 to-green-100";

// Extract background color from Tailwind classes for body matching
export const extractBackgroundColor = (className: string): string => {
  // Common Tailwind background patterns
  const bgPatterns = [
    /bg-\[#([A-Fa-f0-9]{6})\]/g, // Custom hex colors like bg-[#D5FFC5]
    /bg-gray-\d+/g, // Gray scale like bg-gray-50
    /bg-blue-\d+/g, // Blue scale
    /bg-green-\d+/g, // Green scale
    /bg-yellow-\d+/g, // Yellow scale
    /bg-red-\d+/g, // Red scale
    /bg-purple-\d+/g, // Purple scale
    /bg-pink-\d+/g, // Pink scale
    /bg-indigo-\d+/g, // Indigo scale
    /bg-cyan-\d+/g, // Cyan scale
    /bg-slate-\d+/g, // Slate scale
    /bg-zinc-\d+/g, // Zinc scale
    /bg-neutral-\d+/g, // Neutral scale
    /bg-stone-\d+/g, // Stone scale
    /bg-orange-\d+/g, // Orange scale
    /bg-amber-\d+/g, // Amber scale
    /bg-lime-\d+/g, // Lime scale
    /bg-emerald-\d+/g, // Emerald scale
    /bg-teal-\d+/g, // Teal scale
    /bg-sky-\d+/g, // Sky scale
    /bg-violet-\d+/g, // Violet scale
    /bg-fuchsia-\d+/g, // Fuchsia scale
    /bg-rose-\d+/g, // Rose scale
  ];

  for (const pattern of bgPatterns) {
    const match = className.match(pattern);
    if (match) {
      return match[0]; // Return the full class like "bg-gray-50" or "bg-[#D5FFC5]"
    }
  }

  return "bg-gray-50"; // Default fallback
};
