import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  ClockIcon,
  UserIcon,
  AcademicCapIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { instantSessionService, type InstantRequest } from "@/lib/instantSessionService";
import { getSocket } from "@/lib/socketClient";
import toast from "react-hot-toast";

interface ActiveInstantSessionButtonProps {
  tutorId: string;
}

const ActiveInstantSessionButton: React.FC<ActiveInstantSessionButtonProps> = ({
  tutorId,
}) => {
  const [activeSession, setActiveSession] = useState<InstantRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [completingSession, setCompletingSession] = useState(false);

  // Realtime: listen for instant session updates (no polling)
  useEffect(() => {
    if (!tutorId) return;

    const refreshSession = async () => {
      try {
        const sessions = await instantSessionService.getTutorSessions(20);
        const active = sessions.find(
          (session) => session.status === "accepted" || session.status === "in_progress"
        );

        if (active) {
          const sessionId = active.id || (active as any)._id;
          const detailedSession = await instantSessionService.getRequestStatus(sessionId);

          if (
            detailedSession &&
            (detailedSession.status === "accepted" || detailedSession.status === "in_progress")
          ) {
            setActiveSession(detailedSession);
          } else {
            setActiveSession(null);
          }
        } else {
          setActiveSession(null);
        }
      } catch (error) {
        console.error("[ActiveInstantSession] Error refreshing session:", error);
        setActiveSession(null);
      }
    };

    refreshSession();

    // Listen for custom event from InstantSessionRequestPopup
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const session = customEvent.detail?.session;
      if (session && (session.status === "accepted" || session.status === "in_progress")) {
        console.log("[ActiveInstantSession] Custom event received, refreshing session");
        refreshSession();
      }
    };

    window.addEventListener('instant-session-accepted', handleCustomEvent);

    const socket = getSocket();
    if (!socket) {
      return () => {
        window.removeEventListener('instant-session-accepted', handleCustomEvent);
      };
    }

    const handleStatus = (payload: any) => {
      const session = payload?.session;
      if (!session) return;
      const tutorMatch =
        session.tutorId === tutorId ||
        session.tutorId?._id === tutorId ||
        session.tutorId?.id === tutorId;
      if (!tutorMatch) return;

      if (session.status === "accepted" || session.status === "in_progress") {
        const id = session.id || session._id;
        setActiveSession({ ...session, id, _id: id } as any);
      } else {
        // Show notification when session ends
        if (session.status === "completed") {
          // Only show notification if student completed it (not tutor)
          // Extract the actual ID strings for comparison
          const completedById = typeof session.completedBy === 'object' && session.completedBy?._id
            ? session.completedBy._id.toString()
            : session.completedBy?.toString();

          const studentId = typeof session.studentId === 'object' && session.studentId?._id
            ? session.studentId._id.toString()
            : session.studentId?.toString();

          const completedByStudent = completedById && studentId && completedById === studentId;

          if (completedByStudent) {
            const studentName = typeof session.studentId === 'object' && session.studentId
              ? session.studentId.fullName || 'Student'
              : 'Student';
            toast.success(`${studentName} has ended the instant session`);
          }
        }
        setActiveSession(null);
      }
    };

    socket.on("instant:status", handleStatus);

    return () => {
      window.removeEventListener('instant-session-accepted', handleCustomEvent);
      socket.off("instant:status", handleStatus);
    };
  }, [tutorId]);

  const handleJoinSession = async () => {
    if (!activeSession) return;

    // Open blank tab SYNCHRONOUSLY to avoid mobile popup blockers
    const meetingWindow = window.open("about:blank", "_blank");

    if (!meetingWindow) {
      toast.error("Please allow popups and try again, or tap the Join button again.");
      return;
    }

    // Show loading message
    try {
      meetingWindow.document.write(`
        <!doctype html><meta charset="utf-8">
        <title>Joining meeting…</title>
        <body style="font-family:system-ui;padding:24px;text-align:center">
        <h1>Joining your meeting…</h1>
        <p>Please wait while we connect you.</p>
        </body>`);
      meetingWindow.document.close();
    } catch (e) {
      // Ignore
    }

    const sessionId = activeSession.id || activeSession._id;

    try {
      // Show loading toast locally too
      const loadingToast = toast.loading("Preparing meeting room...");

      // Get fresh session data to ensure we have the latest meeting URL
      const freshSessionData = await instantSessionService.getRequestStatus(sessionId);

      // Check if we have a valid session with the right status
      if (freshSessionData) {
        console.log("[ActiveInstantSession] Current session status:", freshSessionData.status);

        // Update our local state with the fresh data
        setActiveSession(freshSessionData);

        // Mark tutor as joined so student can join (do this first, before opening the URL)
        if (!freshSessionData.tutorJoinedAt) {
          try {
            console.log("[ActiveInstantSession] Marking tutor as joined");
            const joinedSession = await instantSessionService.markTutorJoined(sessionId);
            if (joinedSession) {
              setActiveSession(joinedSession);
              freshSessionData.jitsiMeetingUrl = joinedSession.jitsiMeetingUrl;
            }
          } catch (joinError) {
            console.error("[ActiveInstantSession] Error marking tutor as joined:", joinError);
          }
        }

        // If we have a meeting URL, open it
        if (freshSessionData.jitsiMeetingUrl) {
          toast.dismiss(loadingToast);

          try {
            meetingWindow.location.replace(freshSessionData.jitsiMeetingUrl);
          } catch (e) {
            meetingWindow.location.href = freshSessionData.jitsiMeetingUrl;
          }

          toast.success("Opening meeting room...");
          return;
        }

        // If no URL, fetch one more time
        const finalSession = await instantSessionService.getRequestStatus(sessionId);
        if (finalSession?.jitsiMeetingUrl) {
          toast.dismiss(loadingToast);
          setActiveSession(finalSession);

          try {
            meetingWindow.location.replace(finalSession.jitsiMeetingUrl);
          } catch (e) {
            meetingWindow.location.href = finalSession.jitsiMeetingUrl;
          }

          toast.success("Opening meeting room...");
          return;
        }
      }

      // If we got here, we couldn't get a meeting URL
      toast.dismiss(loadingToast);
      toast.error("Meeting URL not available. Please try again in a few moments or complete the session.");
      // Close the blank window since we failed
      meetingWindow.close();

    } catch (error) {
      console.error("[ActiveInstantSession] Error joining session:", error);
      toast.error("Failed to join meeting. Please try again.");
      // Close the blank window since we failed
      if (meetingWindow) meetingWindow.close();
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;

    setCompletingSession(true);
    try {
      await instantSessionService.completeSession(activeSession.id || activeSession._id);
      toast.success("Session completed successfully!");
      setActiveSession(null);
      setShowDetails(false);
    } catch (error: any) {
      console.error("[ActiveInstantSession] Error completing session:", error);
      toast.error(error.message || "Failed to complete session");
    } finally {
      setCompletingSession(false);
    }
  };

  const getStudentName = (session: InstantRequest): string => {
    if (typeof session.studentId === 'object' && session.studentId) {
      return session.studentId.fullName || 'Student';
    }
    return 'Student';
  };

  const getSubjectName = (session: InstantRequest): string => {
    if (typeof session.subjectId === 'object' && session.subjectId) {
      return session.subjectId.displayName || session.subjectId.name || 'Subject';
    }
    return 'Subject';
  };

  const getSubjectColor = (session: InstantRequest): string => {
    if (typeof session.subjectId === 'object' && session.subjectId) {
      return session.subjectId.color || 'blue';
    }
    return 'blue';
  };

  const getTimeElapsed = (session: InstantRequest): string => {
    const startTime = new Date(session.acceptedAt || session.requestedAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);

    if (diffMinutes < 1) return 'Just started';
    if (diffMinutes < 60) return `${diffMinutes}m elapsed`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m elapsed`;
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
          className="fixed bottom-24 right-6 z-50"
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
                onClick={() => setShowDetails(true)}
                className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-2xl hover:shadow-blue-500/50 rounded-full w-16 h-16 flex items-center justify-center group relative transition-all duration-200 ease-out"
                size="lg"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 blur-xl animate-pulse"></div>

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
              Instant Session
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="w-6 h-6" />
                    <h2 className="text-xl font-bold">Active Instant Session</h2>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <UserIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Student</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {getStudentName(activeSession)}
                    </p>
                  </div>
                </div>

                {/* Subject Info */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br from-${getSubjectColor(activeSession)}-500 to-${getSubjectColor(activeSession)}-600 rounded-full flex items-center justify-center shadow-lg`}>
                    <AcademicCapIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {getSubjectName(activeSession)}
                    </p>
                  </div>
                </div>

                {/* Time Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {activeSession.durationMinutes} minutes
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Time Elapsed</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        {getTimeElapsed(activeSession)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-800 dark:text-green-400">
                      {activeSession.status === 'in_progress' ? 'Session In Progress' : 'Session Accepted - Ready to Start'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleJoinSession}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span>Join Meeting Room</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </Button>

                  <Button
                    onClick={handleCompleteSession}
                    disabled={completingSession}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
                  >
                    {completingSession ? "Completing..." : "Complete Session"}
                  </Button>

                  <Button
                    onClick={() => setShowDetails(false)}
                    variant="outline"
                    className="w-full py-3 rounded-xl border-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Continue Session
                  </Button>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t dark:border-gray-700">
                  Remember to end the session when finished
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ActiveInstantSessionButton;

