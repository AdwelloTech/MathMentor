import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface ApplicationStatusBannerProps {
  isActiveTutor: boolean;
  isOnline: boolean;
}

const ApplicationStatusBanner: React.FC<ApplicationStatusBannerProps> = ({
  isActiveTutor,
  isOnline,
}) => {
  return (
    <div id="tutor-status-overview" className="space-y-4">
      {!isActiveTutor && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-start">
            <XCircleIcon className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">
                Account Temporarily Inactive
              </h3>
              <p className="text-sm text-destructive/80 mt-1">
                Your tutor account has been temporarily deactivated. You
                can still view your dashboard and profile, but you cannot
                schedule new classes or accept new students.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {isActiveTutor && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 border border-success/20 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-success">
                Setup Complete!
              </h3>
              <p className="text-sm text-success/80 mt-1">
                Your tutor application and ID verification have been
                approved. You can now schedule classes and start teaching!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {isActiveTutor && !isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/20 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-start">
            <ClockIcon className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-primary">
                You are currently offline
              </h3>
              <p className="text-sm text-primary/80 mt-1">
                Toggle the online switch above to start receiving instant
                session requests from students.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ApplicationStatusBanner;
