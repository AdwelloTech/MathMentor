import type { StudentUpcomingSession } from "@/types/classScheduling";

export const sessionUtils = {
  // Check if session can be joined (5 minutes before start)
  canJoinSession: (session: StudentUpcomingSession): boolean => {
    const sessionDateTime = new Date(`${session.date}T${session.start_time}`);
    const now = new Date();
    const fiveMinutesBefore = new Date(
      sessionDateTime.getTime() - 5 * 60 * 1000
    );

    return now >= fiveMinutesBefore && now <= sessionDateTime;
  },

  // Check if session is currently active
  isSessionActive: (session: StudentUpcomingSession): boolean => {
    const sessionStart = new Date(`${session.date}T${session.start_time}`);
    const sessionEnd = new Date(`${session.date}T${session.end_time}`);
    const now = new Date();

    return now >= sessionStart && now <= sessionEnd;
  },

  // Check if session has ended
  isSessionEnded: (session: StudentUpcomingSession): boolean => {
    const sessionEnd = new Date(`${session.date}T${session.end_time}`);
    const now = new Date();

    return now > sessionEnd;
  },

  // Format session time for display
  formatSessionTime: (date: string, startTime: string): string => {
    const sessionDate = new Date(`${date}T${startTime}`);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Format time
    const timeString = sessionDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Format date
    if (sessionDate.toDateString() === today.toDateString()) {
      return `Today, ${timeString}`;
    } else if (sessionDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${timeString}`;
    } else {
      return sessionDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
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
