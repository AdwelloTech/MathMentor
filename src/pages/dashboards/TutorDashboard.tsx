import React, { useState, useEffect } from "react";
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
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import TutorApplicationForm from "@/components/forms/TutorApplicationForm";
import { db } from "@/lib/db";
import { classSchedulingService } from "@/lib/classSchedulingService";
import type { TutorApplication, TutorApplicationStatus } from "@/types/auth";
import type { TutorDashboardStats, TutorClass } from "@/types/classScheduling";

const TutorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<TutorApplication | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<TutorDashboardStats | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<TutorClass[]>([]);

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
      const existingApplications = await db.tutorApplications.getByUserId(
        user.id
      );
      // Get the most recent application (first in the array since it's ordered by submitted_at desc)
      const mostRecentApplication = existingApplications?.[0] || null;
      setApplication(mostRecentApplication);

      // If application is approved, load dashboard data
      if (mostRecentApplication?.application_status === 'approved') {
        await loadDashboardData();
      }
    } catch (error: any) {
      // If no application found, that's fine
      if (error.code !== "PGRST116") {
        console.error("Error checking application:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [stats, classes] = await Promise.all([
        classSchedulingService.stats.getTutorStats(user!.id),
        classSchedulingService.classes.getUpcomingByTutorId(user!.id)
      ]);
      
      setDashboardStats(stats);
      setUpcomingClasses(classes);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const profileCompletion = calculateProfileCompletion(profile);
  const isProfileComplete = profile?.profile_completed || false;

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

  const handleApplicationSuccess = () => {
    checkApplication(); // Refresh application status
  };

  const isApprovedTutor = application?.application_status === 'approved';
  const isPendingTutor = application?.application_status === 'pending';
  const isRejectedTutor = application?.application_status === 'rejected';

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

  // If approved, show the main tutor dashboard
  if (isApprovedTutor) {
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

        {/* Success Notice */}
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
                Your tutor application has been approved. You can now schedule classes and start teaching!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/schedule-class')}
            className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <PlusIcon className="h-8 w-8 text-blue-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Schedule Class</h3>
                <p className="text-sm text-gray-600">Create new tutoring sessions</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/profile')}
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

          <motion.div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <VideoCameraIcon className="h-8 w-8 text-green-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">My Classes</h3>
                <p className="text-sm text-gray-600">{dashboardStats?.upcoming_classes || 0} upcoming</p>
              </div>
            </div>
          </motion.div>

          <motion.div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Earnings</h3>
                <p className="text-sm text-gray-600">${dashboardStats?.total_earnings || 0}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Stats */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Classes</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.total_classes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.upcoming_classes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">${dashboardStats.total_earnings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.total_students}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Classes */}
        {upcomingClasses.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Classes</h2>
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
                            {classItem.class_type?.name === 'One-to-One' || classItem.class_type?.name === 'One-to-One Extended' ? (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                              </div>
                            ) : classItem.class_type?.name === 'Group Class' ? (
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
                            <div className="text-sm font-medium text-gray-900">{classItem.title}</div>
                            <div className="text-sm text-gray-500">{classItem.class_type?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(() => {
                            // Parse the date string to avoid timezone issues
                            const [year, month, day] = classItem.date.split('-').map(Number);
                            const date = new Date(year, month - 1, day); // month is 0-indexed
                            return date.toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
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
                        {classItem.zoom_link ? (
                          <div className="space-y-1">
                            <a
                              href={classItem.zoom_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Join Meeting
                            </a>
                            {classItem.zoom_meeting_id && (
                              <div className="text-xs text-gray-500">
                                ID: {classItem.zoom_meeting_id}
                              </div>
                            )}
                            {classItem.zoom_password && (
                              <div className="text-xs text-gray-500">
                                Pass: {classItem.zoom_password}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Generating...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          classItem.status === 'scheduled' 
                            ? 'bg-green-100 text-green-800'
                            : classItem.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : classItem.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {classItem.status.replace('_', ' ')}
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
                Your tutor application is currently under review. You'll have full
                access to the dashboard once approved by our team.
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
