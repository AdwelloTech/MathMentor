import React, { useState } from "react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

interface OnlineStatusToggleProps {
  className?: string;
}

const OnlineStatusToggle: React.FC<OnlineStatusToggleProps> = ({
  className,
}) => {
  const { profile, updateProfile } = useAuth();
  const [isOnline, setIsOnline] = useState(profile?.is_online || false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    if (!profile?.id) return;

    setIsUpdating(true);
    const previousStatus = isOnline;
    const newStatus = !isOnline;

    try {
      // Optimistically update UI
      setIsOnline(newStatus);

      // Update database via profile endpoint
      await apiClient.put(`/api/auth/profile`, { isOnline: newStatus });

      // Update local context
      if (updateProfile) {
        await updateProfile({ is_online: newStatus } as any);
      }

      toast.success(
        newStatus
          ? "You are now online and available for instant sessions"
          : "You are now offline"
      );
    } catch (error) {
      console.error("Failed to update online status:", error);
      // Revert on error
      setIsOnline(previousStatus);
      toast.error("Failed to update online status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!profile || profile.role !== "tutor") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center space-x-3 ${className}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={isUpdating}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
          isOnline ? "bg-green-600" : "bg-gray-300"
        } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
            isOnline ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <Label
        className={`text-sm font-medium cursor-pointer ${
          isOnline ? "text-green-700" : "text-gray-600"
        }`}
        onClick={handleToggle}
      >
        {isOnline ? "Online" : "Offline"}
      </Label>
      {isUpdating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"
        />
      )}
    </motion.div>
  );
};

export default OnlineStatusToggle;
