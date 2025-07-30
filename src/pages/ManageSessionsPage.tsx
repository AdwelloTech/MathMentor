import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { classSchedulingService } from '../lib/classSchedulingService';
import { ClassBooking } from '../types/classScheduling';
import { 
  CalendarDays, 
  Clock, 
  DollarSign, 
  Video,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  Calendar
} from 'lucide-react';

const ManageSessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ClassBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ClassBooking | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await classSchedulingService.bookings.getByStudentId(user!.id);
      setBookings(data || []);
    } catch (err) {
      setError('Failed to load your sessions');
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'no_show':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'no_show':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const isSessionJoinable = (booking: ClassBooking) => {
    if (!booking.class || booking.booking_status !== 'confirmed') return false;
    
    const sessionDate = booking.class.date;
    const sessionTime = booking.class.start_time;
    const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`);
    const now = new Date();
    const fiveMinutesBefore = new Date(sessionDateTime.getTime() - 5 * 60 * 1000);
    
    return now >= fiveMinutesBefore && now <= sessionDateTime;
  };

  const isSessionPast = (booking: ClassBooking) => {
    if (!booking.class) return false;
    
    const sessionDate = booking.class.date;
    const sessionTime = booking.class.end_time;
    const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`);
    const now = new Date();
    
    return now > sessionDateTime;
  };

  const handleJoinSession = (booking: ClassBooking) => {
    if (!booking.class?.zoom_link) {
      alert('Zoom link not available for this session');
      return;
    }
    
    // Open Zoom link in new tab
    window.open(booking.class.zoom_link, '_blank');
  };

  const filteredBookings = bookings.filter(booking => {
    switch (filter) {
      case 'upcoming':
        return !isSessionPast(booking) && booking.booking_status === 'confirmed';
      case 'past':
        return isSessionPast(booking) || booking.booking_status === 'completed';
      default:
        return true;
    }
  });

  const upcomingBookings = filteredBookings.filter(booking => 
    !isSessionPast(booking) && booking.booking_status === 'confirmed'
  );
  const pastBookings = filteredBookings.filter(booking => 
    isSessionPast(booking) || booking.booking_status === 'completed'
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Sessions</h1>
          <p className="text-gray-600">Manage your booked sessions and join upcoming classes</p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filter Sessions</h2>
          </div>
          
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Sessions', count: bookings.length },
              { key: 'upcoming', label: 'Upcoming', count: upcomingBookings.length },
              { key: 'past', label: 'Past', count: pastBookings.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-md p-4 mb-6"
          >
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredBookings.map((booking, index) => {
            const session = booking.class;
            if (!session) return null;
            
            const isJoinable = isSessionJoinable(booking);
            const isPast = isSessionPast(booking);
            
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Session Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div>
                          <p className="font-medium text-gray-900">{session.tutor?.full_name}</p>
                          <p className="text-sm text-gray-600">Tutor</p>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.booking_status)}`}>
                          {getStatusIcon(booking.booking_status)}
                          <span className="capitalize">{booking.booking_status}</span>
                        </div>
                      </div>
                      {/* Subject below tutor info */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{session.title}</h3>
                      {session.description && (
                        <p className="text-gray-600 mb-3">{session.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CalendarDays className="w-4 h-4" />
                          <span>{formatDate(session.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>${booking.payment_amount}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-6">
                      {/* Join Session Button */}
                      {booking.booking_status === 'confirmed' && !isPast && (
                        <button
                          onClick={() => handleJoinSession(booking)}
                          disabled={!isJoinable}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                            isJoinable
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                          title={isJoinable ? 'Join session now' : 'Available 5 minutes before session starts'}
                        >
                          <Video className="w-4 h-4" />
                          {isJoinable ? 'Join Session' : 'Join Session'}
                        </button>
                      )}
                      
                      {/* View Details Button */}
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetails(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      
                      {/* Session Notes (for past sessions) */}
                      {isPast && booking.notes && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetails(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Session Notes
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* No Sessions Message */}
        {filteredBookings.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'upcoming' ? 'No upcoming sessions' : 
               filter === 'past' ? 'No past sessions' : 'No sessions found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'upcoming' ? 'Book a session to get started!' : 
               filter === 'past' ? 'Your completed sessions will appear here.' : 
               'You haven\'t booked any sessions yet.'}
            </p>
            {filter !== 'past' && (
              <button
                onClick={() => window.location.href = '/book-session'}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Book Your First Session
              </button>
            )}
          </motion.div>
        )}

        {/* Session Details Modal */}
        {showDetails && selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Session Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                {selectedBooking.class && (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Session Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <p className="text-gray-900">{selectedBooking.class.title}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.booking_status)}`}>
                            {getStatusIcon(selectedBooking.booking_status)}
                            <span className="capitalize">{selectedBooking.booking_status}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date</label>
                          <p className="text-gray-900">{formatDate(selectedBooking.class.date)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Time</label>
                          <p className="text-gray-900">
                            {formatTime(selectedBooking.class.start_time)} - {formatTime(selectedBooking.class.end_time)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Duration</label>
                          <p className="text-gray-900">{selectedBooking.class.duration_minutes} minutes</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
                          <p className="text-gray-900">${selectedBooking.payment_amount}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {selectedBooking.class.description && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Description</h3>
                        <p className="text-gray-700">{selectedBooking.class.description}</p>
                      </div>
                    )}
                    
                    {/* Tutor Info */}
                    {selectedBooking.class.tutor && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Tutor</h3>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {selectedBooking.class.tutor.full_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{selectedBooking.class.tutor.full_name}</p>
                            <p className="text-sm text-gray-600">{selectedBooking.class.tutor.email}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Session Notes */}
                    {selectedBooking.notes && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Session Notes</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700">{selectedBooking.notes}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Zoom Link */}
                    {selectedBooking.class.zoom_link && selectedBooking.booking_status === 'confirmed' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Join Session</h3>
                        <button
                          onClick={() => handleJoinSession(selectedBooking)}
                          disabled={!isSessionJoinable(selectedBooking)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                            isSessionJoinable(selectedBooking)
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Video className="w-4 h-4" />
                          {isSessionJoinable(selectedBooking) ? 'Join Session Now' : 'Join Available 5 Min Before'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ManageSessionsPage;
