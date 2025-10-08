import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, ClockIcon, UserIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { sessionUtils } from "@/utils/sessionUtils";
import { classSchedulingService } from "@/lib/classSchedulingService";
import toast from "react-hot-toast";
import type { TutorClass } from "@/types/classScheduling";

interface EnrolledStudent {
  id: string;
  fullName: string;
  email: string;
}

interface ActiveSessionFloatingButtonProps {
  tutorId: string;
}

const ActiveSessionFloatingButton: React.FC<ActiveSessionFloatingButtonProps> = ({
  tutorId,
}) => {
  if (!tutorId) {
    return null;
  }

  const [activeSession, setActiveSession] = useState<TutorClass | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);

  // Check for active sessions periodically
  useEffect(() => {
    const checkForActiveSessions = async () => {
      try {
        const upcomingSessions = await classSchedulingService.classes.getByTutorId(tutorId);

        const active = upcomingSessions.find((session: any) =>
          (sessionUtils.isSessionActive(session) || session.status === 'in_progress') &&
          session.status !== 'completed' &&
          session.status !== 'cancelled'
        );

        setActiveSession(active || null);
      } catch (error) {
        console.error("Error checking for active sessions:", error);
      }
    };

    // Check immediately and then every 30 seconds
    checkForActiveSessions();
    const interval = setInterval(checkForActiveSessions, 30000);

    return () => clearInterval(interval);
  }, [tutorId]);

  // Fetch enrolled students when active session changes
  useEffect(() => {
    if (activeSession) {
      fetchEnrolledStudents(activeSession);
    } else {
      setEnrolledStudents([]);
    }
  }, [activeSession]);

  // Fetch enrolled students for the active session
  const fetchEnrolledStudents = async (session: TutorClass) => {
    try {
      if (!session.id) return;

      // Fetch all bookings for this teacher
      const bookings = await classSchedulingService.bookings.getByTeacherId(tutorId);

      // Filter bookings for this specific class that are confirmed
      const classBookings = bookings.filter(booking =>
        booking.class_id === session.id &&
        booking.status === 'confirmed' &&
        booking.booking_status === 'confirmed'
      );

      // Extract unique student information
      const students: EnrolledStudent[] = classBookings
        .filter(booking => booking.studentId && typeof booking.studentId === 'object')
        .map(booking => {
          const studentData = booking.studentId as any;
          return {
            id: studentData._id || studentData.id,
            fullName: studentData.fullName || studentData.firstName + ' ' + studentData.lastName || 'Unknown Student',
            email: studentData.email || '',
          };
        })
        .filter((student, index, self) =>
          // Remove duplicates based on ID
          index === self.findIndex(s => s.id === student.id)
        );

      setEnrolledStudents(students);
    } catch (error) {
      console.error("Error fetching enrolled students:", error);
      setEnrolledStudents([]);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    console.log("Ending session:", activeSession);
    setEndingSession(true);
    try {
      await classSchedulingService.classes.update(activeSession.id, {
        status: "completed",
      });

      toast.success("Session ended successfully!");
      setActiveSession(null);
      setShowDetails(false);
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Failed to end session. Please try again.");
    } finally {
      setEndingSession(false);
    }
  };

  if (!activeSession) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            y: 0,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 25,
              duration: 0.4,
            }
          }}
          exit={{ 
            scale: 0.8, 
            opacity: 0, 
            y: 50,
            transition: {
              duration: 0.2,
              ease: "easeInOut"
            }
          }}
          className="fixed bottom-6 right-6 z-50"
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
              transition: {
                duration: 2,
                repeat: Infinity,
                ease: [0.4, 0.0, 0.2, 1],
              },
            }}
            className="flex flex-col items-center space-y-2"
          >
            <motion.div
              whileHover={{ 
                scale: 1.12,
                rotate: [0, -3, 3, 0],
                transition: { duration: 0.3, ease: "easeOut" }
              }}
              whileTap={{ 
                scale: 0.92,
                transition: { duration: 0.1, ease: "easeInOut" }
              }}
            >
            <Button
              onClick={() => {
                console.log("Opening modal for session:", activeSession);
                setShowDetails(true);
              }}
              className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-2xl hover:shadow-red-500/50 rounded-full w-16 h-16 flex items-center justify-center group relative transition-all duration-200 ease-out"
              size="lg"
            >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 blur-xl animate-pulse"></div>
                
                <ClockIcon className="w-8 h-8 relative z-10 transition-transform duration-200 group-hover:scale-110" />
                
                {/* Pulsing indicator with ring */}
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  <div className="absolute w-6 h-6 bg-green-400 rounded-full opacity-30 animate-ping"></div>
                  <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse relative z-10"></div>
                </div>
              </Button>
            </motion.div>

            {/* Label with enhanced animation */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: {
                  delay: 0.15,
                  duration: 0.3,
                  ease: "easeOut"
                }
              }}
              className="bg-gradient-to-r from-slate-800 to-slate-900 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xl border border-slate-700 backdrop-blur-sm will-change-transform"
            >
              Ongoing Class
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Session Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Active Session</h2>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Session Info */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activeSession.title || "Active Session"}
                  </h3>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="w-5 h-5 text-gray-500" />
                      <div className="flex-1">
                        <span className="text-gray-700">
                          <strong>Students:</strong> {enrolledStudents.length} enrolled
                        </span>
                        {enrolledStudents.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {enrolledStudents.map((student) => (
                              <div key={student.id} className="text-sm text-gray-600 bg-white rounded-md px-2 py-1 border border-gray-200">
                                {student.fullName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <CalendarDaysIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">
                        <strong>Time:</strong>{" "}
                        {(() => {
                          try {
                            const dateStr = activeSession.date || activeSession.startDate;
                            const timeStr = activeSession.start_time || activeSession.schedule?.startTime;

                            if (dateStr && timeStr) {
                              // Handle different date formats
                              let dateOnly;
                              if (dateStr.includes('T')) {
                                // ISO date string, extract date part
                                dateOnly = dateStr.split('T')[0];
                              } else {
                                dateOnly = dateStr;
                              }

                              // Try the formatted version first
                              try {
                                return sessionUtils.formatSessionTime(dateOnly, timeStr);
                              } catch (formatError) {
                                console.error("Session utils format error:", formatError);
                                // Fallback to simple date/time display
                                const date = new Date(dateOnly);
                                return `${date.toLocaleDateString()} at ${timeStr}`;
                              }
                            }
                            return "Time not available";
                          } catch (error) {
                            console.error("Error formatting session time:", error, {
                              dateStr: activeSession.date,
                              timeStr: activeSession.start_time,
                              fullSession: activeSession
                            });
                            return "Invalid time format";
                          }
                        })()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <ClockIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">
                        <strong>Duration:</strong> {activeSession.duration_minutes || activeSession.schedule?.duration || "N/A"} minutes
                      </span>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-800">
                        {activeSession.status === 'in_progress' ? 'Session In Progress' : 'Session Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={handleEndSession}
                    disabled={endingSession}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold"
                  >
                    {endingSession ? "Ending Session..." : "End Session"}
                  </Button>

                  <Button
                    onClick={() => setShowDetails(false)}
                    variant="outline"
                    className="w-full py-3 rounded-lg"
                  >
                    Continue Session
                  </Button>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 pt-2 border-t">
                  Session will automatically end at the scheduled time
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ActiveSessionFloatingButton;
