import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  PlusIcon,
  VideoCameraIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  XCircleIcon,
  IdentificationIcon,
  DocumentTextIcon,
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TutorApplicationForm from "@/components/forms/TutorApplicationForm";
import { db } from "@/lib/db";
import {
  instantSessionService,
  type InstantRequest,
  testSubscription,
  testRealTimeComprehensive,
} from "@/lib/instantSessionService";
import { classSchedulingService } from "@/lib/classSchedulingService";
import { supabase } from "@/lib/supabase";
import type { TutorApplication, TutorApplicationStatus } from "@/types/auth";
import type { TutorDashboardStats, TutorClass } from "@/types/classScheduling";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TutorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [idVerification, setIdVerification] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<TutorDashboardStats | null>(null);
  const [instantRequests, setInstantRequests] = useState<InstantRequest[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [subjects, setSubjects] = useState<{ [key: string]: string }>({});
  const [upcomingClasses, setUpcomingClasses] = useState<TutorClass[]>([]);

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

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

  // Audio notification setup
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
    if (!audioEnabled || !audioCtxRef.current) return;
    try {
      const oscillator = audioCtxRef.current.createOscillator();
      const gainNode = audioCtxRef.current.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtxRef.current.destination);
      oscillator.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
      oscillator.frequency.setValueAtTime(
        600,
        audioCtxRef.current.currentTime + 0.1
      );
      gainNode.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtxRef.current.currentTime + 0.2
      );
      oscillator.start(audioCtxRef.current.currentTime);
      oscillator.stop(audioCtxRef.current.currentTime + 0.2);
    } catch (_) {}
  };

  // Check for existing application and ID verification on mount
  useEffect(() => {
    checkApplication();
    checkIDVerification();
  }, [user]);

  // Load dashboard data when both application and ID verification are approved
  useEffect(() => {
    if (
      application?.application_status === "approved" &&
      idVerification?.verification_status === "approved"
    ) {
      loadDashboardData();
    }
  }, [application, idVerification]);

  // Subscribe to instant requests when tutor features enabled
  useEffect(() => {
    const isEnabled =
      application?.application_status === "approved" &&
      idVerification?.verification_status === "approved";
    if (!isEnabled) {
      console.log(
        "[TutorDashboard] Subscription not enabled - tutor features disabled"
      );
      return;
    }

    console.log(
      `[TutorDashboard] Setting up subscription for tutor: ${profile?.id} enabled: ${isEnabled} application status: ${application?.application_status} id verification status: ${idVerification?.verification_status}`
    );

    // Clear any existing requests when setting up new subscription
    setInstantRequests([]);
    setDismissedIds(new Set());

    // Set up real-time subscription for immediate updates
    let unsubscribe: (() => void) | undefined;
    try {
      console.log("[TutorDashboard] Setting up real-time subscription...");
      
      // Set up the main subscription
      unsubscribe = instantSessionService.subscribeToPending(
        ({ new: req, eventType }) => {
          console.log(
            "[TutorDashboard] Real-time event received:",
            eventType,
            (req as any).id,
            "status:",
            (req as any).status
          );
          
          if (eventType === "INSERT") {
            const isFresh =
              Date.now() - new Date((req as any).created_at).getTime() <=
              5 * 60 * 1000; // Last 5 minutes
            if (!isFresh) return; // ignore stale backlog
            
            console.log("[TutorDashboard] New request received via real-time:", (req as any).id);
            setInstantRequests((prev) => {
              const exists = prev.some((r) => r.id === (req as any).id);
              if (exists) return prev;
              return [req as InstantRequest, ...prev];
            });
          }
          
          if (eventType === "UPDATE") {
            console.log("[TutorDashboard] Request updated via real-time:", (req as any).id, "status:", (req as any).status);
            setInstantRequests((prev) => {
              return (req as any).status !== "pending"
                  ? prev.filter((r) => r.id !== (req as any).id)
                  : prev;
            });
          }
        }
      );
      
    } catch (error) {
      console.error("[TutorDashboard] Error setting up subscription:", error);
      // If real-time fails, we'll rely on polling
      console.log("[TutorDashboard] Falling back to polling-only mode");
    }

    // Initial fetch to get current pending requests
    const fetchInitialRequests = async () => {
      try {
        const sinceIso = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // Last 5 minutes
        const { data, error } = await (supabase as any)
          .from("instant_requests")
          .select("*")
          .eq("status", "pending")
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false })
          .limit(20);
        
        if (error) {
          console.error("[TutorDashboard] Initial fetch error:", error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log("[TutorDashboard] Initial fetch found", data.length, "pending requests");
          setInstantRequests(data);
        } else {
          console.log("[TutorDashboard] No pending requests found initially");
        }
      } catch (fetchError) {
        console.error("[TutorDashboard] Initial fetch exception:", fetchError);
      }
    };

    // Fetch initial requests immediately
    fetchInitialRequests();

    // Add focus event listener to check for new requests when user returns to tab
    const handleFocus = async () => {
      console.log("[TutorDashboard] Window focused, checking for new requests...");
      try {
        const sinceIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data, error } = await (supabase as any)
          .from("instant_requests")
          .select("*")
          .eq("status", "pending")
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false })
          .limit(20);
        
        if (error) {
          console.error("[TutorDashboard] Focus check error:", error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log("[TutorDashboard] Focus check found", data.length, "pending requests");
          // Only update if the data is actually different
          setInstantRequests((prev) => {
            if (prev.length === data.length && 
                prev.every((item, index) => item.id === data[index].id)) {
              return prev; // No change needed
            }
            console.log("[TutorDashboard] State update triggered:", {
              previous: prev.length,
              new: data.length,
              data: data.map((r: any) => ({ id: r.id, status: r.status }))
            });
            return data;
          });
        }
      } catch (focusError) {
        console.error("[TutorDashboard] Focus check exception:", focusError);
      }
    };

    // Add event listeners with debouncing to prevent multiple rapid calls
    let focusTimeout: NodeJS.Timeout;
    const debouncedFocusHandler = () => {
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(handleFocus, 100);
    };

    window.addEventListener('focus', debouncedFocusHandler);
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        debouncedFocusHandler();
      }
    });

    // Aggressive polling as primary method - fetch pending requests every 2 seconds
    const poll = setInterval(async () => {
      try {
        const sinceIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data, error } = await (supabase as any)
          .from("instant_requests")
          .select("*")
          .eq("status", "pending")
          .gte("created_at", sinceIso)
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) return;
        if (!data) return;
        
        setInstantRequests((prev) => {
          const map = new Map(prev.map((r) => [r.id, r]));
          for (const row of data as any) map.set(row.id, row);
          const merged = Array.from(map.values()).filter(
            (r: any) => r.status === "pending"
          );
          
          // Only log if there are actual changes
          if (merged.length !== prev.length) {
            console.log("[TutorDashboard] Polling update:", {
              fetched: (data as any).length,
              merged: merged.length,
              current: prev.length,
              timestamp: new Date().toISOString()
            });
            
            // Force state update even if data looks the same
            console.log("[TutorDashboard] Forcing state update with merged data:", {
              merged: merged.map((r: any) => ({ id: r.id, status: r.status }))
            });
          }
          
          return merged;
        });
      } catch (_) {}
    }, 2000); // Poll every 2 seconds for immediate response

    // Cleanup function
    return () => {
      console.log("[TutorDashboard] Cleaning up subscription and polling");
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("[TutorDashboard] Error cleaning up subscription:", error);
        }
      }
      clearInterval(poll);
      clearTimeout(focusTimeout);
      window.removeEventListener('focus', debouncedFocusHandler);
      window.removeEventListener('visibilitychange', () => {
        if (!document.hidden) {
          debouncedFocusHandler();
        }
      });
    };
  }, [application?.application_status, idVerification?.verification_status, profile?.id]);

  const checkApplication = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const existingApplications = await db.tutorApplications.getByUserId(
        user.id
      );
      // Get the most recent application (first in the array since it's ordered by submitted_at desc)
      const mostRecentApplication = existingApplications?.[0] || null;
      setApplication(mostRecentApplication);
    } catch (error: any) {
      // If no application found, that's fine
      if (error.code !== "PGRST116") {
        console.error("Error checking application:", error);
      }
    } finally {
      setLoading(false);
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

  const loadDashboardData = async () => {
    if (!profile) return;

    try {
      const [stats, classes] = await Promise.all([
        classSchedulingService.stats.getTutorStats(profile.id), // Use profile.id instead of user.id
        classSchedulingService.classes.getUpcomingByTutorId(profile.id), // Use profile.id instead of user.id
      ]);

      setDashboardData(stats);
      setUpcomingClasses(classes);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const profileCompletion = calculateProfileCompletion(profile);
  const isProfileComplete = profile?.profile_completed || false;
  const isActiveTutor = profile?.is_active !== false; // Default to true if not set

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes("pdf") && !file.type.includes("document")) {
      setUploadError("Please upload a PDF or Word document");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // For now, we'll simulate the upload
      // In a real implementation, you'd upload to storage and get a URL
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update profile with CV info
      await updateProfile({
        cv_file_name: file.name,
        cv_url: `uploads/cv/${profile?.id}/${file.name}`, // Simulated URL
        profile_completed: true,
      });
    } catch (error) {
      console.error("CV upload error:", error);
      setUploadError("Failed to upload CV. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInstant = async (requestId: string) => {
    try {
      if (!profile?.id) return;
      setAcceptingId(requestId);
      const accepted = await instantSessionService.acceptRequest(
        requestId,
        profile.id
      );
      // Optimistically remove the card immediately after accept
      setDismissedIds((prev) => new Set(prev).add(requestId));
      setInstantRequests((prev) => prev.filter((r) => r.id !== requestId));
      if (accepted.jitsi_meeting_url) {
        window.open(accepted.jitsi_meeting_url, "_blank");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectInstant = (requestId: string) =>
    setDismissedIds((prev) => new Set(prev).add(requestId));

  // Manual refresh function for instant requests
  const refreshInstantRequests = async () => {
    console.log("[TutorDashboard] Manual refresh requested...");
    try {
      const sinceIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await (supabase as any)
        .from("instant_requests")
        .select("*")
        .eq("status", "pending")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) {
        console.error("[TutorDashboard] Manual refresh error:", error);
        return;
      }
      
      if (data && data.length > 0) {
        console.log("[TutorDashboard] Manual refresh found", data.length, "pending requests");
        // Only update if the data is actually different
        setInstantRequests((prev) => {
          if (prev.length === data.length && 
              prev.every((item, index) => item.id === data[index].id)) {
            return prev; // No change needed
          }
          return data;
        });
      } else {
        console.log("[TutorDashboard] Manual refresh found no pending requests");
        setInstantRequests([]);
      }
    } catch (refreshError) {
      console.error("[TutorDashboard] Manual refresh exception:", refreshError);
    }
  };

  const handleApplicationSuccess = () => {
    checkApplication(); // Refresh application status
  };

  const isApprovedTutor = application?.application_status === "approved";
  const isPendingTutor = application?.application_status === "pending";
  // const isRejectedTutor = application?.application_status === 'rejected';

  // Check ID verification status
  const isIDVerificationApproved =
    idVerification?.verification_status === "approved";
  const isIDVerificationPending =
    idVerification?.verification_status === "pending";
  const isIDVerificationRejected =
    idVerification?.verification_status === "rejected";
  const hasIDVerification = !!idVerification;

  // Tutor features are only enabled when both application is approved AND ID verification is approved
  const areTutorFeaturesEnabled = isApprovedTutor && isIDVerificationApproved;

  // Show loading while checking application
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show application form for new tutors
  if (!application) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Tutor Application
          </h1>
          <p className="text-gray-600">
            Please provide your details and qualifications to start tutoring
            with us.
          </p>
        </div>
        <TutorApplicationForm onSuccess={handleApplicationSuccess} />
      </div>
    );
  }

  // Show application status for submitted applications
  if (
    application.application_status === ("pending" as TutorApplicationStatus)
  ) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-8"
        >
          <ClockIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Under Review
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for submitting your tutor application. Our team is
            currently reviewing your qualifications and experience.
          </p>

          <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-2">
              Application Details:
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Submitted:</span>{" "}
                {new Date(application.submitted_at).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Subjects:</span>{" "}
                {application.subjects.join(", ")}
              </p>
              <p>
                <span className="font-medium">CV:</span>{" "}
                {application.cv_file_name}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p>Review typically takes 2-3 business days.</p>
            <p>
              We'll notify you via email once your application has been
              reviewed.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (
    application.application_status ===
    ("under_review" as TutorApplicationStatus)
  ) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-8"
        >
          <ExclamationTriangleIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Under Additional Review
          </h1>
          <p className="text-gray-600 mb-6">
            Your application is being reviewed in detail by our team. We may
            contact you for additional information.
          </p>

          <div className="bg-white border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-5 w-5 mr-2" />
              <span>Extended review in progress - please check back soon</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (
    application.application_status === ("rejected" as TutorApplicationStatus)
  ) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-8"
        >
          <XCircleIcon className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Not Approved
          </h1>
          <p className="text-gray-600 mb-4">
            Unfortunately, your tutor application was not approved at this time.
          </p>

          {application.rejection_reason && (
            <div className="bg-white border border-red-200 rounded-lg p-4 mb-4 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Reason:</h3>
              <p className="text-gray-700 text-sm">
                {application.rejection_reason}
              </p>
            </div>
          )}

          {application.admin_notes && (
            <div className="bg-white border border-red-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">
                Additional Notes:
              </h3>
              <p className="text-gray-700 text-sm">{application.admin_notes}</p>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-6">
            You're welcome to improve your qualifications and apply again in the
            future.
          </p>
        </motion.div>
      </div>
    );
  }

  // If application is approved but ID verification is not completed
  if (isApprovedTutor && !areTutorFeaturesEnabled) {
    return (
      <div className="space-y-8">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.full_name}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Tutor Dashboard - Manage your tutoring profile and sessions.
          </p>
        </div>

        {/* Application Approved Notice */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">
                Application Approved!
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Congratulations! Your tutor application has been approved. To
                complete your setup and access all tutor features, please
                complete your ID verification.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ID Verification Status */}
        <div className="bg-white border border-green-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">Next Steps:</h3>
          <div className="space-y-3 text-sm text-gray-600">
            {!hasIDVerification && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Submit ID verification documents</span>
              </div>
            )}
            {isIDVerificationPending && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>ID verification under review</span>
              </div>
            )}
            {isIDVerificationRejected && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>ID verification rejected - please resubmit</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                Access full tutor features once ID verification is approved
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {!hasIDVerification && (
              <button
                onClick={() => navigate("/id-verification")}
                className="btn btn-primary w-full"
              >
                <IdentificationIcon className="h-5 w-5 mr-2" />
                Complete ID Verification
              </button>
            )}
            {isIDVerificationRejected && (
              <button
                onClick={() => navigate("/id-verification")}
                className="btn btn-primary w-full"
              >
                <IdentificationIcon className="h-5 w-5 mr-2" />
                Resubmit ID Verification
              </button>
            )}
            <button
              onClick={() => navigate("/profile")}
              className="btn btn-secondary w-full"
            >
              View Profile
            </button>
          </div>
        </div>

        {/* Note: Dashboard data and upcoming classes are only available after ID verification is completed */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Complete ID Verification to Access Dashboard
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Once your ID verification is approved, you'll have access to
                your full tutor dashboard including upcoming classes, earnings,
                and student information.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If approved, show the main tutor dashboard
  if (areTutorFeaturesEnabled) {
    return (
      <div className="space-y-8">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.full_name}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Tutor Dashboard - Manage your tutoring profile and sessions.
          </p>
        </div>

        {/* Inactive Status Warning */}
        {!isActiveTutor && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-start">
              <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  Account Temporarily Inactive
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  Your tutor account has been temporarily deactivated by the
                  admin. You can still view your dashboard and profile, but you
                  cannot schedule new classes or accept new students. Please
                  contact support for more information.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success Notice - Only show if active */}
        {isActiveTutor && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800">
                  Setup Complete!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Your tutor application and ID verification have been approved.
                  You can now schedule classes and start teaching!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/schedule-class")}
            disabled={!isActiveTutor}
            className={`p-6 border-2 rounded-lg transition-colors ${
              isActiveTutor
                ? "bg-blue-50 border-blue-200 hover:border-blue-300"
                : "bg-gray-50 border-gray-200 cursor-not-allowed opacity-50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <PlusIcon
                className={`h-8 w-8 ${
                  isActiveTutor ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <div className="text-left">
                <h3
                  className={`font-semibold ${
                    isActiveTutor ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  Schedule Class
                </h3>
                <p
                  className={`text-sm ${
                    isActiveTutor ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {isActiveTutor
                    ? "Create new tutoring sessions"
                    : "Unavailable - Account inactive"}
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/profile")}
            className="p-6 bg-purple-50 border-2 border-purple-200 rounded-lg hover:border-purple-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <UserIcon className="h-8 w-8 text-purple-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Edit Profile</h3>
                <p className="text-sm text-gray-600">Update your information</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/manage-classes")}
            disabled={!isActiveTutor}
            className={`p-6 border-2 rounded-lg transition-colors ${
              isActiveTutor
                ? "bg-orange-50 border-orange-200 hover:border-orange-300"
                : "bg-gray-50 border-gray-200 cursor-not-allowed opacity-50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <CalendarDaysIcon
                className={`h-8 w-8 ${
                  isActiveTutor ? "text-orange-600" : "text-gray-400"
                }`}
              />
              <div className="text-left">
                <h3
                  className={`font-semibold ${
                    isActiveTutor ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  Manage Classes
                </h3>
                <p
                  className={`text-sm ${
                    isActiveTutor ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {isActiveTutor
                    ? "View and edit your classes"
                    : "Unavailable - Account inactive"}
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/quizzes")}
            disabled={!isActiveTutor}
            className={`p-6 border-2 rounded-lg transition-colors ${
              isActiveTutor
                ? "bg-indigo-50 border-indigo-200 hover:border-indigo-300"
                : "bg-gray-50 border-gray-200 cursor-not-allowed opacity-50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <DocumentTextIcon
                className={`h-8 w-8 ${
                  isActiveTutor ? "text-indigo-600" : "text-gray-400"
                }`}
              />
              <div className="text-left">
                <h3
                  className={`font-semibold ${
                    isActiveTutor ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  Quizzes
                </h3>
                <p
                  className={`text-sm ${
                    isActiveTutor ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {isActiveTutor
                    ? "Create and manage quizzes"
                    : "Unavailable - Account inactive"}
                </p>
              </div>
            </div>
          </motion.button>

          <motion.div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <VideoCameraIcon className="h-8 w-8 text-green-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">My Classes</h3>
                <p className="text-sm text-gray-600">
                  {dashboardData?.upcoming_classes || 0} upcoming
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Earnings</h3>
                <p className="text-sm text-gray-600">
                  ${dashboardData?.total_earnings || 0}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Stats */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Classes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.total_classes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.upcoming_classes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${dashboardData.total_earnings}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.total_students}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Classes Summary */}
        {upcomingClasses.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Classes
                </h2>
                <button
                  onClick={() => navigate("/manage-classes")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Classes →
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingClasses.slice(0, 6).map((classItem) => (
                  <div
                    key={classItem.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {classItem.title}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          classItem.status === "scheduled"
                            ? "bg-green-100 text-green-800"
                            : classItem.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : classItem.status === "completed"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {classItem.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        {(() => {
                          const [year, month, day] = classItem.date
                            .split("-")
                            .map(Number);
                          const date = new Date(year, month - 1, day);
                          return date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          });
                        })()}{" "}
                        at {classItem.start_time}
                      </p>
                      <p>
                        {classItem.class_type?.name} • $
                        {classItem.price_per_session}
                      </p>
                      <p>
                        {classItem.current_students}/{classItem.max_students}{" "}
                        students
                      </p>
                    </div>
                    {classItem.jitsi_meeting_url && (
                      <a
                        href={classItem.jitsi_meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center mt-3 text-xs text-blue-600 hover:text-blue-700"
                      >
                        <VideoCameraIcon className="h-3 w-3 mr-1" />
                        Join Meeting
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Classes */}
        {upcomingClasses.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Upcoming Classes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zoom Meeting
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {upcomingClasses.slice(0, 10).map((classItem) => (
                    <tr key={classItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {classItem.class_type?.name === "One-to-One" ||
                            classItem.class_type?.name ===
                              "One-to-One Extended" ? (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                              </div>
                            ) : classItem.class_type?.name === "Group Class" ? (
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <UserGroupIcon className="h-5 w-5 text-green-600" />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {classItem.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {classItem.class_type?.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(() => {
                            // Parse the date string to avoid timezone issues
                            const [year, month, day] = classItem.date
                              .split("-")
                              .map(Number);
                            const date = new Date(year, month - 1, day); // month is 0-indexed
                            return date.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            });
                          })()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {classItem.start_time} - {classItem.end_time}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {classItem.current_students}/{classItem.max_students}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${classItem.price_per_session}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {classItem.jitsi_meeting_url ? (
                          <div className="space-y-1">
                            <a
                              href={classItem.jitsi_meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Join Meeting
                            </a>
                            {classItem.jitsi_room_name && (
                              <div className="text-xs text-gray-500">
                                Room: {classItem.jitsi_room_name}
                              </div>
                            )}
                            {classItem.jitsi_password && (
                              <div className="text-xs text-gray-500">
                                Pass: {classItem.jitsi_password}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Generating...
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            classItem.status === "scheduled"
                              ? "bg-green-100 text-green-800"
                              : classItem.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : classItem.status === "completed"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {classItem.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {upcomingClasses.length > 10 && (
              <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                Showing 10 of {upcomingClasses.length} upcoming classes
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // If pending, show pending status
  if (isPendingTutor) {
    return (
      <div className="space-y-8">
        <div className="border-b border-gray-200 pb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.full_name}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Tutor Dashboard - Manage your tutoring profile and sessions.
          </p>
        </div>
        {/* Application Status Notice */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-start">
            <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Application Under Review
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Your tutor application is currently under review. You'll have
                full access to the dashboard once approved by our team.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Profile Completion Alert */}
        {!isProfileComplete && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          >
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Complete Your Profile
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  You need to upload your CV and complete your profile to start
                  accepting tutoring sessions.
                </p>
                <div className="mt-2">
                  <div className="bg-yellow-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${profileCompletion}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-yellow-600 mt-1 block">
                    {profileCompletion}% complete
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* CV Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card"
            >
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <DocumentArrowUpIcon className="h-6 w-6 mr-2 text-blue-600" />
                  Curriculum Vitae
                </h2>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-green-800">
                        CV Uploaded Successfully
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        File: {application?.cv_file_name || "CV file"}
                      </p>
                    </div>
                  </div>
                </div>

                {profile?.cv_url ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-green-800">
                          CV Uploaded Successfully
                        </h3>
                        <p className="text-sm text-green-700 mt-1">
                          File: {profile.cv_file_name}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="btn btn-secondary btn-sm cursor-pointer">
                        <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                        Update CV
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleCVUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Upload Your CV
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upload your curriculum vitae to complete your tutor
                      profile
                    </p>

                    {uploadError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-red-600">{uploadError}</p>
                      </div>
                    )}

                    <label className="btn btn-primary cursor-pointer">
                      {isUploading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                          Choose File
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCVUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      PDF or Word documents only, max 5MB
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Tutor Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card"
            >
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <UserIcon className="h-6 w-6 mr-2 text-blue-600" />
                  Profile Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subjects
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {application?.subjects?.map((subject, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                        >
                          {subject}
                        </span>
                      )) || (
                        <span className="text-gray-500 text-sm">
                          No subjects listed
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <p className="text-gray-900">
                      {application?.phone_number || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience
                    </label>
                    <p className="text-gray-900">
                      {profile?.experience_years
                        ? `${profile.experience_years} years`
                        : "Not specified"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualification
                    </label>
                    <p className="text-gray-900">
                      {profile?.qualification || "Not specified"}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Application Status
                    </label>
                    <p className="text-gray-900">
                      {application?.application_status ===
                      ("pending" as TutorApplicationStatus)
                        ? "Under Review"
                        : application?.application_status ===
                          ("approved" as TutorApplicationStatus)
                        ? "Approved"
                        : application?.application_status ===
                          ("rejected" as TutorApplicationStatus)
                        ? "Rejected"
                        : "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <button className="btn btn-secondary" disabled>
                    Edit Profile (Available after approval)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Quick Stats */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card"
            >
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Stats
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Sessions
                      </p>
                      <p className="text-sm text-gray-500">0 completed</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Hours Taught
                      </p>
                      <p className="text-sm text-gray-500">0 hours</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Earnings
                      </p>
                      <p className="text-sm text-gray-500">$0.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Items */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card"
            >
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Next Steps
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-gray-500 line-through">
                      Complete application
                    </span>
                  </div>

                  <div className="flex items-center text-sm">
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2"></div>
                    <span className="text-gray-900">Wait for approval</span>

                    {profile?.cv_url ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    ) : (
                      <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2"></div>
                    )}
                    <span
                      className={
                        profile?.cv_url
                          ? "text-gray-500 line-through"
                          : "text-gray-900"
                      }
                    >
                      Upload CV
                    </span>
                  </div>

                  <div className="flex items-center text-sm">
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2"></div>
                    <span className="text-gray-900">Set availability</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2"></div>
                    <span className="text-gray-900">Set hourly rate</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2"></div>
                    <span className="text-gray-900">Add bio</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Debug Section - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Info</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Instant Requests:</span>
                <span className="ml-2 text-gray-600">{instantRequests.length}</span>
              </div>
              <div>
                <span className="font-medium">Dismissed:</span>
                <span className="ml-2 text-gray-600">{dismissedIds.size}</span>
              </div>
              <div>
                <span className="font-medium">Profile ID:</span>
                <span className="ml-2 text-gray-600">{profile?.id || 'None'}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-2 text-gray-600">
                  {application?.application_status || 'None'} / {idVerification?.verification_status || 'None'}
                </span>
              </div>
            </div>
            <div className="mt-4 space-x-2">
              <button
                onClick={async () => {
                  console.log("[Debug] Testing database access and subscription...");
                  try {
                    // Test database access
                    const { data, error } = await (supabase as any)
                      .from("instant_requests")
                      .select("*")
                      .eq("status", "pending")
                      .limit(5);
                    
                    if (error) {
                      console.error("[Debug] Database access error:", error);
                      alert(`Database Error: ${error.message}`);
                    } else {
                      console.log("[Debug] Database access successful:", data?.length || 0, "pending requests");
                      alert(`Database OK: Found ${data?.length || 0} pending requests`);
                    }
                  } catch (testError) {
                    console.error("[Debug] Test failed:", testError);
                    alert(`Test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`);
                  }
                }}
                className="bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600"
              >
                Test Database
              </button>
              <button
                onClick={() => {
                  console.log("[Debug] Current instant requests:", instantRequests);
                  console.log("[Debug] Dismissed IDs:", Array.from(dismissedIds));
                  alert(`Current: ${instantRequests.length}, Dismissed: ${dismissedIds.size}`);
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
              >
                Show State
              </button>
              <button
                onClick={async () => {
                  console.log("[Debug] Testing subscription...");
                  try {
                    await testSubscription();
                    alert("Subscription test successful!");
                  } catch (error) {
                    console.error("[Debug] Subscription test failed:", error);
                    alert(`Subscription test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
              >
                Test Subscription
              </button>
              <button
                onClick={async () => {
                  console.log("[Debug] Testing real-time configuration...");
                  try {
                    // Test if we can create a channel and subscribe
                    const testChannel = (supabase as any).channel(`realtime-test-${Date.now()}`);
                    
                    const subscriptionPromise = new Promise<void>((resolve, reject) => {
                      const timeout = setTimeout(() => {
                        reject(new Error("Real-time test timeout"));
                      }, 5000);
                      
                      testChannel.subscribe((status: any) => {
                        clearTimeout(timeout);
                        if (status === "SUBSCRIBED") {
                          console.log("[Debug] Real-time test successful");
                          resolve();
                        } else if (status === "CHANNEL_ERROR") {
                          reject(new Error("Real-time channel error"));
                        } else if (status === "TIMED_OUT") {
                          reject(new Error("Real-time timeout"));
                        }
                      });
                    });
                    
                    await subscriptionPromise;
                    
                    // Clean up test channel
                    try {
                      (supabase as any).removeChannel(testChannel);
                    } catch (e) {
                      console.warn("[Debug] Error cleaning up test channel:", e);
                    }
                    
                    alert("Real-time configuration test successful!");
                  } catch (error) {
                    console.error("[Debug] Real-time test failed:", error);
                    alert(`Real-time test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                className="bg-indigo-500 text-white px-3 py-1 rounded text-xs hover:bg-indigo-600"
              >
                Test Real-time Config
              </button>
              <button
                onClick={async () => {
                  console.log("[Debug] Running comprehensive real-time test...");
                  try {
                    await testRealTimeComprehensive();
                    alert("Comprehensive real-time test passed! Real-time should be working.");
                  } catch (error) {
                    console.error("[Debug] Comprehensive test failed:", error);
                    alert(`Comprehensive test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nThis indicates a real-time configuration issue.`);
                  }
                }}
                className="bg-pink-500 text-white px-3 py-1 rounded text-xs hover:bg-pink-600"
              >
                Comprehensive Test
              </button>
              <button
                onClick={async () => {
                  console.log("[Debug] Creating test instant request...");
                  try {
                    // Create a test instant request to verify real-time subscription
                    const testRequest = {
                      id: `test-${Date.now()}`,
                      student_id: profile?.id || 'test-student',
                      subject_id: 'test-subject',
                      duration_minutes: 15,
                      status: 'pending',
                      accepted_by_tutor_id: null,
                      jitsi_meeting_url: `https://meet.jit.si/test-${Date.now()}`,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    };
                    
                    const { data, error } = await (supabase as any)
                      .from("instant_requests")
                      .insert([testRequest])
                      .select("*")
                      .single();
                    
                    if (error) {
                      throw new Error(`Failed to create test request: ${error.message}`);
                    }
                    
                    console.log("[Debug] Test request created:", data);
                    alert("Test request created! Check if it appears in real-time.");
                    
                    // Clean up test request after 10 seconds
                    setTimeout(async () => {
                      try {
                        await (supabase as any)
                          .from("instant_requests")
                          .delete()
                          .eq("id", testRequest.id);
                        console.log("[Debug] Test request cleaned up");
                      } catch (cleanupError) {
                        console.error("[Debug] Error cleaning up test request:", cleanupError);
                      }
                    }, 10000);
                    
                  } catch (testError) {
                    console.error("[Debug] Test request creation failed:", testError);
                    alert(`Test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`);
                  }
                }}
                className="bg-orange-500 text-white px-3 py-1 rounded text-xs hover:bg-orange-600"
              >
                Create Test Request
              </button>
              <button
                onClick={async () => {
                  console.log("[Debug] Manual refresh of instant requests...");
                  try {
                    const sinceIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                    const { data, error } = await (supabase as any)
                      .from("instant_requests")
                      .select("*")
                      .eq("status", "pending")
                      .gte("created_at", sinceIso)
                      .order("created_at", { ascending: false })
                      .limit(20);
                    
                    if (error) {
                      throw new Error(`Refresh failed: ${error.message}`);
                    }
                    
                    setInstantRequests(data || []);
                    console.log("[Debug] Manual refresh completed, found", data?.length || 0, "requests");
                    alert(`Manual refresh completed! Found ${data?.length || 0} pending requests.`);
                  } catch (refreshError) {
                    console.error("[Debug] Manual refresh failed:", refreshError);
                    alert(`Refresh failed: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`);
                  }
                }}
                className="bg-teal-500 text-white px-3 py-1 rounded text-xs hover:bg-teal-600"
              >
                Manual Refresh
              </button>
            </div>
          </div>
        )}

        {/* Instant Session Requests Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Instant Session Requests
                  </CardTitle>
                  <CardDescription>
                    Help students who need immediate tutoring assistance
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </div>
                  <Button
                    onClick={refreshInstantRequests}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Debug: Show current state */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
                  <strong>Debug State:</strong> {instantRequests.length} requests, {dismissedIds.size} dismissed
                  <br />
                  <strong>Requests:</strong> {JSON.stringify(instantRequests.map(r => ({ id: r.id, status: r.status })))}
                </div>
              )}
              
              {instantRequests.filter((req) => !dismissedIds.has(req.id)).length > 0 ? (
                <div className="space-y-4">
                  {instantRequests
                    .filter((req) => !dismissedIds.has(req.id))
                    .map((req) => (
                      <div
                        key={req.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-gray-900">
                              New Request
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(req.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Student needs help with a subject
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Duration: 15 minutes</span>
                            <span>Type: Instant Session</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleAcceptInstant(req.id)}
                            disabled={acceptingId === req.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            {acceptingId === req.id ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Accepting...</span>
                              </div>
                            ) : (
                              "Accept Request"
                            )}
                          </Button>
                          <Button
                            onClick={() => handleRejectInstant(req.id)}
                            variant="outline"
                            size="sm"
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No pending requests
                  </h4>
                  <p className="text-gray-600">
                    When students request instant tutoring, their requests will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Debug: Log state changes to track UI updates
  useEffect(() => {
    console.log("[TutorDashboard] State changed - instantRequests:", {
      length: instantRequests.length,
      requests: instantRequests.map(r => ({ id: r.id, status: r.status, created_at: r.created_at }))
    });
  }, [instantRequests]);
};

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(profile: any): number {
  if (!profile) return 0;

  const fields = [
    profile.cv_url,
    profile.subjects?.length > 0,
    profile.qualification,
    profile.experience_years,
    profile.bio,
    profile.hourly_rate,
    profile.availability,
  ];

  const completedFields = fields.filter(Boolean).length;
  return Math.round((completedFields / fields.length) * 100);
}

export default TutorDashboard;
