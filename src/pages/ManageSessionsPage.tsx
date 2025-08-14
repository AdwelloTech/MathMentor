import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { classSchedulingService } from "../lib/classSchedulingService";
import { ClassBooking } from "../types/classScheduling";
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
  Calendar,
  Loader2,
  User,
  Mail,
  Timer,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ManageSessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ClassBooking[]>([]);
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
      setBookings(data || []);
    } catch (err) {
      setError("Failed to load your sessions");
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "no_show":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "no_show":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const isSessionJoinable = (booking: ClassBooking) => {
    if (!booking.class || booking.booking_status !== "confirmed") return false;

    const sessionDate = booking.class.date;
    const sessionTime = booking.class.start_time;
    const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`);
    const now = new Date();
    const fiveMinutesBefore = new Date(
      sessionDateTime.getTime() - 5 * 60 * 1000
    );

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
      toast.error("Zoom link not available for this session");
      return;
    }

    // Open Zoom link in new tab
    window.open(booking.class.zoom_link, "_blank");
  };

  // Filter to show only upcoming sessions
  const upcomingBookings = bookings.filter(
    (booking) =>
      !isSessionPast(booking) && booking.booking_status === "confirmed"
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-900 mx-auto mb-4" />
          <p className="text-green-800 font-medium">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-green-900 mb-3">
            My Sessions
          </h1>
          <p className="text-lg text-green-700">
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
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Sessions List */}
        <div className="space-y-6">
          {upcomingBookings.map((booking, index) => {
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
                <Card className="border-green-200 bg-white hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Tutor Info */}
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-green-200 text-green-800 font-semibold text-lg">
                              {session.tutor?.full_name?.charAt(0) || "T"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-green-900 text-lg">
                              {session.tutor?.full_name || "Unknown Tutor"}
                            </p>
                            <p className="text-green-600 text-sm">Tutor</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(
                              booking.booking_status
                            )} flex items-center gap-1`}
                          >
                            {getStatusIcon(booking.booking_status)}
                            <span className="capitalize font-medium">
                              {booking.booking_status}
                            </span>
                          </Badge>
                        </div>

                        {/* Session Title and Description */}
                        <CardTitle className="text-green-900 text-xl mb-2">
                          {session.title}
                        </CardTitle>
                        {session.description && (
                          <CardDescription className="text-green-700 text-base mb-4">
                            {session.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Session Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CalendarDays className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">
                            Date
                          </p>
                          <p className="text-green-900 font-semibold">
                            {formatDate(session.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Clock className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">
                            Time
                          </p>
                          <p className="text-green-900 font-semibold">
                            {formatTime(session.start_time)} -{" "}
                            {formatTime(session.end_time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                        <DollarSign className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="text-sm text-yellow-600 font-medium">
                            Amount Paid
                          </p>
                          <p className="text-yellow-800 font-bold text-lg">
                            ${booking.payment_amount}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                      {/* Join Session Button */}
                      {booking.booking_status === "confirmed" && (
                        <Button
                          onClick={() => handleJoinSession(booking)}
                          disabled={!isJoinable}
                          className={`flex items-center gap-2 font-semibold ${
                            isJoinable
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200"
                          }`}
                        >
                          <Video className="w-4 h-4" />
                          {isJoinable ? "Join Session" : "Join Session"}
                        </Button>
                      )}

                      {/* View Details Button */}
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetails(true);
                        }}
                        variant="outline"
                        className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* No Sessions Message */}
        {upcomingBookings.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <Calendar className="w-20 h-20 text-green-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-green-900 mb-3">
                No upcoming sessions
              </h3>
              <p className="text-green-700 text-lg mb-6">
                Book a session to get started with your learning journey!
              </p>
              <Button
                onClick={() => (window.location.href = "/book-session")}
                className="bg-green-900 text-white hover:bg-green-800 px-8 py-3 text-lg"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Book Your First Session
              </Button>
            </div>
          </motion.div>
        )}

        {/* Session Details Modal */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-green-900 mb-2">
                Session Details
              </DialogTitle>
            </DialogHeader>

            {selectedBooking?.class && (
              <div className="space-y-6 mt-4">
                {/* Basic Info */}
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-900 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Session Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-green-800 font-medium">
                          Title
                        </Label>
                        <p className="text-green-900 font-semibold mt-1">
                          {selectedBooking.class.title}
                        </p>
                      </div>
                      <div>
                        <Label className="text-green-800 font-medium">
                          Status
                        </Label>
                        <div className="mt-1">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(
                              selectedBooking.booking_status
                            )} flex items-center gap-1 w-fit`}
                          >
                            {getStatusIcon(selectedBooking.booking_status)}
                            <span className="capitalize font-medium">
                              {selectedBooking.booking_status}
                            </span>
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-green-800 font-medium">
                          Date
                        </Label>
                        <p className="text-green-900 font-semibold mt-1">
                          {formatDate(selectedBooking.class.date)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-green-800 font-medium">
                          Time
                        </Label>
                        <p className="text-green-900 font-semibold mt-1">
                          {formatTime(selectedBooking.class.start_time)} -{" "}
                          {formatTime(selectedBooking.class.end_time)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-green-800 font-medium">
                          Duration
                        </Label>
                        <p className="text-green-900 font-semibold mt-1 flex items-center gap-1">
                          <Timer className="w-4 h-4" />
                          {selectedBooking.class.duration_minutes} minutes
                        </p>
                      </div>
                      <div>
                        <Label className="text-green-800 font-medium">
                          Amount Paid
                        </Label>
                        <p className="text-yellow-600 font-bold text-lg mt-1">
                          ${selectedBooking.payment_amount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                {selectedBooking.class.description && (
                  <Card className="border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-900">
                        Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-green-800 leading-relaxed">
                        {selectedBooking.class.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Tutor Info */}
                {selectedBooking.class.tutor && (
                  <Card className="border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-900 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Tutor Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="bg-green-200 text-green-800 font-semibold text-xl">
                            {selectedBooking.class.tutor.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-green-900 text-lg">
                            {selectedBooking.class.tutor.full_name}
                          </p>
                          <p className="text-green-700 flex items-center gap-2 mt-1">
                            <Mail className="w-4 h-4" />
                            {selectedBooking.class.tutor.email}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Session Notes */}
                {selectedBooking.notes && (
                  <Card className="border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-900">
                        Session Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-green-800 leading-relaxed">
                          {selectedBooking.notes}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Zoom Link */}
                {selectedBooking.class.zoom_link &&
                  selectedBooking.booking_status === "confirmed" && (
                    <Card className="border-green-200">
                      <CardHeader>
                        <CardTitle className="text-green-900 flex items-center gap-2">
                          <Video className="w-5 h-5" />
                          Join Session
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => handleJoinSession(selectedBooking)}
                          disabled={!isSessionJoinable(selectedBooking)}
                          className={`flex items-center gap-2 font-semibold ${
                            isSessionJoinable(selectedBooking)
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200"
                          }`}
                        >
                          <Video className="w-4 h-4" />
                          {isSessionJoinable(selectedBooking)
                            ? "Join Session Now"
                            : "Join Available 5 Min Before"}
                        </Button>
                        {!isSessionJoinable(selectedBooking) && (
                          <p className="text-sm text-green-600 mt-2">
                            The join button will be enabled 5 minutes before
                            your session starts.
                          </p>
                        )}
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
