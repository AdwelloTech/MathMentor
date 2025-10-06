import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  UsersIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentTextIcon,
  IdentificationIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  CloudArrowUpIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { useAdmin } from "@/contexts/AdminContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Mock data for UI (Phase 1 - No Backend)
const mockStats = {
  pendingApplications: 5,
  pendingIDVerifications: 3,
  totalStudents: 142,
  activeTutors: 28,
  totalQuizzes: 87,
  totalPDFs: 45,
  totalFlashcards: 156,
  recentSignups: 12,
};

const mockRecentActivity = {
  applications: [
    { id: 1, name: "John Doe", subject: "Mathematics", status: "pending", date: "2 hours ago" },
    { id: 2, name: "Jane Smith", subject: "Physics", status: "pending", date: "5 hours ago" },
    { id: 3, name: "Mike Johnson", subject: "Chemistry", status: "approved", date: "1 day ago" },
  ],
  verifications: [
    { id: 1, name: "Sarah Wilson", type: "Driver's License", status: "pending", date: "1 hour ago" },
    { id: 2, name: "Tom Brown", type: "Passport", status: "pending", date: "3 hours ago" },
    { id: 3, name: "Emily Davis", type: "ID Card", status: "approved", date: "6 hours ago" },
  ],
  students: [
    { id: 1, name: "Alex Thompson", grade: "Grade 10", package: "Gold", date: "30 mins ago" },
    { id: 2, name: "Lisa Chen", grade: "Grade 9", package: "Silver", date: "2 hours ago" },
    { id: 3, name: "David Lee", grade: "Grade 11", package: "Free", date: "4 hours ago" },
  ],
};

