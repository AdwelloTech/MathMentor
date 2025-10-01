import React, { useState, useEffect } from "react";
import dashboardService from "../../lib/dashboardService";
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
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { StudentDashboardStats } from "@/lib/dashboardService";
import type { Quiz } from "@/types/quiz";
import type { FlashcardSet } from "@/types/flashcards";

import logoutIcon from "../../assets/logout.png";

interface DashboardData {
  stats: StudentDashboardStats | null;
  upcomingSessions: any[];
  recentQuizzes: Quiz[];
  recentQuizAttempts: any[];
  availableFlashcards: FlashcardSet[];
  studyMaterials: any[];
  packageInfo: any;
  loading: boolean;
}

const StudentDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { } = useTutorial();

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
    recentQuizAttempts: [],
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
        recentQuizAttempts,
        availableFlashcardsRes,
        studyMaterials,
        packageInfo,
      ] = await Promise.allSettled([
        dashboardService.getStudentStats(profile.user_id),
        loadUpcomingSessions(),
        loadRecentQuizzes(),
        loadRecentQuizAttempts(),
        flashcards.student.listAvailable(profile.user_id),
        loadStudyMaterials(),
        packagePricingService.getCurrentStudentPackage(profile.user_id),
      ]);

      const statsResult = stats.status === "fulfilled" ? stats.value : null;
      const upcomingSessionsResult =
        upcomingSessions.status === "fulfilled" ? upcomingSessions.value : [];
      const recentQuizzesResult =
        recentQuizzes.status === "fulfilled" ? recentQuizzes.value : [];
      const recentQuizAttemptsResult =
        recentQuizAttempts.status === "fulfilled" ? recentQuizAttempts.value : [];
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
        recentQuizAttempts: recentQuizAttemptsResult.slice(0, 3),
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
      const sessions = await dashboardService.getStudentUpcomingSessions(profile.user_id);

      return sessions.map((session: any) => ({
        id: session.id,
        tutor: session.tutor_name,
        subject: session.title,
        time: formatUpcomingTime(session.date, session.start_time),
        duration: getDuration(session.start_time, session.end_time),
        type: session.class_type_name,
        date: session.date,
        startTime: session.start_time,
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
        getStudentTutorMaterials(),
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

  const loadRecentQuizAttempts = async () => {
    if (!profile?.user_id) return [];
    try {
      const attempts = await quizService.studentQuizzes.getStudentAttempts(
        profile.user_id
      );
      return attempts
        .filter((attempt: any) => attempt.status === 'completed')
        .slice(0, 3);
    } catch (error) {
      console.error("Error loading recent quiz attempts:", error);
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
      <div className="min-h-screen bg-background p-6 relative">
        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="shadow-lg border-border">
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
              <Card key={i} className="shadow-xl border-border">
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
    <StudentPageWrapper backgroundClass="bg-background" className="text-foreground">
      <div className="relative overflow-hidden min-h-screen">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-6 pb-16 relative z-10"
        >
          <div className="max-w-7xl mx-auto space-y-8">
            <motion.div variants={itemVariants}>
              <div className="pt-6 relative">
                <div className="flex items-center justify-between">
                  <h1 className="text-4xl font-bold text-foreground">
                    Student Dashboard
                  </h1>
                  <div className="flex items-center space-x-3">
                    <ThemeToggle className="text-foreground hover:bg-muted" />
                    <button
                      onClick={handleLogout}
                      className="p-2 hover:bg-muted rounded-lg transition-colors duration-200"
                      title="Sign out"
                    >
                      <img src={logoutIcon} alt="Logout" className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card id="dashboard-welcome" className="bg-gradient-to-br from-primary to-primary/80 border-primary/20 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-4xl lg:text-5xl font-bold text-white">
                        Welcome back, {profile?.full_name?.split(" ")[0]}!
                      </CardTitle>
                      <CardDescription className="text-white/90 text-xl">
                        Ready to continue your learning journey?
                      </CardDescription>
                    </div>
                    <div className="mt-6 lg:mt-0 flex items-center space-x-4">
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/20 font-semibold"
                      >
                        {getPackageDisplayName(profile?.package || "free")}
                      </Badge>
                      {profile?.package !== "gold" && (
                        <Button
                          variant="secondary"
                          className="bg-white text-primary hover:bg-white/90 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
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

            <motion.div variants={itemVariants}>
              <Card className="border-border shadow-lg bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <CardTitle className="text-2xl text-card-foreground font-bold">
                        My Learning Package
                      </CardTitle>
                      <div className="space-y-2">
                        <p className="text-card-foreground font-medium">
                          {getPackageProgress().used} of{" "}
                          {getPackageProgress().total} sessions used
                        </p>
                        <Progress
                          value={getPackageProgress().percentage}
                          className="w-64 h-2"
                        />
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/20 font-semibold"
                        >
                          {data.packageInfo?.display_name || "Free Package"}
                        </Badge>
                        <span className="text-card-foreground font-medium">
                          {data.packageInfo?.price_monthly
                            ? `${formatCurrency(
                                data.packageInfo.price_monthly
                              )}/month`
                            : "Free"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">
                        {Math.max(data.upcomingSessions.length, 0)}
                      </div>
                      <div className="text-card-foreground text-sm font-medium">
                        sessions remaining
                      </div>
                    </div>
                  </div>
                  <Button
                    className="mt-4 bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
                    onClick={() => navigate("/packages")}
                  >
                    <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                    Manage Package
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

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
                  description: "All time bookings",
                },
                {
                  name: "Hours Learned",
                  value: calculateHoursLearned(),
                  icon: ClockIcon,
                  description: "Estimated learning time",
                },
                {
                  name: "Tutors Worked With",
                  value: data.stats?.total_tutors || 0,
                  icon: UserGroupIcon,
                  description: "Unique tutors",
                },
                {
                  name: "This Month",
                  value: data.stats?.bookings_this_month || 0,
                  icon: TrendingUpIcon,
                  description: "Sessions booked",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.name}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-border shadow-lg hover:shadow-xl transition-all duration-300 group bg-card">
                    <CardHeader className="pb-2">
                      <div
                        className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200"
                      >
                        <stat.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-3xl font-bold text-card-foreground">
                        {stat.value}
                      </CardTitle>
                      <CardDescription className="text-base font-semibold text-card-foreground">
                        {stat.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-card-foreground font-medium">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div id="study-materials" variants={itemVariants} className="h-full">
                <Card className="border-border shadow-lg h-full min-h-[500px] bg-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center">
                          <BookOpenIcon className="w-4 h-4 text-primary" />
                        </div>
                        <CardTitle className="text-xl text-card-foreground">Study Materials</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="p-4 bg-primary/5 hover:bg-primary/10 rounded-lg text-center shadow-sm cursor-pointer transition-colors duration-200 border border-border"
                        onClick={() => navigate("/student/notes")}
                      >
                        <div className="bg-primary/20 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <DocumentTextIcon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-lg font-medium text-card-foreground">
                          {data.studyMaterials.filter((m) => (m as any).content).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Notes</p>
                      </div>
                      <div
                        className="p-4 bg-primary/5 hover:bg-primary/10 rounded-lg text-center shadow-sm cursor-pointer transition-colors duration-200 border border-border"
                        onClick={() => navigate("/student/flashcards")}
                      >
                        <div className="bg-primary/20 w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <BookOpenIcon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-lg font-medium text-card-foreground">
                          {data.availableFlashcards.length}
                        </p>
                        <p className="text-sm text-muted-foreground">Flashcards</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-border shadow-lg bg-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center">
                          <ClockIcon className="w-4 h-4 text-primary" />
                        </div>
                        <CardTitle className="text-xl text-card-foreground">Learning Activity</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary hover:bg-primary/10 font-medium"
                        onClick={() => navigate("/student/activity")}
                      >
                        View all
                        <ArrowRightIcon className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div id="recent-quizzes" className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-card-foreground">
                          Recent Quizzes
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary hover:bg-primary/10 font-medium"
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
                            className="flex items-center space-x-3 p-3 bg-secondary hover:bg-secondary/80 rounded-lg shadow-sm cursor-pointer transition-colors duration-200"
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
                              <p className="text-base font-semibold text-card-foreground truncate">
                                {quiz.title || "Untitled Quiz"}
                              </p>
                              <p className="text-sm text-card-foreground font-medium">
                                {(quiz as any).subject || "General"} •{" "}
                                {quiz.total_questions || 0} questions
                              </p>
                            </div>
                            <span className="text-sm text-primary font-semibold">
                              {(quiz as any).attempt_status === "completed"
                                ? "Completed"
                                : (quiz as any).attempt_status === "in_progress"
                                ? "In Progress"
                                : "Available"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-base text-card-foreground font-medium">
                          No recent quiz activity
                        </p>
                      )}
                    </div>

                    <div id="recent-quiz-results" className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-card-foreground">
                          Recent Quiz Results
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary hover:bg-primary/10 font-medium"
                          onClick={() => navigate("/student/quiz-results")}
                        >
                          View all results
                          <ArrowRightIcon className="w-4 h-4 ml-1" />
                        </Button>
                      </div>

                      {data.recentQuizAttempts.length > 0 ? (
                        data.recentQuizAttempts.map((attempt: any) => (
                          <div
                            key={attempt.id || attempt._id}
                            className="flex items-center space-x-3 p-3 bg-accent/10 hover:bg-accent/20 rounded-lg shadow-sm cursor-pointer transition-colors duration-200"
                            onClick={() => navigate(`/student/quiz-results/${attempt.id || attempt._id}`)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-card-foreground truncate">
                                {attempt.quiz_id?.title || "Quiz"}
                              </p>
                              <p className="text-sm text-card-foreground font-medium">
                                {attempt.quiz_id?.subject || "General"} •{" "}
                                {new Date(attempt.completed_at || attempt.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg text-card-foreground font-bold">
                                {attempt.score !== undefined && attempt.max_score !== undefined
                                  ? `${Math.round((attempt.score / attempt.max_score) * 100)}%`
                                  : "—"}
                              </div>
                              <div className="text-sm text-card-foreground font-medium">
                                {attempt.correct_answers || 0}/{attempt.total_questions || 0} correct
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-base text-card-foreground font-medium">
                          No completed quizzes yet
                        </p>
                      )}
                    </div>

                    <div id="upcoming-sessions" className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-card-foreground">
                          Upcoming Sessions
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary hover:bg-primary/10 font-medium"
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
                            className="flex items-center space-x-3 p-3 bg-secondary rounded-lg shadow-sm"
                        >
                            <div className="bg-primary/20 w-8 h-8 rounded-lg flex items-center justify-center">
                              <VideoCameraIcon className="w-4 h-4 text-primary" />
                          </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-card-foreground truncate">
                                {session.subject}
                              </p>
                              <p className="text-sm text-card-foreground font-medium truncate">
                                {session.tutor} • {session.time}
                              </p>
                        </div>
                      </div>
                        ))
                      ) : (
                        <p className="text-base text-card-foreground font-medium">No upcoming sessions</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div id="quick-actions" variants={itemVariants} className="mb-16">
              <Card className="border-border shadow-lg bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-card-foreground">
                    <div className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center">
                      <LightBulbIcon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xl">Quick Actions</span>
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
                          className="cursor-pointer border-border hover:shadow-xl transition-all duration-300 group bg-card"
                          onClick={action.action}
                        >
                          <CardContent className="p-6 text-center">
                            <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                              <action.icon className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-card-foreground mb-2">
                              {action.title}
                            </h3>
                            <p className="text-base text-muted-foreground mb-4">
                              {action.description}
                            </p>
                            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-base hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg">
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
      
      <TutorialPrompt />
      <TutorialOverlay />
    </StudentPageWrapper>
  );
};

export default StudentDashboard;
