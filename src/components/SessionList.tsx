import React from 'react';
import { motion } from 'framer-motion';
import { ClassSearchResult } from '../types/classScheduling';
import { CalendarDays, Clock, Users, BookOpen, Video, CheckCircle } from 'lucide-react';

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

import { formatGMTTime12Hour } from "@/utils/gmtTimeUtils";

const formatTime = (timeString: string) => {
  // All times are in GMT - display with GMT label
  return formatGMTTime12Hour(timeString);
};

const getClassTypeIcon = (classTypeName: string) => {
  switch (classTypeName?.toLowerCase()) {
    case 'group':
      return <Users className="w-5 h-5 text-primary" />;
    case 'consultation':
      return <BookOpen className="w-5 h-5 text-primary" />;
    case 'one-on-one':
    case 'one-on-one extended':
      return <Video className="w-5 h-5 text-primary" />;
    default:
      return <BookOpen className="w-5 h-5 text-primary" />;
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
    return <div className="text-center py-12 text-muted-foreground">Loading sessions...</div>;
  }
  if (error) {
    return <div className="text-center py-12 text-destructive">{error}</div>;
  }
  if (!sessions.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-muted-foreground"
      >
        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-card-foreground mb-2">No sessions found</h3>
        <p className="text-sm">
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
            className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col h-full"
          >
            <div className="flex items-center gap-2 mb-2">
              {getClassTypeIcon(session.class_type?.name || '')}
              <span className="text-sm font-semibold text-primary">
                {session.class_type?.name}
              </span>
              <span className="ml-auto text-primary font-semibold text-lg">
                ${session.price_per_session}
              </span>
            </div>
            <div className="px-0 pb-4 flex flex-col min-h-[120px] justify-start">
              <p className="font-medium text-card-foreground">{tutor.full_name}</p>
              <h3 className="text-lg font-semibold text-card-foreground mt-1">{session.title}</h3>
              {session.description ? (
                <p className="text-sm text-muted-foreground mt-1 mb-0 line-clamp-2">
                  {session.description}
                </p>
              ) : (
                <span className="block h-8 mt-1 mb-0" aria-hidden="true"></span>
              )}
            </div>
            <div className="px-0 pb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>{formatDate(session.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
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
