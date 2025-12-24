import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
// import {
//   SparklesIcon,
//   ClockIcon,
//   UserGroupIcon,
//   XMarkIcon,
//   CheckIcon,
// } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { getRoleContainerClass } from "@/utils/roleStyles";
import type { TutorApplication } from "@/types/auth";
import Sidebar from "./Sidebar";
// import {
//   instantSessionService,
//   type InstantRequest,
// } from "@/lib/instantSessionService";
import { idVerificationService } from "@/lib/idVerificationService";
import apiClient from "@/lib/apiClient";
import { getSocket } from "@/lib/socketClient";
import toast from "react-hot-toast";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tutorApplication, setTutorApplication] =
    useState<TutorApplication | null>(null);
  const [idVerification, setIdVerification] = useState<any>(null);
  const { user, profile, signOut } = useAuth();
  const { isAdminLoggedIn, logoutAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  // const [instantRequests, setInstantRequests] = useState<InstantRequest[]>([]);
  // const [acceptingId, setAcceptingId] = useState<string | null>(null);
  // const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  // const [subjects, setSubjects] = useState<{ [key: string]: string }>({});
  // const FRESH_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const seenMessageIds = useRef<Set<string>>(new Set());

  const syncUnread = (count: number) => {
    setUnreadMessages(count);
    localStorage.setItem("mm_unread_messages", String(count));
    localStorage.setItem("mm_unread_messages_tutor", String(count));
    window.dispatchEvent(new CustomEvent("message:unread", { detail: { count } }));
  };

  useEffect(() => {
    const stored =
      localStorage.getItem("mm_unread_messages") ||
      localStorage.getItem("mm_unread_messages_tutor");
    if (stored) {
      const num = parseInt(stored, 10);
      if (!isNaN(num)) setUnreadMessages(num);
    }

    const handleUnread = (event: any) => {
      const count = event?.detail?.count ?? 0;
      setUnreadMessages(count);
    };
    window.addEventListener("message:unread", handleUnread as any);
    return () => window.removeEventListener("message:unread", handleUnread as any);
  }, []);

  // Global socket listener for new messages (toast + unread)
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user?.id) return;

    const handleNewMessage = (message: any) => {
      const msgId = message.id || message._id;
      if (!msgId) return;
      if (seenMessageIds.current.has(msgId)) return;
      seenMessageIds.current.add(msgId);

      const senderId =
        (typeof message.senderId === "object" && (message.senderId.id || message.senderId._id)) ||
        message.senderId;
      if (senderId === user.id) return;

      const onMessagesPage = location.pathname.startsWith("/messages");
      if (onMessagesPage) return;

      const next = unreadMessages + 1;
      syncUnread(next);

      const senderObj =
        (typeof message.sender === "object" && message.sender) ||
        (typeof message.senderId === "object" && message.senderId) ||
        null;
      const senderName =
        senderObj?.fullName ||
        senderObj?.full_name ||
        [senderObj?.firstName, senderObj?.lastName].filter(Boolean).join(" ") ||
        message.senderName ||
        "someone";

      toast.success(`new message from ${senderName}`);
    };

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [location.pathname, unreadMessages, user?.id]);

  // Audio notification setup (unlocked on first user interaction)
  // const audioCtxRef = useRef<any>(null);
  // const [audioEnabled, setAudioEnabled] = useState(false);

  // Load subjects for display
  // useEffect(() => {
  //   const loadSubjects = async () => {
  //     try {
  //       // Use apiClient for consistent URL handling
  //       const result = await apiClient.get<any[]>('/api/subjects');
  //       if (result) {
  //         const subjectsMap: { [key: string]: string } = {};
  //         result.forEach((subject: any) => {
  //           subjectsMap[subject._id] = subject.displayName || subject.name;
  //         });
  //         setSubjects(subjectsMap);
  //       }
  //     } catch (error) {
  //       // Silently handle subjects loading errors
  //     }
  //   };

  //   loadSubjects();
  // }, []);

  // const getSubjectName = (subjectId: string | { _id: string; name: string; displayName: string; color: string }) => {
  //   const id = typeof subjectId === 'string' ? subjectId : subjectId._id;
  //   return subjects[id] || "Unknown Subject";
  // };

  // useEffect(() => {
  //   const unlock = () => {
  //     try {
  //       const AC =
  //         (window as any).AudioContext || (window as any).webkitAudioContext;
  //       if (!AC) return;
  //       if (!audioCtxRef.current) audioCtxRef.current = new AC();
  //       if (audioCtxRef.current.state !== "running") {
  //         audioCtxRef.current.resume();
  //       }
  //       setAudioEnabled(true);
  //     } catch (_) { }
  //     document.removeEventListener("click", unlock);
  //     document.removeEventListener("keydown", unlock);
  //     document.removeEventListener("touchstart", unlock);
  //   };
  //   document.addEventListener("click", unlock);
  //   document.addEventListener("keydown", unlock);
  //   document.addEventListener("touchstart", unlock);
  //   return () => {
  //     document.removeEventListener("click", unlock);
  //     document.removeEventListener("keydown", unlock);
  //     document.removeEventListener("touchstart", unlock);
  //   };
  // }, []);

  // const playNotificationSound = () => {
  //   try {
  //     if (!audioEnabled) return;
  //     const ctx = audioCtxRef.current;
  //     if (!ctx) return;
  //     const now = ctx.currentTime;
  //     const makeBeep = (startOffset: number) => {
  //       const osc = ctx.createOscillator();
  //       const gain = ctx.createGain();
  //       osc.type = "square";
  //       osc.frequency.setValueAtTime(1200, now + startOffset);
  //       gain.gain.setValueAtTime(0.0001, now + startOffset);
  //       gain.gain.exponentialRampToValueAtTime(0.08, now + startOffset + 0.02);
  //       gain.gain.exponentialRampToValueAtTime(
  //         0.0001,
  //         now + startOffset + 0.15
  //       );
  //       osc.connect(gain);
  //       gain.connect(ctx.destination);
  //       osc.start(now + startOffset);
  //       osc.stop(now + startOffset + 0.16);
  //     };
  //     // Two short beeps
  //     makeBeep(0);
  //     makeBeep(0.2);
  //   } catch (_) {
  //     // no-op
  //   }
  // };

  // Check tutor application and ID verification status on mount
  useEffect(() => {
    if (profile?.role === "tutor" && user) {
      checkTutorApplication();
      checkIDVerification();
    }
  }, [profile?.role, user]);

  // Subscribe to instant requests globally for tutors (websocket)
  // useEffect(() => {
  //   if (profile?.role !== "tutor") return;

  //   const unsubscribe = instantSessionService.subscribeToPending(
  //     ({ new: req, eventType }) => {
  //       const created =
  //         (req as any).createdAt ||
  //         (req as any).requestedAt ||
  //         (req as any).created_at;
  //       const isFresh =
  //         created && Date.now() - new Date(created).getTime() <= FRESH_WINDOW_MS;

  //       if (eventType === "INSERT") {
  //         if (!isFresh) return; // ignore stale backlog
  //         playNotificationSound();
  //         setInstantRequests((prev) => {
  //           const exists = prev.some((r) => r.id === (req as any).id);
  //           if (exists) return prev;
  //           return [req as InstantRequest, ...prev];
  //         });
  //       }

  //       if (eventType === "REMOVE") {
  //         setInstantRequests((prev) =>
  //           prev.filter((r) => r.id !== (req as any).id)
  //         );
  //       }
  //     },
  //     undefined,
  //     profile?.is_online || false
  //   );

  //   return () => {
  //     unsubscribe?.();
  //   };
  // }, [profile?.role, profile?.is_online]);

  const checkTutorApplication = async () => {
    if (!user) return;

    try {
      // Use apiClient instead of direct fetch for consistent URL handling
      const result = await apiClient.get<TutorApplication[]>('/api/tutors/applications');

      if (result && result.length > 0) {
        // Get the most recent application
        const mostRecentApplication = result[0];
        setTutorApplication(mostRecentApplication);
      } else {
        setTutorApplication(null);
      }
    } catch (error) {
      console.error("Error checking tutor application:", error);
    }
  };

  const checkIDVerification = async () => {
    if (!user || !profile) return;

    try {
      const verification = await idVerificationService.getVerificationByUserId();
      setIdVerification(verification);
    } catch (error) {
      console.error("Error checking ID verification:", error);
      setIdVerification(null);
    }
  };

  const handleSignOut = async () => {
    if (isAdminLoggedIn) {
      await logoutAdmin();
      navigate("/admin/login");
    } else {
      await signOut();
      navigate("/login");
    }
  };
  // const DEFAULT_JITSI_URL = "https://meet.jit.si/jitsi_room_test_123456789";
  // const MEETING_TAB_NAME = "instant_meeting_tab";

  // const handleAcceptInstant = async (requestId: string) => {
  //   // Open a blank tab synchronously to avoid popup blockers
  //   const meetingWindow = window.open("about:blank", MEETING_TAB_NAME);

  //   if (!meetingWindow) {
  //     window.open(DEFAULT_JITSI_URL, "_blank");
  //     return;
  //   }

  //   // Show a loading message while waiting for the meeting URL
  //   try {
  //     meetingWindow.document.open();
  //     meetingWindow.document.write(`
  //     <!doctype html>
  //     <meta charset="utf-8">
  //     <title>Joining your meeting…</title>
  //     <style>
  //       body{font-family:system-ui,Segoe UI,Arial;margin:24px;line-height:1.5}
  //       .btn{display:inline-block;padding:10px 14px;border:1px solid #ccc;border-radius:8px;text-decoration:none}
  //     </style>
  //     <h1>Joining your meeting…</h1>
  //     <p>This tab will navigate automatically when the session is ready.</p>
  //     <p>If it doesn't, you can <a class="btn" href="${DEFAULT_JITSI_URL}" target="_self" rel="noopener">open the Meeting link</a>.</p>
  //   `);
  //     meetingWindow.document.close();
  //   } catch {
  //     // ignore
  //   }

  //   try {
  //     if (!profile?.id) {
  //       meetingWindow.close();
  //       return;
  //     }

  //     setAcceptingId(requestId);
  //     setDismissedIds((prev) => new Set(prev).add(requestId));
  //     setInstantRequests((prev) => prev.filter((r) => r.id !== requestId));

  //     // Accept the request and get the meeting URL from the backend
  //     const accepted = await instantSessionService.acceptRequest(
  //       requestId,
  //       profile.id
  //     );

  //     // Use the meeting URL from the backend, fallback to default if missing
  //     const url = (() => {
  //       try {
  //         return new URL(
  //           accepted?.jitsiMeetingUrl || DEFAULT_JITSI_URL
  //         ).toString();
  //       } catch {
  //         return DEFAULT_JITSI_URL;
  //       }
  //     })();

  //     // Redirect the opened tab to the meeting URL
  //     try {
  //       meetingWindow.location.replace(url);
  //     } catch {
  //       try {
  //         meetingWindow.location.href = url;
  //       } catch {
  //         window.open(url, MEETING_TAB_NAME);
  //       }
  //     }
  //   } catch (e) {
  //     console.error(e);
  //     if (!meetingWindow.closed) meetingWindow.close();
  //   } finally {
  //     setAcceptingId(null);
  //   }
  // };

  // const handleRejectInstant = (requestId: string) => {
  //   setDismissedIds((prev) => new Set(prev).add(requestId));
  //   setInstantRequests((prev) => prev.filter((r) => r.id !== requestId));
  // };

  return (
    <div
      className={
        isAdminLoggedIn
          ? "min-h-screen bg-background"
          : getRoleContainerClass(profile?.role)
      }
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tutorApplication={tutorApplication}
        idVerification={idVerification}
        onSignOut={handleSignOut}
      />

      <div className="lg:pl-20">
        {/* Header removed - keeping design clean and minimal */}

        {/* Main content with bottom padding for mobile nav */}
        <main className={
          profile?.role === "student"
            ? "pt-10 pb-24 lg:pb-10"
            : profile?.role === "parent"
              ? "pb-24 lg:pb-10" // No top padding for parents to allow full-width sticky headers
              : "py-10 pb-24 lg:pb-10"
        }>
          <div className="px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>

      {/* Floating Instant Requests Notification - DISABLED to avoid duplicates */}
      {/* The detailed popup in TutorDashboard (InstantSessionRequestPopup) handles this better */}
      {/* {profile?.role === "tutor" &&
        profile?.is_online &&
        instantRequests.filter((req) => !dismissedIds.has(req.id)).length >
          0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-md w-full"
          >
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg">
                      <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {
                          instantRequests.filter(
                            (req) => !dismissedIds.has(req.id)
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Instant Requests
                    </span>
                    <p className="text-xs text-gray-500 font-normal">
                      Students need your help
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {instantRequests
                    .filter((req, _index) => !dismissedIds.has(req.id))
                    .map((req, index) => (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-sm">
                                <UserGroupIcon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900">
                                  New Request
                                </span>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <ClockIcon className="w-3 h-3" />
                                  <span>15 minutes</span>
                                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                  <span className="text-purple-600 font-medium">
                                    {getSubjectName(req.subjectId)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRejectInstant(req.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptInstant(req.id)}
                              disabled={acceptingId === req.id}
                              className="h-8 px-4 text-xs bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              {acceptingId === req.id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <CheckIcon className="w-3 h-3 mr-1" />
                                  Accept
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      </motion.div>
                    ))}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    💡 Click Accept to start helping immediately
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )} */}
    </div>
  );
};

export default DashboardLayout;
