import React, { useState, useEffect } from "react";
import { classSchedulingService } from "../../lib/classSchedulingService";
import { quizService } from "../../lib/quizService";
import { packagePricingService } from "../../lib/packagePricing";
import { flashcards } from "../../lib/flashcards";
import { searchStudyNotes } from "../../lib/notes";
import { getStudentTutorMaterials } from "../../lib/studentTutorMaterials";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTutorial } from "@/contexts/TutorialContext";
import { TutorialOverlay, TutorialPrompt } from "@/components/tutorial";
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
import { getPackageDisplayName } from "@/utils/permissions";
import StudentPageWrapper from "@/components/ui/StudentPageWrapper";
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

// Images (bellIcon currently unused; keeping imports intact per original)
import bellIcon from "../../assets/bell.png";
import logoutIcon from "../../assets/logout.png";

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
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { shouldShowTutorial } = useTutorial();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id]);

  const loadDashboardData = async () => {
    if (!profile?.user_id) return;

    setData((prev) => ({ ...prev, loading: true }));

    try {
      const [
        stats,
        upcomingSessions,
        recentQuizzes,
        availableFlashcardsRes,
        studyMaterials,
        packageInfo,
      ] = await Promise.allSettled([
        classSchedulingService.stats.getStudentStats(profile.user_id),
        loadUpcomingSessions(),
        loadRecentQuizzes(),
        flashcards.student.listAvailable(),
        loadStudyMaterials(),
        packagePricingService.getCurrentStudentPackage(profile.user_id),
      ]);

      const statsResult = stats.status === "fulfilled" ? stats.value : null;
      const upcomingSessionsResult =
        upcomingSessions.status === "fulfilled" ? upcomingSessions.value : [];
      const recentQuizzesResult =
        recentQuizzes.status === "fulfilled" ? recentQuizzes.value : [];
      const availableFlashcardsResult =
        availableFlashcardsRes.status === "fulfilled"
          ? availableFlashcardsRes.value
          : [];
      const studyMaterialsResult =
        studyMaterials.status === "fulfilled" ? studyMaterials.value : [];
      const packageInfoResult =
        packageInfo.status === "fulfilled" ? packageInfo.value : null;

      setData({
        stats: statsResult,
        upcomingSessions: upcomingSessionsResult,
        recentQuizzes: recentQuizzesResult.slice(0, 3),
        availableFlashcards: availableFlashcardsResult.slice(0, 3),
        studyMaterials: studyMaterialsResult.slice(0, 3),
        packageInfo: packageInfoResult,
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

  const loadRecentQuizzes = async () => {
    if (!profile?.user_id) return [];
    try {
      const recent = await quizService.studentQuizzes.getRecentQuizzes(
        profile.user_id
      );
      if (recent.length > 0) return recent.slice(0, 3);

      const available = await quizService.studentQuizzes.getAvailableQuizzes(
        profile.user_id
      );
      return available.slice(0, 3);
    } catch (error) {
      console.error("Error loading recent quizzes:", error);
      try {
        const available = await quizService.studentQuizzes.getAvailableQuizzes(
          profile.user_id
        );
        return available.slice(0, 3);
      } catch (fallbackError) {
        console.error("Fallback quizzes error:", fallbackError);
        return [];
      }
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
    const mins = eh * 60 + em - (sh * 60 + sm);
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
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)]" />
        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>

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
    <StudentPageWrapper backgroundClass="bg-[#D5FFC5]">
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)]" />
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-green-400/10 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/5 to-yellow-300/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-6 pb-16 relative z-10"
        >
          <div className="space-y-8">
            {/* Header */}
            <motion.div variants={itemVariants}>
              <div className="pt-6 relative">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Student Dashboard
                  </h1>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleLogout}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <img src={logoutIcon} alt="Logout" className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Welcome */}
            <motion.div variants={itemVariants}>
              <Card id="dashboard-welcome" className="bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white border-0 shadow-[0_2px_2px_0_rgba(0,0,0,0.5)]">
                <CardHeader className="pb-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-3xl lg:text-4xl font-bold text-white">
                        Welcome back, {profile?.full_name?.split(" ")[0]}! 👋
                      </CardTitle>
                      <CardDescription className="text-white text-lg">
                        Ready to continue your learning journey?
                      </CardDescription>
                    </div>
                    <div className="mt-6 lg:mt-0 flex items-center space-x-4">
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/20"
                      >
                        {getPackageDisplayName(profile?.package || "free")}
                      </Badge>
                      {profile?.package !== "gold" && (
                        <Button
                          variant="secondary"
                          className="bg-white text-[#199421] hover:bg-white/90 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
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

            {/* Package Status Card (gradient) */}
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
                          className="border-yellow-500/20"
                        >
                          {data.packageInfo?.display_name || "Free Package"}
                        </Badge>
                        <span className="text-green-100">
                          {data.packageInfo?.price_monthly
                            ? `${formatCurrency(data.packageInfo.price_monthly)}/month`
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
              id="dashboard-stats"
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

            {/* Main Content Grid (tall cards) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Study Materials (tall) */}
              <motion.div id="study-materials" variants={itemVariants} className="h-full">
                <Card className="shadow-[0_2px_2px_0_#16803D] border-0 h-full min-h-[500px]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                          <BookOpenIcon className="w-4 h-4 text-white" />
                        </div>
                        <CardTitle>Study Materials</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="p-4 bg-[#D5FFC5] rounded-[10px] text-center shadow-sm cursor-pointer hover:bg-[#C5F0B5] transition-colors duration-200"
                        onClick={() => navigate("/student/notes")}
                      >
                        <div className="bg-[#16803D] w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <DocumentTextIcon className="w-5 h-5 text-white" />
                            </div>
                        <p className="text-base font-medium text-black">
                          {data.studyMaterials.filter((m) => (m as any).content).length}
                        </p>
                        <p className="text-sm text-black">Notes</p>
                      </div>
                      <div
                        className="p-4 bg-[#D5FFC5] rounded-[10px] text-center shadow-sm cursor-pointer hover:bg-[#C5F0B5] transition-colors duration-200"
                        onClick={() => navigate("/student/flashcards")}
                      >
                        <div className="bg-[#16803D] w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <BookOpenIcon className="w-5 h-5 text-white" />
                            </div>
                        <p className="text-base font-medium text-black">
                          {data.availableFlashcards.length}
                        </p>
                        <p className="text-sm text-black">Flashcards</p>
                        </div>
                      </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Learning Activity */}
              <motion.div variants={itemVariants}>
                <Card className="shadow-[0_2px_2px_0_#16803D] border-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                          <ClockIcon className="w-4 h-4 text-white" />
                        </div>
                        <CardTitle>Learning Activity</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#16803D] hover:text-[#16803D] hover:bg-green-50 font-medium"
                        onClick={() => navigate("/student/activity")}
                      >
                        View all
                        <ArrowRightIcon className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quizzes */}
                    <div id="recent-quizzes" className="space-y-3">
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
                        data.recentQuizzes.map((quiz) => (
                          <div
                            key={quiz.id}
                            className="flex items-center space-x-3 p-3 bg-[#D5FFC5] rounded-[10px] shadow-sm cursor-pointer hover:bg-[#C5F0B5] transition-colors duration-200"
                            onClick={() =>
                              (quiz as any).attempt_id
                                ? navigate(
                                    `/student/take-quiz/${
                                      (quiz as any).attempt_id
                                    }`
                                  )
                                : console.warn(
                                    "No attempt available for quiz",
                                    quiz.id
                                  )
                            }
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-black truncate">
                                {quiz.title || "Untitled Quiz"}
                              </p>
                              <p className="text-sm text-black">
                                {(quiz as any).subject || "General"} •{" "}
                                {quiz.total_questions || 0} questions
                              </p>
                            </div>
                            <span className="text-black font-medium">
                              {(quiz as any).attempt_status === "completed"
                                ? "Completed"
                                : (quiz as any).attempt_status === "in_progress"
                                ? "In Progress"
                                : "Available"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No recent quiz activity
                        </p>
                      )}
                    </div>

                    {/* Upcoming Sessions (moved here) */}
                    <div id="upcoming-sessions" className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Upcoming Sessions
                        </h4>
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
                      {data.upcomingSessions.length > 0 ? (
                        data.upcomingSessions.slice(0, 3).map((session) => (
                        <div
                            key={session.id}
                            className="flex items-center space-x-3 p-3 bg-[#D5FFC5] rounded-[10px] shadow-sm"
                        >
                            <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                              <VideoCameraIcon className="w-4 h-4 text-white" />
                          </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-black truncate">
                                {session.subject}
                              </p>
                              <p className="text-sm text-black truncate">
                                {session.tutor} • {session.time}
                              </p>
                        </div>
                      </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No upcoming sessions</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div id="quick-actions" variants={itemVariants} className="mb-16">
              <Card className="shadow-[0_2px_2px_0_#16803D] border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                      <LightBulbIcon className="w-4 h-4 text-white" />
                    </div>
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
                        action: () => navigate("/student/book-session"),
                      },
                      {
                        title: "Take Quiz",
                        description: "Test your knowledge",
                        icon: AcademicCapIcon,
                        action: () => navigate("/student/quizzes"),
                      },
                      {
                        title: "Study Notes",
                        description: "Review study materials",
                        icon: BookOpenIcon,
                        action: () => navigate("/student/notes"),
                      },
                      {
                        title: "Flashcards",
                        description: "Practice with flashcards",
                        icon: CogIcon,
                        action: () => navigate("/student/flashcards"),
                      },
                    ].map((action) => (
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
                            <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
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
      
      {/* Tutorial Components */}
      <TutorialPrompt />
      <TutorialOverlay />
    </StudentPageWrapper>
  );
};

export default StudentDashboard;
