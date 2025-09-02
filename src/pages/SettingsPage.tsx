import React from "react";
import { motion } from "framer-motion";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";

const SettingsPage: React.FC = () => {
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
          <Cog6ToothIcon className="h-8 w-8 text-primary-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your account preferences and system settings.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Settings Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="card">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Account Settings
            </h2>
            <p className="text-gray-600">
              Settings page for {profile?.role} users is coming soon. Here
              you'll be able to manage:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• Account preferences</li>
              <li>• Notification settings</li>
              <li>• Privacy controls</li>
              <li>• Security settings</li>
              <li>• Theme preferences</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
