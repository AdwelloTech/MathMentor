import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { classSchedulingService } from "../lib/classSchedulingService";
import { sessionRatingService } from "../lib/sessionRatingService";
import { ClassSearchResult, ClassType } from "../types/classScheduling";
import SessionPaymentForm from "../components/payment/SessionPaymentForm";
import {
  CalendarDays,
  Clock,
  Users,
  DollarSign,
  Filter,
  Search,
  X,
  Star,
  BookOpen,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const BookSessionPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ClassSearchResult[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [tutorRatings, setTutorRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<ClassSearchResult | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const getClassTypeName = (classTypeId: string) => {
    const classType = classTypes.find((ct) => ct.id === classTypeId);
    return classType ? classType.name : 'Unknown';
  };

  useEffect(() => {
    loadSessions();
    loadClassTypes();
  }, []);

  // Load tutor ratings whenever sessions change
  useEffect(() => {
    const loadTutorRatings = async () => {
      const uniqueTutorIds = Array.from(
        new Set(
          (sessions || [])
            .map((s) => s.tutor?.id)
            .filter((id): id is string => Boolean(id))
        )
      );

      if (!uniqueTutorIds.length) {
        setTutorRatings({});
        return;
      }

      const statsEntries = await Promise.all(
        uniqueTutorIds.map(async (tutorId) => {
          try {
            const stats = await sessionRatingService.getTutorStats(tutorId);
            return [
              tutorId,
              {
                avg: stats.average_rating ?? 0,
                count: stats.total_reviews ?? 0,
              },
            ] as const;
          } catch (e) {
            console.error("Failed to load rating stats for tutor", tutorId, e);
            return [tutorId, { avg: 0, count: 0 }] as const;
          }
        })
      );
      setTutorRatings(Object.fromEntries(statsEntries));
    };

    loadTutorRatings();
  }, [sessions]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await classSchedulingService.classes.getAvailableClasses();
      setSessions(data || []);
    } catch (err) {
      setError("Failed to load available sessions");
      console.error("Error loading sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadClassTypes = async () => {
    try {
      const data = await classSchedulingService.classTypes.getAll();
      setClassTypes(data || []);
    } catch (err) {
      console.error("Error loading class types:", err);
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
        selectedSession.class.price || 0,
        paymentIntentId
      );

      // Refresh sessions to update available slots
      await loadSessions();

      // Close modal and show success message
      setShowPaymentModal(false);
      setSelectedSession(null);
      toast.success("Session booked successfully!");
    } catch (err) {
      console.error("Error booking session:", err);
      toast.error("Failed to book session. Please try again.");
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


  const filteredSessions = sessions.filter((sessionResult) => {
    const session = sessionResult.class;

    // Filter out past sessions - only show upcoming sessions
    const sessionDate = session.startDate;
    const sessionTime = session.schedule.startTime;
    const sessionDateTime = new Date(`${sessionDate}T${sessionTime}`);
    const now = new Date();
    const isUpcoming = sessionDateTime > now;

    if (!isUpcoming) return false;

    // For now, skip class type filtering since we don't have class types in the new backend
    const matchesType = filterType === "all";
    const matchesDate = !filterDate || session.startDate === filterDate;
    const matchesSubject =
      !filterSubject ||
      session.title.toLowerCase().includes(filterSubject.toLowerCase()) ||
      (session.description &&
        session.description
          .toLowerCase()
          .includes(filterSubject.toLowerCase()));
    const matchesSearch =
      !searchTerm ||
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sessionResult.tutor.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (session.description &&
        session.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      matchesType &&
      matchesDate &&
      matchesSubject &&
      matchesSearch &&
      sessionResult.is_bookable
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-900 mx-auto mb-4" />
          <p className="text-green-800 font-medium">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-green-900 mb-3">
            Book a Session
          </h1>
          <p className="text-lg text-gray-700">
            Find and book upcoming sessions with our expert tutors
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-green-200 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-green-900 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Session Type Filter */}
                <div className="space-y-2">
                  <Label
                    htmlFor="session-type"
                    className="text-gray-900 font-medium"
                  >
                    Session Type
                  </Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger
                      id="session-type"
                      className="border-green-900/60 focus:border-green-900 focus:ring-green-900"
                    >
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {classTypes.map((type) => (
                        <SelectItem key={type._id} value={type._id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-gray-900 font-medium">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border-green-900/60 focus:border-green-900 focus:ring-green-900"
                  />
                </div>

                {/* Subject Filter */}
                <div className="space-y-2">
                  <Label
                    htmlFor="subject"
                    className="text-gray-900 font-medium"
                  >
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="e.g., Math, Physics"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="border-green-900/60 focus:border-green-900 focus:ring-green-900"
                  />
                </div>

                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-gray-900 font-medium">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-900" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search sessions or tutors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-green-900/60 focus:border-green-900 focus:ring-green-900"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {(filterType !== "all" ||
                filterDate ||
                filterSubject ||
                searchTerm) && (
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterType("all");
                      setFilterDate("");
                      setFilterSubject("");
                      setSearchTerm("");
                    }}
                    className="border-green-900/60 text-gray-700 hover:bg-gray-50 hover:text-gray-800"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear all filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((sessionResult, index) => {
            const session = sessionResult.class;
            const tutor = sessionResult.tutor;
            const isBooking = bookingLoading === session._id;

            // ... existing code ...
            return (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col border-green-900/60  transition-all duration-200 hover:shadow-lg bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        variant="secondary"
                        className="bg-green-900 hover:bg-green-900 text-white flex items-center gap-1"
                      >
                        {getClassTypeName('class')}
                      </Badge>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className="border-yellow-400 border-2 text-black  text-lg font-bold px-3 py-1"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          {session.price}
                        </Badge>
                      </div>
                    </div>

                    {/* Title & Subject */}
                    <h3 className="text-lg font-semibold text-gray-900 mt-2">
                      {session.title}
                    </h3>
                    {session.subjectId_populated && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {session.subjectId_populated.displayName}
                        </span>
                      </div>
                    )}
                    {session.description && (
                      <CardDescription className="text-gray-700 line-clamp-2">
                        {session.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    {/* Tutor Info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className=" text-gray-900 font-semibold">
                          {tutor.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {tutor.full_name}
                        </p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-700 font-medium">
                            {(
                              tutorRatings[tutor.id]?.avg ?? tutor.rating ?? 0
                            ).toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-600">
                            (
                            {tutorRatings[tutor.id]?.count ?? tutor.total_reviews ?? 0} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Session Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <CalendarDays className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">
                          {formatDate(session.startDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">
                          {formatTime(session.schedule.startTime)} -{" "}
                          {formatTime(session.schedule.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">
                          {sessionResult.available_slots} of{" "}
                          {session.capacity} spots available
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      onClick={() => handleBookSession(sessionResult)}
                      disabled={isBooking || !sessionResult.is_bookable}
                      className={`w-full font-semibold ${
                        sessionResult.is_bookable
                          ? "bg-green-900 hover:bg-green-800 text-white"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {isBooking ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Booking...
                        </div>
                      ) : sessionResult.is_bookable ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Book Now
                        </div>
                      ) : (
                        "Fully Booked"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* No Sessions Message */}
        {filteredSessions.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <BookOpen className="w-20 h-20 text-green-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-green-900 mb-3">
                No sessions found
              </h3>
              <p className="text-green-700 text-lg">
                Try adjusting your filters or check back later for new sessions.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
          {selectedSession && (
            <>
              <DialogTitle className="sr-only">
                Complete Payment for {selectedSession.class.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Complete your payment to book a session with {selectedSession.tutor.full_name} on {selectedSession.class.startDate} at {selectedSession.class.schedule.startTime}
              </DialogDescription>
              <SessionPaymentForm
                sessionTitle={selectedSession.class.title}
                tutorName={selectedSession.tutor.full_name}
                sessionDate={selectedSession.class.startDate}
                sessionTime={selectedSession.class.schedule.startTime}
                amount={selectedSession.class.price || 0}
                customerEmail={user?.email || ""}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookSessionPage;
