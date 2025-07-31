import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
} from '@heroicons/react/24/outline';
import { idVerificationService, IDVerification, IDVerificationStats } from '@/lib/idVerificationService';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const ManageIDVerificationsPage: React.FC = () => {
  const [verifications, setVerifications] = useState<IDVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<IDVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<IDVerification | null>(null);
  const [stats, setStats] = useState<IDVerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'expire'>('approve');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingVerification, setDeletingVerification] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [verificationsData, statsData] = await Promise.all([
        idVerificationService.getAllVerifications(),
        idVerificationService.getVerificationStats()
      ]);

      setVerifications(verificationsData);
      setFilteredVerifications(verificationsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load ID verification data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = verifications;
    
    if (searchTerm) {
      filtered = filtered.filter(verification => {
        const profile = (verification as any).profiles;
        return (
          profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          verification.id_number.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(verification => verification.verification_status === filterStatus);
    }
    
    setFilteredVerifications(filtered);
  }, [verifications, searchTerm, filterStatus]);

  const handleViewDetails = (verification: IDVerification) => {
    setSelectedVerification(verification);
    setShowDetailsModal(true);
  };

  const handleAction = (verification: IDVerification, type: 'approve' | 'reject' | 'expire') => {
    setSelectedVerification(verification);
    setActionType(type);
    setAdminNotes('');
    setRejectionReason('');
    setShowActionModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedVerification) return;

    try {
      setUpdatingStatus(selectedVerification.id);
      
      const statusMap = {
        'approve': 'approved' as const,
        'reject': 'rejected' as const,
        'expire': 'expired' as const
      };
      
      const newStatus = statusMap[actionType];
      
      await idVerificationService.updateVerificationStatus(
        selectedVerification.id,
        newStatus,
        adminNotes,
        actionType === 'reject' ? rejectionReason : undefined
      );
      
      setVerifications(prev => prev.map(v => 
        v.id === selectedVerification.id 
          ? { 
              ...v, 
              verification_status: newStatus,
              admin_notes: adminNotes,
              rejection_reason: actionType === 'reject' ? rejectionReason : v.rejection_reason,
              verified_at: new Date().toISOString()
            }
          : v
      ));
      
      toast.success(`ID verification ${actionType}d successfully`);
      setShowActionModal(false);
      setSelectedVerification(null);
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast.error('Failed to update verification status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteVerification = async (verificationId: string) => {
    if (!confirm('Are you sure you want to delete this ID verification? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingVerification(verificationId);
      await idVerificationService.deleteVerification(verificationId);
      setVerifications(prev => prev.filter(v => v.id !== verificationId));
      toast.success('ID verification deleted successfully');
    } catch (error) {
      console.error('Error deleting verification:', error);
      toast.error('Failed to delete verification');
    } finally {
      setDeletingVerification(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Expired
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatIDType = (idType: string) => {
    return idType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
        <h1 className="text-2xl font-bold text-gray-900">Manage ID Verifications</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review and manage ID verification submissions from tutors.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <IdentificationIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Verifications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
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
                placeholder="Search by name, email, or ID number..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            ID Verifications ({filteredVerifications.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Details
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
              {filteredVerifications.map((verification) => {
                const profile = (verification as any).profiles;
                return (
                  <tr key={verification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {profile?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {profile?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatIDType(verification.id_type)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {showSensitiveData ? verification.id_number : '••••••••••'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(verification.verification_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(verification.submitted_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {/* View Details Button */}
                        <button
                          onClick={() => handleViewDetails(verification)}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        
                        {/* Approve Button */}
                        {verification.verification_status === 'pending' && (
                          <button
                            onClick={() => handleAction(verification, 'approve')}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            title="Approve"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        {/* Reject Button */}
                        {verification.verification_status === 'pending' && (
                          <button
                            onClick={() => handleAction(verification, 'reject')}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            title="Reject"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteVerification(verification.id)}
                          disabled={deletingVerification === verification.id}
                          className={`inline-flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                            deletingVerification === verification.id ? 'opacity-50 cursor-not-allowed' : ''
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
            <IdentificationIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No verifications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No ID verifications have been submitted yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Sensitive Data Toggle */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <EyeIcon className="h-4 w-4" />
            <span>{showSensitiveData ? 'Hide' : 'Show'} Sensitive Data</span>
          </button>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Mark as Expired'} Verification
              </h2>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to {actionType} this ID verification?
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add notes about this decision..."
                />
              </div>
              
              {actionType === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus === selectedVerification.id || (actionType === 'reject' && !rejectionReason.trim())}
                className={`px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : actionType === 'reject'
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                }`}
              >
                {updatingStatus === selectedVerification.id ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Mark as Expired'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageIDVerificationsPage; 