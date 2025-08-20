// SessionsPage.tsx - Main component with Shadcn UI
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { classSchedulingService } from "../lib/classSchedulingService";
import { ClassBooking } from "../types/classScheduling";
import {
  CalendarDays,
  Clock,
  DollarSign,
  Video,
  Eye,
  Calendar,
  XCircle,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// Shadcn UI imports
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ManageSessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<ClassBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ClassBooking | null>(
    null
  );
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await classSchedulingService.bookings.getByStudentId(
        user!.id
      );
      setUpcomingBookings(data || []);
    } catch (err) {
      setError("Failed to load your sessions");
      console.error("Error loading bookings:", err);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "no_show":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "no_show":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const isSessionJoinable = (booking: ClassBooking) => {
    if (
      booking.booking_status !== "confirmed" ||
      !booking.class?.jitsi_meeting_url
    ) {
      return false;
    }
    const now = new Date();
    const sessionDate = new Date(
      `${booking.class.date}T${booking.class.start_time}`
    );
    const fiveMinutesBeforeSession = new Date(
      sessionDate.getTime() - 5 * 60 * 1000
    );
    return now >= fiveMinutesBeforeSession;
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
    if (booking.class?.jitsi_meeting_url && isSessionJoinable(booking)) {
      window.open(booking.class.jitsi_meeting_url, "_blank");
    } else {
      toast.error("Session is not available for joining yet");
    }
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

  // Filter to show only upcoming sessions
  const filteredUpcomingBookings = upcomingBookings.filter(
    (booking) =>
      !isSessionPast(booking) && booking.booking_status === "confirmed"
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-green-900 mb-3">
            My Sessions
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your upcoming sessions and join classes
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Sessions List */}
        <div className="space-y-6">
          {filteredUpcomingBookings.map((booking, index) => {
            const session = booking.class;
            if (!session) return null;

            const isJoinable = isSessionJoinable(booking);

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-900">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Session Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-900 to-green-700 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {session.tutor?.full_name?.charAt(0) || "T"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-green-900 text-lg">
                              {session.tutor?.full_name || "Tutor"}
                            </p>
                            <p className="text-sm text-gray-600">Tutor</p>
                          </div>
                          <Badge
                            className={getStatusColor(booking.booking_status)}
                          >
                            <span className="mr-1">
                              {getStatusIcon(booking.booking_status)}
                            </span>
                            <span className="capitalize font-medium">
                              {booking.booking_status}
                            </span>
                          </Badge>
                        </div>

                        {/* Subject */}
                        <h3 className="text-xl font-bold text-green-900 mb-2">
                          {session.title}
                        </h3>
                        {session.description && (
                          <p className="text-gray-700 mb-4 leading-relaxed">
                            {session.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-3 text-gray-700">
                            <CalendarDays className="w-5 h-5 text-green-700" />
                            <span className="font-medium">
                              {formatDate(session.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-700">
                            <Clock className="w-5 h-5 text-green-700" />
                            <span className="font-medium">
                              {formatTime(session.start_time)} -{" "}
                              {formatTime(session.end_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-700">
                            <DollarSign className="w-5 h-5 text-yellow-500" />
                            <span className="font-bold text-yellow-600">
                              ${booking.payment_amount}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Title & Subject */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {session.title}
                      </h3>
                      {session.subject && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mb-2">
                          {session.subject.display_name}
                        </span>
                      )}
                      {session.description && (
                        <p className="text-gray-600 mb-3">
                          {session.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-3 ml-6">
                        {/* Join Session Button */}
                        {booking.booking_status === "confirmed" && (
                          <Button
                            onClick={() => handleJoinSession(booking)}
                            disabled={!isJoinable}
                            className={
                              isJoinable
                                ? "bg-green-900 hover:bg-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }
                            size="lg"
                          >
                            <Video className="w-5 h-5 mr-2" />
                            {isJoinable ? "Join Now" : "Join Session"}
                          </Button>
                        )}

                        {/* View Details Button */}
                        <Button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetails(true);
                          }}
                          variant="outline"
                          size="lg"
                          className="border-2 border-green-900 text-green-900 hover:bg-green-50 hover:border-green-800 transition-all duration-200"
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* No Sessions Message */}
        {filteredUpcomingBookings.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8">
                <Calendar className="w-20 h-20 text-green-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-green-900 mb-3">
                  No upcoming sessions
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Ready to start learning? Book your first session!
                </p>
                <Button
                  onClick={() => navigate("/student/book-session")}
                  className="bg-green-900 hover:bg-green-800 text-white text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  Book Your First Session
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Session Details Modal */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-green-900">
                Session Details
              </DialogTitle>
            </DialogHeader>

            {selectedBooking && (
              <div className="space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4">
                      Session Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <p className="text-green-900 font-semibold text-lg">
                          {selectedBooking.class?.title}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <Badge
                          className={getStatusColor(
                            selectedBooking.booking_status
                          )}
                        >
                          <span className="mr-1">
                            {getStatusIcon(selectedBooking.booking_status)}
                          </span>
                          <span className="capitalize font-medium">
                            {selectedBooking.booking_status}
                          </span>
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedBooking.class?.date &&
                            formatDate(selectedBooking.class.date)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedBooking.class?.start_time &&
                            selectedBooking.class?.end_time &&
                            `${formatTime(
                              selectedBooking.class.start_time
                            )} - ${formatTime(selectedBooking.class.end_time)}`}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration
                        </label>
                        <p className="text-gray-900 font-medium">
                          {selectedBooking.class?.duration_minutes} minutes
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount Paid
                        </label>
                        <p className="text-yellow-600 font-bold text-lg">
                          ${selectedBooking.payment_amount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                {selectedBooking.class?.description && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-3">
                        Description
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedBooking.class.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Tutor Info */}
                {selectedBooking.class?.tutor && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-3">
                        Tutor
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-green-900 to-green-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-xl">
                            {selectedBooking.class.tutor.full_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-green-900 text-lg">
                            {selectedBooking.class.tutor.full_name}
                          </p>
                          <p className="text-gray-600">
                            {selectedBooking.class.tutor.email}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Session Notes */}
                {selectedBooking.notes && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-3">
                        Session Notes
                      </h3>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed">
                          {selectedBooking.notes}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Join Session */}
                {selectedBooking.class?.jitsi_meeting_url &&
                  selectedBooking.booking_status === "confirmed" && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-green-900 mb-3">
                          Join Session
                        </h3>
                        <Button
                          onClick={() => handleJoinSession(selectedBooking)}
                          disabled={!isSessionJoinable(selectedBooking)}
                          className={
                            isSessionJoinable(selectedBooking)
                              ? "bg-green-900 hover:bg-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }
                          size="lg"
                        >
                          <Video className="w-5 h-5 mr-2" />
                          {isSessionJoinable(selectedBooking)
                            ? "Join Session Now"
                            : "Available 5 Min Before Start"}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ManageSessionsPage;
