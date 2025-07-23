import React from "react";
import { motion } from "framer-motion";
import { UserIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import StudentProfile from "@/components/student/StudentProfile";
import TutorProfile from "@/components/tutor/TutorProfile";

const ProfilePage: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-gray-200 pb-5"
      >
        <div className="flex items-center">
          <UserIcon className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your personal information and learning preferences.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Profile Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {profile?.role === "student" ? (
          <StudentProfile />
        ) : profile?.role === "tutor" ? (
          <TutorProfile />
        ) : (
          <div className="card">
            <div className="card-body">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Profile Management
              </h2>
              <p className="text-gray-600">
                Profile management for {profile?.role} users is coming soon.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;