const AdminDashboard: React.FC = () => {
  const { adminSession, logoutAdmin } = useAdmin();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Stats configuration
  const statsCards = [
    {
      name: "Pending Applications",
      value: mockStats.pendingApplications,
      icon: ClockIcon,
      color: "bg-orange-600",
      description: "Tutor applications to review",
      change: "+2 today",
      changeType: "warning",
      link: "/admin/tutor-applications",
    },
    {
      name: "ID Verifications",
      value: mockStats.pendingIDVerifications,
      icon: IdentificationIcon,
      color: "bg-blue-600",
      description: "Pending verifications",
      change: "+1 today",
      changeType: "info",
      link: "/admin/id-verifications",
    },
    {
      name: "Total Students",
      value: mockStats.totalStudents,
      icon: UsersIcon,
      color: "bg-green-600",
      description: "Active students",
      change: `+${mockStats.recentSignups} this week`,
      changeType: "positive",
      link: "/admin/students",
    },
    {
      name: "Active Tutors",
      value: mockStats.activeTutors,
      icon: AcademicCapIcon,
      color: "bg-purple-600",
      description: "Approved tutors",
      change: "+3 this month",
      changeType: "positive",
      link: "/admin/tutors",
    },
    {
      name: "Total Quizzes",
      value: mockStats.totalQuizzes,
      icon: DocumentTextIcon,
      color: "bg-yellow-600",
      description: "Available quizzes",
      change: "+5 this week",
      changeType: "positive",
      link: "/admin/quizzes",
    },
    {
      name: "Quiz PDFs",
      value: mockStats.totalPDFs,
      icon: CloudArrowUpIcon,
      color: "bg-indigo-600",
      description: "Uploaded materials",
      change: "+2 this week",
      changeType: "positive",
      link: "/admin/quiz-pdfs",
    },
    {
      name: "Flashcard Sets",
      value: mockStats.totalFlashcards,
      icon: BookOpenIcon,
      color: "bg-pink-600",
      description: "Total flashcard sets",
      change: "+8 this week",
      changeType: "positive",
      link: "/admin/flashcards",
    },
    {
      name: "Recent Sign-ups",
      value: mockStats.recentSignups,
      icon: UserGroupIcon,
      color: "bg-teal-600",
      description: "Last 7 days",
      change: "+4 from last week",
      changeType: "positive",
      link: "/admin/students",
    },
  ];

  // Management sections
  const managementSections = [
    {
      title: "Tutor Management",
      description: "Manage tutor applications and verifications",
      icon: AcademicCapIcon,
      color: "from-green-600 to-green-700",
      actions: [
        { label: "Review Applications", count: mockStats.pendingApplications, link: "/admin/tutor-applications" },
        { label: "ID Verifications", count: mockStats.pendingIDVerifications, link: "/admin/id-verifications" },
        { label: "Manage Tutors", count: mockStats.activeTutors, link: "/admin/tutors" },
      ],
    },
    {
      title: "Student Management",
      description: "View and manage student accounts",
      icon: UsersIcon,
      color: "from-blue-600 to-blue-700",
      actions: [
        { label: "All Students", count: mockStats.totalStudents, link: "/admin/students" },
        { label: "Recent Sign-ups", count: mockStats.recentSignups, link: "/admin/students?filter=recent" },
        { label: "Package Management", count: null, link: "/packages" },
      ],
    },
    {
      title: "Content Management",
      description: "Manage educational content",
      icon: DocumentTextIcon,
      color: "from-purple-600 to-purple-700",
      actions: [
        { label: "Upload Quiz PDFs", count: mockStats.totalPDFs, link: "/admin/quiz-pdfs" },
        { label: "Manage Quizzes", count: mockStats.totalQuizzes, link: "/admin/quizzes" },
        { label: "Flashcard Sets", count: mockStats.totalFlashcards, link: "/admin/flashcards" },
      ],
    },
    {
      title: "System Settings",
      description: "Configure system parameters",
      icon: Cog6ToothIcon,
      color: "from-gray-600 to-gray-700",
      actions: [
        { label: "Manage Subjects", count: null, link: "/admin/subjects" },
        { label: "Grade Levels", count: null, link: "/admin/grade-levels" },
        { label: "System Config", count: null, link: "/admin/settings" },
      ],
    },
  ];

  // Quick actions
  const quickActions = [
    {
      title: "Review Applications",
      description: "Check tutor applications",
      icon: CheckCircleIcon,
      link: "/admin/tutor-applications",
      badge: mockStats.pendingApplications,
    },
    {
      title: "Verify IDs",
      description: "Process ID verifications",
      icon: IdentificationIcon,
      link: "/admin/id-verifications",
      badge: mockStats.pendingIDVerifications,
    },
    {
      title: "Upload Quiz PDF",
      description: "Add new quiz materials",
      icon: CloudArrowUpIcon,
      link: "/admin/quiz-pdfs",
      badge: null,
    },
    {
      title: "Manage Students",
      description: "View student accounts",
      icon: UsersIcon,
      link: "/admin/students",
      badge: null,
    },
    {
      title: "Create Flashcards",
      description: "Add flashcard sets",
      icon: BookOpenIcon,
      link: "/admin/flashcards",
      badge: null,
    },
    {
      title: "Manage Tutors",
      description: "View active tutors",
      icon: AcademicCapIcon,
      link: "/admin/tutors",
      badge: null,
    },
    {
      title: "View Reports",
      description: "Analytics and insights",
      icon: ChartBarIcon,
      link: "/admin/reports",
      badge: null,
    },
    {
      title: "System Settings",
      description: "Configure platform",
      icon: Cog6ToothIcon,
      link: "/admin/settings",
      badge: null,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)]" />
        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
        </div>
      </div>
    );
  }

  // State and hooks are already declared at the top of the component

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)]"></div>

      {/* Floating decorative elements - using the color palette from ADMIN_DASHBOARD_PLAN.md */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-600/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-green-600/10 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 pb-16 relative z-10"
      >
        <div className="space-y-8">
          {/* Header */}
          <motion.div variants={itemVariants} className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-[#16803D] rounded-xl shadow-sm">
                    <ShieldCheckIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-[#FBBF24]">Admin Dashboard</h1>
                    <p className="mt-1 text-lg text-slate-300">
                      Welcome back, {adminSession?.profile?.full_name || "Admin"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-[#16803D] text-[#34A853] hover:bg-green-50/10"
                  onClick={() => navigate("/admin/reports")}
                >
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  View Reports
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="relative"
                    onClick={() => navigate("/admin/notifications")}
                  >
                    <BellAlertIcon className="w-6 h-6 text-slate-300" />
                    {(mockStats.pendingApplications + mockStats.pendingIDVerifications) > 0 && (
                      <span className="absolute top-1 right-1 w-3 h-3 bg-[#EA580C] rounded-full"></span>
                    )}
                  </Button>
                </div>
                <ThemeToggle className="text-slate-300 hover:bg-slate-700/50" />
                <Button
                  variant="outline"
                  size="lg"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={async () => {
                    await logoutAdmin();
                    navigate("/admin-login");
                  }}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Urgent Actions Alert */}
          {(mockStats.pendingApplications > 0 || mockStats.pendingIDVerifications > 0) && (
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-r from-[#EA580C]/20 to-[#FBBF24]/20 border-[#EA580C]/30 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <BellAlertIcon className="h-6 w-6 text-[#FBBF24]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#FCD34D]">
                        Action Required: {mockStats.pendingApplications} tutor applications and{" "}
                        {mockStats.pendingIDVerifications} ID verifications awaiting review
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#EA580C] hover:bg-[#EA580C]/80 text-white"
                      onClick={() => navigate("/admin/tutor-applications")}
                    >
                      Review Now
                    </Button>
          </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {statsCards.map((stat, index) => (
              <motion.div
                key={stat.name}
                variants={itemVariants}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => navigate(stat.link)}
              >
                <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-[0_2px_2px_0_#16803D] h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                      >
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium text-slate-400 mb-1">
                          {stat.name}
                        </CardTitle>
                        <div className="text-3xl font-bold text-white">{stat.value}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-slate-400 mb-2">{stat.description}</p>
                    <div
                      className={`text-sm font-semibold ${
                            stat.changeType === "positive"
                              ? "text-green-600"
                          : stat.changeType === "warning"
                          ? "text-orange-600"
                          : "text-blue-600"
                          }`}
                        >
                          {stat.change}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Management Sections Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {managementSections.map((section) => (
              <Card
                key={section.title}
                className="shadow-[0_2px_2px_0_#34A853] border-0 hover:shadow-xl transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`bg-gradient-to-r ${section.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {section.actions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => navigate(action.link)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/50 transition-colors duration-200 group"
                      >
                        <span className="text-sm font-medium text-slate-300 group-hover:text-white">
                          {action.label}
                        </span>
                        <div className="flex items-center space-x-2">
                          {action.count !== null && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              {action.count}
                            </Badge>
                          )}
                          <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <Card className="shadow-[0_2px_2px_0_#34A853] border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white">Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action) => (
                    <motion.div
                      key={action.title}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-slate-600/30 backdrop-blur-sm relative"
                        onClick={() => navigate(action.link)}
                      >
                        <CardContent className="p-5 text-center">
                          {action.badge !== null && action.badge > 0 && (
                            <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                              {action.badge}
                            </Badge>
                          )}
                          <div className="bg-gradient-to-r from-green-600 to-green-700 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                            <action.icon className="w-6 h-6 text-white" />
                                </div>
                            <h3 className="font-semibold text-white mb-1">{action.title}</h3>
                          <p className="text-xs text-slate-400">{action.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Applications */}
            <Card className="shadow-[0_2px_2px_0_#34A853] border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Recent Applications</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin/tutor-applications")}
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockRecentActivity.applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/admin/tutor-applications")}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{app.name}</p>
                        <p className="text-xs text-slate-400">{app.subject}</p>
                    </div>
                      <div className="text-right">
                        <Badge
                          variant={app.status === "approved" ? "default" : "secondary"}
                          className={
                            app.status === "approved"
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                          }
                        >
                          {app.status}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">{app.date}</p>
                      </div>
                    </div>
                  ))}
                        </div>
              </CardContent>
            </Card>

            {/* Recent ID Verifications */}
            <Card className="shadow-[0_2px_2px_0_#34A853] border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">ID Verifications</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin/id-verifications")}
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockRecentActivity.verifications.map((ver) => (
                    <div
                      key={ver.id}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/admin/id-verifications")}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{ver.name}</p>
                        <p className="text-xs text-slate-400">{ver.type}</p>
                        </div>
                      <div className="text-right">
                        <Badge
                          variant={ver.status === "approved" ? "default" : "secondary"}
                          className={
                            ver.status === "approved"
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }
                        >
                          {ver.status}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">{ver.date}</p>
                      </div>
                    </div>
                              ))}
                            </div>
              </CardContent>
            </Card>

            {/* Recent Student Sign-ups */}
            <Card className="shadow-[0_2px_2px_0_#34A853] border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">New Students</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin/students")}
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockRecentActivity.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                      onClick={() => navigate("/admin/students")}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{student.name}</p>
                        <p className="text-xs text-slate-400">{student.grade}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="secondary"
                          className={
                            student.package === "Gold"
                              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              : student.package === "Silver"
                              ? "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                              : "bg-green-500/20 text-green-300 border border-green-500/30"
                          }
                        >
                          {student.package}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">{student.date}</p>
                      </div>
                    </div>
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

export default AdminDashboard;
