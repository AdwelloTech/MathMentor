import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ParentStudentLink, parentService } from '@/lib/parentService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  CalendarDaysIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { X, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatGMTTime24Hour } from '@/utils/gmtTimeUtils';
import { GMTTooltip } from '@/components/ui/GMTTooltip';

interface ParentContextType {
  selectedStudent: ParentStudentLink | undefined;
  linkedStudents: ParentStudentLink[];
  refreshStudents: () => Promise<void>;
}

interface SessionData {
  id: string;
  subject: string;
  tutorName: string;
  tutorEmail: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  sessionType: string;
  studentFeedback?: string;
  studentRating?: number;
  tutorNotes?: string;
}

interface SessionProgressData {
  sessions: SessionData[];
  stats: {
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    cancelledSessions: number;
    averageRating: number;
    tutorBreakdown: { tutorName: string; sessionCount: number; averageRating: number }[];
    subjectBreakdown: { subject: string; sessionCount: number }[];
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalSessions: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const ParentSessionProgress: React.FC = () => {
  const navigate = useNavigate();
  const { selectedStudent } = useOutletContext<ParentContextType>();
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false); // For smooth filter transitions
  const [sessionData, setSessionData] = useState<SessionProgressData | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 10;
  const [isInitialLoad, setIsInitialLoad] = useState(true);


  useEffect(() => {
    if (selectedStudent) {
      loadSessionProgress();
    } else {
      navigate('/parent/manage');
    }
  }, [selectedStudent, filter, subjectFilter, currentPage]);

  const loadSessionProgress = async () => {
    if (!selectedStudent) return;

    try {
      // Only show full loading skeleton on initial load
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsFiltering(true); // Show subtle loading for filter changes
      }
      setError('');
      const data = await parentService.getStudentSessionProgress(selectedStudent.studentId, {
        filter,
        subject: subjectFilter || undefined, // Pass subject filter to API
        page: currentPage,
        limit: sessionsPerPage
      });
      setSessionData(data);
      setIsInitialLoad(false); // After first load, use subtle loading
    } catch (error: any) {
      console.error('Error loading session progress:', error);
      setError('Failed to load session progress');
    } finally {
      setLoading(false);
      setIsFiltering(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 1, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-400/20 text-green-300 border-green-400/30';
      case 'upcoming':
        return 'bg-blue-400/20 text-blue-300 border-blue-400/30';
      case 'cancelled':
        return 'bg-red-400/20 text-red-300 border-red-400/30';
      default:
        return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-300" />;
      case 'upcoming':
        return <ClockIcon className="h-5 w-5 text-blue-300" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-300" />;
      default:
        return null;
    }
  };

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, subjectFilter]);

  // Handle subject filter click
  const handleSubjectFilter = (subject: string) => {
    if (subjectFilter === subject) {
      // Clear filter if clicking the same subject
      setSubjectFilter(null);
    } else {
      setSubjectFilter(subject);
    }
  };

  // Sessions are now filtered server-side, use sessionData.sessions directly

  const handleViewSessionDetails = (session: SessionData) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  if (!selectedStudent) {
    return (
      <Alert className="bg-yellow-900/40 border-yellow-400/30 text-white">
        <AlertDescription>
          Please select a student from the dropdown above or link a student to get started.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full bg-green-950/40" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-green-950/40" />
          ))}
        </div>
        <Skeleton className="h-96 w-full bg-green-950/40" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-900/40 border-red-400/30 text-white">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CalendarDaysIcon className="h-8 w-8 text-yellow-300" />
                <div>
                  <CardTitle className="text-2xl text-yellow-300 flex items-center gap-2">
                    Session Progress
                    <GMTTooltip size="sm" />
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    {selectedStudent.studentName}'s tutoring sessions and feedback
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div variants={itemVariants}>
            <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total Sessions</p>
                    <p className="text-3xl font-bold text-yellow-300 mt-1">
                      {sessionData?.stats.totalSessions || 0}
                    </p>
                  </div>
                  <CalendarDaysIcon className="h-10 w-10 text-yellow-300/40" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Completed</p>
                    <p className="text-3xl font-bold text-green-300 mt-1">
                      {sessionData?.stats.completedSessions || 0}
                    </p>
                  </div>
                  <CheckCircleIcon className="h-10 w-10 text-green-300/40" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Upcoming</p>
                    <p className="text-3xl font-bold text-blue-300 mt-1">
                      {sessionData?.stats.upcomingSessions || 0}
                    </p>
                  </div>
                  <ClockIcon className="h-10 w-10 text-blue-300/40" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Average Rating</p>
                    <p className="text-3xl font-bold text-yellow-300 mt-1">
                      {sessionData?.stats.averageRating?.toFixed(1) || '0.0'}
                    </p>
                  </div>
                  <StarIcon className="h-10 w-10 text-yellow-300/40" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tutor Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-yellow-300">Sessions by Tutor</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionData?.stats.tutorBreakdown && sessionData.stats.tutorBreakdown.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessionData.stats.tutorBreakdown.map((tutor, index) => (
                    <div key={index} className="p-4 bg-green-900/40 rounded-lg border border-yellow-400/10">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-400/20 rounded-lg">
                          <UserIcon className="h-5 w-5 text-yellow-300" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{tutor.tutorName}</h4>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-white/60">
                              {tutor.sessionCount} {tutor.sessionCount === 1 ? 'session' : 'sessions'}
                            </span>
                            {tutor.averageRating > 0 && (
                              <div className="flex items-center gap-1">
                                <StarIcon className="h-4 w-4 text-yellow-300" />
                                <span className="text-yellow-300 font-semibold">
                                  {tutor.averageRating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-center py-8">No tutor data available yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Subject Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-yellow-300">Sessions by Subject</CardTitle>
                {subjectFilter && (
                  <button
                    onClick={() => setSubjectFilter(null)}
                    className="text-sm text-white/60 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Clear filter
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {sessionData?.stats.subjectBreakdown && sessionData.stats.subjectBreakdown.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {sessionData.stats.subjectBreakdown.map((subject, index) => (
                    <Badge
                      key={index}
                      onClick={() => handleSubjectFilter(subject.subject)}
                      className={`px-4 py-2 cursor-pointer transition-all duration-200 ${subjectFilter === subject.subject
                        ? 'bg-yellow-400 text-green-900 border-yellow-500 font-semibold'
                        : 'bg-blue-400/20 text-blue-300 border-blue-400/30 hover:bg-blue-400/30'
                        }`}
                    >
                      {subject.subject}: {subject.sessionCount}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-center py-8">No subject data available yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-wrap gap-3">
            {(['all', 'upcoming', 'completed', 'cancelled'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${filter === filterOption
                  ? 'bg-yellow-400 text-green-900 font-semibold'
                  : 'bg-green-900/40 text-white hover:bg-green-900/60'
                  }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Sessions List */}
        <motion.div variants={itemVariants}>
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-yellow-300">
                {filter === 'all' ? 'All Sessions' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Sessions`}
                {subjectFilter && (
                  <span className="text-sm font-normal text-white/60 ml-2">
                    • Filtered by: {subjectFilter}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-white/80">
                Detailed session information and feedback
                {subjectFilter && ` (showing ${sessionData?.sessions?.length || 0} session${(sessionData?.sessions?.length || 0) !== 1 ? 's' : ''})`}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {/* Subtle loading overlay for filter changes */}
              {isFiltering && (
                <div className="absolute inset-0 bg-green-950/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="text-yellow-300 flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Filtering...</span>
                  </div>
                </div>
              )}
              {sessionData?.sessions && sessionData.sessions.length > 0 ? (
                <div className={`space-y-4 ${isFiltering ? 'opacity-50' : ''}`}>
                  {sessionData.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 bg-green-900/40 rounded-lg border border-yellow-400/10 hover:border-yellow-400/30 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row items-start gap-3 mb-3">
                            <div className="mt-1 hidden sm:block">{getStatusIcon(session.status)}</div>
                            <div className="flex-1 w-full">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="sm:hidden">{getStatusIcon(session.status)}</div>
                                    <h4 className="font-semibold text-white text-lg mb-1 break-words">
                                      {session.subject}
                                    </h4>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-sm text-white/60 mb-2">
                                    <UserIcon className="h-4 w-4 shrink-0" />
                                    <span className="truncate max-w-[150px]">{session.tutorName}</span>
                                    <span>•</span>
                                    <span className="truncate max-w-[150px]">{session.tutorEmail}</span>
                                  </div>
                                </div>
                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                  <Badge className={getStatusBadgeClass(session.status)}>
                                    {session.status}
                                  </Badge>
                                  <Button
                                    onClick={() => handleViewSessionDetails(session)}
                                    variant="outline"
                                    size="sm"
                                    className="bg-yellow-400/10 border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/20 whitespace-nowrap"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Button>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 mb-3">
                                <Badge className="bg-purple-400/20 text-purple-300 border-purple-400/30 whitespace-normal h-auto text-left">
                                  {session.sessionType}
                                </Badge>
                                <Badge className="bg-blue-400/20 text-blue-300 border-blue-400/30 whitespace-nowrap">
                                  {new Date(session.date).toLocaleDateString()}
                                </Badge>
                                <Badge className="bg-green-400/20 text-green-300 border-green-400/30 whitespace-normal h-auto text-left leading-tight">
                                  {formatGMTTime24Hour(session.startTime)} - {formatGMTTime24Hour(session.endTime)}
                                </Badge>
                                <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30 whitespace-nowrap">
                                  {session.duration} min
                                </Badge>
                              </div>

                              {session.studentRating && (
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm text-white/60">Student Rating:</span>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <StarIcon
                                        key={i}
                                        className={`h-4 w-4 ${i < session.studentRating!
                                          ? 'text-yellow-300 fill-yellow-300'
                                          : 'text-white/20'
                                          }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {session.studentFeedback && (
                                <div className="mt-3 p-3 bg-blue-400/10 rounded-lg border border-blue-400/20">
                                  <p className="text-xs text-blue-300 font-semibold mb-1">
                                    Student Feedback
                                  </p>
                                  <p className="text-sm text-white/90">{session.studentFeedback}</p>
                                </div>
                              )}

                              {session.tutorNotes && (
                                <div className="mt-3 p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
                                  <p className="text-xs text-yellow-300 font-semibold mb-1">
                                    Tutor Notes
                                  </p>
                                  <p className="text-sm text-white/90">{session.tutorNotes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarDaysIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 text-lg">
                    No {filter !== 'all' ? filter : ''} sessions found
                  </p>
                  <p className="text-white/40 text-sm mt-2">
                    Sessions will appear here once your student books tutoring sessions
                  </p>
                </div>
              )}

              {/* Pagination */}
              {sessionData?.pagination && sessionData.pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-yellow-400/10">
                  <div className="text-sm text-white/60 text-center sm:text-left w-full sm:w-auto">
                    Showing {(sessionData.pagination.page - 1) * sessionData.pagination.limit + 1}-
                    {Math.min(sessionData.pagination.page * sessionData.pagination.limit, sessionData.pagination.totalSessions)} of {sessionData.pagination.totalSessions} sessions
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!sessionData.pagination.hasPrevPage}
                      variant="outline"
                      size="sm"
                      className="bg-green-900/40 border-yellow-400/30 text-white hover:bg-green-900/60 disabled:opacity-50"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, sessionData.pagination.totalPages) }, (_, i) => {
                        const pageNum = i + Math.max(1, sessionData.pagination.page - 2);
                        if (pageNum > sessionData.pagination.totalPages) return null;
                        return (
                          <Button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            variant={sessionData.pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            className={
                              sessionData.pagination.page === pageNum
                                ? "bg-yellow-400 text-green-900"
                                : "bg-green-900/40 border-yellow-400/30 text-white hover:bg-green-900/60"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(sessionData.pagination.totalPages, prev + 1))}
                      disabled={!sessionData.pagination.hasNextPage}
                      variant="outline"
                      size="sm"
                      className="bg-green-900/40 border-yellow-400/30 text-white hover:bg-green-900/60 disabled:opacity-50"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div >

      {/* Session Detail Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isModalOpen && selectedSession && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={handleCloseModal}
            >
              <motion.div
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1, opacity: 1 }}
                className="bg-green-950/90 border border-yellow-400/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-yellow-400/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-400/20 rounded-lg">
                      <EyeIcon className="h-6 w-6 text-yellow-300" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        Session Details
                      </h2>
                      <p className="text-sm text-white/60">
                        {selectedSession.subject} with {selectedSession.tutorName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-green-900/40 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-white/60" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Session Info */}
                  <div className="bg-green-900/40 rounded-lg p-4 border border-yellow-400/10">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-yellow-400/20 rounded-lg">
                        <UserIcon className="h-6 w-6 text-yellow-300" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {selectedSession.subject}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                              <UserIcon className="h-4 w-4" />
                              <span>{selectedSession.tutorName}</span>
                              <span>•</span>
                              <span>{selectedSession.tutorEmail}</span>
                            </div>
                          </div>
                          <Badge className={getStatusBadgeClass(selectedSession.status)}>
                            {selectedSession.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarDaysIcon className="h-4 w-4 text-yellow-300" />
                            <span className="text-white/80">
                              {new Date(selectedSession.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <ClockIcon className="h-4 w-4 text-blue-300" />
                            <span className="text-white/80">
                              {formatGMTTime24Hour(selectedSession.startTime)} - {formatGMTTime24Hour(selectedSession.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge className="bg-purple-400/20 text-purple-300 border-purple-400/30">
                              {selectedSession.sessionType}
                            </Badge>
                            <Badge className="bg-green-400/20 text-green-300 border-green-400/30">
                              {selectedSession.duration} min
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student Rating */}
                  {selectedSession.studentRating && (
                    <div className="bg-blue-400/10 rounded-lg p-4 border border-blue-400/20">
                      <h4 className="text-sm font-semibold text-blue-300 mb-3">
                        Student Rating
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-5 w-5 ${i < selectedSession.studentRating!
                                ? 'text-yellow-300 fill-yellow-300'
                                : 'text-white/20'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-white/80 text-sm">
                          {selectedSession.studentRating}/5 stars
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Student Feedback */}
                  {selectedSession.studentFeedback && (
                    <div className="bg-green-400/10 rounded-lg p-4 border border-green-400/20">
                      <h4 className="text-sm font-semibold text-green-300 mb-3">
                        Student Feedback
                      </h4>
                      <p className="text-white/90 text-sm leading-relaxed">
                        {selectedSession.studentFeedback}
                      </p>
                    </div>
                  )}

                  {/* Tutor Notes */}
                  {selectedSession.tutorNotes && (
                    <div className="bg-yellow-400/10 rounded-lg p-4 border border-yellow-400/20">
                      <h4 className="text-sm font-semibold text-yellow-300 mb-3">
                        Tutor Notes
                      </h4>
                      <p className="text-white/90 text-sm leading-relaxed">
                        {selectedSession.tutorNotes}
                      </p>
                    </div>
                  )}

                  {/* No additional content */}
                  {!selectedSession.studentRating && !selectedSession.studentFeedback && !selectedSession.tutorNotes && (
                    <div className="text-center py-8">
                      <EyeIcon className="h-12 w-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/60">
                        No additional feedback or notes available for this session
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )
          }
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ParentSessionProgress;

