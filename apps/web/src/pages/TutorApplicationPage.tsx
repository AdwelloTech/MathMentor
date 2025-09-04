import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TutorApplicationForm from "@/components/forms/TutorApplicationForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { db } from "@/lib/db";
import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import type { TutorApplication } from "@/types/auth";

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
      const application = await db.tutorApplications.getByUserId(user.id);
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

  const handleApplicationSuccess = () => {
    setShowSuccessMessage(true);
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
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <AcademicCapIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You're Already a Tutor!
            </h1>
            <p className="text-gray-600 mb-6">
              You already have tutor access in your account. You can manage your
              tutoring activities from your dashboard.
            </p>
            <button onClick={handleGoToDashboard} className="btn btn-primary">
              Go to Tutor Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading spinner while checking for existing application
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Show success message after submission
  if (
    showSuccessMessage ||
    (existingApplication &&
      existingApplication.application_status === "pending")
  ) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-8"
          >
            <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Application Submitted Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in becoming a tutor with MathMentor.
              Your application has been received and is currently under review.
            </p>

            <div className="bg-white border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>Review typically takes 2-3 business days</span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-6">
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
      </DashboardLayout>
    );
  }

  // Show status for approved applications
  if (existingApplication?.application_status === "approved") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8">
            <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Application Approved!
            </h1>
            <p className="text-gray-600 mb-6">
              Congratulations! Your tutor application has been approved. Your
              account should now have tutor privileges.
            </p>
            <button onClick={handleGoToDashboard} className="btn btn-primary">
              Go to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show status for rejected applications
  if (existingApplication?.application_status === "rejected") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <XCircleIcon className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Application Not Approved
            </h1>
            <p className="text-gray-600 mb-4">
              Unfortunately, your tutor application was not approved at this
              time.
            </p>

            {existingApplication.rejection_reason && (
              <div className="bg-white border border-red-200 rounded-lg p-4 mb-4 text-left">
                <h3 className="font-medium text-gray-900 mb-2">Reason:</h3>
                <p className="text-gray-700 text-sm">
                  {existingApplication.rejection_reason}
                </p>
              </div>
            )}

            {existingApplication.admin_notes && (
              <div className="bg-white border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-gray-900 mb-2">
                  Additional Notes:
                </h3>
                <p className="text-gray-700 text-sm">
                  {existingApplication.admin_notes}
                </p>
              </div>
            )}

            <p className="text-sm text-gray-600 mb-6">
              You're welcome to apply again in the future once you've addressed
              the feedback provided.
            </p>

            <button onClick={handleGoToDashboard} className="btn btn-secondary">
              Return to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show status for under_review applications
  if (existingApplication?.application_status === "under_review") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Application Under Review
            </h1>
            <p className="text-gray-600 mb-6">
              Your application is currently being reviewed by our team. We may
              contact you if we need additional information.
            </p>

            <div className="bg-white border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>Review in progress - please check back soon</span>
              </div>
            </div>

            <button onClick={handleGoToDashboard} className="btn btn-secondary">
              Return to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show application form for new applications
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <TutorApplicationForm
          onSuccess={handleApplicationSuccess}
          onCancel={handleGoToDashboard}
        />
      </div>
    </DashboardLayout>
  );
};

export default TutorApplicationPage;
