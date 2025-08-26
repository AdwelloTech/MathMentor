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
  DocumentTextIcon,
  VideoCameraIcon,
  ExclamationCircleIcon,
  XMarkIcon,
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

// Helper function to generate initials safely
const generateInitials = (fullName: string | null | undefined): string => {
  // Handle null/undefined/empty cases
  if (!fullName || typeof fullName !== "string") {
    return "??";
  }

  // Trim and split by whitespace, filter out empty parts
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "??";
  }

  // Map to first character of each part, with fallback
  const initials = parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2); // Limit to 2 characters max

  return initials || "??";
};

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
          tutor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      } else if (filterStatus === "under_review") {
        filtered = filtered.filter(
          (tutor) => tutor.application_status === "under_review"
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
      const classes = await adminTutorService.getTutorClasses(tutor.id);
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
      case "under_review":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Under Review
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
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">Manage Tutors</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and manage all tutor profiles, their status, and scheduled
          classes.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Tutors
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.approved}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Under Review
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.under_review}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <XMarkIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.rejected}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tutors by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tutors Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Tutors ({filteredTutors.length})
          </h2>
        </div>

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
                            {generateInitials(tutor.full_name)}
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
                    <div className="text-sm text-gray-900">{tutor.email}</div>
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
                        title={tutor.is_active ? "Deactivate" : "Activate"}
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
      </div>

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
                          {generateInitials(selectedTutor.full_name)}
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
                      <h3 className="text-lg font-medium text-gray-900">Bio</h3>
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
  );
};

export default ManageTutorsPage;
