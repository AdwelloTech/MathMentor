import React, { useState, useEffect } from "react";
import { classSchedulingService } from "../../lib/classSchedulingService";
import { quizService } from "../../lib/quizService";
import { packagePricingService } from "../../lib/packagePricing";
import { flashcards } from "../../lib/flashcards";
import { searchStudyNotes } from "../../lib/notes";
import { getStudentTutorMaterials } from "../../lib/studentTutorMaterials";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  VideoCameraIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlayIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  GiftIcon,
  LightBulbIcon,
  CheckCircleIcon,
  CogIcon,
  ChartBarIcon as TrendingUpIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { getPackageDisplayName, getPackageFeatures } from "@/utils/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentDashboardStats } from "@/types/classScheduling";
import type { Quiz } from "@/types/quiz";
import type { FlashcardSet } from "@/types/flashcards";

interface DashboardData {
  stats: StudentDashboardStats | null;
  upcomingSessions: any[];
  recentQuizzes: Quiz[];
  availableFlashcards: FlashcardSet[];
  studyMaterials: any[];
  packageInfo: any;
  loading: boolean;
}

const StudentDashboard: React.FC = () => {
  const { profile, canAccess } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({
    stats: null,
    upcomingSessions: [],
    recentQuizzes: [],
    availableFlashcards: [],
    studyMaterials: [],
    packageInfo: null,
    loading: true,
  });

  useEffect(() => {
    if (profile?.user_id) {
      loadDashboardData();
    }
  }, [profile?.user_id]);

  const loadDashboardData = async () => {
    if (!profile?.user_id) return;

    setData((prev) => ({ ...prev, loading: true }));

    try {
      const [
        stats,
        upcomingSessions,
        recentQuizzes,
        availableFlashcards,
        studyMaterials,
        packageInfo,
      ] = await Promise.all([
        classSchedulingService.stats.getStudentStats(profile.user_id),
        loadUpcomingSessions(),
        quizService.studentQuizzes.getAvailableQuizzes(profile.user_id),
        flashcards.student.listAvailable(),
        loadStudyMaterials(),
        packagePricingService.getCurrentStudentPackage(profile.user_id),
      ]);

      setData({
        stats,
        upcomingSessions,
        recentQuizzes: recentQuizzes.slice(0, 3), // Show only 3 recent
        availableFlashcards: availableFlashcards.slice(0, 3), // Show only 3
        studyMaterials: studyMaterials.slice(0, 3), // Show only 3
        packageInfo,
        loading: false,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setData((prev) => ({ ...prev, loading: false }));
    }
  };

  const loadUpcomingSessions = async () => {
    if (!profile?.user_id) return [];

    try {
      const allBookings = await classSchedulingService.bookings.getByStudentId(
        profile.user_id,
        { booking_status: "confirmed" }
      );

      const now = new Date();
      const futureBookings = allBookings.filter((booking: any) => {
        const date = booking.class?.date;
        const time = booking.class?.start_time;
        if (!date || !time) return false;
        const sessionDateTime = new Date(`${date}T${time}`);
        return sessionDateTime > now;
      });

      return futureBookings.map((booking: any) => ({
        id: booking.id,
        tutor: booking.class?.tutor?.full_name || booking.tutor_name,
        subject: booking.class?.title,
        time: formatUpcomingTime(
          booking.class?.date,
          booking.class?.start_time
        ),
        duration: getDuration(
          booking.class?.start_time,
          booking.class?.end_time
        ),
        type: booking.class?.class_type?.name || booking.class_type,
        date: booking.class?.date,
        startTime: booking.class?.start_time,
      }));
    } catch (error) {
      console.error("Error loading upcoming sessions:", error);
      return [];
    }
  };

  const loadStudyMaterials = async () => {
    if (!profile?.user_id) return [];

    try {
      const [notes, materials] = await Promise.all([
        searchStudyNotes(),
        getStudentTutorMaterials(profile.user_id),
      ]);

      return [...notes, ...materials].slice(0, 6);
    } catch (error) {
      console.error("Error loading study materials:", error);
      return [];
    }
  };

  const formatUpcomingTime = (date: string, time: string) => {
    if (!date || !time) return "";
    const dt = new Date(`${date}T${time}`);
    const today = new Date();

    if (dt.toDateString() === today.toDateString()) {
      return `Today, ${dt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    return `${dt.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })}, ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const getDuration = (start: string, end: string) => {
    if (!start || !end) return "";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let mins = eh * 60 + em - (sh * 60 + sm);
    return `${mins} min`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const calculateHoursLearned = () => {
    if (!data.stats) return 0;
    // Estimate 1 hour per completed booking
    return data.stats.completed_bookings;
  };

  const getPackageProgress = () => {
    if (!data.packageInfo) return { used: 0, total: 10, percentage: 0 };

    const total =
      data.packageInfo.package_type === "gold"
        ? 20
        : data.packageInfo.package_type === "silver"
        ? 15
        : 10;
    const used = data.stats?.total_bookings || 0;
    const percentage = Math.min((used / total) * 100, 100);

    return { used, total, percentage };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 p-6 relative">
        {/* Background pattern for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          {/* Header Skeleton */}
          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="shadow-lg shadow-gray-200/50 border-0">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="shadow-xl shadow-gray-200/50 border-0">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-16 w-full" />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)]"></div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-green-400/10 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/5 to-yellow-300/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6 relative z-10"
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 text-white border-0 shadow-2xl shadow-green-900/20">
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">
                      Welcome back, {profile?.full_name?.split(" ")[0]}! 👋
                    </CardTitle>
                    <CardDescription className="text-green-100 text-lg">
                      Ready to continue your learning journey?
                    </CardDescription>
                  </div>
                  <div className="mt-6 lg:mt-0 flex items-center space-x-4">
                    <Badge
                      variant="secondary"
                      className="bg-yellow-500/20 text-yellow-100 border-yellow-500/20"
                    >
                      {getPackageDisplayName(profile?.package || "free")}
                    </Badge>
                    {profile?.package !== "gold" && (
                      <Button
                        variant="secondary"
                        className="bg-yellow-300 text-black hover:bg-yellow-200 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                        onClick={() => navigate("/packages")}
                      >
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Upgrade
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Package Status Card */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white border-0 shadow-2xl shadow-green-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <CardTitle className="text-xl">
                      My Learning Package
                    </CardTitle>
                    <div className="space-y-2">
                      <p className="text-green-100">
                        {getPackageProgress().used} of{" "}
                        {getPackageProgress().total} sessions used
                      </p>
                      <Progress
                        value={getPackageProgress().percentage}
                        className="w-64 h-2 bg-white [&>div]:bg-yellow-400"
                      />
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <Badge
                        variant="secondary"
                        className=" border-yellow-500/20"
                      >
                        {data.packageInfo?.display_name || "Free Package"}
                      </Badge>
                      <span className="text-green-100">
                        {data.packageInfo?.price_monthly
                          ? formatCurrency(data.packageInfo.price_monthly) +
                            "/month"
                          : "Free"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      {getPackageProgress().total - getPackageProgress().used}
                    </div>
                    <div className="text-green-100 text-sm">
                      sessions remaining
                    </div>
                  </div>
                </div>
                <Button
                  className="mt-4 bg-yellow-300 text-black hover:bg-yellow-200 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                  onClick={() => navigate("/packages")}
                >
                  <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                  Manage Package
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                name: "Total Sessions",
                value: data.stats?.total_bookings || 0,
                icon: VideoCameraIcon,
                color: "bg-green-900",
                description: "All time bookings",
              },
              {
                name: "Hours Learned",
                value: calculateHoursLearned(),
                icon: ClockIcon,
                color: "bg-green-900",
                description: "Estimated learning time",
              },
              {
                name: "Tutors Worked With",
                value: data.stats?.total_tutors || 0,
                icon: UserGroupIcon,
                color: "bg-green-900",
                description: "Unique tutors",
              },
              {
                name: "This Month",
                value: data.stats?.bookings_this_month || 0,
                icon: TrendingUpIcon,
                color: "bg-yellow-900",
                description: "Sessions booked",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.name}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-lg shadow-gray-200/50">
                  <CardHeader className="pb-2">
                    <div
                      className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      {stat.value}
                    </CardTitle>
                    <CardDescription className="text-sm font-medium">
                      {stat.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Sessions */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-xl shadow-gray-200/50 border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-gradient-to-r from-green-600 to-green-700 w-8 h-8 rounded-lg flex items-center justify-center">
                        <CalendarDaysIcon className="w-4 h-4 text-white" />
                      </div>
                      <CardTitle>Upcoming Sessions</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 font-medium"
                      onClick={() => navigate("/student/manage-sessions")}
                    >
                      View all
                      <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.upcomingSessions.length > 0 ? (
                    data.upcomingSessions.slice(0, 3).map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl border shadow-md shadow-gray-100/50"
                      >
                        <div className="bg-gradient-to-r from-green-600 to-green-700 w-10 h-10 rounded-full flex items-center justify-center">
                          <VideoCameraIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {session.subject}
                          </h4>
                          <p className="text-sm text-gray-600">
                            with {session.tutor}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 text-sm">
                            {session.time}
                          </p>
                          <p className="text-xs text-gray-600">
                            {session.duration}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarDaysIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        No upcoming sessions
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Book your first session to get started!
                      </p>
                      <Button
                        className="bg-yellow-300 text-black hover:bg-yellow-200 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                        onClick={() => navigate("/student/book-session")}
                      >
                        <PlayIcon className="w-4 h-4 mr-2" />
                        Book Session
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={itemVariants}>
              <Card className="shadow-xl shadow-gray-200/50 border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 w-8 h-8 rounded-lg flex items-center justify-center">
                        <CogIcon className="w-4 h-4 text-white" />
                      </div>
                      <CardTitle>Learning Activity</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quiz Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        Recent Quizzes
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 font-medium"
                        onClick={() => navigate("/student/quizzes")}
                      >
                        View all
                        <ArrowRightIcon className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    {data.recentQuizzes.length > 0 ? (
                      data.recentQuizzes.map((quiz, index) => (
                        <div
                          key={quiz.id}
                          className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg shadow-sm shadow-green-100/50"
                        >
                          <div className="bg-green-100 w-8 h-8 rounded-lg flex items-center justify-center">
                            <AcademicCapIcon className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {quiz.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {quiz.subject} • {quiz.total_questions} questions
                            </p>
                          </div>
                          <Badge
                            variant={
                              quiz.attempt_status === "completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {quiz.attempt_status === "completed"
                              ? "Completed"
                              : "Available"}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        No recent quiz activity
                      </p>
                    )}
                  </div>

                  {/* Study Materials */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        Study Materials
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 font-medium"
                        onClick={() => navigate("/student/notes")}
                      >
                        View all
                        <ArrowRightIcon className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-green-50 rounded-lg text-center shadow-sm shadow-green-100/50">
                        <DocumentTextIcon className="w-6 h-6 text-green-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-gray-900">
                          {data.studyMaterials.filter((m) => m.content).length}
                        </p>
                        <p className="text-xs text-gray-600">Notes</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg text-center shadow-sm shadow-yellow-100/50">
                        <BookOpenIcon className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-gray-900">
                          {data.availableFlashcards.length}
                        </p>
                        <p className="text-xs text-gray-600">Flashcards</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-xl shadow-gray-200/50 border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LightBulbIcon className="w-6 h-6 text-green-600" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      title: "Book Session",
                      description: "Schedule a tutoring session",
                      icon: PlayIcon,
                      color: "from-green-900 to-green-900",
                      action: () => navigate("/student/book-session"),
                    },
                    {
                      title: "Take Quiz",
                      description: "Test your knowledge",
                      icon: AcademicCapIcon,
                      color: "from-green-900 to-green-900",
                      action: () => navigate("/student/quizzes"),
                    },
                    {
                      title: "Study Notes",
                      description: "Review study materials",
                      icon: BookOpenIcon,
                      color: "from-green-900 to-green-900",
                      action: () => navigate("/student/notes"),
                    },
                    {
                      title: "Flashcards",
                      description: "Practice with flashcards",
                      icon: CogIcon,
                      color: "from-green-900 to-green-900",
                      action: () => navigate("/student/flashcards"),
                    },
                  ].map((action, index) => (
                    <motion.div
                      key={action.title}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-lg shadow-gray-200/50 border-0"
                        onClick={action.action}
                      >
                        <CardContent className="p-6 text-center">
                          <div
                            className={`bg-gradient-to-r ${action.color} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg`}
                          >
                            <action.icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            {action.description}
                          </p>
                          <div className="bg-yellow-300 text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-yellow-200 transition-all duration-200 shadow-md hover:shadow-lg">
                            Get Started
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentDashboard;
