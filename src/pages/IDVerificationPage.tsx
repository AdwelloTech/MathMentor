import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { idVerificationService, IDVerification } from '@/lib/idVerificationService';
import IDVerificationForm from '@/components/idVerification/IDVerificationForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  IdentificationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const IDVerificationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [verification, setVerification] = useState<IDVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadVerification();
    }
  }, [user]);

  const loadVerification = async () => {
    try {
      setLoading(true);
      const existingVerification = await idVerificationService.getVerificationByUserId(user!.id);
      setVerification(existingVerification);
      
      // Show form if no verification exists
      if (!existingVerification) {
        setShowForm(true);
      }
    } catch (error) {
      console.error('Error loading verification:', error);
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
      case 'pending':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div>
                <h3 className="text-lg font-medium text-yellow-800">Verification Pending</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your ID verification has been submitted and is under review. We'll notify you once it's processed.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  Submitted on: {new Date(verification.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        );

      case 'approved':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-medium text-green-800">Verification Approved</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your ID verification has been approved. You can now access all tutor features.
                </p>
                {verification.verified_at && (
                  <p className="text-xs text-green-600 mt-2">
                    Approved on: {new Date(verification.verified_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'rejected':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <XCircleIcon className="h-8 w-8 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Verification Rejected</h3>
                <p className="text-sm text-red-700 mt-1">
                  Your ID verification was not approved. Please review the reason below and submit a new verification.
                </p>
                {verification.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-100 rounded-md">
                    <p className="text-sm font-medium text-red-800">Reason for rejection:</p>
                    <p className="text-sm text-red-700 mt-1">{verification.rejection_reason}</p>
                  </div>
                )}
                {verification.admin_notes && (
                  <div className="mt-2 p-3 bg-red-100 rounded-md">
                    <p className="text-sm font-medium text-red-800">Admin notes:</p>
                    <p className="text-sm text-red-700 mt-1">{verification.admin_notes}</p>
                  </div>
                )}
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Submit New Verification
                </button>
              </div>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="h-8 w-8 text-gray-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-800">Verification Expired</h3>
                <p className="text-sm text-gray-700 mt-1">
                  Your ID verification has expired. Please submit a new verification.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <IdentificationIcon className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">ID Verification</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete your ID verification to access all tutor features. This helps us ensure the safety and authenticity of our platform.
          </p>
        </div>

        {/* Status Display */}
        {verification && getStatusDisplay()}

        {/* Form */}
        {showForm && (
          <IDVerificationForm
            userId={user!.id}
            applicationId="" // You might want to get this from the tutor's application
            onSuccess={handleVerificationSuccess}
            onCancel={handleCancel}
          />
        )}

        {/* Instructions */}
        {!verification && !showForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-blue-800">Get Started with ID Verification</h3>
                <p className="text-sm text-blue-700 mt-1">
                  To complete your tutor profile and access all features, you need to verify your identity. 
                  This process is quick and secure.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default IDVerificationPage; 