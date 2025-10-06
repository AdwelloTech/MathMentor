import React, { useState, useEffect } from "react";
import logoUrl from "@/assets/math-mentor-logo.png";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  AcademicCapIcon,
  UserCircleIcon,
  SparklesIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentTextIcon,
  UserIcon,
  IdentificationIcon,
  CreditCardIcon,
  BookOpenIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { getRoleDisplayName } from "@/utils/permissions";
import type { TutorApplication } from "@/types/auth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  tutorApplication: TutorApplication | null;
  idVerification: any;
  onSignOut?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  tutorApplication,
  idVerification,
  onSignOut,
}) => {
  const { profile } = useAuth();
  const { adminSession, loading: adminLoading } = useAdmin();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Add admin-specific navigation
  const adminNavigation = [
    { name: "Dashboard", href: "/admin", icon: AcademicCapIcon },
    { 
      name: "Tutor Management",
      href: "/admin/tutors", 
      icon: UserIcon
    },
    {
      name: "Tutor Applications",
      href: "/admin/tutor-applications",
      icon: DocumentTextIcon,
    },
    {
      name: "ID Verifications",
      href: "/admin/id-verifications",
      icon: IdentificationIcon,
    },
    { 
      name: "Student Management", 
      href: "/admin/students", 
      icon: UserGroupIcon 
    },
    {
      name: "Content Management",
      href: "/admin/quizzes",
      icon: DocumentTextIcon,
      subItems: [
        { name: "Quiz PDFs", href: "/admin/quiz-pdfs" },
        { name: "Manage Quizzes", href: "/admin/quizzes" },
        { name: "Flashcard Sets", href: "/admin/flashcards" },
      ]
    },
    {
      name: "System Settings",
      href: "/admin/settings",
      icon: Cog6ToothIcon,
      subItems: [
        { name: "Subjects", href: "/admin/subjects" },
        { name: "Grade Levels", href: "/admin/grade-levels" },
        { name: "System Config", href: "/admin/settings" },
      ]
    },
    {
      name: "View Reports",
      href: "/admin/reports",
      icon: ChartBarIcon,
    },
    { name: "Profile", href: "/profile", icon: UserCircleIcon },
  ];

  // Base navigation for all users
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: AcademicCapIcon },
    { name: "Profile", href: "/profile", icon: UserCircleIcon },
  ];

  // Tutor-specific navigation items
  const tutorNavigationItems = [
    { name: "Schedule Class", href: "/schedule-class", icon: CalendarDaysIcon },
    { name: "Manage Classes", href: "/manage-classes", icon: CalendarDaysIcon },
    { name: "Quizzes", href: "/quizzes", icon: DocumentTextIcon },
    {
      name: "Manage Flash Cards",
      href: "/tutor/flashcards",
      icon: DocumentTextIcon,
    },
    {
      name: "ID Verification",
      href: "/id-verification",
      icon: IdentificationIcon,
    },
    {
      name: "Manage Materials",
      href: "/tutor/manage-materials",
      icon: DocumentTextIcon,
    },
  ];

  // Check if tutor navigation should be disabled
  const isTutorApproved = tutorApplication?.application_status === "approved";
  const isTutorPending = tutorApplication?.application_status === "pending";
  const isTutorRejected = tutorApplication?.application_status === "rejected";
  const isTutorActive = profile?.is_active !== false; // Default to true if not set

  // Check ID verification status
  const isIDVerificationApproved =
    idVerification?.verification_status === "approved";
  const isIDVerificationPending =
    idVerification?.verification_status === "pending";
  const isIDVerificationRejected =
    idVerification?.verification_status === "rejected";
  const hasIDVerification = !!idVerification;

  // Tutor features are only enabled when both application is approved AND ID verification is approved
  const areTutorFeaturesEnabled =
    isTutorApproved && isIDVerificationApproved && isTutorActive;

  // Build navigation based on user role
  const getNavigation = () => {
    // Student-specific navigation
    if (profile?.role === "student") {
      return [
        { name: "Dashboard", href: "/student", icon: AcademicCapIcon },
        {
          name: "Instant Session",
          href: "/student/instant-session",
          icon: SparklesIcon,
        },
        {
          name: "Book a Session",
          href: "/student/book-session",
          icon: CalendarDaysIcon,
        },
        {
          name: "My Sessions",
          href: "/student/manage-sessions",
          icon: SparklesIcon,
        },
        {
          name: "Tutor Materials",
          href: "/student/tutor-materials",
          icon: BookOpenIcon,
        },
        {
          name: "Quizzes",
          href: "/student/quizzes",
          icon: DocumentTextIcon,
        },
        {
          name: "Flash Cards",
          href: "/student/flashcards",
          icon: BookOpenIcon,
        },
        {
          name: "Packages",
          href: "/student/packages",
          icon: CreditCardIcon,
        },
        { name: "Profile", href: "/profile", icon: UserCircleIcon },
      ];
    }
    // Show admin nav only for validated admin sessions
    if (adminSession || (profile?.role === "admin" && !adminLoading)) {
      return adminNavigation;
    }

    // For tutors, include tutor-specific items but mark them as disabled if not approved or inactive
    if (profile?.role === "tutor") {
      const navigationItems = [
        ...baseNavigation.slice(0, 1),
        ...tutorNavigationItems,
        ...baseNavigation.slice(1),
      ];

      // If tutor is not approved, inactive, or has no application, disable tutor-specific items
      if (!areTutorFeaturesEnabled) {
        return navigationItems.map((item) => {
          if (
            tutorNavigationItems.some(
              (tutorItem) => tutorItem.name === item.name
            )
          ) {
            return { ...item, disabled: true };
          }
          return item;
        });
      }

      return navigationItems;
    }

    // For students and other roles, only show base navigation
    return baseNavigation;
  };

  const navigation = getNavigation();

  const isActive = (href: string) => location.pathname === href;

  // Get tooltip message based on application status
  const getTooltipMessage = () => {
    if (profile?.role !== "tutor") return "";

    if (!isTutorActive) {
      return "Your account has been temporarily deactivated. This feature will be available once your account is reactivated.";
    }

    if (isTutorPending) {
      return "Your application is under review. This feature will be available once approved.";
    }

    if (isTutorRejected) {
      return "Your application was rejected. Please contact support for more information.";
    }

    if (!tutorApplication) {
      return "Please submit a tutor application first.";
    }

    if (isTutorApproved && !hasIDVerification) {
      return "Your application is approved! Please complete ID verification to access tutor features.";
    }

    if (isTutorApproved && isIDVerificationPending) {
      return "Your ID verification is under review. This feature will be available once approved.";
    }

    if (isTutorApproved && isIDVerificationRejected) {
      return "Your ID verification was rejected. Please resubmit with correct documents.";
    }

    return "Application pending approval";
  };

  // Collapsible Logo Section
  const LogoSection = () => {
    return (
      <div className="flex h-16 shrink-0 items-center mb-6 justify-center lg:justify-start">
        <div className="flex items-center">
          <div className="relative">
            <img
              src={logoUrl}
              alt="IEMS Logo"
              className="h-8 w-8 text-primary text-center mx-auto"
            />
          </div>
        </div>
      </div>
    );
  };

  // Collapsible Navigation Item Component
  const NavigationItem = ({ item, index }: { item: any; index: number }) => {
    const isDisabled = item.disabled;
    const active = isActive(item.href);
    const showSubItems = expandedItem === item.name;

    // Check if any sub-item is active
    const hasActiveSubItem = item.subItems?.some((subItem: any) => isActive(subItem.href));

    // Auto-expand submenu if any sub-item is active
    useEffect(() => {
      if (hasActiveSubItem && item.subItems && expandedItem !== item.name) {
        setExpandedItem(item.name);
      }
    }, [hasActiveSubItem, item.name, item.subItems, expandedItem]);

    // Use consistent theme colors for all navigation items
    const getActiveClasses = () => {
      return "text-primary-foreground bg-primary border border-primary/20 shadow-sm";
    };

    const getHoverClasses = () => {
      return "text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent hover:border-border/50";
    };

    // Simple animation variants
    const itemVariants = {
      hidden: {
        opacity: 0,
        x: -10,
      },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.3,
          delay: index * 0.03,
        },
      },
    };

    if (isDisabled) {
      return (
        <motion.div
          key={item.name}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          <div
            className={cn(
              "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden cursor-not-allowed",
              active
                ? "text-muted-foreground bg-muted/50 border border-border"
                : "text-muted-foreground bg-transparent hover:bg-muted/30 border border-transparent",
              !isHovered && "justify-center"
            )}
            title={getTooltipMessage()}
          >
            <div className="relative opacity-50">
              <item.icon className="h-5 w-5 shrink-0" />
            </div>
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 0.5, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {item.name}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Status indicators */}
            {isTutorPending && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-warning rounded-full" />
            )}
            {isTutorRejected && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            )}
            {isTutorApproved && isIDVerificationPending && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            )}
            {isTutorApproved && isIDVerificationRejected && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            )}

            {/* Status indicator text */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 0.6, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-1 right-2 text-xs overflow-hidden whitespace-nowrap"
                >
                  {isTutorPending && "App Pending"}
                  {isTutorRejected && "App Rejected"}
                  {!tutorApplication && "No App"}
                  {isTutorApproved && !hasIDVerification && "Need ID"}
                  {isTutorApproved && isIDVerificationPending && "ID Pending"}
                  {isTutorApproved && isIDVerificationRejected && "ID Rejected"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      );
    }

    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <motion.div
        key={item.name}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        <div className="flex flex-col">
          {/* Main nav item */}
          <Link
            to={item.href}
            onClick={() => {
              setSidebarOpen(false);
              if (hasSubItems) {
                // Toggle the submenu - if it's already expanded, collapse it; otherwise expand it
                setExpandedItem(expandedItem === item.name ? null : item.name);
              } else {
                // If clicking on a regular item (no submenu), collapse any expanded submenu
                setExpandedItem(null);
              }
            }}
            className={cn(
              "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden",
              (active || hasActiveSubItem) ? getActiveClasses() : getHoverClasses(),
              !isHovered && "justify-center"
            )}
          >
            <div className="relative">
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors duration-200",
                  (active || hasActiveSubItem)
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {(active || hasActiveSubItem) && (
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary" />
              )}
            </div>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="flex items-center justify-between flex-1"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="group-hover:translate-x-1 transition-transform duration-200 overflow-hidden whitespace-nowrap">
                    {item.name}
                  </span>
                  
                  {hasSubItems && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpandedItem(expandedItem === item.name ? null : item.name);
                      }}
                      className="ml-2 rounded-full p-1 hover:bg-accent/50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-3 w-3 transition-transform ${showSubItems ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {(active || hasActiveSubItem) && (
              <div className="absolute inset-0 rounded-xl bg-primary/10" />
            )}
          </Link>
          
          {/* Sub items */}
          <AnimatePresence>
            {isHovered && hasSubItems && expandedItem === item.name && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-8 overflow-hidden"
              >
                {item.subItems.map((subItem: any, subIndex: number) => {
                  const subActive = isActive(subItem.href);
                  return (
                    <Link
                      key={`${item.name}-sub-${subIndex}`}
                      to={subItem.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center py-2 px-3 text-xs rounded-lg my-1 transition-colors",
                        subActive
                          ? "bg-primary/20 text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                      )}
                    >
                      <div className="w-1.5 h-1.5 rounded-full mr-2 bg-current opacity-70" />
                      {subItem.name}
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // Simple Navigation Section
  const NavigationSection = () => {
    return (
      <div className="flex flex-1 flex-col space-y-1">
        {navigation.map((item, index) => (
          <NavigationItem key={item.name} item={item} index={index} />
        ))}
      </div>
    );
  };

  // Collapsible Profile Section
  const ProfileSection = () => {
    // Compute display values outside JSX to avoid inline useMemo calls
    const displayName = profile?.full_name || "User";
    const displayRole = profile?.role
      ? getRoleDisplayName(profile.role)
      : "User";

    return (
      <div className="border-t border-border/50 pt-4 mt-4 mb-8">
        <div
          className={cn(
            "flex items-center",
            isHovered ? "justify-between" : "justify-center"
          )}
        >
          {/* Profile Info */}
          <div className="flex items-center gap-3">
            {/* Profile Avatar */}
            <motion.div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {profile?.full_name
                  ? profile.full_name.charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-background shadow-sm" />
            </motion.div>

            {/* Profile Details */}
            {isHovered && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-card-foreground truncate max-w-[8rem]">
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[8rem]">
                  {displayRole}
                </span>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                onClick={onSignOut}
                className="p-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 text-secondary-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="relative z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />

            <motion.div
              className="fixed inset-0 flex"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
            >
              <div className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <motion.button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={() => setSidebarOpen(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <XMarkIcon className="h-6 w-6 text-foreground" />
                  </motion.button>
                </div>

              <div className="flex grow flex-col bg-card/95 backdrop-blur-lg border-r border-border px-6 pb-4 relative overflow-hidden shadow-lg">
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
                  </div>

                  <div className="relative z-10 flex flex-col h-full overflow-y-auto">
                    <LogoSection />
                    <NavigationSection />
                    <div className="flex-1" />
                    <ProfileSection />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsible sidebar for desktop */}
      <div id="sidebar-navigation" className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col">
        <motion.div
          className="flex grow flex-col bg-card/95 backdrop-blur-lg border-r border-border shadow-xl relative overflow-hidden"
          animate={{
            width: isHovered ? 288 : 80, // 288px = 72 * 4 (lg:w-72), 80px for collapsed
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
          </div>

          <div className="relative z-10 flex flex-col h-full overflow-y-auto px-6 pb-4">
            <LogoSection />
            <NavigationSection />
            <div className="flex-1" />
            <ProfileSection />
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Sidebar;
