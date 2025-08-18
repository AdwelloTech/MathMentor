import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { getRoleDisplayName } from "@/utils/permissions";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { TutorApplication } from "@/types/auth";
import Sidebar from "./Sidebar";

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tutorApplication, setTutorApplication] =
    useState<TutorApplication | null>(null);
  const [idVerification, setIdVerification] = useState<any>(null);
  const [loadingApplication, setLoadingApplication] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { adminSession, isAdminLoggedIn, logoutAdmin } = useAdmin();
  const navigate = useNavigate();

  // Check tutor application and ID verification status on mount
  useEffect(() => {
    if (profile?.role === "tutor" && user) {
      checkTutorApplication();
      checkIDVerification();
    }
  }, [profile?.role, user]);

  const checkTutorApplication = async () => {
    if (!user) return;

    setLoadingApplication(true);
    try {
      const applications = await db.tutorApplications.getByUserId(user.id);
      // Get the most recent application
      const mostRecentApplication = applications?.[0] || null;
      setTutorApplication(mostRecentApplication);
    } catch (error) {
      console.error("Error checking tutor application:", error);
    } finally {
      setLoadingApplication(false);
    }
  };

  const checkIDVerification = async () => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from("id_verifications")
        .select("*")
        .eq("user_id", profile.id) // Use profile.id instead of user.id
        .order("submitted_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error checking ID verification:", error);
        setIdVerification(null);
      } else {
        // Set the first record or null if no records found
        setIdVerification(data?.[0] || null);
      }
    } catch (error) {
      console.error("Error checking ID verification:", error);
      setIdVerification(null);
    }
  };

  // Check if tutor navigation should be disabled
  const isTutorApproved = tutorApplication?.application_status === "approved";
  const isTutorPending = tutorApplication?.application_status === "pending";
  const isTutorRejected = tutorApplication?.application_status === "rejected";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tutorApplication={tutorApplication}
        idVerification={idVerification}
        loadingApplication={loadingApplication}
        checkTutorApplication={checkTutorApplication}
        checkIDVerification={checkIDVerification}
        onSignOut={handleSignOut}
      />

      <div className="lg:pl-20">
        {/* Header - Hidden for students */}
        {profile?.role !== "student" && (
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
                {/* Tutor Application Status Indicator */}
                {profile?.role === "tutor" && (
                  <>
                    {loadingApplication ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                      >
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                          <span>Checking Status...</span>
                        </div>
                      </motion.div>
                    ) : (
                      tutorApplication && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isTutorApproved
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : isTutorPending
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : isTutorRejected
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                        >
                          {isTutorApproved && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Approved</span>
                            </div>
                          )}
                          {isTutorPending && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                              <span>Pending Review</span>
                            </div>
                          )}
                          {isTutorRejected && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span>Application Rejected</span>
                            </div>
                          )}
                        </motion.div>
                      )
                    )}
                  </>
                )}

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
        )}

        {/* Main content */}
        <main className={profile?.role === "student" ? "pt-10" : "py-10"}>
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
