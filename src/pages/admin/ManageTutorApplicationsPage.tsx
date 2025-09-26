import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  AdminTutorApplicationService,
  TutorApplication,
  ApplicationStats,
} from "@/lib/adminTutorApplicationService";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ManageTutorApplicationsPage: React.FC = () => {
  const { adminSession } = useAdmin();
  const [applications, setApplications] = useState<TutorApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    TutorApplication[]
  >([]);
  const [selectedApplication, setSelectedApplication] =
    useState<TutorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingAction, setProcessingAction] = useState(false);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    recentApplications: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load applications and stats in parallel
      const [applicationsData, statsData] = await Promise.all([
        AdminTutorApplicationService.getAllApplications(),
        AdminTutorApplicationService.getApplicationStats(),
      ]);

      setApplications(applicationsData);
      setFilteredApplications(applicationsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load tutor application data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter applications based on search and status filter
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(
        (application) =>
          application.full_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          application.applicant_email
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          application.subjects.some((subject) =>
            subject.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (application) => application.application_status === filterStatus
      );
    }

    setFilteredApplications(filtered);
  }, [applications, searchTerm, filterStatus]);

  const handleViewApplication = (application: TutorApplication) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const handleApproveApplication = (application: TutorApplication) => {
    setSelectedApplication(application);
    setActionType("approve");
    setAdminNotes("");
    setShowActionModal(true);
  };

  const handleRejectApplication = (application: TutorApplication) => {
    setSelectedApplication(application);
    setActionType("reject");
    setAdminNotes("");
    setRejectionReason("");
    setShowActionModal(true);
  };

  const handleDownloadCV = async (cvUrl: string, fileName: string) => {
    try {
      // Check if the URL is valid
      if (!cvUrl || cvUrl.includes("undefined") || cvUrl.includes("null")) {
        toast.error("CV file not found or URL is invalid");
        return;
      }

      // Extract bucket and path from URL
      const urlMatch = cvUrl.match(
        /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/
      );
      if (!urlMatch) {
        toast.error("Invalid CV URL format");
        return;
      }

      const bucketName = urlMatch[1];
      const filePath = urlMatch[2];

      // Try to download using Supabase storage client first
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(filePath);

        if (error) {
          throw error;
        }

        if (data) {
          // Create a blob URL
          const blobUrl = window.URL.createObjectURL(data);

          // Create a temporary anchor element
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileName || "cv.pdf";

          // Append to body, click, and remove
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up the blob URL
          window.URL.revokeObjectURL(blobUrl);

          toast.success("CV download started");
          return;
        }
      } catch (storageError) {
        // Fallback: Try direct URL fetch
        const response = await fetch(cvUrl);

        if (!response.ok) {
          if (response.status === 404) {
            toast.error(
              "CV file not found. The file may have been deleted or moved."
            );
          } else {
            toast.error(`Failed to download CV. Error: ${response.status}`);
          }
          return;
        }

        // Get the blob from the response
        const blob = await response.blob();

        // Create a blob URL
        const blobUrl = window.URL.createObjectURL(blob);

        // Create a temporary anchor element
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName || "cv.pdf";

        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);

        toast.success("CV download started");
      }
    } catch (error) {
      console.error("Error downloading CV:", error);
      toast.error("Failed to download CV. Please try again.");
    }
  };

  const handleActionSubmit = async () => {
    if (!selectedApplication || !actionType || !adminSession) {
      toast.error("Missing required information");
      return;
    }

    setProcessingAction(true);

    try {
      let success = false;

      if (actionType === "approve") {
        success = await AdminTutorApplicationService.approveApplication(
          selectedApplication.id,
          adminNotes || undefined
        );

        if (success) {
          toast.success("Application approved successfully");
        } else {
          toast.error("Failed to approve application");
        }
      } else if (actionType === "reject") {
        if (!rejectionReason.trim()) {
          toast.error("Please provide a rejection reason");
          setProcessingAction(false);
          return;
        }

        success = await AdminTutorApplicationService.rejectApplication(
          selectedApplication.id,
          rejectionReason,
          adminNotes || undefined
        );

        if (success) {
          toast.success("Application rejected successfully");
        } else {
          toast.error("Failed to reject application");
        }
      }

      if (success) {
        setShowActionModal(false);
        setShowApplicationModal(false);
        loadData(); // Reload data to reflect changes
      }
    } catch (error) {
      console.error("Error processing application action:", error);
      toast.error("An error occurred while processing the application");
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const dashboardStats = [
    {
      name: "Total Applications",
      value: stats.total.toString(),
      change: "+12%",
      changeType: "positive",
      icon: DocumentTextIcon,
    },
    {
      name: "Pending Review",
      value: stats.pending.toString(),
      change: "+5%",
      changeType: "positive",
      icon: ClockIcon,
    },
    {
      name: "Approved",
      value: stats.approved.toString(),
      change: "+8%",
      changeType: "positive",
      icon: CheckCircleIcon,
    },
    {
      name: "Recent Applications",
      value: stats.recentApplications.toString(),
      change: "+15%",
      changeType: "positive",
      icon: UserGroupIcon,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
          {/* Header */}
          <div className="pt-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Tutor Applications
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Review and manage tutor applications submitted by potential
              educators.
            </p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 justify-center"
          >
            {dashboardStats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
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
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === "positive"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {stat.change}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Applications Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-[0_2px_2px_0_#16803D] border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-4 h-4 text-white" />
                  </div>
                  <span>Tutor Applications</span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#34A853] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#34A853] focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Applications Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subjects
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            {applications.length === 0
                              ? "No applications found"
                              : "No applications match your search criteria"}
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((application) => (
                          <tr key={application.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {application.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {application.full_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {application.applicant_email}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {application.phone_number}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                {application.subjects
                                  .slice(0, 3)
                                  .map((subject, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {subject}
                                    </span>
                                  ))}
                                {application.subjects.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    +{application.subjects.length - 3} more
                                  </span>
                                )}
                              </div>
                              {application.specializes_learning_disabilities && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Learning Disabilities Specialist
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(application.application_status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(application.submitted_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() =>
                                    handleViewApplication(application)
                                  }
                                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#34A853] to-[#6DD47E] rounded-lg hover:from-[#2E8B47] hover:to-[#5BC06F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#34A853] transition-all duration-200 shadow-[0_2px_2px_0_#16803D] hover:shadow-[0_4px_4px_0_#16803D] transform hover:scale-105"
                                  title="View Details"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  View
                                </button>
                                {application.application_status ===
                                  "pending" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleApproveApplication(application)
                                      }
                                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                      title="Approve Application"
                                    >
                                      <CheckIcon className="h-4 w-4 mr-1" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRejectApplication(application)
                                      }
                                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                      title="Reject Application"
                                    >
                                      <XMarkIcon className="h-4 w-4 mr-1" />
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Application Details Modal */}
          {showApplicationModal && selectedApplication && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Application Details: {selectedApplication.full_name}
                    </h3>
                    <button
                      onClick={() => setShowApplicationModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Personal Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            <strong>Name:</strong>{" "}
                            {selectedApplication.full_name}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            <strong>Email:</strong>{" "}
                            {selectedApplication.applicant_email}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            <strong>Phone:</strong>{" "}
                            {selectedApplication.phone_number}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>
                            <strong>Submitted:</strong>{" "}
                            {formatDate(selectedApplication.submitted_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Teaching Information */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Teaching Information
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <strong>Subjects:</strong>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedApplication.subjects.map(
                              (subject, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {subject}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                        <div>
                          <strong>Learning Disabilities Specialization:</strong>
                          <span
                            className={`ml-2 ${
                              selectedApplication.specializes_learning_disabilities
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {selectedApplication.specializes_learning_disabilities
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Additional Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <span>
                            <strong>Postcode:</strong>{" "}
                            {selectedApplication.postcode}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span>
                            <strong>Based in Country:</strong>{" "}
                            {selectedApplication.based_in_country}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span>
                            <strong>Employment Status:</strong>{" "}
                            {selectedApplication.employment_status ||
                              "Not specified"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span>
                            <strong>Education Level:</strong>{" "}
                            {selectedApplication.education_level ||
                              "Not specified"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span>
                            <strong>Average Weekly Hours:</strong>{" "}
                            {selectedApplication.average_weekly_hours ||
                              "Not specified"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span>
                            <strong>Expected Hourly Rate:</strong>{" "}
                            {selectedApplication.expected_hourly_rate
                              ? `$${selectedApplication.expected_hourly_rate}`
                              : "Not specified"}
                          </span>
                        </div>
                      </div>

                      {selectedApplication.past_experience && (
                        <div className="mt-4">
                          <strong>Past Experience:</strong>
                          <div className="bg-gray-50 p-3 rounded-lg mt-2">
                            <p className="text-sm text-gray-700">
                              {selectedApplication.past_experience}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedApplication.weekly_availability && (
                        <div className="mt-4">
                          <strong>Weekly Availability:</strong>
                          <div className="bg-gray-50 p-3 rounded-lg mt-2">
                            <p className="text-sm text-gray-700">
                              {selectedApplication.weekly_availability}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CV Information */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        CV Information
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedApplication.cv_file_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Size:{" "}
                              {formatFileSize(selectedApplication.cv_file_size)}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleDownloadCV(
                                selectedApplication.cv_url,
                                selectedApplication.cv_file_name
                              )
                            }
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#34A853] to-[#6DD47E] rounded-lg hover:from-[#2E8B47] hover:to-[#5BC06F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#34A853] transition-all duration-200 shadow-[0_2px_2px_0_#16803D] hover:shadow-[0_4px_4px_0_#16803D] transform hover:scale-105"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                            Download CV
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Additional Notes */}
                    {selectedApplication.additional_notes && (
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">
                          Additional Notes
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-700">
                            {selectedApplication.additional_notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Application Status */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Application Status
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="mr-2">Status:</span>
                          {getStatusBadge(
                            selectedApplication.application_status
                          )}
                        </div>
                        {selectedApplication.reviewed_at && (
                          <div className="text-sm text-gray-600">
                            Reviewed:{" "}
                            {formatDate(selectedApplication.reviewed_at)}
                          </div>
                        )}
                        {selectedApplication.rejection_reason && (
                          <div className="text-sm text-gray-600">
                            <strong>Rejection Reason:</strong>{" "}
                            {selectedApplication.rejection_reason}
                          </div>
                        )}
                        {selectedApplication.admin_notes && (
                          <div className="text-sm text-gray-600">
                            <strong>Admin Notes:</strong>{" "}
                            {selectedApplication.admin_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {selectedApplication.application_status === "pending" && (
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() =>
                            handleApproveApplication(selectedApplication)
                          }
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#34A853] to-[#6DD47E] rounded-lg hover:from-[#2E8B47] hover:to-[#5BC06F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#34A853] transition-all duration-200 shadow-[0_2px_2px_0_#16803D] hover:shadow-[0_4px_4px_0_#16803D] transform hover:scale-105"
                        >
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Approve Application
                        </button>
                        <button
                          onClick={() =>
                            handleRejectApplication(selectedApplication)
                          }
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                        >
                          <XMarkIcon className="h-4 w-4 mr-2" />
                          Reject Application
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Modal */}
          {showActionModal && selectedApplication && actionType && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {actionType === "approve" ? "Approve" : "Reject"}{" "}
                      Application
                    </h3>
                    <button
                      onClick={() => setShowActionModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-4">
                        You are about to <strong>{actionType}</strong> the
                        application from{" "}
                        <strong>{selectedApplication.full_name}</strong>.
                      </p>
                    </div>

                    {actionType === "reject" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection Reason *
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#34A853] focus:border-transparent"
                          placeholder="Please provide a reason for rejection..."
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Notes (Optional)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#34A853] focus:border-transparent"
                        placeholder="Add any additional notes..."
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => setShowActionModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                        disabled={processingAction}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleActionSubmit}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                          actionType === "approve"
                            ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                            : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        }`}
                        disabled={
                          processingAction ||
                          (actionType === "reject" && !rejectionReason.trim())
                        }
                      >
                        {processingAction ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            {actionType === "approve" ? (
                              <>
                                <CheckIcon className="h-4 w-4 mr-2" />
                                Approve Application
                              </>
                            ) : (
                              <>
                                <XMarkIcon className="h-4 w-4 mr-2" />
                                Reject Application
                              </>
                            )}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ManageTutorApplicationsPage;
