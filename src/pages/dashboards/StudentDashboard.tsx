import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  VideoCameraIcon,
  LockClosedIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  HeartIcon,
  SparklesIcon,
  ArrowRightIcon,
  PlayIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  FireIcon,
  TrophyIcon,
  GiftIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { getPackageDisplayName, getPackageFeatures } from "@/utils/permissions";

const StudentDashboard: React.FC = () => {
  const { profile, canAccess } = useAuth();
  const navigate = useNavigate();
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");

  // Mock data for tutors
  const tutors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      specialization: "Mathematics",
      rating: 4.9,
      students: 127,
      online: true,
      price: "$25",
      subjects: ["Algebra", "Calculus", "Geometry"],
      experience: "8 years",
      languages: ["English", "Spanish"],
    },
    {
      id: 2,
      name: "Prof. Michael Chen",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      specialization: "Physics",
      rating: 4.8,
      students: 89,
      online: true,
      price: "$30",
      subjects: ["Mechanics", "Thermodynamics", "Quantum Physics"],
      experience: "12 years",
      languages: ["English", "Mandarin"],
    },
    {
      id: 3,
      name: "Ms. Emily Rodriguez",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      specialization: "Learning Disabilities Support",
      rating: 4.9,
      students: 203,
      online: true,
      price: "$35",
      subjects: ["Dyslexia Support", "ADHD Strategies", "Math Anxiety"],
      experience: "6 years",
      languages: ["English", "Spanish"],
    },
    {
      id: 4,
      name: "Dr. James Wilson",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      specialization: "Chemistry",
      rating: 4.7,
      students: 156,
      online: false,
      price: "$28",
      subjects: ["Organic Chemistry", "Inorganic Chemistry", "Biochemistry"],
      experience: "10 years",
      languages: ["English"],
    },
  ];

  const specializations = [
    { value: "all", label: "All Subjects" },
    { value: "mathematics", label: "Mathematics" },
    { value: "physics", label: "Physics" },
    { value: "chemistry", label: "Chemistry" },
    { value: "learning-disabilities", label: "Learning Disabilities Support" },
    { value: "biology", label: "Biology" },
    { value: "computer-science", label: "Computer Science" },
  ];

  const upcomingSessions = [
    {
      id: 1,
      tutor: "Dr. Sarah Johnson",
      subject: "Calculus",
      time: "Today, 2:00 PM",
      duration: "60 min",
      type: "One-to-One",
    },
    {
      id: 2,
      tutor: "Prof. Michael Chen",
      subject: "Physics",
      time: "Tomorrow, 10:00 AM",
      duration: "45 min",
      type: "Group Session",
    },
  ];

  const packageInfo = {
    name: profile?.package || "free",
    sessionsRemaining: 5,
    totalSessions: 10,
    expiresIn: "15 days",
  };

  const filteredTutors =
    selectedSpecialization === "all"
      ? tutors
      : tutors.filter((tutor) =>
          tutor.specialization
            .toLowerCase()
            .includes(selectedSpecialization.replace("-", " "))
        );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white"
          variants={itemVariants}
        >
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative px-6 py-8 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <motion.h1
                  className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  Welcome back, {profile?.full_name?.split(" ")[0]}!
                  <span className="inline-block bounce-cute">👋</span>
                </motion.h1>
                <motion.p
                  className="text-blue-100 text-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  Ready to continue your learning journey?
                </motion.p>
              </div>
              <motion.div
                className="mt-6 lg:mt-0 flex items-center space-x-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-full px-4 py-2">
                  <span className="text-sm font-medium">
                    {getPackageDisplayName(profile?.package || "free")}
                  </span>
                </div>
                {profile?.package !== "gold" && (
                  <motion.button
                    className="bg-white text-blue-600 px-4 py-2 rounded-full font-medium hover:bg-blue-50 transition-colors duration-200 flex items-center space-x-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <SparklesIcon className="w-4 h-4" />
                    <span>Upgrade</span>
                  </motion.button>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="px-6 py-8 lg:px-8 space-y-8">
          {/* Package Status Card */}
          <motion.div
            className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl float sparkle"
            variants={itemVariants}
            whileHover={{ scale: 1.02, rotateY: 2 }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">My Current Package</h3>
                <p className="text-emerald-100">
                  {packageInfo.sessionsRemaining} of {packageInfo.totalSessions}{" "}
                  sessions remaining
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    Expires in {packageInfo.expiresIn}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {packageInfo.sessionsRemaining}
                </div>
                <div className="text-emerald-100 text-sm">sessions left</div>
              </div>
            </div>
            <motion.button
              className="mt-4 bg-white text-emerald-600 px-6 py-3 rounded-xl font-medium hover:bg-emerald-50 transition-colors duration-200 flex items-center space-x-2 heartbeat"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CurrencyDollarIcon className="w-5 h-5" />
              <span>Buy More Sessions</span>
            </motion.button>
          </motion.div>

          {/* Find a Tutor Section */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                  <AcademicCapIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Find a Tutor Now
                  </h2>
                  <p className="text-gray-600">
                    Book a 15-minute session with expert tutors
                  </p>
                </div>
              </div>
              <div className="relative">
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {specializations.map((spec) => (
                    <option key={spec.value} value={spec.value}>
                      {spec.label}
                    </option>
                  ))}
                </select>
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredTutors.map((tutor, index) => (
                  <motion.div
                    key={tutor.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group card-3d"
                    whileHover={{ y: -8, scale: 1.02, rotateY: 3 }}
                  >
                    <div className="relative">
                      <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 relative overflow-hidden">
                        <img
                          src={tutor.avatar}
                          alt={tutor.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        {tutor.online && (
                          <div className="absolute top-3 right-3 bg-green-500 w-3 h-3 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <h3 className="text-white font-semibold text-lg">
                          {tutor.name}
                        </h3>
                        <p className="text-blue-100 text-sm">
                          {tutor.specialization}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">
                            {tutor.rating}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          {tutor.price}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex items-center space-x-2">
                          <UserGroupIcon className="w-3 h-3" />
                          <span>{tutor.students} students</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-3 h-3" />
                          <span>{tutor.experience} experience</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {tutor.subjects.slice(0, 2).map((subject, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>

                      <motion.button
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center space-x-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <PlayIcon className="w-4 h-4" />
                        <span>Book 15-min Session</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Quick Actions Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group float"
              whileHover={{ y: -5, scale: 1.02, rotateY: 2 }}
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <CalendarDaysIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                My Upcoming Sessions
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                View and manage your scheduled lessons
              </p>
              <div className="flex items-center text-blue-600 font-medium text-sm">
                <span>View all</span>
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group float float-delay-1"
              whileHover={{ y: -5, scale: 1.02, rotateY: 2 }}
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                My Past Sessions
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Review your completed lessons and notes
              </p>
              <div className="flex items-center text-green-600 font-medium text-sm">
                <span>View all</span>
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group float float-delay-2"
              whileHover={{ y: -5, scale: 1.02, rotateY: 2 }}
              onClick={() => navigate("/student/notes")}
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <BookOpenIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                My Notes
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Access your study materials and notes
              </p>
              <div className="flex items-center text-purple-600 font-medium text-sm">
                <span>View all</span>
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group float"
              whileHover={{ y: -5, scale: 1.02, rotateY: 2 }}
            >
              <div className="bg-gradient-to-r from-orange-500 to-red-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Book Consultation
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Schedule a detailed consultation session
              </p>
              <div className="flex items-center text-orange-600 font-medium text-sm">
                <span>Book now</span>
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </motion.div>
          </motion.div>

          {/* Upcoming Sessions */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <CalendarDaysIcon className="w-6 h-6" />
                <span>My Upcoming Sessions</span>
              </h3>
            </div>
            <div className="p-6">
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center">
                          <VideoCameraIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {session.subject}
                          </h4>
                          <p className="text-sm text-gray-600">
                            with {session.tutor}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {session.time}
                        </p>
                        <p className="text-sm text-gray-600">
                          {session.duration}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarDaysIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No upcoming sessions
                  </h4>
                  <p className="text-gray-600">
                    Book your first session with a tutor to get started!
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                name: "Total Sessions",
                value: "24",
                icon: VideoCameraIcon,
                color: "from-blue-500 to-blue-600",
              },
              {
                name: "Hours Learned",
                value: "36",
                icon: ClockIcon,
                color: "from-green-500 to-emerald-600",
              },
              {
                name: "Tutors Worked With",
                value: "8",
                icon: UserGroupIcon,
                color: "from-purple-500 to-pink-600",
              },
              {
                name: "Average Rating",
                value: "4.8",
                icon: StarIcon,
                color: "from-yellow-500 to-orange-600",
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.name}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 float"
                whileHover={{ y: -5, scale: 1.02, rotateY: 2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`bg-gradient-to-r ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}
                >
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </h3>
                <p className="text-gray-600 text-sm">{stat.name}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Achievement Section */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl overflow-hidden relative"
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <motion.div
                    className="bg-white bg-opacity-20 p-3 rounded-xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <TrophyIcon className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold">Recent Achievements</h3>
                    <p className="text-yellow-100">Keep up the great work!</p>
                  </div>
                </div>
                <motion.div
                  className="text-right"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="text-3xl font-bold">🎉</div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Perfect Week",
                    desc: "7 days of consistent learning",
                    icon: "⭐",
                    color: "bg-yellow-500",
                  },
                  {
                    title: "Math Master",
                    desc: "Completed Algebra module",
                    icon: "🏆",
                    color: "bg-orange-500",
                  },
                  {
                    title: "Quick Learner",
                    desc: "5 sessions this week",
                    icon: "🚀",
                    color: "bg-red-500",
                  },
                ].map((achievement, index) => (
                  <motion.div
                    key={achievement.title}
                    className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <h4 className="font-semibold mb-1">{achievement.title}</h4>
                    <p className="text-sm text-yellow-100">
                      {achievement.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick Tips Section */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="bg-white bg-opacity-20 p-3 rounded-xl"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <GiftIcon className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold">Today's Learning Tip</h3>
                  <p className="text-blue-100">Boost your productivity!</p>
                </div>
              </div>
            </div>

            <motion.div
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-sm">
                💡 <strong>Pro Tip:</strong> Take short breaks between study
                sessions to maintain focus and retention. The Pomodoro Technique
                (25 minutes study + 5 minutes break) can significantly improve
                your learning efficiency!
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentDashboard;
