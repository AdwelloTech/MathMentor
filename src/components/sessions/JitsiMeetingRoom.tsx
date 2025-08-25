import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  VideoCameraIcon,
  ClockIcon,
  UserIcon,
  XMarkIcon,
  PlayIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import type { StudentUpcomingSession } from "@/types/classScheduling";
import { sessionUtils } from "@/utils/sessionUtils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SessionTimer from "./SessionTimer";

interface JitsiMeetingRoomProps {
  session: StudentUpcomingSession;
  onClose: () => void;
  userDisplayName?: string;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const JitsiMeetingRoom: React.FC<JitsiMeetingRoomProps> = ({
  session,
  onClose,
  userDisplayName = "Student",
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [jitsiApi, setJitsiApi] = useState<any>(null);
  const [isJitsiLoaded, setIsJitsiLoaded] = useState(false);
  const [showEmbedded, setShowEmbedded] = useState(false);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  // Extract room name from Jitsi URL
  const getRoomName = (url: string): string => {
    const urlParts = url.split("/");
    return urlParts[urlParts.length - 1] || "default-room";
  };

  const roomName = session.jitsi_meeting_url
    ? getRoomName(session.jitsi_meeting_url)
    : `room-${session.id}`;

  // Cleanup function for Jitsi API and modal state
  const cleanup = useCallback(() => {
    if (jitsiApi) {
      console.log("Cleaning up Jitsi API");
      jitsiApi.dispose();
      setJitsiApi(null);
    }
    setShowEmbedded(false);
    setLoading(false);
  }, [jitsiApi]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Load Jitsi Meet External API
  useEffect(() => {
    const loadJitsiScript = () => {
      if (window.JitsiMeetExternalAPI) {
        setIsJitsiLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => {
        setIsJitsiLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load Jitsi Meet External API");
      };
      document.head.appendChild(script);
    };

    loadJitsiScript();
  }, []);

  const initializeJitsiMeeting = () => {
    if (!isJitsiLoaded || !jitsiContainerRef.current) {
      console.error("Jitsi not loaded or container not available");
      return;
    }

    setLoading(true);

    const options = {
      roomName: roomName,
      width: "100%",
      height: 400,
      parentNode: jitsiContainerRef.current,
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        enableClosePage: false,
        prejoinPageEnabled: false,
        requireDisplayName: true,
        disableInviteFunctions: true,
        doNotStoreRoom: true,
        startScreenSharing: false,
        enableEmailInStats: false,
      },
      interfaceConfigOverwrite: {
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_BUTTONS: [
          "microphone",
          "camera",
          "closedcaptions",
          "desktop",
          "fullscreen",
          "fodeviceselection",
          "hangup",
          "profile",
          "chat",
          "recording",
          "livestreaming",
          "etherpad",
          "sharedvideo",
          "settings",
          "raisehand",
          "videoquality",
          "filmstrip",
          "invite",
          "feedback",
          "stats",
          "shortcuts",
          "tileview",
          "videobackgroundblur",
          "download",
          "help",
          "mute-everyone",
        ],
      },
      userInfo: {
        displayName: userDisplayName,
      },
    };

    try {
      const api = new window.JitsiMeetExternalAPI("meet.jit.si", options);

      // Store API immediately—construction is synchronous
      setJitsiApi(api);

      // Clear loading once the local participant has joined
      api.addEventListener("videoConferenceJoined", () => {
        console.log("Jitsi: local user joined");
        setLoading(false);
      });

      api.addEventListener("participantLeft", (participant: any) => {
        console.log("Participant left:", participant);
      });

      api.addEventListener("videoConferenceLeft", () => {
        console.log("User left the conference");
        api.dispose();
        setJitsiApi(null);
        setShowEmbedded(false);
      });

      api.addEventListener("readyToClose", () => {
        console.log("Ready to close");
        api.dispose();
        setJitsiApi(null);
        setShowEmbedded(false);
      });
    } catch (error) {
      console.error("Error initializing Jitsi Meet:", error);
      setLoading(false);
    }
  };

  const handleJoinJitsi = () => {
    if (showEmbedded) {
      // If embedded mode is active, just show the container
      return;
    }

    if (isJitsiLoaded) {
      setShowEmbedded(true);
      setTimeout(() => {
        initializeJitsiMeeting();
      }, 100);
    } else {
      // Fallback to opening in new tab
      sessionUtils.joinJitsiMeeting(session);
    }
  };

  const handleOpenInNewTab = () => {
    sessionUtils.joinJitsiMeeting(session);
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
        className={`bg-white rounded-2xl shadow-2xl w-full max-h-[95vh] overflow-hidden ${
          showEmbedded ? "max-w-4xl" : "max-w-md"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <VideoCameraIcon className="w-6 h-6" />
              <h2 className="text-xl font-bold">
                {showEmbedded ? "Live Session" : "Session Room"}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              {showEmbedded && (
                                  <button
                    onClick={() => {
                      cleanup();
                      setShowEmbedded(false);
                    }}
                    className="text-white hover:text-gray-200 transition-colors"
                    title="Minimize"
                  >
                    <CogIcon className="w-5 h-5" />
                  </button>
              )}
              <button
                onClick={() => {
                  cleanup();
                  onClose();
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!showEmbedded ? (
            <>
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
                      <strong>Duration:</strong> {session.duration_minutes}{" "}
                      minutes
                    </span>
                  </div>
                </div>
              </div>

              {/* Session Timer */}
              <SessionTimer
                session={session}
                onSessionEnd={() => {
                  // Handle session end if needed
                }}
              />

              {/* Join Buttons */}
              <div className="space-y-4">
                {canJoin ? (
                  <>
                    <motion.button
                      onClick={handleJoinJitsi}
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
                          <span>Join Meeting Here</span>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      onClick={handleOpenInNewTab}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <VideoCameraIcon className="w-5 h-5" />
                      <span>Open in New Tab</span>
                    </motion.button>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="bg-gray-100 text-gray-600 py-4 rounded-xl">
                      <div className="text-sm font-medium mb-1">
                        Session not ready
                      </div>
                      <div className="text-xs">
                        Join button will be available 5 minutes before the
                        session starts
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Instructions:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Click "Join Meeting Here" for embedded experience</li>
                  <li>• Or "Open in New Tab" for full-screen meeting</li>
                  <li>• Make sure your microphone and camera are working</li>
                  <li>• Be on time and ready to learn!</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Embedded Jitsi Meeting */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">
                    {session.title} - Live Session
                  </h3>
                </div>

                <div
                  ref={jitsiContainerRef}
                  className="w-full bg-gray-100 rounded-lg overflow-hidden"
                  style={{ minHeight: "400px" }}
                >
                  {loading && (
                    <div className="flex items-center justify-center h-96">
                      <LoadingSpinner size="lg" />
                      <span className="ml-3 text-gray-600">
                        Loading meeting...
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      cleanup();
                      setShowEmbedded(false);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Minimize
                  </button>
                  <button
                    onClick={handleOpenInNewTab}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Open in Full Screen
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default JitsiMeetingRoom;
