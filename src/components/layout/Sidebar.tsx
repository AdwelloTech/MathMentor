import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
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
import type { TutorApplication } from "@/types/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getActiveProfileImage, getProfileImageUrl } from "@/lib/profileImages";
import type { ProfileImage } from "@/types/auth";
import mathMentorLogo from "@/assets/math-mentor-logo.png";

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
  const [profileImage, setProfileImage] = useState<ProfileImage | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Fetch profile image when component mounts or profile changes
  useEffect(() => {
    let cancelled = false;
    const currentUserId = profile?.user_id ?? null;

    // If user logs out or no profile, clear immediately
    if (!currentUserId) {
      setProfileImage(null);
      setProfileImageUrl(null);
      return;
    }

    (async () => {
      try {
        const activeImage = await getActiveProfileImage(currentUserId);
        if (cancelled) return;
        if (activeImage) {
          setProfileImage(activeImage);
          setProfileImageUrl(getProfileImageUrl(activeImage.file_path));
        } else {
          setProfileImage(null);
          setProfileImageUrl(null);
        }
      } catch (error) {
        console.error("Error fetching profile image:", error);
        if (!cancelled) {
          setProfileImage(null);
          setProfileImageUrl(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.user_id]);

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
    {
      name: "Manage Quizzes",
      href: "/admin/quizzes",
      icon: DocumentTextIcon,
    },
    {
      name: "Manage Flash Cards",
      href: "/admin/flashcards",
      icon: BookOpenIcon,
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
          name: "Instant Session",
          href: "/student/instant-session",
          icon: SparklesIcon,
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

  // Memoize navigation items to prevent unnecessary re-renders
  const navigation = useMemo(
    () => getNavigation(),
    [
      profile?.role,
      isAdminLoggedIn,
      tutorApplication?.application_status,
      idVerification?.verification_status,
      profile?.is_active,
      hasIDVerification,
    ]
  );

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

  // Enhanced Logo Section with smooth animations
  const LogoSection = () => {
    return (
      <motion.div
        className="flex h-16 shrink-0 items-center mb-8 justify-center lg:justify-start"
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center">
          <div className="relative group">
            <motion.div
              className="w-12 h-12 rounded-xl  flex items-center justify-center"
              transition={{ duration: 0.2 }}
            >
              <img
                src={mathMentorLogo}
                alt="Math Mentor logo"
                className="h-16 w-16"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Memoize individual navigation items
  const NavigationItem = useCallback(
    ({ item }: { item: any }) => {
      const isDisabled = item.disabled;
      const active = isActive(item.href);

      if (isDisabled) {
        return (
          <motion.div
            key={item.name}
            className="relative group"
            title={getTooltipMessage(item)}
          >
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-not-allowed",
                active
                  ? "text-gray-400 bg-gray-100/50"
                  : "text-gray-400 hover:bg-gray-50/50",
                !isHovered && "justify-start"
              )}
            >
              <div className="relative opacity-40">
                <item.icon className="h-5 w-5 shrink-0" />
              </div>
              {isHovered && (
                <span className="overflow-hidden whitespace-nowrap text-gray-400">
                  {item.name}
                </span>
              )}
            </div>
          </motion.div>
        );
      }

      return (
        <motion.div
          key={item.name}
          className="relative group"
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
        >
          <Link
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden",
              active
                ? "text-black bg-yellow-300 shadow-lg"
                : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900",
              !isHovered && "justify-start"
            )}
          >
            {/* Active indicator */}
            {active && (
              <motion.div
                className="absolute inset-0 bg-yellow-300 rounded-xl"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}

            <div className="relative z-10 flex items-center gap-3">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors duration-200",
                    active
                      ? "text-black"
                      : "text-gray-600 group-hover:text-gray-900"
                  )}
                />
              </motion.div>
              {isHovered && (
                <span className="overflow-hidden whitespace-nowrap font-medium">
                  {item.name}
                </span>
              )}
            </div>
          </Link>
        </motion.div>
      );
    },
    [isHovered, isActive]
  );

  // Memoize the navigation section to prevent re-renders
  const NavigationSection = useCallback(() => {
    return (
      <div className="flex flex-1 flex-col space-y-2">
        {navigation.map((item) => (
          <div key={item.name}>
            <NavigationItem item={item} />
          </div>
        ))}
      </div>
    );
  }, [navigation, NavigationItem]);

  // Enhanced Profile Section with modern design and profile image
  const ProfileSection = () => {
    // Compute display values outside JSX to avoid inline useMemo calls
    const displayName = profile?.full_name || "User";
    const displayRole = profile?.role
      ? getRoleDisplayName(profile.role)
      : "User";

    return (
      <motion.div
        className="border-t border-gray-200/50 pt-6 mt-6 mb-4"
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div
          className={cn(
            "flex items-center",
            isHovered ? "justify-between" : "justify-start"
          )}
        >
          {/* Profile Info */}
          <div className="flex items-center gap-3">
            {/* Enhanced Profile Avatar with actual image */}
            <motion.div
              className="relative group"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={`${profile?.full_name || "User"}'s profile`}
                    className="w-full h-full object-cover"
                    onError={() => {
                      // Fallback to initials if image fails to load
                      setProfileImageUrl(null);
                    }}
                  />
                ) : (
                  <span>
                    {profile?.full_name
                      ? profile.full_name.charAt(0).toUpperCase()
                      : "U"}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm" />
            </motion.div>

            {/* Profile Details */}
            {isHovered && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-gray-900 truncate max-w-[8rem]">
                  {displayName}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-[8rem]">
                  {displayRole}
                </span>
              </div>
            )}
          </div>

          {/* Enhanced Logout Button */}
          <AnimatePresence mode="wait">
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSignOut}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Enhanced Mobile sidebar with Aceternity design */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="relative z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-0 flex"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <motion.button
                    type="button"
                    className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 transition-colors"
                    onClick={() => setSidebarOpen(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </motion.button>
                </div>

                <div className="flex grow flex-col bg-[#FFFFE4] backdrop-blur-xl border-r border-gray-200/50 px-6 pb-4 shadow-2xl">
                  <div className="flex flex-col h-full overflow-y-auto">
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

      {/* Enhanced Collapsible sidebar for desktop with Aceternity design */}
      <motion.div
        className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="flex grow flex-col bg-[#FFFFE4] backdrop-blur-xl border-r border-gray-200/50 shadow-xl"
          animate={{
            width: isHovered ? 320 : 80,
          }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0.0, 0.2, 1], // Custom easing for smooth collapse
            delay: isHovered ? 0 : 0.1, // Small delay when collapsing to prevent breaking
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
            <LogoSection />
            <NavigationSection />
            <div className="flex-1" />
            <ProfileSection />
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Sidebar;
