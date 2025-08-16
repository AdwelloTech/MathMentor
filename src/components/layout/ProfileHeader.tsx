import React from "react";
import { motion } from "framer-motion";
import { UserIcon } from "@heroicons/react/24/outline";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const ProfileHeader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-2xl p-8 shadow-lg max-w-full mx-auto">
        <div className="flex items-center space-x-4">
          {/* Icon Container */}
          <div className="relative">
            <div className="p-4 bg-yellow-400 rounded-2xl shadow-md">
              <UserIcon className="h-8 w-8 text-emerald-900" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-white">My Profile</h1>
              <Badge
                variant="secondary"
                className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30 rounded-xl px-3 py-1"
              >
                Active
              </Badge>
            </div>
            <p className="text-emerald-100 text-base leading-relaxed">
              Manage your personal information and learning preferences with our
              modern, secure profile system.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 text-sm text-white border border-white/20">
                📚 Learning Preferences
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 text-sm text-white border border-white/20">
                🔒 Secure Data
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 text-sm text-white border border-white/20">
                ⚡ Real-time Sync
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none">
          <div className="absolute top-4 right-4 w-32 h-32 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-emerald-300 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="relative mt-4">
        <Separator className="bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
        <div className="absolute inset-0 flex justify-center">
          <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-900 to-yellow-400 rounded-full -mt-px"></div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
