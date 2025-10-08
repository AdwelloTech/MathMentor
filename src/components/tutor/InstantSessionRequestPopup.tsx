import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  ClockIcon,
  UserCircleIcon,
  UserIcon,
  AcademicCapIcon,
  BellAlertIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { instantSessionService, type InstantRequest } from '@/lib/instantSessionService';
import toast from 'react-hot-toast';

interface InstantSessionRequestPopupProps {
  tutorId: string;
  isOnline: boolean;
}

export default function InstantSessionRequestPopup({ tutorId, isOnline }: InstantSessionRequestPopupProps) {
  const [requests, setRequests] = useState<InstantRequest[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [acceptedSession, setAcceptedSession] = useState<InstantRequest | null>(null);
  const [showAcceptedModal, setShowAcceptedModal] = useState(false);

  useEffect(() => {
    if (!isOnline || !tutorId) {
      setRequests([]);
      return;
    }

    console.log('[InstantPopup] Setting up subscription for tutor:', tutorId, 'online:', isOnline);

    // Subscribe to new requests
    const unsubscribe = instantSessionService.subscribeToPending(
      ({ new: request, eventType }) => {
        console.log('[InstantPopup] Event received:', eventType, request.id);
        
        if (eventType === 'INSERT' && request.status === 'pending') {
          // Check if we've already dismissed this request
          if (!dismissedIds.has(request.id || request._id)) {
            setRequests(prev => {
              const exists = prev.some(r => (r.id || r._id) === (request.id || request._id));
              if (!exists) {
                console.log('[InstantPopup] Adding new request:', request.id);
                return [request, ...prev];
              }
              return prev;
            });
          }
        } else if (eventType === 'UPDATE' && request.status !== 'pending') {
          // Remove from list if status changed
          const reqId = request.id || request._id;
          setRequests(prev => prev.filter(r => (r.id || r._id) !== reqId));
        }
      },
      undefined, // All subjects
      isOnline
    );

    // Initial fetch of pending requests (only if online)
    const fetchInitialRequests = async () => {
      if (!isOnline) {
        console.log('[InstantPopup] Tutor is offline, skipping initial fetch');
        return;
      }

      try {
        const pending = await instantSessionService.getPendingRequests();
        console.log('[InstantPopup] Initial pending requests:', pending.length);
        setRequests(pending.filter(r => !dismissedIds.has(r.id || r._id)));
      } catch (error) {
        console.error('[InstantPopup] Error fetching initial requests:', error);
      }
    };

    fetchInitialRequests();

    return () => {
      console.log('[InstantPopup] Cleaning up subscription');
      if (unsubscribe) unsubscribe();
    };
  }, [tutorId, isOnline]);

  const handleAccept = async (request: InstantRequest) => {
    const reqId = request.id || request._id;
    
    try {
      setAcceptingId(reqId);
      console.log('[InstantPopup] Accepting request:', reqId);
      
      // Accept the request - this generates the meeting URL
      const accepted = await instantSessionService.acceptRequest(reqId, tutorId);
      
      // Remove from list immediately
      setRequests(prev => prev.filter(r => (r.id || r._id) !== reqId));

      // DON'T mark tutor as joined yet - only when they click the join button
      
      console.log('[InstantPopup] Session accepted with URL:', accepted.jitsiMeetingUrl);

      // Show the accepted session modal with the link
      if (accepted.jitsiMeetingUrl) {
        setAcceptedSession(accepted);
        setShowAcceptedModal(true);
        
        toast.success('Session accepted! Click the link to join.', {
          icon: '✅',
          duration: 4000,
        });
      } else {
        console.warn('[InstantPopup] No meeting URL available after accepting session');
        toast.error('Session accepted but meeting URL not generated. Please try again.', {
          icon: '⚠️',
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error('[InstantPopup] Error accepting request:', error);
      toast.error(error.message || 'Failed to accept session request', {
        icon: '❌',
        duration: 4000,
      });
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDismiss = (request: InstantRequest) => {
    const reqId = request.id || request._id;
    console.log('[InstantPopup] Dismissing request:', reqId);
    
    // Add to dismissed set
    setDismissedIds(prev => new Set([...prev, reqId]));
    
    // Remove from list
    setRequests(prev => prev.filter(r => (r.id || r._id) !== reqId));
  };

  const getStudentName = (request: InstantRequest): string => {
    if (typeof request.studentId === 'object' && request.studentId) {
      return request.studentId.fullName || 'Student';
    }
    return 'Student';
  };

  const getSubjectName = (request: InstantRequest): string => {
    if (typeof request.subjectId === 'object' && request.subjectId) {
      return request.subjectId.displayName || request.subjectId.name || 'Subject';
    }
    return 'Subject';
  };

  const getSubjectColor = (request: InstantRequest): string => {
    if (typeof request.subjectId === 'object' && request.subjectId) {
      return request.subjectId.color || 'blue';
    }
    return 'blue';
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const handleJoinFromModal = async () => {
    if (acceptedSession?.jitsiMeetingUrl) {
      const sessionId = acceptedSession.id || acceptedSession._id;
      
      // Mark tutor as joined so student can now join
      try {
        await instantSessionService.markTutorJoined(sessionId);
        console.log('[InstantPopup] Tutor marked as joined, student can now join');
      } catch (error) {
        console.error('[InstantPopup] Error marking tutor as joined:', error);
      }
      
      // Open the meeting
      window.open(acceptedSession.jitsiMeetingUrl, '_blank');
      setShowAcceptedModal(false);
    }
  };

  const handleCloseModal = () => {
    setShowAcceptedModal(false);
    setAcceptedSession(null);
  };

  if (!isOnline || (requests.length === 0 && !showAcceptedModal)) {
    return showAcceptedModal ? renderAcceptedModal() : null;
  }

  function renderAcceptedModal() {
    if (!acceptedSession) return null;

    return (
      <AnimatePresence>
        {showAcceptedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border-2 border-blue-300 dark:border-blue-600"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-white"
                  animate={{
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <div className="relative z-10 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <CheckCircleIcon className="w-16 h-16 text-white mx-auto mb-3" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Session Accepted!
                  </h2>
                  <p className="text-blue-100">Your instant session is ready</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Student Info */}
                <div className="flex items-center gap-3 bg-white/70 dark:bg-gray-800/70 rounded-xl p-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <UserIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Student</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {getStudentName(acceptedSession)}
                    </p>
                  </div>
                </div>

                {/* Subject Info */}
                <div className="flex items-center gap-3 bg-white/70 dark:bg-gray-800/70 rounded-xl p-3">
                  <div className={`w-12 h-12 bg-gradient-to-br from-${getSubjectColor(acceptedSession)}-500 to-${getSubjectColor(acceptedSession)}-600 rounded-full flex items-center justify-center shadow-lg`}>
                    <AcademicCapIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Subject</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {getSubjectName(acceptedSession)}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 text-sm bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3">
                  <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-800 dark:text-blue-200 font-medium">15 minutes session</span>
                </div>

                {/* Join Button */}
                <motion.button
                  onClick={handleJoinFromModal}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ArrowRightIcon className="w-6 h-6" />
                  <span>Join Meeting Now</span>
                </motion.button>

                {/* Later Button */}
                <button
                  onClick={handleCloseModal}
                  className="w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Join Later (Use blue floating button)
                </button>
              </div>

              {/* Bottom accent */}
              <motion.div
                className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  backgroundSize: '200% 100%',
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <>
      {renderAcceptedModal()}
      <div className="fixed bottom-6 right-6 z-50 max-w-md">
        <AnimatePresence>
          {requests.map((request, index) => {
          const reqId = request.id || request._id;
          const isAccepting = acceptingId === reqId;
          
          return (
            <motion.div
              key={reqId}
              initial={{ opacity: 0, x: 400, y: 0 }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                y: index * -10, // Stack them slightly
              }}
              exit={{ opacity: 0, x: 400, scale: 0.9 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30,
                delay: index * 0.1 
              }}
              className="mb-4"
              style={{ zIndex: 50 - index }}
            >
              <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl shadow-2xl border-2 border-green-200 dark:border-green-700 overflow-hidden backdrop-blur-lg">
                {/* Header with pulse animation */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-white"
                    animate={{
                      opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <BellAlertIcon className="w-6 h-6 text-white" />
                      </motion.div>
                      <h3 className="text-white font-bold text-lg">
                        New Instant Session Request
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDismiss(request)}
                      className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                      disabled={isAccepting}
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Student Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <UserCircleIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Student</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {getStudentName(request)}
                      </p>
                    </div>
                  </div>

                  {/* Subject Info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-br from-${getSubjectColor(request)}-500 to-${getSubjectColor(request)}-600 rounded-full flex items-center justify-center shadow-lg`}>
                      <AcademicCapIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {getSubjectName(request)}
                      </p>
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
                    <ClockIcon className="w-5 h-5" />
                    <span>15 minutes session • Requested {getTimeAgo(request.requestedAt)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <motion.button
                      onClick={() => handleAccept(request)}
                      disabled={isAccepting}
                      whileHover={{ scale: isAccepting ? 1 : 1.02 }}
                      whileTap={{ scale: isAccepting ? 1 : 0.98 }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAccepting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Accepting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
                          <span>Accept & Join</span>
                        </>
                      )}
                    </motion.button>
                    <button
                      onClick={() => handleDismiss(request)}
                      disabled={isAccepting}
                      className="px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                {/* Bottom accent */}
                <motion.div
                  className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    backgroundSize: '200% 100%',
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
    </>
  );
}

