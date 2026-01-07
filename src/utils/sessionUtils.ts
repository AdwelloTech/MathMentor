import type { StudentUpcomingSession } from "@/types/classScheduling";
import {
  canJoinGMTSession,
  isGMTSessionActive,
  isGMTSessionEnded,
  formatGMTTimeWithRelativeDate,
} from "./gmtTimeUtils";

export const sessionUtils = {
  // Check if session can be joined (5 minutes before start)
  // All times are in GMT
  canJoinSession: (session: StudentUpcomingSession): boolean => {
    return canJoinGMTSession(session.date, session.start_time);
  },

  // Check if session is currently active
  // All times are in GMT
  isSessionActive: (session: StudentUpcomingSession): boolean => {
    return isGMTSessionActive(session.date, session.start_time, session.end_time);
  },

  // Check if session has ended
  // All times are in GMT
  isSessionEnded: (session: StudentUpcomingSession): boolean => {
    return isGMTSessionEnded(session.date, session.end_time);
  },

  // Format session time for display
  // All times are displayed in GMT with GMT label
  formatSessionTime: (date: string, startTime: string): string => {
    return formatGMTTimeWithRelativeDate(date, startTime);
  },

  // Get session status for display
  getSessionStatus: (
    session: StudentUpcomingSession
  ): {
    status: "upcoming" | "can-join" | "active" | "ended";
    label: string;
    color: string;
  } => {
    if (sessionUtils.isSessionEnded(session)) {
      return { status: "ended", label: "Ended", color: "text-gray-500" };
    }

    if (sessionUtils.isSessionActive(session)) {
      return {
        status: "active",
        label: "In Progress",
        color: "text-green-600",
      };
    }

    if (sessionUtils.canJoinSession(session)) {
      return { status: "can-join", label: "Join Now", color: "text-blue-600" };
    }

    return { status: "upcoming", label: "Upcoming", color: "text-gray-600" };
  },

  // Open Jitsi meeting in new tab
  joinJitsiMeeting: (session: StudentUpcomingSession): void => {
    if (session.jitsi_meeting_url) {
      window.open(session.jitsi_meeting_url, "_blank");
    } else {
      console.error("No Jitsi meeting link available for this session");
    }
  },
};
