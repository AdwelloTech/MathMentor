import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bars3Icon,
  SparklesIcon,
  ClockIcon,
  UserGroupIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { getRoleContainerClass } from "@/utils/roleStyles";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { TutorApplication } from "@/types/auth";
import Sidebar from "./Sidebar";
import {
  instantSessionService,
  type InstantRequest,
} from "@/lib/instantSessionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tutorApplication, setTutorApplication] =
    useState<TutorApplication | null>(null);
  const [idVerification, setIdVerification] = useState<any>(null);
  const [loadingApplication, setLoadingApplication] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { isAdminLoggedIn, logoutAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [instantRequests, setInstantRequests] = useState<InstantRequest[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [subjects, setSubjects] = useState<{ [key: string]: string }>({});
  const FRESH_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

  // Hide the global header on all student pages
  const isStudentDashboardRoute = location.pathname.startsWith("/student");

  // Audio notification setup (unlocked on first user interaction)
  const audioCtxRef = useRef<any>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Load subjects for display
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("note_subjects")
          .select("id, display_name, name")
          .eq("is_active", true);

        if (error) {
          console.error("Error loading subjects:", error);
          return;
        }

        const subjectsMap: { [key: string]: string } = {};
        data?.forEach((subject: any) => {
          subjectsMap[subject.id] = subject.display_name || subject.name;
        });
        setSubjects(subjectsMap);
      } catch (error) {
        console.error("Error loading subjects:", error);
      }
    };

    loadSubjects();
  }, []);

  const getSubjectName = (subjectId: string) => {
    return subjects[subjectId] || "Unknown Subject";
  };

  useEffect(() => {
    const unlock = () => {
      try {
        const AC =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        if (!audioCtxRef.current) audioCtxRef.current = new AC();
        if (audioCtxRef.current.state !== "running") {
          audioCtxRef.current.resume();
        }
        setAudioEnabled(true);
      } catch (_) {}
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("keydown", unlock);
    document.addEventListener("touchstart", unlock);
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      if (!audioEnabled) return;
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const now = ctx.currentTime;
      const makeBeep = (startOffset: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(1200, now + startOffset);
        gain.gain.setValueAtTime(0.0001, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.08, now + startOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + startOffset + 0.15
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + 0.16);
      };
      // Two short beeps
      makeBeep(0);
      makeBeep(0.2);
    } catch (_) {
      // no-op
    }
  };

  // Check tutor application and ID verification status on mount
  useEffect(() => {
    if (profile?.role === "tutor" && user) {
      checkTutorApplication();
      checkIDVerification();
    }
  }, [profile?.role, user]);

  // Subscribe to instant requests globally for tutors
  useEffect(() => {
    if (profile?.role !== "tutor") return;

    // Initial fetch to validate RLS and data visibility
    (async () => {
      try {
        const sinceIso = new Date(Date.now() - FRESH_WINDOW_MS).toISOString();
        const { data, error } = await supabase
          .from("instant_requests")
          .select("*")
          .eq("status", "pending")
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) {
          console.error("[Instant] initial fetch error", error);
        } else {
          console.log("[Instant] initial pending count", data?.length || 0);
          if (data && data.length > 0) {
            const unique = Array.from(
              new Map(data.map((r: any) => [r.id, r])).values()
            ) as any;
            setInstantRequests(unique);
          }
        }
      } catch (e) {
        console.error("[Instant] initial fetch exception", e);
      }
    })();

    // Fallback polling every 10s (until Realtime confirmed)
    const poll = setInterval(async () => {
      try {
        const sinceIso = new Date(Date.now() - FRESH_WINDOW_MS).toISOString();
        const { data, error } = await supabase
          .from("instant_requests")
          .select("*")
          .eq("status", "pending")
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) return;
        if (!data) return;
        // Replace the list with current pending requests to avoid stale items lingering
        setInstantRequests(
          (data as any[]).filter((r: any) => r.status === "pending")
        );
      } catch (_) {}
    }, 10000);

    console.log(
      "[Realtime] Subscribing to instant_requests for tutor",
      profile?.id
    );
    const unsubscribe = instantSessionService.subscribeToPending(
      ({ new: req, eventType }) => {
        console.log(
          "[Realtime] instant_requests event",
          eventType,
          req?.id,
          req?.status
        );
        const isFresh =
          Date.now() - new Date((req as any).created_at).getTime() <=
          FRESH_WINDOW_MS;
        if (eventType === "INSERT") {
          if (!isFresh) return; // ignore stale backlog
          playNotificationSound();
          setInstantRequests((prev) => {
            const exists = prev.some((r) => r.id === (req as any).id);
            if (exists) return prev;
            return [req as InstantRequest, ...prev];
          });
        }
        if (eventType === "UPDATE" || eventType === "BROADCAST_ACCEPTED") {
          setInstantRequests((prev) =>
            (req as any).status !== "pending"
              ? prev.filter((r) => r.id !== (req as any).id)
              : prev
          );
        }
      },
      undefined,
      profile?.is_online || false
    );

    return () => {
      console.log("[Realtime] Unsubscribe instant_requests");
      clearInterval(poll);
      unsubscribe?.();
    };
  }, [profile?.role, profile?.is_online]);

  const checkTutorApplication = async () => {
    if (!user) return;

    setLoadingApplication(true);
    try {
      const applications = await db.tutorApplications.getByUserId(user.id);
      // Get the most recent application
      const mostRecentApplication = applications?.[0] || null;
      setTutorApplication(mostRecentApplication);
    } catch (error) {
      console.error("Error checking tutor application:", error);
    } finally {
      setLoadingApplication(false);
    }
  };

  const checkIDVerification = async () => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from("id_verifications")
        .select("*")
        .eq("user_id", profile.id) // Use profile.id instead of user.id
        .order("submitted_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error checking ID verification:", error);
        setIdVerification(null);
      } else {
        // Set the first record or null if no records found
        setIdVerification(data?.[0] || null);
      }
    } catch (error) {
      console.error("Error checking ID verification:", error);
      setIdVerification(null);
    }
  };

  const isTutorApproved = tutorApplication?.application_status === "approved";
  const isTutorPending = tutorApplication?.application_status === "pending";
  const isTutorRejected = tutorApplication?.application_status === "rejected";

  const handleSignOut = async () => {
    if (isAdminLoggedIn) {
      await logoutAdmin();
      navigate("/admin/login");
    } else {
      await signOut();
      navigate("/login");
    }
  };
  const DEFAULT_JITSI_URL = "https://meet.jit.si/jitsi_room_test_123456789";
  const MEETING_TAB_NAME = "instant_meeting_tab";

  const handleAcceptInstant = async (requestId: string) => {
    // Open a blank tab synchronously to avoid popup blockers
    const meetingWindow = window.open("about:blank", MEETING_TAB_NAME);

    if (!meetingWindow) {
      window.open(DEFAULT_JITSI_URL, "_blank");
      return;
    }

    // Show a loading message while waiting for the meeting URL
    try {
      meetingWindow.document.open();
      meetingWindow.document.write(`
      <!doctype html>
      <meta charset="utf-8">
      <title>Joining your meeting…</title>
      <style>
        body{font-family:system-ui,Segoe UI,Arial;margin:24px;line-height:1.5}
        .btn{display:inline-block;padding:10px 14px;border:1px solid #ccc;border-radius:8px;text-decoration:none}
      </style>
      <h1>Joining your meeting…</h1>
      <p>This tab will navigate automatically when the session is ready.</p>
      <p>If it doesn't, you can <a class="btn" href="${DEFAULT_JITSI_URL}" target="_self" rel="noopener">open the Meeting link</a>.</p>
    `);
      meetingWindow.document.close();
    } catch {
      // ignore
    }

    try {
      if (!profile?.id) {
        meetingWindow.close();
        return;
      }

      setAcceptingId(requestId);
      setDismissedIds((prev) => new Set(prev).add(requestId));
      setInstantRequests((prev) => prev.filter((r) => r.id !== requestId));

      // Accept the request and get the meeting URL from the backend
      const accepted = await instantSessionService.acceptRequest(
        requestId,
        profile.id
      );

      // Use the meeting URL from the backend, fallback to default if missing
      const url = (() => {
        try {
          return new URL(
            accepted?.jitsi_meeting_url || DEFAULT_JITSI_URL
          ).toString();
        } catch {
          return DEFAULT_JITSI_URL;
        }
      })();

      // Redirect the opened tab to the meeting URL
      try {
        meetingWindow.location.replace(url);
      } catch {
        try {
          meetingWindow.location.href = url;
        } catch {
          window.open(url, MEETING_TAB_NAME);
        }
      }
    } catch (e) {
      console.error(e);
      if (!meetingWindow.closed) meetingWindow.close();
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectInstant = (requestId: string) => {
    setDismissedIds((prev) => new Set(prev).add(requestId));
    setInstantRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <div
      className={
        isAdminLoggedIn
          ? "min-h-screen bg-[#D5FFC5]"
          : getRoleContainerClass(profile?.role)
      }
    >
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tutorApplication={tutorApplication}
        idVerification={idVerification}
        loadingApplication={loadingApplication}
        checkTutorApplication={checkTutorApplication}
        checkIDVerification={checkIDVerification}
        onSignOut={handleSignOut}
      />

      <div className="lg:pl-20">
        {/* Header removed - keeping design clean and minimal */}

        {/* Main content */}
        <main className={profile?.role === "student" ? "pt-10" : "py-10"}>
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <div className="lg:hidden mb-4">
              <motion.button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                onClick={() => setSidebarOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Bars3Icon className="h-6 w-6" />
              </motion.button>
            </div>

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

      {/* Floating Instant Requests Notification - Only show when tutor is online */}
      {profile?.role === "tutor" &&
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
                    .filter((req, index) => !dismissedIds.has(req.id))
                    .map((req, index) => (
                      <motion.div
                        key={req.id}
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                      >
                        {/* Animated background gradient */}
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
                                    {getSubjectName(req.subject_id)}
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

                        {/* Subtle pulse animation for urgency */}
                        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      </motion.div>
                    ))}
                </div>

                {/* Footer with action hint */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    💡 Click Accept to start helping immediately
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
    </div>
  );
};

export default DashboardLayout;
