import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  ClockIcon,
  AcademicCapIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { quizService } from "@/lib/quizService";
import { getNoteSubjects } from "@/lib/notes";
import type { Quiz } from "@/types/quiz";
import toast from "react-hot-toast";

type NoteSubject = {
  id: string;
  name: string;
  display_name: string;
  color: string;
};

const StudentQuizDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<NoteSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("Loading quizzes for user:", user!.id);

      const [quizzesData, subjectsData] = await Promise.all([
        quizService.studentQuizzes.getAvailableQuizzes(user!.id),
        getNoteSubjects(),
      ]);

      console.log("Quizzes loaded:", quizzesData);
      console.log("Subjects loaded:", subjectsData);

      setAllQuizzes(quizzesData);
      setQuizzes(quizzesData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  // Real-time filtering effect
  useEffect(() => {
    const filterQuizzes = () => {
      let filtered = [...allQuizzes];

      // Filter by search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(
          (quiz) =>
            quiz.title?.toLowerCase().includes(term) ||
            quiz.description?.toLowerCase().includes(term) ||
            quiz.subject?.toLowerCase().includes(term) ||
            quiz.tutor?.full_name?.toLowerCase().includes(term)
        );
      }

      // Filter by subject
      if (selectedSubject) {
        filtered = filtered.filter((quiz) => quiz.subject === selectedSubject);
      }

      setQuizzes(filtered);
    };

    filterQuizzes();
  }, [searchTerm, selectedSubject, allQuizzes]);

  const handleStartQuiz = async (quizId: string) => {
    try {
      // Check if quiz is already completed
      const quiz = allQuizzes.find((q) => q.id === quizId);
      if (quiz?.attempt_status === "completed") {
        toast.error("You have already completed this quiz");
        return;
      }

      // Start the quiz attempt
      const attempt = await quizService.studentQuizzes.startQuizAttempt(
        quizId,
        user!.id
      );

      // Navigate to the quiz taking page
      navigate(`/student/take-quiz/${attempt.id}`);
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast.error("Failed to start quiz");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSubject("");
  };

  const hasActiveFilters = searchTerm.trim() || selectedSubject;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Study</h1>
              <p className="text-gray-600">
                Quizzes and flash cards from your tutors
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.name}>
                    {subject.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Showing filtered results
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Available Quizzes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {quizzes.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <AcademicCapIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Subjects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(quizzes.map((q) => q.subject)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Avg Time Limit
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {quizzes.length > 0
                    ? Math.round(
                        quizzes.reduce(
                          (sum, q) => sum + q.time_limit_minutes,
                          0
                        ) / quizzes.length
                      )
                    : 0}{" "}
                  min
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quizzes List */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {quizzes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No quizzes available
              </h3>
              <p className="text-gray-600 mb-6">
                {allQuizzes.length === 0
                  ? "You haven't booked any sessions with tutors yet. Book a session to access their quizzes!"
                  : "No quizzes match your search criteria. Try adjusting your filters."}
              </p>
              {allQuizzes.length === 0 && (
                <button
                  onClick={() => navigate("/student/book-session")}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Book Your First Session
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                          {quiz.title}
                        </h3>
                        {quiz.description && (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                            {quiz.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quiz Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <AcademicCapIcon className="h-4 w-4 mr-2" />
                        <span>{quiz.tutor?.full_name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpenIcon className="h-4 w-4 mr-2" />
                        <span>{quiz.subject}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>{quiz.time_limit_minutes} minutes</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        <span>{quiz.total_questions} questions</span>
                      </div>
                    </div>

                    {/* Quiz Action Button */}
                    {quiz.attempt_status === "completed" ? (
                      <div className="space-y-2">
                        <div className="text-center text-sm text-gray-600">
                          {quiz.attempt_correct_answers}/
                          {quiz.attempt_total_questions} Questions Correct (
                          {Math.round(
                            ((quiz.attempt_score || 0) /
                              (quiz.attempt_max_score || 1)) *
                              100
                          )}
                          %)
                        </div>
                        {quiz.attempt_tutor_feedback ? (
                          <div className="text-center text-xs font-medium text-green-700 bg-green-100 py-1 rounded">
                            Feedback received
                          </div>
                        ) : (
                          <div className="text-center text-xs font-medium text-orange-700 bg-orange-100 py-1 rounded">
                            Feedback pending
                          </div>
                        )}
                        <button
                          onClick={() =>
                            navigate(`/student/quiz-results/${quiz.attempt_id}`)
                          }
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          View Results
                        </button>
                      </div>
                    ) : quiz.attempt_status === "in_progress" ? (
                      <button
                        onClick={() =>
                          navigate(`/student/take-quiz/${quiz.attempt_id}`)
                        }
                        className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center justify-center"
                      >
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Continue Quiz
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartQuiz(quiz.id)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                      >
                        <PlayIcon className="h-4 w-4 mr-2" />
                        Start Quiz
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StudentQuizDashboard;
