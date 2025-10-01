import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TutorApplicationForm from "@/components/forms/TutorApplicationForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { db } from "@/lib/db";
import { checkTutorDashboardAccess } from "@/lib/tutorApplicationAcceptance";
import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import type { TutorApplication } from "@/types/auth";
import ApplicationStatusView from "@/components/tutor/application/ApplicationStatusView";

const TutorApplicationPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [existingApplication, setExistingApplication] =
    useState<TutorApplication | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check for existing application on component mount
  useEffect(() => {
    checkExistingApplication();
  }, [user]);

  const checkExistingApplication = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await db.tutorApplications.getByUserId(user.id);
      const application = response.success ? response.data : null;

      // If application is under_review, try to auto-approve it for immediate access
      if (application && application.application_status === 'under_review') {
        console.log('Found under_review application, attempting auto-approval...');
        const accessCheck = await checkTutorDashboardAccess(user.id);
        if (accessCheck.hasAccess) {
          console.log('Auto-approval successful, refreshing application status...');
          // Refresh the application status after auto-approval
          const updatedResponse = await db.tutorApplications.getByUserId(user.id);
          const updatedApplication = updatedResponse.success ? updatedResponse.data : null;
          setExistingApplication(updatedApplication);
          return;
        }
      }

      setExistingApplication(application);
    } catch (error: any) {
      // If no application found, that's fine
      if (error.code !== "PGRST116") {
        console.error("Error checking existing application:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSuccess = async () => {
    setShowSuccessMessage(true);
    // Check if we can grant immediate access
    if (user) {
      const accessCheck = await checkTutorDashboardAccess(user.id);
      if (accessCheck.hasAccess) {
        toast.success('Tutor dashboard access granted! You can now access tutor features.');
      }
    }
    checkExistingApplication(); // Refresh application status
  };

  const handleGoToDashboard = () => {
    if (profile?.role) {
      navigate(`/dashboard/${profile.role}`);
    } else {
      navigate("/dashboard/student"); // Default fallback
    }
  };

  // Redirect if user is already a tutor
  if (profile?.role === "tutor") {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-8">
          <AcademicCapIcon className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            You're Already a Tutor!
          </h1>
          <p className="text-secondary-foreground mb-6">
            You already have tutor access in your account. You can manage your
            tutoring activities from your dashboard.
          </p>
          <button onClick={handleGoToDashboard} className="btn btn-primary">
            Go to Tutor Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking for existing application
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show success message after submission
  if (
    showSuccessMessage ||
    (existingApplication &&
      existingApplication.application_status === "pending")
  ) {
    return (
      <div>
        <div className="max-w-2xl mx-auto text-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-success/10 border border-success/20 rounded-lg p-8"
          >
            <CheckCircleIcon className="h-16 w-16 text-success mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Application Submitted Successfully!
            </h1>
            <p className="text-secondary-foreground mb-6">
              Thank you for your interest in becoming a tutor with MathMentor.
              Your application has been received and is currently under review.
            </p>

            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="flex items-center text-sm text-secondary-foreground">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>Review typically takes 2-3 business days</span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-secondary-foreground mb-6">
              <p>
                We'll notify you via email when your application has been
                reviewed.
              </p>
              <p>
                If approved, you'll gain access to tutor features in your
                dashboard.
              </p>
            </div>

            <button onClick={handleGoToDashboard} className="btn btn-primary">
              Return to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show status for approved applications
  if (existingApplication?.application_status === "approved") {
    return (
      <div>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-success/10 border border-success/20 rounded-lg p-8">
            <CheckCircleIcon className="h-16 w-16 text-success mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Application Approved!
            </h1>
            <p className="text-secondary-foreground mb-6">
              Congratulations! Your tutor application has been approved. Your
              account should now have tutor privileges.
            </p>
            <button onClick={handleGoToDashboard} className="btn btn-primary">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show status for rejected or under_review applications
  if (existingApplication && (existingApplication.application_status === "rejected" || existingApplication.application_status === "under_review")) {
    return (
      <ApplicationStatusView 
        application={existingApplication} 
        onGoToDashboard={handleGoToDashboard}
      />
    );
  }

  // Show application form for new applications
  return (
    <div className="container mx-auto px-4 py-8">
      <TutorApplicationForm
        onSuccess={handleApplicationSuccess}
        onCancel={handleGoToDashboard}
      />
    </div>
  );
};

export default TutorApplicationPage;
