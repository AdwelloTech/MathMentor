import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
// Removed unused tutorial components
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
  XCircleIcon,
  IdentificationIcon,
  DocumentTextIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { Star } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TutorApplicationForm from "@/components/forms/TutorApplicationForm";
import {
  instantSessionService,
  type InstantRequest,
} from "@/lib/instantSessionService";
import { idVerificationService } from "@/lib/idVerificationService";
import apiClient from "@/lib/apiClient";
import DashboardService from "@/lib/dashboardService";
import type { TutorApplication, TutorApplicationStatus } from "@/types/auth";
import type { TutorDashboardStats } from "@/lib/dashboardService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateDocumentFile } from "@/constants/form";
import toast from "react-hot-toast";
import OnlineStatusToggle from "@/components/tutor/OnlineStatusToggle";

const TutorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<TutorApplication | null>(null);
  const [idVerification, setIdVerification] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] =
    useState<TutorDashboardStats | null>(null);
  const [instantRequests, setInstantRequests] = useState<InstantRequest[]>([]);
  const FRESH_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

  // Audio notification setup (unlocked on first user interaction)
  const audioCtxRef = useRef<any>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);




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

    // Polling mechanism to fetch pending requests every 10 seconds
    // For now, we'll skip polling since the API isn't implemented yet
    const poll = setInterval(async () => {
      try {
        // Skip polling for now - implement when instant requests API is ready
        console.log("[TutorDashboard] polling skipped - API not implemented yet");
      } catch (_) {}
    }, 10000);

    console.log(
      "[TutorDashboard] Setting up subscription for tutor:",
      profile?.id,
      "enabled:",
      isEnabled,
      "application status:",
      application?.application_status,
      "id verification status:",
      idVerification?.verification_status
    );
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = instantSessionService.subscribeToPending(
        ({ new: req, eventType }) => {
          console.log(
            "[TutorDashboard] Event received:",
            eventType,
            (req as any).id,
            "status:",
            (req as any).id
          );
          if (eventType === "INSERT") {
            const isFresh =
              Date.now() - new Date((req as any).created_at).getTime() <=
              FRESH_WINDOW_MS;
            if (!isFresh) return; // ignore stale backlog
            playNotificationSound();
            setInstantRequests((prev) => {
              const exists = prev.some((r) => r.id === (req as any).id);
              if (exists) return prev;
              return [req as InstantRequest, ...prev];
            });
          }
          if (eventType === "UPDATE") {
            console.log("[TutorDashboard] UPDATE event received:", {
              requestId: (req as any).id,
              status: (req as any).status,
              currentRequests: instantRequests.length,
            });
            setInstantRequests((prev) => {
              const newList =
                (req as any).status !== "pending"
                  ? prev.filter((r) => r.id !== (req as any).id)
                  : prev;
              console.log("[TutorDashboard] After UPDATE filter:", {
                beforeCount: prev.length,
                afterCount: newList.length,
                removed: prev.length - newList.length,
              });
              return newList;
            });
          }
        },
        undefined,
        profile?.is_online || false
      );
    } catch (error) {
      console.error("[TutorDashboard] Error setting up subscription:", error);
    }
    return () => {
      console.log(
        "[TutorDashboard] Cleaning up subscription for tutor:",
        profile?.id
      );
      clearInterval(poll);
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error(
            "[TutorDashboard] Error cleaning up subscription:",
            error
          );
        }
      }
    };
  }, [
    application?.application_status,
    idVerification?.verification_status,
    profile?.id,
    profile?.is_online,
  ]);

  const checkApplication = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Use apiClient for consistent URL handling
      const result = await apiClient.get<any[]>('/api/tutors/applications');
      if (result && result.length > 0) {
        // Get the most recent application
        const mostRecentApplication = result[0];
        setApplication(mostRecentApplication);
      } else {
        setApplication(null);
      }
    } catch (error: any) {
      // If no application found, that's fine
      console.error("Error checking application:", error);
    } finally {
      setLoading(false);
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

  const loadDashboardData = async () => {
    if (!profile) return;

    try {
      const stats = await DashboardService.getTutorStats(profile.id);

      setDashboardStats(stats);
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
    if (!validateDocumentFile(file)) {
      toast.error("Please upload a PDF (.pdf) or Word (.doc, .docx) file");
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
      setIsUploading(false);
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
      <div className="min-h-screen bg-[#D5FFC5] relative overflow-hidden">
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 pb-16 relative z-10"
        >
          <div className="space-y-8">
            <div className="text-center py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Complete Your Tutor Application
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Please provide your details and qualifications to start
                  tutoring with us.
                </p>
                <TutorApplicationForm onSuccess={handleApplicationSuccess} />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show application status for submitted applications
  if (
    application.application_status === ("pending" as TutorApplicationStatus)
  ) {
    return (
      <div className="min-h-screen bg-[#D5FFC5] relative overflow-hidden">
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 pb-16 relative z-10"
        >
          <div className="space-y-8">
            <div className="text-center py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
              >
                <Card className="shadow-[0_2px_2px_0_#16803D] border-0 p-8">
                  <ClockIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Application Under Review
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Thank you for submitting your tutor application. Our team is
                    currently reviewing your qualifications and experience.
                  </p>


                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Application Details:
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Submitted:</span>{" "}
                        {new Date(
                          application.submitted_at
                        ).toLocaleDateString()}
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
                </Card>
              </motion.div>
            </div>
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
      <div className="min-h-screen bg-[#D5FFC5] relative overflow-hidden">
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 pb-16 relative z-10"
        >
          {/* Status Indicator - Top Right */}
          <div id="tutor-welcome" className="flex justify-between items-start mb-6">
            {/* Dashboard Title and Welcome Message - Left Side */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tutor Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                Welcome back, {profile?.full_name}! Manage your tutoring
                sessions and students.
              </p>
            </div>

            {/* Action Buttons - Right Side */}
            <div className="flex items-center space-x-4">
              <Button
                id="schedule-class-button"
                onClick={() => navigate("/schedule-class")}
                disabled={!isActiveTutor}
                className="bg-[#16803D] hover:bg-[#0F5A2A] text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Schedule Class
              </Button>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Approved</span>
                </div>
              </motion.div>

              {/* Online Status Toggle */}
              <div id="online-status-toggle">
                <OnlineStatusToggle className="ml-4" />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Status Alerts */}
            <div id="tutor-status-overview">
            {!isActiveTutor && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                      Account Temporarily Inactive
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      Your tutor account has been temporarily deactivated. You
                      can still view your dashboard and profile, but you cannot
                      schedule new classes or accept new students.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {isActiveTutor && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-green-800">
                      Setup Complete!
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your tutor application and ID verification have been
                      approved. You can now schedule classes and start teaching!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Online Status Message */}
            {isActiveTutor && profile?.is_online === false && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-800">
                      You are currently offline
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Toggle the online switch above to start receiving instant
                      session requests from students.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            </div>

            {/* Stats Grid */}
            <motion.div
              id="tutor-stats"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-center"
            >
              {[
                {
                  name: "Total Classes",
                  value: dashboardStats?.total_sessions || 0,
                  icon: VideoCameraIcon,
                  color: "from-green-600 to-green-700",
                  description: "All time sessions",
                },
                {
                  name: "Students Taught",
                  value: dashboardStats?.total_students || 0,
                  icon: UserGroupIcon,
                  color: "from-blue-500 to-blue-600",
                  description: "Unique students",
                },
                {
                  name: "This Month",
                  value: dashboardStats?.upcoming_sessions || 0,
                  icon: CalendarDaysIcon,
                  color: "from-yellow-500 to-yellow-600",
                  description: "Upcoming sessions",
                },
                {
                  name: "Earnings",
                  value: `$${dashboardStats?.monthly_earnings || 0}`,
                  icon: CurrencyDollarIcon,
                  color: "from-green-700 to-green-800",
                  description: "Monthly earnings",
                },
              ].map((stat) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-[0_2px_2px_0_#16803D] h-[152px] w-[311px]">
                    <CardHeader className="pb-2">
                      <div className="flex items-start space-x-3">
                        <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 max-w-xs">
                            {stat.name}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="pl-0">
                        <div className="flex items-start space-x-2">
                          <div className="text-3xl font-bold text-gray-900 ml-3">
                            {stat.value}
                          </div>
                          <p className="text-sm text-muted-foreground mt-3 px-6">
                            {stat.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Main Content Grid - Removed Upcoming Classes and Instant Requests cards */}

            {/* Quick Actions */}
            <motion.div
              id="tutor-quick-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-16"
            >
              <Card className="shadow-[0_2px_2px_0_#16803D] border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                      <LightBulbIcon className="w-4 h-4 text-white" />
                    </div>
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        title: "Schedule Class",
                        description: "Create a new tutoring session",
                        icon: PlusIcon,
                        color: "from-green-600 to-green-700",
                        action: () => navigate("/schedule-class"),
                        disabled: !isActiveTutor,
                      },
                      {
                        title: "Manage Classes",
                        description: "View and edit your classes",
                        icon: CalendarDaysIcon,
                        color: "from-blue-500 to-blue-600",
                        action: () => navigate("/manage-classes"),
                        disabled: !isActiveTutor,
                      },
                      {
                        title: "Create Quiz",
                        description: "Build assessments for students",
                        icon: DocumentTextIcon,
                        color: "from-purple-500 to-purple-600",
                        action: () => navigate("/create-quiz"),
                        disabled: !isActiveTutor,
                      },
                      {
                        title: "Ratings",
                        description: "View student feedback",
                        icon: Star,
                        color: "from-yellow-500 to-yellow-600",
                        action: () => navigate("/tutor/ratings"),
                        disabled: !isActiveTutor,
                      },
                    ].map((action) => (
                      <motion.div
                        key={action.title}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={`cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-lg shadow-gray-200/50 border-0 ${
                            action.disabled
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          onClick={action.disabled ? undefined : action.action}
                        >
                          <CardContent className="p-6 text-center">
                            <div
                              className={`bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg`}
                            >
                              <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                              {action.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              {action.description}
                            </p>
                            <div className="bg-yellow-300 text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-yellow-200 transition-all duration-200 shadow-md hover:shadow-lg">
                              {action.disabled ? "Unavailable" : "Get Started"}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // If pending, show pending status
  if (isPendingTutor) {
    return (
      <div className="min-h-screen bg-[#D5FFC5] relative overflow-hidden">
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 pb-16 relative z-10"
        >
          <div className="space-y-8">
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-6 relative"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome, {profile?.full_name}
                  </h1>
                  <p className="text-lg text-gray-600">
                    Tutor Dashboard - Manage your tutoring profile and sessions.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Application Status Notice */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-800">
                    Application Under Review
                  </h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Your tutor application is currently under review. You'll
                    have full access to the dashboard once approved by our team.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Profile Completion Alert */}
            <div id="tutor-profile-completion">
            {!isProfileComplete && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Complete Your Profile
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      You need to upload your CV and complete your profile to
                      start accepting tutoring sessions.
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
            </div>

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
                            <p className="text-sm text-red-600">
                              {uploadError}
                            </p>
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
          </div>
        </motion.div>
      </div>
    );
  }
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
