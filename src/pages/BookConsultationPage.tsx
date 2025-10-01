import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { classSchedulingService } from "../lib/classSchedulingService";
import { ClassSearchResult } from "../types/classScheduling";
import SessionPaymentForm from "../components/payment/SessionPaymentForm";
import {
  CalendarDays,
  Clock,
  Users,
  Filter,
  Search,
  BookOpen,
  CheckCircle,
} from "lucide-react";

const BookConsultationPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ClassSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<ClassSearchResult | null>(null);

  const [filterDate, setFilterDate] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    loadConsultations();
  }, [filterDate, filterSubject, searchTerm]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const filters: any = { class_type: "Consultation" };
      if (filterDate) filters.date_from = filterDate;
      if (filterDate) filters.date_to = filterDate;
      if (filterSubject) filters.search = filterSubject;
      if (searchTerm) filters.search = searchTerm;

      const allSessions =
        await classSchedulingService.classes.getAvailableClasses(filters);
      // Filter for consultation sessions only
      const consultationSessions = allSessions.filter(
        (session) => session.class.class_type?.name === "Consultation"
      );
      setSessions(consultationSessions);
    } catch (err: any) {
      setError("Failed to load consultation sessions.");
      console.error("Error loading consultations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = (sessionResult: ClassSearchResult) => {
    if (!user) return;

    setSelectedSession(sessionResult);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!selectedSession || !user) return;

    try {
      setBookingLoading(selectedSession.class._id);

      // Create booking with payment information
      await classSchedulingService.bookings.create(
        selectedSession.class._id,
        user.id,
        selectedSession.class.price_per_session,
        paymentIntentId
      );

      // Refresh sessions to update available slots
      await loadConsultations();

      // Close modal and show success message
      setShowPaymentModal(false);
      setSelectedSession(null);
      toast.success("Consultation booked successfully!");
    } catch (err) {
      console.error("Error booking consultation:", err);
      toast.error("Failed to book consultation. Please try again.");
    } finally {
      setBookingLoading(null);
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`);
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setSelectedSession(null);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading consultation sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Book a Consultation
          </h1>
          <p className="text-gray-600">
            Schedule a detailed consultation session with our expert tutors
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                placeholder="e.g., Math, Physics"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Search Bar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sessions or tutors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sessions Grid */}
        {sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No consultation sessions found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or check back later for new
              consultation sessions.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((sessionResult, index) => {
              const session = sessionResult.class;
              const tutor = sessionResult.tutor;
              const isBooking = bookingLoading === session.id;

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between h-full"
                >
                  {/* Session Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">
                          Consultation
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          ${session.price_per_session}
                        </div>
                      </div>
                    </div>

                    {session.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {session.description}
                      </p>
                    )}
                  </div>

                  {/* Tutor Info */}
                  <div className="px-6 pb-4 flex flex-col min-h-[120px] justify-start">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {tutor.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {tutor.full_name}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-600">
                            {tutor.rating.toFixed(1)} ({tutor.total_reviews}{" "}
                            reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {session.title}
                    </h3>
                  </div>

                  {/* Session Details */}
                  <div className="px-6 pb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarDays className="w-4 h-4" />
                      <span>{formatDate(session.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(session.start_time)} -{" "}
                        {formatTime(session.end_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>
                        {sessionResult.available_slots} of{" "}
                        {session.max_students} spots available
                      </span>
                    </div>
                  </div>

                  {/* Book Button */}
                  <div className="px-6 pb-6 mt-auto">
                    <button
                      onClick={() => handleBookSession(sessionResult)}
                      disabled={isBooking || !sessionResult.is_bookable}
                      className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                        sessionResult.is_bookable
                          ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
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
                          Book Consultation
                        </div>
                      ) : (
                        "Fully Booked"
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <SessionPaymentForm
              sessionTitle={selectedSession.class.title}
              tutorName={selectedSession.tutor.full_name}
              sessionDate={selectedSession.class.date}
              sessionTime={selectedSession.class.start_time}
              amount={selectedSession.class.price_per_session}
              customerEmail={user?.email || ""}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BookConsultationPage;
