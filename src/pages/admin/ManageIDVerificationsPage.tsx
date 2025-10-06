import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  IdentificationIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  idVerificationService,
  IDVerification,
  IDVerificationStats,
} from "@/lib/idVerificationService";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ManageIDVerificationsPage: React.FC = () => {
  const [verifications, setVerifications] = useState<IDVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<
    IDVerification[]
  >([]);
  const [selectedVerification, setSelectedVerification] =
    useState<IDVerification | null>(null);
  const [stats, setStats] = useState<IDVerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "expire">(
    "approve"
  );
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingVerification, setDeletingVerification] = useState<
    string | null
  >(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showSensitiveData, setShowSensitiveData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [verificationsData, statsData] = await Promise.all([
        idVerificationService.getAllVerifications(),
        idVerificationService.getVerificationStats(),
      ]);

      setVerifications(verificationsData);
      setFilteredVerifications(verificationsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load ID verification data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = verifications;

    if (searchTerm) {
      filtered = filtered.filter((verification) => {
        const profile = (verification as any).profiles;
        return (
          profile?.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          verification.id_number
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      });
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (verification) => verification.verification_status === filterStatus
      );
    }

    setFilteredVerifications(filtered);
  }, [verifications, searchTerm, filterStatus]);

  const handleViewDetails = (verification: IDVerification) => {
    setSelectedVerification(verification);
    setShowDetailsModal(true);
  };

  const handleAction = (
    verification: IDVerification,
    type: "approve" | "reject" | "expire"
  ) => {
    setSelectedVerification(verification);
    setActionType(type);
    setAdminNotes("");
    setRejectionReason("");
    setShowActionModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedVerification) return;

    try {
      setUpdatingStatus(selectedVerification.id);

      const statusMap = {
        approve: "approved" as const,
        reject: "rejected" as const,
        expire: "expired" as const,
      };

      const newStatus = statusMap[actionType];

      await idVerificationService.updateVerificationStatusById(
        selectedVerification.id,
        newStatus,
        adminNotes,
        actionType === "reject" ? rejectionReason : undefined
      );

      setVerifications((prev) =>
        prev.map((v) =>
          v.id === selectedVerification.id
            ? {
                ...v,
                verification_status: newStatus,
                admin_notes: adminNotes,
                rejection_reason:
                  actionType === "reject"
                    ? rejectionReason
                    : v.rejection_reason,
                verified_at: new Date().toISOString(),
              }
            : v
        )
      );

      toast.success(`ID verification ${actionType}d successfully`);
      setShowActionModal(false);
      setSelectedVerification(null);
    } catch (error) {
      console.error("Error updating verification status:", error);
      toast.error("Failed to update verification status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteVerification = async (verificationId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this ID verification? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingVerification(verificationId);
      await idVerificationService.deleteVerification(verificationId);
      setVerifications((prev) => prev.filter((v) => v.id !== verificationId));
      toast.success("ID verification deleted successfully");
    } catch (error) {
      console.error("Error deleting verification:", error);
      toast.error("Failed to delete verification");
    } finally {
      setDeletingVerification(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            Rejected
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatIDType = (idType: string) => {
    return idType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
          {/* Header */}
          <div className="pt-6">
            <h1 className="text-3xl font-bold text-foreground">
              Manage ID Verifications
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Review and manage ID verification submissions from tutors.
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
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-lg border border-border h-[152px] w-[311px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <IdentificationIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground max-w-xs">
                          Total Verifications
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="pl-0">
                      <div className="text-3xl font-bold text-foreground ml-3">
                        {stats.total_verifications}
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
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-lg border border-border h-[152px] w-[311px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <ClockIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground max-w-xs">
                          Pending
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="pl-0">
                      <div className="text-3xl font-bold text-foreground ml-3">
                        {stats.pending_verifications}
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
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-lg border border-border h-[152px] w-[311px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <CheckCircleIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground max-w-xs">
                          Approved
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="pl-0">
                      <div className="text-3xl font-bold text-foreground ml-3">
                        {stats.approved_verifications}
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
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-lg border border-border h-[152px] w-[311px]">
                  <CardHeader className="pb-2">
                    <div className="flex items-start space-x-3">
                      <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground max-w-xs">
                          Rejected
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="pl-0">
                      <div className="text-3xl font-bold text-foreground ml-3">
                        {stats.rejected_verifications}
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
            <Card className="shadow-lg border border-border">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or ID number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-input border border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <FunnelIcon className="h-5 w-5 text-muted-foreground" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-input border border-border text-foreground rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Verifications Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-lg border border-border overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                    <IdentificationIcon className="w-4 h-4 text-white" />
                  </div>
                  <span>ID Verifications ({filteredVerifications.length})</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          ID Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredVerifications.map((verification) => {
                        const profile = (verification as any).profiles;
                        return (
                          <tr
                            key={verification.id}
                            className="hover:bg-muted/50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-foreground">
                                    {profile?.full_name || "Unknown"}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {profile?.email || "No email"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">
                                {formatIDType(verification.id_type)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {showSensitiveData
                                  ? verification.id_number
                                  : "••••••••••"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(verification.verification_status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {formatDate(verification.submitted_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                {/* View Details Button */}
                                <button
                                  onClick={() =>
                                    handleViewDetails(verification)
                                  }
                                  className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                  title="View Details"
                                >
                                  <EyeIcon className="h-5 w-5" />
                                </button>

                                {/* Approve Button */}
                                {verification.verification_status ===
                                  "pending" && (
                                  <button
                                    onClick={() =>
                                      handleAction(verification, "approve")
                                    }
                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                    title="Approve"
                                  >
                                    <CheckCircleIcon className="h-5 w-5" />
                                  </button>
                                )}

                                {/* Reject Button */}
                                {verification.verification_status ===
                                  "pending" && (
                                  <button
                                    onClick={() =>
                                      handleAction(verification, "reject")
                                    }
                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    title="Reject"
                                  >
                                    <XCircleIcon className="h-5 w-5" />
                                  </button>
                                )}

                                {/* Delete Button */}
                                <button
                                  onClick={() =>
                                    handleDeleteVerification(verification.id)
                                  }
                                  disabled={
                                    deletingVerification === verification.id
                                  }
                                  className={`inline-flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                                    deletingVerification === verification.id
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                  title="Delete"
                                >
                                  {deletingVerification === verification.id ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <TrashIcon className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredVerifications.length === 0 && (
                  <div className="text-center py-12">
                    <IdentificationIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">
                      No verifications found
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchTerm || filterStatus !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "No ID verifications have been submitted yet."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sensitive Data Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="shadow-lg border border-border">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowSensitiveData(!showSensitiveData)}
                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>
                      {showSensitiveData ? "Hide" : "Show"} Sensitive Data
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Details Modal */}
          {showDetailsModal && selectedVerification && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground">
                    ID Verification Details
                  </h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* User Information */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-foreground mb-4">
                      User Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Full Name
                        </label>
                        <p className="mt-1 text-sm text-foreground">
                          {showSensitiveData
                            ? selectedVerification.full_name
                            : "••••••••••"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Email
                        </label>
                        <p className="mt-1 text-sm text-foreground">
                          {(selectedVerification as any).profiles?.email ||
                            "No email"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Date of Birth
                        </label>
                        <p className="mt-1 text-sm text-foreground">
                          {showSensitiveData &&
                          selectedVerification.date_of_birth
                            ? formatDate(selectedVerification.date_of_birth)
                            : "••••••••••"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Phone
                        </label>
                        <p className="mt-1 text-sm text-foreground">
                          {(selectedVerification as any).profiles?.phone ||
                            "No phone"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* ID Information */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-foreground mb-4">
                      ID Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          ID Type
                        </label>
                        <p className="mt-1 text-sm text-foreground">
                          {formatIDType(selectedVerification.id_type)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          ID Number
                        </label>
                        <p className="mt-1 text-sm text-foreground">
                          {showSensitiveData
                            ? selectedVerification.id_number
                            : "••••••••••"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Issuing Country
                        </label>
                        <p className="mt-1 text-sm text-foreground">
                          {selectedVerification.issuing_country ||
                            "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Issuing Authority
                        </label>
                        <p className="mt-1 text-sm text-foreground">
                          {selectedVerification.issuing_authority ||
                            "Not specified"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Expiry Date
                        </label>
                        <p className="mt-1 text-sm text-foreground">
                          {showSensitiveData && selectedVerification.expiry_date
                            ? formatDate(selectedVerification.expiry_date)
                            : "••••••••••"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-foreground mb-4">
                      Verification Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Status
                        </label>
                        <div className="mt-1">
                          {getStatusBadge(
                            selectedVerification.verification_status
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Submitted
                        </label>
                        <p className="mt-1 text-sm text-foreground">
                          {formatDate(selectedVerification.submitted_at)}
                        </p>
                      </div>
                      {selectedVerification.verified_at && (
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground">
                            Verified
                          </label>
                          <p className="mt-1 text-sm text-foreground">
                            {formatDate(selectedVerification.verified_at)}
                          </p>
                        </div>
                      )}
                      {selectedVerification.admin_notes && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-muted-foreground">
                            Admin Notes
                          </label>
                          <p className="mt-1 text-sm text-foreground">
                            {selectedVerification.admin_notes}
                          </p>
                        </div>
                      )}
                      {selectedVerification.rejection_reason && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-muted-foreground">
                            Rejection Reason
                          </label>
                          <p className="mt-1 text-sm text-foreground">
                            {selectedVerification.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ID Images */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-foreground mb-4">
                      ID Images
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedVerification.front_image_url && (
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Front Image
                          </label>
                          <div className="relative">
                            <img
                              src={selectedVerification.front_image_url}
                              alt="ID Front"
                              className="w-full h-48 object-cover rounded-lg border border-border"
                              onError={(e) => {
                                console.error(
                                  "Error loading front image:",
                                  selectedVerification.front_image_url
                                );
                                (e.target as HTMLImageElement).src =
                                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBVbmF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+";
                              }}
                            />
                            <div className="absolute top-2 right-2">
                              <a
                                href={selectedVerification.front_image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs hover:bg-opacity-70"
                              >
                                Open
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedVerification.back_image_url && (
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Back Image
                          </label>
                          <div className="relative">
                            <img
                              src={selectedVerification.back_image_url}
                              alt="ID Back"
                              className="w-full h-48 object-cover rounded-lg border border-border"
                              onError={(e) => {
                                console.error(
                                  "Error loading back image:",
                                  selectedVerification.back_image_url
                                );
                                (e.target as HTMLImageElement).src =
                                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBVbmF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+";
                              }}
                            />
                            <div className="absolute top-2 right-2">
                              <a
                                href={selectedVerification.back_image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs hover:bg-opacity-70"
                              >
                                Open
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedVerification.selfie_with_id_url && (
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Selfie with ID
                          </label>
                          <div className="relative">
                            <img
                              src={selectedVerification.selfie_with_id_url}
                              alt="Selfie with ID"
                              className="w-full h-48 object-cover rounded-lg border border-border"
                              onError={(e) => {
                                console.error(
                                  "Error loading selfie image:",
                                  selectedVerification.selfie_with_id_url
                                );
                                (e.target as HTMLImageElement).src =
                                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBVbmF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+";
                              }}
                            />
                            <div className="absolute top-2 right-2">
                              <a
                                href={selectedVerification.selfie_with_id_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs hover:bg-opacity-70"
                              >
                                Open
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {!selectedVerification.front_image_url &&
                      !selectedVerification.back_image_url &&
                      !selectedVerification.selfie_with_id_url && (
                        <p className="text-sm text-muted-foreground mt-2">
                          No images uploaded
                        </p>
                      )}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4 p-6 border-t border-border">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Modal */}
          {showActionModal && selectedVerification && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-card border border-border rounded-lg w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground">
                    {actionType === "approve"
                      ? "Approve"
                      : actionType === "reject"
                      ? "Reject"
                      : "Mark as Expired"}{" "}
                    Verification
                  </h2>
                  <button
                    onClick={() => setShowActionModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to {actionType} this ID verification?
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Admin Notes
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-input border border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Add notes about this decision..."
                    />
                  </div>

                  {actionType === "reject" && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Rejection Reason *
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-input border border-border text-foreground placeholder:text-muted-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Please provide a reason for rejection..."
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-4 p-6 border-t border-border">
                  <button
                    onClick={() => setShowActionModal(false)}
                    className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={
                      updatingStatus === selectedVerification.id ||
                      (actionType === "reject" && !rejectionReason.trim())
                    }
                    className={`px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      actionType === "approve"
                        ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                        : actionType === "reject"
                        ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        : "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500"
                    }`}
                  >
                    {updatingStatus === selectedVerification.id ? (
                      <LoadingSpinner size="sm" />
                    ) : actionType === "approve" ? (
                      "Approve"
                    ) : actionType === "reject" ? (
                      "Reject"
                    ) : (
                      "Mark as Expired"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
    </motion.div>
  );
};

export default ManageIDVerificationsPage;
