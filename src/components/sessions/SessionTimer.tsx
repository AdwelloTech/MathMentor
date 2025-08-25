import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SessionRatingModal from "./SessionRatingModal";
import { sessionRatingService } from "@/lib/sessionRatingService";
import { classSchedulingService } from "@/lib/classSchedulingService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import type { StudentUpcomingSession } from "@/types/classScheduling";

interface SessionTimerProps {
  session: StudentUpcomingSession;
  onSessionEnd?: () => void;
  className?: string;
}

const SessionTimer: React.FC<SessionTimerProps> = ({
  session,
  onSessionEnd,
  className = "",
}) => {
  const { user, profile } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isSessionEnded, setIsSessionEnded] = useState<boolean>(false);
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [manuallyEnded, setManuallyEnded] = useState<boolean>(false);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [endingSession, setEndingSession] = useState<boolean>(false);
  const [cancellingSession, setCancellingSession] = useState<boolean>(false);
  const [isSessionCancelled, setIsSessionCancelled] = useState<boolean>(false);

  // Calculate session duration in seconds
  const sessionDuration = session.duration_minutes * 60;

  // Check if student has already rated this specific session
  // Each session can be rated independently, even with the same tutor
  const checkIfRated = useCallback(async () => {
    if (!user) return;

    // Require profile.id for rating checks - don't fall back to user.id
    if (!user.profile?.id) {
      console.log("Rating check skipped - no profile.id available:", {
        sessionId: session.id,
        sessionTitle: session.title,
        hasProfileId: false,
      });
      setHasRated(false);
      return;
    }

    try {
      console.log("Checking if rated for this specific session:", {
        sessionId: session.id,
        sessionTitle: session.title,
        hasProfileId: true,
      });

      const hasRatedSession = await sessionRatingService.hasStudentRated(
        session.id,
        user.profile.id
      );

      console.log("Rating check result for this session:", hasRatedSession);
      setHasRated(hasRatedSession);
    } catch (error) {
      console.error("Error checking if session was rated:", error);
      // If check fails, allow rating (better user experience)
      console.log("Allowing rating due to check failure");
      setHasRated(false);
    }
  }, [session.id, user]);

  // Update timer and session status
  useEffect(() => {
    const updateTimer = () => {
      // Don't update status if manually ended
      if (manuallyEnded) {
        console.log("Timer update blocked - session manually ended");
        return;
      }

      // Check if session is already completed or cancelled in database
      if (session.class_status === "completed") {
        console.log(
          "Session already completed in database - setting ended state"
        );
        setTimeRemaining(0);
        setIsSessionActive(false);
        setIsSessionEnded(true);
        setManuallyEnded(true);
        return;
      }

      if (session.class_status === "cancelled") {
        console.log(
          "Session already cancelled in database - setting cancelled state"
        );
        setTimeRemaining(0);
        setIsSessionActive(false);
        setIsSessionEnded(false);
        setIsSessionCancelled(true);
        return;
      }

      const now = new Date();
      const sessionStart = new Date(`${session.date}T${session.start_time}`);
      const sessionEnd = new Date(`${session.date}T${session.end_time}`);
      const joinWindowStart = new Date(sessionStart.getTime() - 5 * 60 * 1000); // 5 minutes before start

      if (now < joinWindowStart) {
        // Before join window - countdown until join window starts
        const diff = Math.max(
          0,
          Math.floor((joinWindowStart.getTime() - now.getTime()) / 1000)
        );
        setTimeRemaining(diff);
        setIsSessionActive(false);
        setIsSessionEnded(false);
      } else if (now >= joinWindowStart && now <= sessionEnd) {
        // In join window or session is active
        if (now <= sessionStart) {
          // In join window but session hasn't started yet - countdown until session starts
          const diff = Math.max(
            0,
            Math.floor((sessionStart.getTime() - now.getTime()) / 1000)
          );
          setTimeRemaining(diff);
          setIsSessionActive(false);
          setIsSessionEnded(false);
        } else {
          // Session is active
          const diff = Math.max(
            0,
            Math.floor((sessionEnd.getTime() - now.getTime()) / 1000)
          );
          setTimeRemaining(diff);
          setIsSessionActive(true);
          setIsSessionEnded(false);
        }
      } else {
        // Session has ended
        setTimeRemaining(0);
        setIsSessionActive(false);
        setIsSessionEnded(true);
      }
    };

    // If manually ended, immediately set session to ended state
    if (manuallyEnded) {
      console.log("Session manually ended - setting ended state immediately");
      setTimeRemaining(0);
      setIsSessionActive(false);
      setIsSessionEnded(true);
      return; // Don't run timer updates
    }

    // If session is cancelled, don't run timer updates
    if (isSessionCancelled) {
      console.log("Session cancelled - not running timer updates");
      return;
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session, manuallyEnded, isSessionCancelled]);

  // Check if rated when component loads and when session ends
  useEffect(() => {
    if (user) {
      console.log("Checking if already rated for this session...");
      checkIfRated();
    }

    // Log current state for debugging
    console.log("Current state for session:", {
      sessionId: session.id,
      sessionTitle: session.title,
      sessionDate: session.date,
      manuallyEnded,
      ratingSubmitted,
      hasRated,
    });
  }, [user, checkIfRated, manuallyEnded, ratingSubmitted]);

  // Handle initial state when manually ended
  useEffect(() => {
    if (manuallyEnded) {
      console.log(
        "Initial load with manually ended session - setting ended state"
      );
      setTimeRemaining(0);
      setIsSessionActive(false);
      setIsSessionEnded(true);
    }

    // Debug current session status
    console.log("Current session status:", {
      manuallyEnded,
      isSessionActive,
      isSessionEnded,
      timeRemaining,
    });
  }, [manuallyEnded, isSessionActive, isSessionEnded, timeRemaining]);

  // Auto-show rating modal when session ends
  useEffect(() => {
    console.log("Rating modal effect triggered:", {
      isSessionEnded,
      showRatingModal,
      ratingSubmitted,
      hasRated,
    });
    if (isSessionEnded && !showRatingModal && !ratingSubmitted && !hasRated) {
      console.log("Setting up rating modal timer...");
      // Small delay to let user see session ended state
      const timer = setTimeout(() => {
        console.log("Showing rating modal now!");
        setShowRatingModal(true);
      }, 2000);

      return () => clearTimeout(timer);
    } else if (isSessionEnded && (ratingSubmitted || hasRated)) {
      console.log("Session ended and already rated - no modal needed");
    }
  }, [isSessionEnded, showRatingModal, ratingSubmitted, hasRated]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Handle session cancellation (before session starts)
  const handleCancelSession = async () => {
    console.log("🚨 Cancel Session clicked! Current state:", {
      isSessionActive,
      isSessionEnded,
      manuallyEnded,
      timeRemaining,
    });

    if (!isSessionActive && timeRemaining > 0) {
      console.log("✅ Cancelling future session...");
      setCancellingSession(true);

      try {
        // Update the booking status in the database to cancelled
        console.log(
          "🔄 Updating booking status to 'cancelled' for session:",
          session.id
        );

        // We need to update the booking status, not the class status
        // First, we need to find the booking ID for this student and session

        // Require profile.id for cancellation - don't fall back to user.id
        if (!user?.profile?.id) {
          console.error("❌ No profile.id available for cancellation");
          throw new Error("Profile ID not available for cancellation");
        }

        const studentId = user.profile.id;

        console.log("🔍 Cancelling booking for session:", {
          sessionId: session.id,
          sessionTitle: session.title,
          hasProfileId: true,
        });

        // Try to find the booking first to debug
        try {
          // First, let's try to find the booking to see what we're working with
          const { data: existingBookings, error: findError } = await supabase
            .from("class_bookings")
            .select("*")
            .eq("student_id", studentId)
            .eq("class_id", session.id);

          console.log("🔍 Direct database query result:", {
            bookingCount: existingBookings?.length || 0,
            hasError: !!findError,
          });

          if (existingBookings && existingBookings.length > 0) {
            const bookingId = existingBookings[0].id;
            console.log("✅ Found booking for session:", session.id);

            // Try the simpler cancel method first
            try {
              const result = await classSchedulingService.bookings.cancel(
                bookingId
              );
              console.log("✅ Cancellation via cancel method:", result);
            } catch (cancelError) {
              console.log(
                "⚠️ Cancel method failed, trying updateByStudentAndClass:",
                cancelError
              );

              // Fallback to direct update
              const result = await classSchedulingService.bookings.update(
                bookingId,
                { booking_status: "cancelled" }
              );
              console.log("✅ Cancellation via direct update:", result);
            }
          } else {
            console.error("❌ No booking found in direct query");
            throw new Error("No booking found for this student and class");
          }
        } catch (error) {
          console.error("❌ Cancellation failed:", error);
          throw error;
        }

        console.log("✅ Session cancelled successfully in database!");

        // Set cancellation state
        setIsSessionCancelled(true);
        setIsSessionActive(false);
        setIsSessionEnded(false);
        setTimeRemaining(0);

        onSessionEnd?.();
        toast.success("Session cancelled successfully!");

        console.log("✅ Session cancelled! State should now be:", {
          isSessionCancelled: true,
          isSessionActive: false,
          isSessionEnded: false,
        });
      } catch (error) {
        console.error("❌ Failed to cancel session in database:", {
          sessionId: session.id,
          sessionTitle: session.title,
          errorMessage: (error as any).message,
        });
        toast.error("Failed to cancel session. Please try again.");
      } finally {
        setCancellingSession(false);
      }
    } else {
      console.log("❌ Session cannot be cancelled - already active or ended");
    }
  };

  // Handle manual session end
  const handleEndSession = async () => {
    // Security check: Only tutors can end sessions
    if (!profile?.role || profile.role !== "tutor") {
      console.error("❌ Unauthorized: Only tutors can end sessions");
      toast.error("You don't have permission to end this session");
      return;
    }

    console.log("🚨 End Session clicked! Current state:", {
      isSessionActive,
      isSessionEnded,
      manuallyEnded,
      timeRemaining,
    });

    // Only allow ending if session is active OR if it's a future session (for testing)
    if (isSessionActive || timeRemaining > 0) {
      console.log("✅ Setting session to ended...");
      setEndingSession(true);

      try {
        // Update the session status in the database
        console.log(
          "🔄 Updating session status to 'completed' for session:",
          session.id
        );

        // First check if the session exists and can be updated
        console.log("🔍 Session data being updated:", {
          sessionId: session.id,
          currentStatus: session.class_status,
          newStatus: "completed",
        });

        await classSchedulingService.classes.update(session.id, {
          status: "completed",
        });

        console.log("✅ Database updated successfully!");

        // Set all states immediately
        setIsSessionActive(false);
        setIsSessionEnded(true);
        setManuallyEnded(true);

        console.log("🚨 States set, checking in 100ms...");

        // Check if states were actually set
        setTimeout(() => {
          console.log("🚨 State check after 100ms:", {
            isSessionActive,
            isSessionEnded,
            manuallyEnded,
          });
        }, 100);

        onSessionEnd?.();
        toast.success("Session ended successfully!");

        console.log("✅ Session ended successfully! State should now be:", {
          isSessionActive: false,
          isSessionEnded: true,
          manuallyEnded: true,
        });
      } catch (error) {
        console.error("❌ Failed to update session status in database:", error);
        console.error("Error details:", {
          message: (error as any).message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
        });
        toast.error("Failed to end session. Please try again.");
      } finally {
        setEndingSession(false);
      }
    } else {
      console.log("❌ Session cannot be ended - not active and not future");
    }
  };

  // Handle rating submission
  const handleRatingSubmit = async (ratingData: any) => {
    try {
      console.log("Rating submitted with data:", ratingData);
      setShowRatingModal(false);
      setRatingSubmitted(true);
      setHasRated(true); // Mark as rated for this session

      // Note: Not persisting to localStorage to avoid cross-session issues

      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Error handling rating submission:", error);
      toast.error("Failed to submit rating");
    }
  };

  // Get status display
  const getStatusDisplay = () => {
    if (isSessionCancelled) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-red-600" />,
        text: "Session Cancelled",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
      };
    }

    if (isSessionEnded) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        text: "Session Ended",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      };
    }

    if (isSessionActive) {
      return {
        icon: <Clock className="w-5 h-5 text-blue-600" />,
        text: "Session Active",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    }

    return {
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      text: "Starting Soon",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    };
  };

  const status = getStatusDisplay();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full bg-white rounded-lg border ${status.borderColor} shadow-sm ${className}`}
      >
        <div className="p-3">
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {status.icon}
                <span className={`text-sm font-medium ${status.color}`}>
                  {status.text}
                </span>
              </div>
              <div className="text-xs text-blue-600 font-medium">
                {session.duration_minutes || 30} min session
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Timer Display */}
            <div className="text-xl font-bold text-gray-900 font-mono">
              {isSessionCancelled ? "0:00" : formatTime(timeRemaining)}
            </div>

            {/* Action Button - Show Cancel before session starts, End Session when active */}
            {!isSessionCancelled && !isSessionEnded && (
              <>
                {!isSessionActive && timeRemaining > 0 ? (
                  // Cancel Session button (before session starts)
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelSession}
                    disabled={cancellingSession}
                    className="border-orange-200 text-orange-600 hover:bg-orange-50 disabled:opacity-50 text-xs px-2 py-1 h-6"
                  >
                    {cancellingSession ? "Cancelling..." : "Cancel Session"}
                  </Button>
                ) : (
                  // End Session button (when session is active) - Only for tutors
                  profile?.role === "tutor" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEndSession}
                      disabled={endingSession}
                      className="border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-xs px-2 py-1 h-6"
                    >
                      {endingSession ? "Ending..." : "End Session"}
                    </Button>
                  ) : null
                )}
              </>
            )}
          </div>

          {/* Rating Button - Only show when session ended */}
          {isSessionEnded && !ratingSubmitted && !hasRated && (
            <div className="text-center mt-2">
              <Button
                onClick={() => setShowRatingModal(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1 h-6"
              >
                Rate Session
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Rating Modal */}
      <SessionRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        session={session}
        onSubmit={() => handleRatingSubmit({})}
      />
    </>
  );
};

export default SessionTimer;
