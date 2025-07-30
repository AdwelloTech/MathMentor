import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  VideoCameraIcon,
  ClockIcon,
  UserIcon,
  XMarkIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import type { StudentUpcomingSession } from "@/types/classScheduling";
import { sessionUtils } from "@/utils/sessionUtils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface SessionRoomProps {
  session: StudentUpcomingSession;
  onClose: () => void;
}

const SessionRoom: React.FC<SessionRoomProps> = ({ session, onClose }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateTimeRemaining = () => {
      const sessionStart = new Date(`${session.date}T${session.start_time}`);
      const sessionEnd = new Date(`${session.date}T${session.end_time}`);
      const now = new Date();

      if (now < sessionStart) {
        // Session hasn't started yet
        const diff = sessionStart.getTime() - now.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      } else if (now >= sessionStart && now <= sessionEnd) {
        // Session is active
        const diff = sessionEnd.getTime() - now.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      } else {
        // Session has ended
        setTimeRemaining("Ended");
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const handleJoinZoom = async () => {
    setLoading(true);
    try {
      sessionUtils.joinZoomMeeting(session);
    } catch (error) {
      console.error("Error joining Zoom meeting:", error);
    } finally {
      setLoading(false);
    }
  };

  const sessionStatus = sessionUtils.getSessionStatus(session);
  const canJoin =
    sessionUtils.canJoinSession(session) ||
    sessionUtils.isSessionActive(session);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <VideoCameraIcon className="w-6 h-6" />
              <h2 className="text-xl font-bold">Session Room</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Session Info */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {session.title}
              </h3>
              <p className="text-gray-600">{session.description}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <UserIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">
                  <strong>Tutor:</strong> {session.tutor.full_name}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <ClockIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">
                  <strong>Time:</strong>{" "}
                  {sessionUtils.formatSessionTime(
                    session.date,
                    session.start_time
                  )}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <ClockIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">
                  <strong>Duration:</strong> {session.duration_minutes} minutes
                </span>
              </div>
            </div>
          </div>

          {/* Status and Timer */}
          <div className="text-center space-y-2">
            <div className={`text-lg font-semibold ${sessionStatus.color}`}>
              {sessionStatus.label}
            </div>
            {timeRemaining && (
              <div className="text-2xl font-bold text-gray-900">
                {timeRemaining}
              </div>
            )}
          </div>

          {/* Join Button */}
          <div className="space-y-4">
            {canJoin ? (
              <motion.button
                onClick={handleJoinZoom}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <PlayIcon className="w-6 h-6" />
                    <span>Join Zoom Meeting</span>
                  </>
                )}
              </motion.button>
            ) : (
              <div className="text-center">
                <div className="bg-gray-100 text-gray-600 py-4 rounded-xl">
                  <div className="text-sm font-medium mb-1">
                    Session not ready
                  </div>
                  <div className="text-xs">
                    Join button will be available 5 minutes before the session
                    starts
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click "Join Zoom Meeting" to open the session</li>
              <li>• Make sure your microphone and camera are working</li>
              <li>• Be on time and ready to learn!</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SessionRoom;
