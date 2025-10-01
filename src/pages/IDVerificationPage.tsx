import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  idVerificationService,
  IDVerification,
} from "@/lib/idVerificationService";
import IDVerificationForm from "@/components/idVerification/IDVerificationForm";
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
        await idVerificationService.getVerificationByUserId();
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
          <div className="bg-yellow-500/20 border-2 border-yellow-500/30 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-600 rounded-2xl shadow-lg">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-yellow-300">
                  Verification Pending
                </h3>
                <p className="text-base text-yellow-200 mt-2">
                  Your ID verification has been submitted and is under review.
                  We'll notify you once it's processed.
                </p>
                <p className="text-sm text-yellow-400 mt-3 font-medium">
                  Submitted on:{" "}
                  {new Date(verification.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        );

      case "approved":
        return (
          <div className="bg-green-500/20 border-2 border-green-500/30 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-2xl shadow-lg">
                <CheckCircleIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-300">
                  Verification Approved
                </h3>
                <p className="text-base text-green-200 mt-2">
                  Your ID verification has been approved. You can now access all
                  tutor features.
                </p>
                {verification.verified_at && (
                  <p className="text-sm text-green-400 mt-3 font-medium">
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
          <div className="bg-red-500/20 border-2 border-red-500/30 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-600 rounded-2xl shadow-lg">
                <XCircleIcon className="h-8 w-8 text-white mt-0.5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-300">
                  Verification Rejected
                </h3>
                <p className="text-base text-red-200 mt-2">
                  Your ID verification was not approved. Please review the
                  reason below and submit a new verification.
                </p>
                {verification.rejection_reason && (
                  <div className="mt-4 p-4 bg-red-500/30 rounded-xl border border-red-500/40">
                    <p className="text-sm font-bold text-red-300">
                      Reason for rejection:
                    </p>
                    <p className="text-sm text-red-200 mt-2">
                      {verification.rejection_reason}
                    </p>
                  </div>
                )}
                {verification.admin_notes && (
                  <div className="mt-3 p-4 bg-red-500/30 rounded-xl border border-red-500/40">
                    <p className="text-sm font-bold text-red-300">
                      Admin notes:
                    </p>
                    <p className="text-sm text-red-200 mt-2">
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
          <div className="bg-slate-500/20 border-2 border-slate-500/30 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-600 rounded-2xl shadow-lg">
                <ExclamationTriangleIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-300">
                  Verification Expired
                </h3>
                <p className="text-base text-slate-200 mt-2">
                  Your ID verification has expired. Please submit a new
                  verification.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-6 px-6 py-3 bg-slate-600 text-white rounded-2xl hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
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
      <div className="min-h-screen bg-slate-800 relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -my-10 px-4 sm:px-6 lg:px-8 py-10">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/15 to-yellow-400/15 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/15 to-green-400/15 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/10 to-yellow-300/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg">
              Loading verification status...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800 relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -my-10 px-4 sm:px-6 lg:px-8 py-10">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/15 to-yellow-400/15 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/15 to-green-400/15 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/10 to-yellow-300/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="p-3 bg-green-600 rounded-3xl shadow-lg">
                  <IdentificationIcon className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-green-400">
                  ID Verification
                </h1>
              </div>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Complete your ID verification to access all tutor features. This
                helps us ensure the safety and authenticity of our platform.
              </p>
            </div>

            {/* Status Display */}
            {verification && getStatusDisplay()}

            {/* Form */}
            {showForm && (
              <IDVerificationForm
                onSuccess={handleVerificationSuccess}
                onCancel={handleCancel}
              />
            )}

            {/* Instructions */}
            {!verification && !showForm && (
              <div className="bg-blue-500/20 border-2 border-blue-500/30 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-600 rounded-2xl shadow-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-white mt-0.5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-300">
                      Get Started with ID Verification
                    </h3>
                    <p className="text-base text-blue-200 mt-2">
                      To complete your tutor profile and access all features,
                      you need to verify your identity. This process is quick
                      and secure.
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-6 px-8 py-3 bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white rounded-2xl hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-lg transition-all duration-300 font-medium"
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
                className="text-green-400 hover:text-green-300 font-medium text-lg hover:underline transition-colors duration-200"
              >
                ← Back to Dashboard
              </button>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export { IDVerificationPage as default };
