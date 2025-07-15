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
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const TutorDashboard: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const profileCompletion = calculateProfileCompletion(profile);
  const isProfileComplete = profile?.profile_completed || false;

  // Handle CV file upload
  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('document')) {
      setUploadError('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // For now, we'll simulate the upload
      // In a real implementation, you'd upload to storage and get a URL
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update profile with CV info
      await updateProfile({
        cv_file_name: file.name,
        cv_url: `uploads/cv/${profile?.id}/${file.name}`, // Simulated URL
        profile_completed: true,
      });

    } catch (error) {
      console.error('CV upload error:', error);
      setUploadError('Failed to upload CV. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

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
                You need to upload your CV and complete your profile to start accepting tutoring sessions.
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
                    Upload your curriculum vitae to complete your tutor profile
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
                    {profile?.subjects?.map((subject, index) => (
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
                    Experience
                  </label>
                  <p className="text-gray-900">
                    {profile?.experience_years ? `${profile.experience_years} years` : 'Not specified'}
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualification
                  </label>
                  <p className="text-gray-900">
                    {profile?.qualification || 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <button className="btn btn-secondary">
                  Edit Profile
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
                  {profile?.cv_url ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <div className="h-4 w-4 border-2 border-gray-300 rounded-full mr-2"></div>
                  )}
                  <span className={profile?.cv_url ? 'text-gray-500 line-through' : 'text-gray-900'}>
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