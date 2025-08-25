import React, { useState } from "react";
import logoUrl from "@/assets/math-mentor-logo.png";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  AcademicCapIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  SparklesIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentTextIcon,
  UserIcon,
  IdentificationIcon,
  CreditCardIcon,
  BookOpenIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { getRoleDisplayName } from "@/utils/permissions";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { TutorApplication } from "@/types/auth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  tutorApplication: TutorApplication | null;
  idVerification: any;
  loadingApplication: boolean;
  checkTutorApplication: () => void;
  checkIDVerification: () => void;
  onSignOut?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  tutorApplication,
  idVerification,
  loadingApplication,
  checkTutorApplication,
  checkIDVerification,
  onSignOut,
}) => {
  const { profile } = useAuth();
  const { isAdminLoggedIn } = useAdmin();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  // Add admin-specific navigation
  const adminNavigation = [
    { name: "Dashboard", href: "/admin", icon: AcademicCapIcon },
    { name: "Manage Students", href: "/admin/students", icon: UserGroupIcon },
    { name: "Manage Tutors", href: "/admin/tutors", icon: UserIcon },
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
    { name: "Profile", href: "/profile", icon: UserCircleIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ];

  // Base navigation for all users
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: AcademicCapIcon },
    { name: "Profile", href: "/profile", icon: UserCircleIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
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
        { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
      ];
    }
    if (profile?.role === "admin" || isAdminLoggedIn) {
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
  const getTooltipMessage = (item: any) => {
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
              className="h-8 w-8 text-green-600 text-center mx-auto"
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

    // Context-aware color logic
    const getItemColor = (item: any) => {
      // Priority-based colors
      const highPriorityItems = ["Dashboard", "Profile", "Settings"];
      const isHighPriority = highPriorityItems.includes(item.name);

      // Role-based colors
      const isAdminItem = adminNavigation.some((nav) => nav.name === item.name);
      const isTutorItem = tutorNavigationItems.some(
        (nav) => nav.name === item.name
      );
      const isStudentItem =
        profile?.role === "student" &&
        [
          "Book a Session",
          "My Sessions",
          "Tutor Materials",
          "Quizzes",
          "Flash Cards",
          "Packages",
        ].includes(item.name);

      // Section type colors
      const isMainFeature = [
        "Dashboard",
        "Book a Session",
        "My Sessions",
        "Schedule Class",
        "Manage Classes",
      ].includes(item.name);
      const isSettings = ["Settings", "Profile"].includes(item.name);
      const isManagement = [
        "Manage Students",
        "Manage Tutors",
        "Tutor Applications",
        "ID Verifications",
      ].includes(item.name);
      const isContent = [
        "Quizzes",
        "Flash Cards",
        "Tutor Materials",
        "Manage Materials",
      ].includes(item.name);

      // Time-based color adaptation (subtle)
      const hour = new Date().getHours();
      const isDayTime = hour >= 6 && hour <= 18;

      // Color assignment logic
      if (isHighPriority) {
        return { primary: "green", secondary: "emerald" };
      }

      if (profile?.role === "admin" || isAdminLoggedIn) {
        if (isManagement) return { primary: "green", secondary: "emerald" };
        if (isSettings) return { primary: "yellow", secondary: "amber" };
        return { primary: "green", secondary: "emerald" };
      }

      if (profile?.role === "tutor") {
        if (isMainFeature) return { primary: "green", secondary: "emerald" };
        if (isContent) return { primary: "yellow", secondary: "amber" };
        if (isSettings) return { primary: "yellow", secondary: "amber" };
        return { primary: "green", secondary: "emerald" };
      }

      if (profile?.role === "student") {
        if (isStudentItem) return { primary: "green", secondary: "emerald" };
        if (isSettings) return { primary: "yellow", secondary: "amber" };
        return { primary: "green", secondary: "emerald" };
      }

      // Default fallback
      return { primary: "green", secondary: "emerald" };
    };

    const itemColors = getItemColor(item);
    const isGreenActive = itemColors.primary === "green";

    // Dynamic class generation for context-aware colors
    const getActiveClasses = () => {
      if (itemColors.primary === "green") {
        return "text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 shadow-sm";
      } else {
        return "text-yellow-700 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 shadow-sm";
      }
    };

    const getHoverClasses = () => {
      if (itemColors.primary === "green") {
        return "text-gray-700 hover:text-green-600 hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 border border-transparent hover:border-green-100";
      } else {
        return "text-gray-700 hover:text-yellow-600 hover:bg-gradient-to-r hover:from-yellow-50/50 hover:to-amber-50/50 border border-transparent hover:border-yellow-100";
      }
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
                ? "text-gray-400 bg-gray-100/50 border border-gray-200"
                : "text-gray-400 bg-transparent hover:bg-gray-50/50 border border-transparent",
              !isHovered && "justify-center"
            )}
            title={getTooltipMessage(item)}
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
              <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full" />
            )}
            {isTutorRejected && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            )}
            {isTutorApproved && isIDVerificationPending && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full" />
            )}
            {isTutorApproved && isIDVerificationRejected && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
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

    return (
      <motion.div
        key={item.name}
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        <Link
          to={item.href}
          onClick={() => setSidebarOpen(false)}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden",
            active ? getActiveClasses() : getHoverClasses(),
            !isHovered && "justify-center"
          )}
        >
          <div className="relative">
            <item.icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors duration-200",
                active
                  ? (isGreenActive ? "text-green-600" : "text-yellow-600")
                  : "text-gray-600",
                !active &&
                  (itemColors.primary === "green"
                    ? "group-hover:text-green-600"
                    : "group-hover:text-yellow-600")
              )}
            />
            {active && (
              <div
                className={cn(
                  "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                  isGreenActive ? "bg-green-500" : "bg-yellow-500"
                )}
              />
            )}
          </div>

          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="group-hover:translate-x-1 transition-transform duration-200 overflow-hidden whitespace-nowrap"
              >
                {item.name}
              </motion.span>
            )}
          </AnimatePresence>

          {active && (
            <div
              className={cn(
                "absolute inset-0 rounded-xl",
                isGreenActive ? "bg-green-100/20" : "bg-yellow-100/20"
              )}
            />
          )}
        </Link>
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
    return (
      <div className="border-t border-gray-200/50 pt-4 mt-4 mb-8">
        <div
          className={cn(
            "flex items-center",
            isHovered ? "justify-between" : "justify-center"
          )}
        >
          {/* Profile Info */}
          <div className="flex items-center gap-3">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center text-white font-semibold text-sm">
                {profile?.full_name
                  ? profile.full_name.charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white" />
            </div>

            {/* Profile Details */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col overflow-hidden whitespace-nowrap"
                >
                  <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                    {profile?.full_name || "User"}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-32">
                    {profile?.role ? getRoleDisplayName(profile.role) : "User"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
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
                className="p-2 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 text-green-600" />
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
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
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
                    <XMarkIcon className="h-6 w-6 text-white" />
                  </motion.button>
                </div>

                <div className="flex grow flex-col bg-gradient-to-br from-green-50/95 via-yellow-50/95 to-green-50/95 backdrop-blur-xl border-r border-green-200/50 px-6 pb-4 shadow-2xl relative overflow-hidden">
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-200/10 via-transparent to-yellow-200/10" />
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col">
        <motion.div
          className="flex grow flex-col bg-gradient-to-br from-green-50/95 via-yellow-50/95 to-green-50/95 backdrop-blur-xl border-r border-green-200/50 shadow-xl relative overflow-hidden"
          animate={{
            width: isHovered ? 288 : 80, // 288px = 72 * 4 (lg:w-72), 80px for collapsed
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-200/10 via-transparent to-yellow-200/10" />
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
