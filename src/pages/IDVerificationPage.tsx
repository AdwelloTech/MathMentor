import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  idVerificationService,
  IDVerification,
} from "@/lib/idVerificationService";
import IDVerificationForm from "@/components/idVerification/IDVerificationForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TutorPageWrapper from "@/components/ui/TutorPageWrapper";
import {
  IdentificationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const IDVerificationPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [verification, setVerification] = useState<IDVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user && profile) {
      loadVerification();
    }
  }, [user, profile]);

  const loadVerification = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      const existingVerification =
        await idVerificationService.getVerificationByUserId(profile.id); // Use profile.id instead of user.id
      setVerification(existingVerification);

      // Show form if no verification exists
      if (!existingVerification) {
        setShowForm(true);
      }
    } catch (error) {
      console.error("Error loading verification:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setShowForm(false);
    loadVerification(); // Reload to show the new verification
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const getStatusDisplay = () => {
    if (!verification) return null;

    switch (verification.verification_status) {
      case "pending":
        return (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-600 rounded-2xl shadow-lg">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-yellow-800">
                  Verification Pending
                </h3>
                <p className="text-base text-yellow-700 mt-2">
                  Your ID verification has been submitted and is under review.
                  We'll notify you once it's processed.
                </p>
                <p className="text-sm text-yellow-600 mt-3 font-medium">
                  Submitted on:{" "}
                  {new Date(verification.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        );

      case "approved":
        return (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-2xl shadow-lg">
                <CheckCircleIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800">
                  Verification Approved
                </h3>
                <p className="text-base text-green-700 mt-2">
                  Your ID verification has been approved. You can now access all
                  tutor features.
                </p>
                {verification.verified_at && (
                  <p className="text-sm text-green-600 mt-3 font-medium">
                    Approved on:{" "}
                    {new Date(verification.verified_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case "rejected":
        return (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-600 rounded-2xl shadow-lg">
                <XCircleIcon className="h-8 w-8 text-white mt-0.5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-800">
                  Verification Rejected
                </h3>
                <p className="text-base text-red-700 mt-2">
                  Your ID verification was not approved. Please review the
                  reason below and submit a new verification.
                </p>
                {verification.rejection_reason && (
                  <div className="mt-4 p-4 bg-red-100 rounded-xl border border-red-200">
                    <p className="text-sm font-bold text-red-800">
                      Reason for rejection:
                    </p>
                    <p className="text-sm text-red-700 mt-2">
                      {verification.rejection_reason}
                    </p>
                  </div>
                )}
                {verification.admin_notes && (
                  <div className="mt-3 p-4 bg-red-100 rounded-xl border border-red-200">
                    <p className="text-sm font-bold text-red-800">
                      Admin notes:
                    </p>
                    <p className="text-sm text-red-700 mt-2">
                      {verification.admin_notes}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-6 px-6 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                >
                  Submit New Verification
                </button>
              </div>
            </div>
          </div>
        );

      case "expired":
        return (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-600 rounded-2xl shadow-lg">
                <ExclamationTriangleIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Verification Expired
                </h3>
                <p className="text-base text-gray-700 mt-2">
                  Your ID verification has expired. Please submit a new
                  verification.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-6 px-6 py-3 bg-gray-600 text-white rounded-2xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                >
                  Submit New Verification
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <TutorPageWrapper backgroundClass="bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-900 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">
              Loading verification status...
            </p>
          </div>
        </div>
      </TutorPageWrapper>
    );
  }

  return (
    <TutorPageWrapper backgroundClass="bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="p-3 bg-green-900 rounded-3xl shadow-lg">
                  <IdentificationIcon className="h-12 w-12 text-yellow-400" />
                </div>
                <h1 className="text-4xl font-bold text-green-900">
                  ID Verification
                </h1>
              </div>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Complete your ID verification to access all tutor features. This
                helps us ensure the safety and authenticity of our platform.
              </p>
            </div>

            {/* Status Display */}
            {verification && getStatusDisplay()}

            {/* Form */}
            {showForm && (
              <IDVerificationForm
                userId={profile!.id}
                onSuccess={handleVerificationSuccess}
                onCancel={handleCancel}
              />
            )}

            {/* Instructions */}
            {!verification && !showForm && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-600 rounded-2xl shadow-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-white mt-0.5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-800">
                      Get Started with ID Verification
                    </h3>
                    <p className="text-base text-blue-700 mt-2">
                      To complete your tutor profile and access all features,
                      you need to verify your identity. This process is quick
                      and secure.
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                    >
                      Start Verification
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Back to Dashboard */}
            <div className="text-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-green-900 hover:text-green-700 font-medium text-lg hover:underline transition-colors duration-200"
              >
                ← Back to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </TutorPageWrapper>
  );
};

export default IDVerificationPage;
