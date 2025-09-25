import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import StudentProfile from "@/components/student/StudentProfile";
import TutorProfile from "@/components/tutor/TutorProfile";
import ProfileHeader from "@/components/layout/ProfileHeader";

const ProfilePage: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6 max-w-full mx-auto">
      {/* Page Header */}
      <ProfileHeader />

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
