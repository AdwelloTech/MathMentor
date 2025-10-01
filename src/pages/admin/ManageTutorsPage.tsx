import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  VideoCameraIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import {
  adminTutorService,
  Tutor,
  TutorStats,
  TutorClass,
} from "@/lib/adminTutorService";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ManageTutorsPage: React.FC = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [tutorClasses, setTutorClasses] = useState<TutorClass[]>([]);
  const [stats, setStats] = useState<TutorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [showClassesModal, setShowClassesModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingTutor, setDeletingTutor] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [tutorsData, statsData] = await Promise.all([
        adminTutorService.getAllTutors(),
        adminTutorService.getTutorStats(),
      ]);

      setTutors(tutorsData);
      setFilteredTutors(tutorsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load tutor data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter tutors based on search and status filter
    let filtered = tutors;

    if (searchTerm) {
      filtered = filtered.filter(
        (tutor) =>
          tutor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tutor.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          tutor.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      if (filterStatus === "active") {
        filtered = filtered.filter((tutor) => tutor.is_active);
      } else if (filterStatus === "inactive") {
        filtered = filtered.filter((tutor) => !tutor.is_active);
      } else if (filterStatus === "approved") {
        filtered = filtered.filter(
          (tutor) => tutor.application_status === "approved"
        );
      } else if (filterStatus === "pending") {
        filtered = filtered.filter(
          (tutor) => tutor.application_status === "pending"
        );
      } else if (filterStatus === "rejected") {
        filtered = filtered.filter(
          (tutor) => tutor.application_status === "rejected"
        );
      }
    }

    setFilteredTutors(filtered);
  }, [tutors, searchTerm, filterStatus]);

  const handleViewTutor = async (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setShowTutorModal(true);
  };

  const handleViewClasses = async (tutor: Tutor) => {
    try {
      const classes = await adminTutorService.getTutorClasses(tutor.user_id);
      setTutorClasses(classes);
      setSelectedTutor(tutor);
      setShowClassesModal(true);
    } catch (error) {
      console.error("Error loading tutor classes:", error);
      toast.error("Failed to load tutor classes");
    }
  };

  const handleUpdateStatus = async (tutorId: string, isActive: boolean) => {
    try {
      setUpdatingStatus(tutorId);
      await adminTutorService.updateTutorStatus(tutorId, isActive);

      // Update local state
      setTutors((prev) =>
        prev.map((tutor) =>
          tutor.id === tutorId ? { ...tutor, is_active: isActive } : tutor
        )
      );

      toast.success(
        `Tutor ${isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Error updating tutor status:", error);
      toast.error("Failed to update tutor status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteTutor = async (tutorId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this tutor? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingTutor(tutorId);
      await adminTutorService.deleteTutor(tutorId);

      // Update local state
      setTutors((prev) => prev.filter((tutor) => tutor.id !== tutorId));

      toast.success("Tutor deleted successfully");
    } catch (error) {
      console.error("Error deleting tutor:", error);
      toast.error("Failed to delete tutor");
    } finally {
      setDeletingTutor(null);
    }
  };

  const getStatusBadge = (tutor: Tutor) => {
    if (!tutor.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }

    switch (tutor.application_status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "N/A";
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
        <div className="space-y-6">
          {/* Header */}
          <div className="pt-6">
            <h1 className="text-3xl font-bold text-gray-900">Manage Tutors</h1>
            <p className="mt-2 text-lg text-gray-600">
              View and manage all tutor profiles, their status, and scheduled
              classes.
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-[0_2px_2px_0_#16803D] h-[152px] w-[311px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 max-w-xs">
                          Total Tutors
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="pl-0">
                      <div className="text-3xl font-bold text-gray-900 ml-3">
                        {stats.total}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-[0_2px_2px_0_#16803D] h-[152px] w-[311px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <CheckCircleIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 max-w-xs">
                          Active
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="pl-0">
                      <div className="text-3xl font-bold text-gray-900 ml-3">
                        {stats.active}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-[0_2px_2px_0_#16803D] h-[152px] w-[311px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <AcademicCapIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 max-w-xs">
                          Approved
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="pl-0">
                      <div className="text-3xl font-bold text-gray-900 ml-3">
                        {stats.approved}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-[0_2px_2px_0_#16803D] h-[152px] w-[311px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <ClockIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 max-w-xs">
                          Pending
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="pl-0">
                      <div className="text-3xl font-bold text-gray-900 ml-3">
                        {stats.pending}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-[0_2px_2px_0_#16803D] border-0">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search tutors by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#34A853] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#34A853] focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tutors Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-[0_2px_2px_0_#16803D] border-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <span>Tutors ({filteredTutors.length})</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tutor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTutors.map((tutor) => (
                        <tr key={tutor.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                {tutor.profile_image_url ? (
                                  <img
                                    src={tutor.profile_image_url}
                                    alt={tutor.full_name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-gray-700">
                                    {tutor.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {tutor.full_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {tutor.qualification || "No qualification"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {tutor.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {tutor.phone || "No phone"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(tutor)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(tutor.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-3">
                              {/* View Details Button */}
                              <button
                                onClick={() => handleViewTutor(tutor)}
                                className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                title="View Details"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>

                              {/* View Classes Button */}
                              <button
                                onClick={() => handleViewClasses(tutor)}
                                className="inline-flex items-center justify-center p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                title="View Classes"
                              >
                                <CalendarDaysIcon className="h-5 w-5" />
                              </button>

                              {/* Activate/Deactivate Button */}
                              <button
                                onClick={() =>
                                  handleUpdateStatus(tutor.id, !tutor.is_active)
                                }
                                disabled={updatingStatus === tutor.id}
                                className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                  tutor.is_active
                                    ? "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 focus:ring-red-500"
                                    : "bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 focus:ring-green-500"
                                } ${
                                  updatingStatus === tutor.id
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                title={
                                  tutor.is_active ? "Deactivate" : "Activate"
                                }
                              >
                                {updatingStatus === tutor.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : tutor.is_active ? (
                                  <XCircleIcon className="h-5 w-5" />
                                ) : (
                                  <CheckCircleIcon className="h-5 w-5" />
                                )}
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteTutor(tutor.id)}
                                disabled={deletingTutor === tutor.id}
                                className={`inline-flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                                  deletingTutor === tutor.id
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                title="Delete"
                              >
                                {deletingTutor === tutor.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <TrashIcon className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredTutors.length === 0 && (
                  <div className="text-center py-12">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No tutors found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || filterStatus !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "No tutors have been registered yet."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Tutor Details Modal */}
          {showTutorModal && selectedTutor && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Tutor Details
                  </h2>
                  <button
                    onClick={() => setShowTutorModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Basic Information
                      </h3>

                      <div className="flex items-center space-x-3">
                        <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                          {selectedTutor.profile_image_url ? (
                            <img
                              src={selectedTutor.profile_image_url}
                              alt={selectedTutor.full_name}
                              className="h-16 w-16 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-medium text-gray-700">
                              {selectedTutor.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {selectedTutor.full_name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {selectedTutor.role}
                          </p>
                          {getStatusBadge(selectedTutor)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {selectedTutor.email}
                          </span>
                        </div>
                        {selectedTutor.phone && (
                          <div className="flex items-center space-x-2">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {selectedTutor.phone}
                            </span>
                          </div>
                        )}
                        {selectedTutor.address && (
                          <div className="flex items-center space-x-2">
                            <MapPinIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {selectedTutor.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Professional Information
                      </h3>

                      <div className="space-y-2">
                        {selectedTutor.qualification && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Qualification:
                            </span>
                            <p className="text-sm text-gray-900">
                              {selectedTutor.qualification}
                            </p>
                          </div>
                        )}

                        {selectedTutor.experience_years && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Experience:
                            </span>
                            <p className="text-sm text-gray-900">
                              {selectedTutor.experience_years} years
                            </p>
                          </div>
                        )}

                        {selectedTutor.hourly_rate && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Hourly Rate:
                            </span>
                            <p className="text-sm text-gray-900">
                              {formatCurrency(selectedTutor.hourly_rate)}
                            </p>
                          </div>
                        )}

                        {selectedTutor.subjects &&
                          selectedTutor.subjects.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">
                                Subjects:
                              </span>
                              <p className="text-sm text-gray-900">
                                {selectedTutor.subjects.join(", ")}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="md:col-span-2 space-y-4">
                      {selectedTutor.bio && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Bio
                          </h3>
                          <p className="text-sm text-gray-700 mt-2">
                            {selectedTutor.bio}
                          </p>
                        </div>
                      )}

                      {selectedTutor.availability && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Availability
                          </h3>
                          <p className="text-sm text-gray-700 mt-2">
                            {selectedTutor.availability}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Profile Completed:
                          </span>
                          <p className="text-sm text-gray-900">
                            {selectedTutor.profile_completed ? "Yes" : "No"}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Last Login:
                          </span>
                          <p className="text-sm text-gray-900">
                            {formatDate(selectedTutor.last_login)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tutor Classes Modal */}
          {showClassesModal && selectedTutor && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Classes by {selectedTutor.full_name}
                  </h2>
                  <button
                    onClick={() => setShowClassesModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
                  {tutorClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tutorClasses.map((classItem) => (
                        <div
                          key={classItem.id}
                          className="bg-gray-50 rounded-lg p-4 border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900">
                              {classItem.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                classItem.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : classItem.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {classItem.status}
                            </span>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <CalendarDaysIcon className="h-4 w-4" />
                              <span>{formatDate(classItem.date)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="h-4 w-4" />
                              <span>
                                {classItem.start_time} - {classItem.end_time}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <AcademicCapIcon className="h-4 w-4" />
                              <span>{classItem.class_type.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <UserGroupIcon className="h-4 w-4" />
                              <span>
                                {classItem.current_students}/
                                {classItem.max_students} students
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CurrencyDollarIcon className="h-4 w-4" />
                              <span>
                                {formatCurrency(classItem.price_per_session)}
                              </span>
                            </div>
                          </div>

                          {classItem.jitsi_meeting && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <VideoCameraIcon className="h-4 w-4" />
                                <span>Jitsi Meeting Available</span>
                              </div>
                              <a
                                href={classItem.jitsi_meeting.meeting_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm mt-1"
                              >
                                <LinkIcon className="h-4 w-4" />
                                <span>Join Meeting</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No classes found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        This tutor hasn't scheduled any classes yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ManageTutorsPage;
