import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DocumentArrowUpIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TutorApplicationForm from '@/components/forms/TutorApplicationForm';
import { db } from '@/lib/db';
import type { TutorApplication } from '@/types/auth';

const TutorDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<TutorApplication | null>(null);

  // Check for existing application on mount
  useEffect(() => {
    checkApplication();
  }, [user]);

  const checkApplication = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const existingApplication = await db.tutorApplications.getByUserId(user.id);
      setApplication(existingApplication);
    } catch (error: any) {
      // If no application found, that's fine
      if (error.code !== 'PGRST116') {
        console.error("Error checking application:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSuccess = () => {
    checkApplication(); // Refresh application status
  };

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
            Please provide your details and qualifications to start tutoring with us.
          </p>
        </div>
        <TutorApplicationForm onSuccess={handleApplicationSuccess} />
      </div>
    );
  }

  // Show application status for submitted applications
  if (application.application_status === 'pending') {
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
            Thank you for submitting your tutor application. Our team is currently reviewing your qualifications and experience.
          </p>
          
          <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-2">Application Details:</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Submitted:</span> {new Date(application.submitted_at).toLocaleDateString()}</p>
              <p><span className="font-medium">Subjects:</span> {application.subjects.join(', ')}</p>
              <p><span className="font-medium">CV:</span> {application.cv_file_name}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p>Review typically takes 2-3 business days.</p>
            <p>We'll notify you via email once your application has been reviewed.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (application.application_status === 'under_review') {
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
            Your application is being reviewed in detail by our team. We may contact you for additional information.
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

  if (application.application_status === 'rejected') {
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
              <p className="text-gray-700 text-sm">{application.rejection_reason}</p>
            </div>
          )}

          {application.admin_notes && (
            <div className="bg-white border border-red-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Additional Notes:</h3>
              <p className="text-gray-700 text-sm">{application.admin_notes}</p>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-6">
            You're welcome to improve your qualifications and apply again in the future.
          </p>
        </motion.div>
      </div>
    );
  }

  // If approved, show the main tutor dashboard (but locked until admin approval)
  const profileCompletion = calculateProfileCompletion(profile);
  const isProfileComplete = profile?.profile_completed || false;

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
              Application Submitted Successfully!
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              Your tutor application is currently under review. You'll have full access to the dashboard once approved by our team.
            </p>
          </div>
        </div>
      </motion.div>

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
                      File: {application?.cv_file_name || 'CV file'}
                    </p>
                  </div>
                </div>
              </div>
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
                      <span className="text-gray-500 text-sm">No subjects listed</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <p className="text-gray-900">{application?.phone_number || 'Not specified'}</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Status
                  </label>
                  <p className="text-gray-900">
                    {application?.application_status === 'pending' ? 'Under Review' : 
                     application?.application_status === 'approved' ? 'Approved' :
                     application?.application_status === 'rejected' ? 'Rejected' : 'Unknown'}
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
                    <p className="text-sm font-medium text-gray-900">Sessions</p>
                    <p className="text-sm text-gray-500">0 completed</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Hours Taught</p>
                    <p className="text-sm text-gray-500">0 hours</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Earnings</p>
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
                  <span className="text-gray-500 line-through">Complete application</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2"></div>
                  <span className="text-gray-900">Wait for approval</span>
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
  );
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