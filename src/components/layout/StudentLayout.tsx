import React, { useEffect, useRef } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AcademicCapIcon,
  SparklesIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  BookOpenIcon,
  DocumentIcon,
  CreditCardIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  StudentBackgroundProvider,
  useStudentBackground,
} from "@/contexts/StudentBackgroundContext";
import StudentDashboard from "@/pages/dashboards/StudentDashboard";
import { cn } from "@/lib/utils";

// Inner component that uses the context
const StudentLayoutContent: React.FC = () => {
  const location = useLocation();
  const { backgroundClass } = useStudentBackground();
  const appliedClassRef = useRef<string | null>(null);

  // Student navigation items for mobile
  const studentNavigation = [
    { name: "Dashboard", href: "/student", icon: AcademicCapIcon },
    { name: "Instant", href: "/student/instant-session", icon: SparklesIcon },
    { name: "Book", href: "/student/book-session", icon: CalendarDaysIcon },
    { name: "Sessions", href: "/student/manage-sessions", icon: UserGroupIcon },
    { name: "Materials", href: "/student/tutor-materials", icon: BookOpenIcon },
    { name: "Quizzes", href: "/student/quizzes", icon: DocumentIcon },
    { name: "Flashcards", href: "/student/flashcards", icon: BookOpenIcon },
    { name: "Packages", href: "/student/packages", icon: CreditCardIcon },
    { name: "Profile", href: "/profile", icon: UserCircleIcon },
  ];

  const isActive = (href: string) => location.pathname === href;

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
    return (
      <div className="relative">
        <StudentDashboard />
        {/* Mobile Bottom Navigation */}
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl"
        >
          <div className="safe-area-inset-bottom">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex items-center px-2 py-2 min-w-max">
                {studentNavigation.map((item, index) => {
                  const active = isActive(item.href);

                  return (
                    <motion.div
                      key={item.name}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      className="flex-shrink-0 w-16 mx-1"
                    >
                      <Link
                        to={item.href}
                        className={cn(
                          "flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl transition-all duration-300 min-h-[56px] active:scale-95 relative",
                          active
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 mb-1 transition-transform duration-300",
                          active && "scale-110"
                        )} />
                        <span className={cn(
                          "text-[10px] font-medium text-center leading-tight",
                          active && "font-semibold"
                        )}>
                          {item.name}
                        </span>
                        {active && (
                          <motion.div
                            layoutId="student-mobile-nav-indicator"
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary-foreground rounded-t-full"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.nav>
      </div>
    );
  }

  // For nested routes, show the specific page
  return (
    <div className={`min-h-screen ${backgroundClass}`}>
      {/* Page content with bottom padding for mobile nav */}
      <div className="pb-24 lg:pb-0">
        <Outlet />
      </div>

      {/* Mobile Bottom Navigation */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl"
      >
        <div className="safe-area-inset-bottom">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center px-2 py-2 min-w-max">
              {studentNavigation.map((item, index) => {
                const active = isActive(item.href);

                return (
                  <motion.div
                    key={item.name}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    className="flex-shrink-0 w-16 mx-1"
                  >
                    <Link
                      to={item.href}
                      className={cn(
                        "flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl transition-all duration-300 min-h-[56px] active:scale-95 relative",
                        active
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 mb-1 transition-transform duration-300",
                        active && "scale-110"
                      )} />
                      <span className={cn(
                        "text-[10px] font-medium text-center leading-tight",
                        active && "font-semibold"
                      )}>
                        {item.name}
                      </span>
                      {active && (
                        <motion.div
                          layoutId="student-mobile-nav-indicator"
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary-foreground rounded-t-full"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.nav>
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
