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
  VideoCameraIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlayIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  CogIcon,
  ChartBarIcon as TrendingUpIcon,
} from "@heroicons/react/24/outline";
import { GraduationCap, Star, Sparkles } from "lucide-react";
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
// removed unused bellIcon
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

/** Graceful fetch wrapper: logs which call 404'd and returns a fallback */
async function safeCall<T>(label: string, p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e: any) {
    const method = e?.method ? String(e.method).toUpperCase() : "";
    const url = e?.url || "";
    if (e?.status === 404) {
      console.warn(`[StudentDashboard] 404 from ${label}`, method, url);
    } else {
      console.error(`[StudentDashboard] ${label} failed:`, e);
    }
    return fallback;
  }
}

const StudentDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  // tutorial context not needed for UI here

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

    const [
      stats,
      upcomingSessions,
      recentQuizzes,
      availableFlashcardsRes,
      studyMaterials,
      packageInfo,
    ] = await Promise.all([
      safeCall(
        "stats.getStudentStats",
        (classSchedulingService as any)?.stats?.getStudentStats
          ? (classSchedulingService as any).stats.getStudentStats(profile.user_id)
          : Promise.resolve(null as any),
        null
      ),
      safeCall("bookings.getByStudentId", loadUpcomingSessions(), []),
      safeCall("quizzes.recentOrAvailable", loadRecentQuizzes(), []),
      safeCall("flashcards.student.listAvailable", flashcards.student.listAvailable(), []),
      safeCall("notes+materials", loadStudyMaterials(), []),
      safeCall(
        "packagePricing.getCurrentStudentPackage",
        packagePricingService.getCurrentStudentPackage(profile.user_id),
        null
      ),
    ]);

    setData({
      stats,
      upcomingSessions,
      recentQuizzes: recentQuizzes.slice(0, 3),
      availableFlashcards: availableFlashcardsRes.slice(0, 3),
      studyMaterials: studyMaterials.slice(0, 3),
      packageInfo,
      loading: false,
    });
  };

  const loadUpcomingSessions = async () => {
    if (!profile?.user_id) return [];
    try {
      const allBookings = await (classSchedulingService as any).bookings.getByStudentId(
        profile.user_id
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
      const recentGetter = (quizService as any)?.studentQuizzes?.getRecentQuizzes;
      const recent = recentGetter ? await recentGetter(profile.user_id) : [];
      if (recent && recent.length > 0) return recent.slice(0, 3);

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
    return Math.max(Math.round((data.stats.hours_learned || 0) * 10) / 10, 0);
  };

  const getPackageProgress = () => {
    if (!data.packageInfo)
      return { used: 0, total: 10, percentage: 0, remaining: 10 };
    const total =
      data.packageInfo.package_type === "gold"
        ? 20
        : data.packageInfo.package_type === "silver"
        ? 15
        : 10;
    // Count only this month's bookings towards the current package usage
    const used = data.stats?.bookings_this_month || 0;
    const percentage = Math.min((used / total) * 100, 100);
    const remaining = Math.max(total - used, 0);
    return { used, total, percentage, remaining };
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
    <StudentPageWrapper backgroundClass="bg-[#0f172a]">
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          background:
            "radial-gradient(1000px 600px at 50% -100px, rgba(255,255,255,0.08), transparent)",
        }}
      >
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
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-900/90 rounded-lg shadow-sm shadow-black/30">
                        <GraduationCap className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-4xl font-extrabold text-yellow-300 drop-shadow-md tracking-tight">
                          Student Dashboard
                        </h1>
                        <Badge
                          variant="outline"
                          className="border-yellow-300/40 text-yellow-300 mt-2 bg-green-900/60"
                        >
                          Learning Hub
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 lg:shrink-0">
                    {profile?.package !== "gold" && (
                      <Button
                        onClick={() => navigate("/packages")}
                        size="lg"
                        className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold shadow-lg"
                      >
                        <Star className="h-5 w-5 mr-2" />
                        Upgrade to Premium
                        <Sparkles className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                      title="Sign out"
                    >
                      <img src={logoutIcon} alt="Logout" className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Welcome */}
            <motion.div variants={itemVariants}>
              <Card id="dashboard-welcome" className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-3xl lg:text-4xl font-bold text-yellow-300">
                        Welcome back, {profile?.full_name?.split(" ")[0]}! 👋
                      </CardTitle>
                      <CardDescription className="text-white/80 text-lg">
                        Ready to continue your learning journey?
                      </CardDescription>
                    </div>
                    <div className="mt-6 lg:mt-0 flex items-center space-x-4">
                      <Badge
                        variant="secondary"
                        className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30"
                      >
                        {getPackageDisplayName(profile?.package || "free")}
                      </Badge>
                      {profile?.package !== "gold" && (
                        <Button
                          variant="secondary"
                          className="bg-yellow-400 text-green-900 hover:bg-yellow-500 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
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
              <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <CardTitle className="text-xl text-yellow-300 drop-shadow">
                        My Learning Package
                      </CardTitle>
                      <div className="space-y-2">
                        <p className="text-white/80">
                          {getPackageProgress().used} of{" "}
                          {getPackageProgress().total} sessions used
                        </p>
                        <Progress
                          value={getPackageProgress().percentage}
                          className="w-64 h-2 bg-white/20 [&>div]:bg-yellow-400"
                        />
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <Badge
                          variant="secondary"
                          className="border-yellow-400/30 text-yellow-300 bg-yellow-400/10"
                        >
                          {data.packageInfo?.display_name || "Free Package"}
                        </Badge>
                        <span className="text-white/80">
                          {data.packageInfo?.price_monthly
                            ? `${formatCurrency(
                                data.packageInfo.price_monthly
                              )}/month`
                            : "Free"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-yellow-300 drop-shadow">
                        {Math.max(data.upcomingSessions.length, 0)}
                      </div>
                      <div className="text-white/80 text-sm">
                        sessions remaining
                      </div>
                    </div>
                  </div>
                  <Button
                    className="mt-4 bg-yellow-400 text-green-900 hover:bg-yellow-500 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
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
                  <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-green-900/20 transition-all duration-300 group">
                    <CardHeader className="pb-2">
                      <div
                        className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}
                      >
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-yellow-300 drop-shadow">
                        {stat.value}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium text-white/80">
                        {stat.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-white/60">
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
                <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl h-full min-h-[500px]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="bg-green-900/80 w-8 h-8 rounded-lg flex items-center justify-center shadow-inner">
                          <BookOpenIcon className="w-4 h-4 text-white" />
                        </div>
                        <CardTitle className="text-yellow-300 drop-shadow">Study Materials</CardTitle>
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
                <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="bg-green-900/80 w-8 h-8 rounded-lg flex items-center justify-center shadow-inner">
                          <ClockIcon className="w-4 h-4 text-white" />
                        </div>
                        <CardTitle className="text-yellow-300 drop-shadow">Learning Activity</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-yellow-300 hover:text-yellow-400 hover:bg-yellow-400/10 font-medium"
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
                        <h4 className="font-medium text-yellow-300 drop-shadow">
                          Recent Quizzes
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-yellow-300 hover:text-yellow-400 hover:bg-yellow-400/10 font-medium"
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
                        <p className="text-sm text-white/60">
                          No recent quiz activity
                        </p>
                      )}
                    </div>

                    {/* Upcoming Sessions (moved here) */}
                    <div id="upcoming-sessions" className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-yellow-300 drop-shadow">
                          Upcoming Sessions
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-yellow-300 hover:text-yellow-400 hover:bg-yellow-400/10 font-medium"
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
                        <p className="text-sm text-white/60">No upcoming sessions</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div id="quick-actions" variants={itemVariants} className="mb-16">
              <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-300 drop-shadow">
                    <div className="bg-green-900/80 w-8 h-8 rounded-lg flex items-center justify-center shadow-inner">
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
                          className="cursor-pointer hover:shadow-2xl hover:shadow-green-900/20 hover:-translate-y-1 transition-all duration-300 group bg-green-950/30 border border-yellow-400/10 backdrop-blur-sm rounded-xl"
                          onClick={action.action}
                        >
                          <CardContent className="p-6 text-center">
                            <div className="bg-green-900/80 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg shadow-inner">
                              <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-yellow-300 drop-shadow mb-2">
                              {action.title}
                            </h3>
                            <p className="text-sm text-white/80 mb-4">
                              {action.description}
                            </p>
                            <div className="bg-yellow-400 text-green-900 px-4 py-2 rounded-lg font-medium text-sm hover:bg-yellow-500 transition-all duration-200 shadow-md hover:shadow-lg">
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
