import React from 'react';
import { motion } from 'framer-motion';
import { ClassSearchResult } from '../types/classScheduling';
import { CalendarDays, Clock, Users, Star, BookOpen, Video, CheckCircle } from 'lucide-react';

type SessionListProps = {
  sessions: ClassSearchResult[];
  loading?: boolean;
  error?: string | null;
  onBookSession?: (classId: string, price: number) => void;
  bookingLoading?: string | null;
};

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (timeString: string) => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getClassTypeIcon = (classTypeName: string) => {
  switch (classTypeName?.toLowerCase()) {
    case 'group':
      return <Users className="w-5 h-5" />;
    case 'consultation':
      return <BookOpen className="w-5 h-5" />;
    case 'one-on-one':
    case 'one-on-one extended':
      return <Video className="w-5 h-5" />;
    default:
      return <BookOpen className="w-5 h-5" />;
  }
};

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  loading,
  error,
  onBookSession,
  bookingLoading,
}) => {
  if (loading) {
    return <div className="text-center py-12">Loading sessions...</div>;
  }
  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }
  if (!sessions.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
        <p className="text-gray-600">
          Try adjusting your filters or check back later for new sessions.
        </p>
      </motion.div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((sessionResult) => {
        const session = sessionResult.class;
        const tutor = sessionResult.tutor;
        const isBooking = bookingLoading === session.id;
        return (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow p-6 flex flex-col h-full"
          >
            <div className="flex items-center gap-2 mb-2">
              {getClassTypeIcon(session.class_type?.name || '')}
              <span className="text-sm font-semibold text-blue-600">
                {session.class_type?.name}
              </span>
              <span className="ml-auto text-green-600 font-bold text-lg">
                ${session.price_per_session}
              </span>
            </div>
            <div className="px-0 pb-4 flex flex-col min-h-[120px] justify-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {tutor.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{tutor.full_name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {tutor.rating.toFixed(1)} ({tutor.total_reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-2">{session.title}</h3>
              {session.description ? (
                <p className="text-sm text-gray-600 mt-1 mb-0 line-clamp-2">
                  {session.description}
                </p>
              ) : (
                <span className="block h-8 mt-1 mb-0" aria-hidden="true"></span>
              )}
            </div>
            <div className="px-0 pb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CalendarDays className="w-4 h-4" />
                <span>{formatDate(session.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>
                  {sessionResult.available_slots} of {session.max_students} spots available
                </span>
              </div>
            </div>
            {onBookSession && (
              <div className="px-0 pb-6 mt-auto">
                <button
                  onClick={() => onBookSession(session.id, session.price_per_session)}
                  disabled={isBooking || !sessionResult.is_bookable}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    sessionResult.is_bookable
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isBooking ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Booking...
                    </div>
                  ) : sessionResult.is_bookable ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Book Now
                    </div>
                  ) : (
                    'Fully Booked'
                  )}
                </button>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default SessionList;
