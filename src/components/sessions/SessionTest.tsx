import React, { useState } from "react";
import { motion } from "framer-motion";
import { PlayIcon, ClockIcon, UserIcon } from "@heroicons/react/24/outline";
import type { StudentUpcomingSession } from "@/types/classScheduling";
import { sessionUtils } from "@/utils/sessionUtils";
import SessionRoom from "./SessionRoom";

// Mock session data for testing
const mockSession: StudentUpcomingSession = {
  id: "test-booking-1",
  title: "Algebra Fundamentals",
  description: "Learn the basics of algebra with interactive examples",
  date: new Date(Date.now() + 10 * 60 * 1000).toISOString().split("T")[0], // 10 minutes from now
  start_time: new Date(Date.now() + 10 * 60 * 1000).toTimeString().slice(0, 5),
  end_time: new Date(Date.now() + 25 * 60 * 1000).toTimeString().slice(0, 5), // 15 minutes later
  duration_minutes: 15,
  jitsi_meeting_url: "https://meet.jit.si/jitsi_room_test_123456789",
  jitsi_room_name: "jitsi_room_test_123456789",
  jitsi_password: "test123",
  class_status: "scheduled",
  booking_status: "confirmed",
  payment_status: "paid",
  class_type: "One-to-One",
  tutor: {
    id: "tutor-1",
    full_name: "Dr. Sarah Johnson",
    email: "sarah.johnson@example.com",
  },
};

const SessionTest: React.FC = () => {
  const [showSessionRoom, setShowSessionRoom] = useState(false);

  const sessionStatus = sessionUtils.getSessionStatus(mockSession);
  const canJoin =
    sessionUtils.canJoinSession(mockSession) ||
    sessionUtils.isSessionActive(mockSession);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Session Joining System Test
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Session Info Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
              <h2 className="text-xl font-bold mb-4">Session Information</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <UserIcon className="w-5 h-5" />
                  <span>
                    <strong>Tutor:</strong> {mockSession.tutor.full_name}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-5 h-5" />
                  <span>
                    <strong>Time:</strong>{" "}
                    {sessionUtils.formatSessionTime(
                      mockSession.date,
                      mockSession.start_time
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <ClockIcon className="w-5 h-5" />
                  <span>
                    <strong>Duration:</strong> {mockSession.duration_minutes}{" "}
                    minutes
                  </span>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Session Status
              </h2>
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${sessionStatus.color} mb-2`}
                  >
                    {sessionStatus.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: {sessionStatus.status}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Can Join Session:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        canJoin ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {canJoin ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Session Active:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        sessionUtils.isSessionActive(mockSession)
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {sessionUtils.isSessionActive(mockSession) ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Session Ended:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        sessionUtils.isSessionEnded(mockSession)
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {sessionUtils.isSessionEnded(mockSession) ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <motion.button
                onClick={() => setShowSessionRoom(true)}
                disabled={!canJoin}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-3 mx-auto ${
                  canJoin
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                whileHover={canJoin ? { scale: 1.05 } : {}}
                whileTap={canJoin ? { scale: 0.95 } : {}}
              >
                <PlayIcon className="w-6 h-6" />
                <span>Test Session Room</span>
              </motion.button>
            </div>

            <div className="text-center text-sm text-gray-600">
              {canJoin ? (
                <p>
                  ✅ Session can be joined! Click the button above to test the
                  session room.
                </p>
              ) : (
                <p>⏳ Session will be available 5 minutes before start time.</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">
              How it works:
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>
                • The "Join Session" button becomes active 5 minutes before the
                session starts
              </li>
              <li>
                • During the session, students can click to open Zoom in a new
                tab
              </li>
              <li>
                • The session room shows real-time countdown and session status
              </li>
              <li>
                • All session data comes from the database (this is a test with
                mock data)
              </li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Session Room Modal */}
      {showSessionRoom && (
        <SessionRoom
          session={mockSession}
          onClose={() => setShowSessionRoom(false)}
        />
      )}
    </div>
  );
};

export default SessionTest;
