import React, { useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BellIcon,
  Cog6ToothIcon,
  SparklesIcon,

  CalendarDaysIcon,

  UserGroupIcon,
  DocumentTextIcon,

} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { getRoleDisplayName } from "@/utils/permissions";


const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { adminSession, isAdminLoggedIn, logoutAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    if (isAdminLoggedIn) {
      // Admin logout
      await logoutAdmin();
      navigate("/admin/login");
    } else {
      // Regular user logout
      await signOut();
      navigate("/login");
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: AcademicCapIcon },
    { name: "Schedule Class", href: "/schedule-class", icon: CalendarDaysIcon },
    { name: "Profile", href: "/profile", icon: UserCircleIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ];

  // Add admin-specific navigation
  const adminNavigation = [
    { name: "Dashboard", href: "/admin", icon: AcademicCapIcon },
    { name: "Manage Students", href: "/admin/students", icon: UserGroupIcon },
    { name: "Tutor Applications", href: "/admin/tutor-applications", icon: DocumentTextIcon },
    { name: "Profile", href: "/profile", icon: UserCircleIcon },
    { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
  ];

  // Use admin navigation if user is admin or admin session exists
  const currentNavigation = (profile?.role === 'admin' || isAdminLoggedIn) ? adminNavigation : navigation;

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="relative z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="fixed inset-0 bg-gray-900/80"
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6 text-white" />
                  </button>
                </div>

                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-indigo-100 px-6 pb-4 shadow-xl backdrop-blur-sm">
                  <motion.div
                    className="flex h-16 shrink-0 items-center"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div
                      className="flex items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                      </motion.div>
                      <motion.span
                        className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      >
                        IEMS
                      </motion.span>
                      <motion.div
                        className="ml-2"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <SparklesIcon className="h-4 w-4 text-yellow-500" />
                      </motion.div>
                    </motion.div>
                  </motion.div>

                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-2">
                          {currentNavigation.map((item, index) => (
                            <motion.li
                              key={item.name}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                              <Link
                                to={item.href}
                                className={`group flex gap-x-3 rounded-2xl p-4 text-sm leading-6 font-medium transition-all duration-300 relative overflow-hidden border ${
                                  isActive(item.href)
                                    ? "text-blue-700 bg-gradient-to-r from-blue-100 via-blue-50 to-indigo-100 shadow-lg border-blue-300"
                                    : "text-gray-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 border-transparent hover:border-blue-200"
                                }`}
                                onClick={() => setSidebarOpen(false)}
                              >
                                <motion.div
                                  className="relative"
                                  whileHover={{ rotate: 360, scale: 1.2 }}
                                  transition={{
                                    duration: 0.8,
                                    type: "spring",
                                    stiffness: 200,
                                  }}
                                >
                                  <item.icon className="h-5 w-5 shrink-0 drop-shadow-sm" />
                                  {isActive(item.href) && (
                                    <motion.div
                                      className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        type: "spring",
                                        stiffness: 500,
                                      }}
                                    />
                                  )}
                                </motion.div>
                                <span>{item.name}</span>
                                {isActive(item.href) && (
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-xl"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                  />
                                )}
                              </Link>
                            </motion.li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-blue-200 bg-gradient-to-br from-white via-blue-50 to-indigo-100 px-6 pb-4 shadow-xl backdrop-blur-sm">
          <motion.div
            className="flex h-16 shrink-0 items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                className="relative"
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <AcademicCapIcon className="h-8 w-8 text-blue-600 drop-shadow-lg" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
              <motion.span
                className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                IEMS
              </motion.span>
              <motion.div
                className="ml-2"
                animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <SparklesIcon className="h-4 w-4 text-yellow-500 drop-shadow-md" />
              </motion.div>
            </motion.div>
          </motion.div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-2">
                  {currentNavigation.map((item, index) => (
                    <motion.li
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Link
                        to={item.href}
                        className={`group flex gap-x-3 rounded-2xl p-4 text-sm leading-6 font-medium transition-all duration-300 relative overflow-hidden border ${
                          isActive(item.href)
                            ? "text-blue-700 bg-gradient-to-r from-blue-100 via-blue-50 to-indigo-100 shadow-lg border-blue-300"
                            : "text-gray-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 border-transparent hover:border-blue-200"
                        }`}
                      >
                        <motion.div
                          className="relative"
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{
                            duration: 0.8,
                            type: "spring",
                            stiffness: 200,
                          }}
                        >
                          <item.icon className="h-5 w-5 shrink-0 drop-shadow-sm" />
                          {isActive(item.href) && (
                            <motion.div
                              className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                            />
                          )}
                        </motion.div>
                        <span>{item.name}</span>
                        {isActive(item.href) && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-64">
        {/* Header */}
        <motion.div
          className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-blue-200 bg-gradient-to-r from-white via-blue-50 to-indigo-100 px-4 shadow-xl backdrop-blur-sm sm:gap-x-6 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-blue-100 rounded-lg transition-colors duration-200"
            onClick={() => setSidebarOpen(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bars3Icon className="h-6 w-6" />
          </motion.button>

          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <motion.div
              className="relative flex flex-1 items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                {profile?.role && getRoleDisplayName(profile.role)} Dashboard
              </h1>
            </motion.div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <motion.button
                type="button"
                className="-m-2.5 p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <BellIcon className="h-6 w-6" />
              </motion.button>

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <button
                  type="button"
                  className="-m-1.5 flex items-center p-1.5 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                  onClick={handleSignOut}
                >
                  <span className="sr-only">Sign out</span>
                  <div className="flex items-center gap-x-2">
                    <motion.span
                      className="text-sm font-semibold leading-6 text-gray-900"
                      whileHover={{ color: "#2563eb" }}
                    >
                      {profile?.full_name}
                    </motion.span>
                    <motion.div
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-400" />
                    </motion.div>
                  </div>
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
