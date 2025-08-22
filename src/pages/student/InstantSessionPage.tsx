import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { instantSessionService } from "../../lib/instantSessionService";
import { useAuth } from "../../contexts/AuthContext";
import type { InstantRequest } from "../../types/instantSession";
import {
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

interface NoteSubject {
  id: string;
  name: string;
  display_name: string;
  sort_order: number;
  is_active: boolean;
}

export default function InstantSessionPage() {
  const { user } = useAuth();
  const [subjectId, setSubjectId] = useState("");
  const [subjects, setSubjects] = useState<NoteSubject[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "waiting" | "accepted" | "cancelled" | "expired"
  >("idle");
  const [jitsiUrl, setJitsiUrl] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<Date | null>(null);

  // Load subjects from database
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("note_subjects")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (error) {
          console.error("Error loading subjects:", error);
          return;
        }

        setSubjects(data || []);
      } catch (error) {
        console.error("Error loading subjects:", error);
      }
    };

    loadSubjects();
  }, []);

  // Restore session state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("instantSessionState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.requestId && parsed.status && parsed.status !== "idle") {
          setRequestId(parsed.requestId);
          setStatus(parsed.status);
          setJitsiUrl(parsed.jitsiUrl);
          setSubjectId(parsed.subjectId);

          if (parsed.acceptedAt) {
            const acceptedAtDate = new Date(parsed.acceptedAt);
            setAcceptedAt(acceptedAtDate);

            // Check if session has expired
            const now = new Date();
            const elapsed = now.getTime() - acceptedAtDate.getTime();
            const remaining = 15 * 60 * 1000 - elapsed;

            if (remaining <= 0) {
              setStatus("expired");
              setTimeLeft(0);
              localStorage.removeItem("instantSessionState");
            }
          }
        }
      } catch (error) {
        console.error("Error restoring session state:", error);
        localStorage.removeItem("instantSessionState");
      }
    }
  }, []);

  // Save session state to localStorage whenever it changes
  useEffect(() => {
    if (requestId && status !== "idle") {
      const stateToSave = {
        requestId,
        status,
        jitsiUrl,
        subjectId,
        acceptedAt: acceptedAt?.toISOString(),
      };
      localStorage.setItem("instantSessionState", JSON.stringify(stateToSave));
    } else if (
      status === "idle" ||
      status === "expired" ||
      status === "cancelled"
    ) {
      localStorage.removeItem("instantSessionState");
    }
  }, [requestId, status, jitsiUrl, subjectId, acceptedAt]);

  const handleRequest = async () => {
    if (!user?.id || !subjectId) return;

    try {
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;

      const request = await instantSessionService.createRequest(
        profile.id,
        subjectId
      );
      setRequestId(request.id);
      setStatus("waiting");
    } catch (error) {
      console.error("Error creating request:", error);
    }
  };

  const handleCancel = async () => {
    if (!requestId || !user?.id) return;

    try {
      setCancelling(true);

      // Get the student profile ID
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        console.error("No profile found for user");
        return;
      }

      await instantSessionService.cancelRequest(requestId, profile.id);
      setStatus("cancelled");
      setRequestId(null);
    } catch (error) {
      console.error("Error cancelling request:", error);
    } finally {
      setCancelling(false);
    }
  };

  // Reset function to clear state and localStorage
  const resetSession = () => {
    setStatus("idle");
    setRequestId(null);
    setJitsiUrl(null);
    setTimeLeft(null);
    setAcceptedAt(null);
    setSubjectId("");
    localStorage.removeItem("instantSessionState");
  };

  useEffect(() => {
    if (!requestId) return;

    console.log("[Student] Setting up real-time listener for request:", requestId);

    // Realtime listener
    const channel = (supabase as any)
      .channel(`instant_requests:student:${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "instant_requests",
          filter: `id=eq.${requestId}`,
        } as any,
        async (payload: any) => {
          console.log("[Student] UPDATE payload received:", payload);
          console.log("[Student] Payload new:", payload.new);
          console.log("[Student] Payload old:", payload.old);
          
          const next = payload.new;
          
          if (next.status === "accepted") {
            console.log("[Student] Request accepted, processing...");
            // If we have the Jitsi URL in the payload, use it immediately
            if (next.jitsi_meeting_url) {
              console.log("[Student] Using Jitsi URL from payload:", next.jitsi_meeting_url);
              const validatedUrl = validateJitsiUrl(next.jitsi_meeting_url);
              if (validatedUrl) {
                setJitsiUrl(validatedUrl);
                setStatus("accepted");
                setAcceptedAt(new Date()); // Start the timer
                return; // Exit early, no need for further processing
              } else {
                console.warn("[Student] Invalid Jitsi URL in payload, will use fallback");
              }
            }
            
            // If URL is still not set (either missing from payload or invalid), fetch from database
            if (!jitsiUrl) {
              console.log("[Student] No valid Jitsi URL, fetching from database...");
              // If URL is missing, fetch the full record to get the URL
              try {
                const { data, error } = await (supabase as any)
                  .from("instant_requests")
                  .select("*")
                  .eq("id", requestId)
                  .single();
                
                if (!error && data && data.jitsi_meeting_url) {
                  console.log("[Student] Retrieved Jitsi URL from database:", data.jitsi_meeting_url);
                  const validatedUrl = validateJitsiUrl(data.jitsi_meeting_url);
                  if (validatedUrl) {
                    setJitsiUrl(validatedUrl);
                    setStatus("accepted");
                    setAcceptedAt(new Date()); // Start the timer
                    return; // Exit early, no need for further processing
                  }
                } else {
                  console.log("[Student] No Jitsi URL in database, using fallback");
                  // Fallback: generate the URL deterministically
                  const fallbackUrl = `https://meet.jit.si/instant-${requestId}`;
                  setJitsiUrl(fallbackUrl);
                  setStatus("accepted");
                  setAcceptedAt(new Date()); // Start the timer
                  console.log("[Student] Using fallback Jitsi URL:", fallbackUrl);
                  return; // Exit early, no need for further processing
                }
              } catch (fetchError) {
                console.error("[Student] Error fetching request details:", fetchError);
                // Final fallback: generate the URL deterministically
                const fallbackUrl = `https://meet.jit.si/instant-${requestId}`;
                setJitsiUrl(fallbackUrl);
            setStatus("accepted");
            setAcceptedAt(new Date()); // Start the timer
                console.log("[Student] Using final fallback Jitsi URL:", fallbackUrl);
                return; // Exit early, no need for further processing
              }
            }
          } else if (next.status === "cancelled") {
            console.log("[Student] Request cancelled");
            setStatus("cancelled");
            setJitsiUrl(null);
            setAcceptedAt(null);
            setTimeLeft(null);
            return; // Exit early, no need for further processing
          } else {
            console.log("[Student] Status update (not accepted/cancelled):", next.status);
          }
        }
      )
      .subscribe((status: any) => {
        console.log("[Student] Channel subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("[Student] Successfully subscribed to real-time updates");
        } else if (status === "CHANNEL_ERROR") {
          console.error("[Student] Channel subscription error");
        } else if (status === "TIMED_OUT") {
          console.error("[Student] Channel subscription timed out");
        }
      });

    // Polling fallback - more aggressive for instant sessions
    const pollInterval = setInterval(async () => {
      // Stop polling if already accepted or cancelled
      if (status === "accepted" || status === "cancelled") {
        console.log("[Student] Stopping polling - session already", status);
        clearInterval(pollInterval);
        return;
      }

      console.log("[Student] Polling for request status...");
      try {
      const { data, error } = await (supabase as any)
        .from("instant_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("[Student] Polling error:", error);
        return;
      }

      if (data) {
          console.log("[Student] Polling data received:", data);
          if (data.status === "accepted") {
            console.log("[Student] Request accepted via polling");
            // Ensure we have a Jitsi URL
            let finalJitsiUrl = data.jitsi_meeting_url;
            if (!finalJitsiUrl) {
              // Generate fallback URL if missing
              finalJitsiUrl = `https://meet.jit.si/instant-${requestId}`;
              console.log("[Student] Generated fallback Jitsi URL via polling:", finalJitsiUrl);
            }
            
            // Validate the URL before setting it
            const validatedUrl = validateJitsiUrl(finalJitsiUrl);
            if (validatedUrl) {
              setJitsiUrl(validatedUrl);
          setStatus("accepted");
          if (!acceptedAt) {
            setAcceptedAt(new Date()); // Start the timer if not already started
          }
          clearInterval(pollInterval); // Stop polling once accepted
              console.log("[Student] Polling stopped - session accepted");
            } else {
              console.error("[Student] Invalid Jitsi URL from polling:", finalJitsiUrl);
            }
        } else if (data.status === "cancelled") {
            console.log("[Student] Request cancelled via polling");
          setStatus("cancelled");
          setJitsiUrl(null);
          setAcceptedAt(null);
          setTimeLeft(null);
          clearInterval(pollInterval); // Stop polling once cancelled
            console.log("[Student] Polling stopped - session cancelled");
        }
      }
      } catch (pollError) {
        console.error("[Student] Polling exception:", pollError);
      }
    }, 2000); // Poll every 2 seconds for faster response

    return () => {
      console.log("[Student] Cleaning up real-time listener and polling");
      (supabase as any).removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [requestId]); // Remove acceptedAt dependency to prevent re-triggering

  // Timer effect
  useEffect(() => {
    if (status !== "accepted" || !acceptedAt) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = now.getTime() - acceptedAt.getTime();
      const remaining = 15 * 60 * 1000 - elapsed; // 15 minutes in milliseconds

      if (remaining <= 0) {
        setTimeLeft(0);
        setStatus("expired");
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, [status, acceptedAt]);

  // Debug effect to log status changes
  useEffect(() => {
    console.log("[Student] Status changed:", { 
      status, 
      jitsiUrl, 
      requestId, 
      acceptedAt: acceptedAt?.toISOString() 
    });
  }, [status, jitsiUrl, requestId, acceptedAt]);

  // Cleanup effect to ensure proper cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[Student] Component unmounting, cleaning up...");
      // Any additional cleanup can go here
    };
  }, []);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Utility function to validate and sanitize Jitsi URL
  const validateJitsiUrl = (url: string): string | null => {
    if (!url) return null;
    
    // Check if it's a valid Jitsi URL
    if (url.startsWith('https://meet.jit.si/')) {
      return url;
    }
    
    // If it's just a meeting ID, construct the full URL
    if (url.match(/^[a-zA-Z0-9_-]+$/)) {
      return `https://meet.jit.si/${url}`;
    }
    
    // If it's a relative path, construct the full URL
    if (url.startsWith('/')) {
      return `https://meet.jit.si${url}`;
    }
    
    console.warn("[Student] Invalid Jitsi URL format:", url);
    return null;
  };

  const handleJoin = () => {
    console.log("[Student] handleJoin called", { jitsiUrl, timeLeft });
    
    if (!jitsiUrl) {
      console.error("[Student] No Jitsi URL available");
      alert("Error: No meeting link available. Please refresh the page and try again.");
      return;
    }
    
    if (!timeLeft || timeLeft <= 0) {
      console.error("[Student] Session has expired or no time left");
      alert("Session has expired. Please request a new session.");
      return;
    }
    
    // Validate and sanitize the Jitsi URL
    const validatedUrl = validateJitsiUrl(jitsiUrl);
    if (!validatedUrl) {
      console.error("[Student] Invalid Jitsi URL format:", jitsiUrl);
      alert("Error: Invalid meeting link format. Please refresh the page and try again.");
      return;
    }
    
    try {
      console.log("[Student] Opening validated Jitsi meeting:", validatedUrl);
      const newWindow = window.open(validatedUrl, "_blank");
      
      if (!newWindow) {
        console.error("[Student] Popup blocked by browser");
        alert("Popup blocked! Please allow popups for this site and try again.");
        return;
      }
      
      // Focus the new window
      newWindow.focus();
      console.log("[Student] Jitsi meeting opened successfully");
    } catch (error) {
      console.error("[Student] Error opening Jitsi meeting:", error);
      alert("Error opening meeting. Please try again or copy the link manually.");
    }
  };

  const getSubjectName = (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    return subject?.display_name || subject?.name || id;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)]"></div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-green-400/10 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/5 to-yellow-300/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Instant Session
          </h1>
          <p className="text-lg text-gray-600 flex items-center justify-center gap-2">
            <ClockIcon className="w-5 h-5" />
            <span>15 minutes • Get tutoring help immediately</span>
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Status-based content */}
          {status === "idle" && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <AcademicCapIcon className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Need tutoring help?
                </h2>
                <p className="text-gray-600">
                  Select your subject and connect with a tutor instantly
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Choose your subject
                  </label>
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-lg bg-white hover:border-gray-300 focus:outline-none focus:shadow-lg h-auto">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 rounded-xl shadow-lg">
                      {subjects.map((subject) => (
                        <SelectItem
                          key={subject.id}
                          value={subject.id}
                          className="py-3 px-4 text-lg hover:bg-green-50 focus:bg-green-50 cursor-pointer"
                        >
                          {subject.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <button
                  onClick={handleRequest}
                  disabled={!subjectId}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                >
                  <UserGroupIcon className="w-5 h-5" />
                  Request Tutor Now
                </button>
              </div>
            </div>
          )}

          {status === "waiting" && (
            <div className="p-8 text-center">
              <div className="animate-pulse">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
                  <ClockIcon className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Finding your tutor...
              </h2>
              <p className="text-gray-600 mb-6">
                We're searching for available tutors in{" "}
                {getSubjectName(subjectId)}
              </p>

              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>

              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                <XCircleIcon className="w-4 h-4" />
                {cancelling ? "Cancelling..." : "Cancel Request"}
              </button>
            </div>
          )}

          {status === "accepted" && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Tutor Found! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                A tutor has accepted your request
              </p>

              {timeLeft !== null && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ClockIcon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Time remaining
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      timeLeft < 5 * 60 * 1000
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {jitsiUrl && timeLeft && timeLeft > 0 && (
                  <button
                    onClick={handleJoin}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <PlayIcon className="w-5 h-5" />
                    Join Session Now
                  </button>
                )}

                <button
                  onClick={resetSession}
                  className="w-full bg-red-500 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <XCircleIcon className="w-5 h-5" />
                  End Session
                </button>
              </div>
            </div>
          )}

          {status === "expired" && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Session Expired
              </h2>
              <p className="text-gray-600 mb-6">
                The 15-minute time limit has passed
              </p>
              <button
                onClick={resetSession}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Request New Session
              </button>
            </div>
          )}

          {status === "cancelled" && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                <XCircleIcon className="w-8 h-8 text-gray-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Request Cancelled
              </h2>
              <p className="text-gray-600 mb-6">
                Your instant session request has been cancelled
              </p>
              <button
                onClick={resetSession}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Quick Sessions</h3>
            </div>
            <p className="text-sm text-gray-600">
              Get tutoring help in just 15 minutes with our instant service
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Expert Tutors</h3>
            </div>
            <p className="text-sm text-gray-600">
              Connect with qualified tutors who are ready to help immediately
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Instant Connect</h3>
            </div>
            <p className="text-sm text-gray-600">
              No waiting - get matched with a tutor and start learning right
              away
            </p>
          </div>
        </div>

        {/* Debug Section - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Info</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-2 text-gray-600">{status}</span>
              </div>
              <div>
                <span className="font-medium">Request ID:</span>
                <span className="ml-2 text-gray-600">{requestId || 'None'}</span>
              </div>
              <div>
                <span className="font-medium">Jitsi URL:</span>
                <span className="ml-2 text-gray-600 break-all">
                  {jitsiUrl ? jitsiUrl.substring(0, 30) + '...' : 'None'}
                </span>
              </div>
              <div>
                <span className="font-medium">Time Left:</span>
                <span className="ml-2 text-gray-600">
                  {timeLeft ? formatTime(timeLeft) : 'None'}
                </span>
              </div>
            </div>
            <div className="mt-4 space-x-2">
              {jitsiUrl && (
                <>
                  <button
                    onClick={() => navigator.clipboard.writeText(jitsiUrl)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                  >
                    Copy Jitsi URL
                  </button>
                  <button
                    onClick={() => {
                      console.log("[Debug] Testing Jitsi URL opening:", jitsiUrl);
                      try {
                        const newWindow = window.open(jitsiUrl, "_blank");
                        if (newWindow) {
                          newWindow.focus();
                          console.log("[Debug] Jitsi URL opened successfully");
                        } else {
                          console.error("[Debug] Popup blocked");
                        }
                      } catch (error) {
                        console.error("[Debug] Error opening Jitsi URL:", error);
                      }
                    }}
                    className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                  >
                    Test Open Jitsi
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
