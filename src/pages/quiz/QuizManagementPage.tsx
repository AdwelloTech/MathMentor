import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { quizService } from "@/lib/quizService";
import type { Quiz, QuizStats } from "@/types/quiz";
import toast from "react-hot-toast";
import { getGradeLevelDisplayName } from "@/lib/gradeLevels";

const QuizManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingQuiz, setDeletingQuiz] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      loadQuizzes();
      loadStats();
    }
  }, [profile]);

  const loadQuizzes = async () => {
    try {
      const data = await quizService.quizzes.getByTutorId(profile!.id);
      setQuizzes(data);
    } catch (error) {
      console.error("Error loading quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await quizService.stats.getTutorStats(profile!.id);
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingQuiz(quizId);
    try {
      await quizService.quizzes.delete(quizId);
      setQuizzes(quizzes.filter((quiz) => quiz.id !== quizId));
      loadStats();
      toast.success("Quiz deleted successfully!");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz. Please try again.");
    } finally {
      setDeletingQuiz(null);
    }
  };

  const handleToggleActive = async (quiz: Quiz) => {
    try {
      await quizService.quizzes.update(quiz.id, { is_active: !quiz.is_active });
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quiz.id ? { ...q, is_active: !q.is_active } : q))
      );
      loadStats();
      toast.success("Quiz status updated successfully!");
    } catch (error) {
      console.error("Error updating quiz:", error);
      toast.error("Failed to update quiz status. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#D5FFC5] relative overflow-hidden">
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Quiz Management
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create and manage quizzes with up to 40 questions for your students
          </p>
        </motion.div>

        {/* Create Quiz Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/create-quiz")}
            className="bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white px-8 py-3 rounded-xl font-semibold shadow-[0_2px_2px_0_#16803D] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Quiz
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white p-6 rounded-xl shadow-[0_2px_2px_0_#16803D] border-0 transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
            >
              <div className="flex items-center">
                <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Quizzes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_quizzes}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white p-6 rounded-xl shadow-[0_2px_2px_0_#16803D] border-0 transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
            >
              <div className="flex items-center">
                <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Quizzes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.active_quizzes}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white p-6 rounded-xl shadow-[0_2px_2px_0_#16803D] border-0 transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
            >
              <div className="flex items-center">
                <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                  <AcademicCapIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Attempts
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_attempts}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white p-6 rounded-xl shadow-[0_2px_2px_0_#16803D] border-0 transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
            >
              <div className="flex items-center">
                <div className="bg-yellow-100 w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                  <ChartBarIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.average_score}%
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white p-6 rounded-xl shadow-[0_2px_2px_0_#16803D] border-0 transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
            >
              <div className="flex items-center">
                <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                  <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_students}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Quizzes List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-[0_2px_2px_0_#16803D] border-0"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-4 h-4 text-white" />
              </div>
              <span>Your Quizzes</span>
            </h2>
          </div>

          {quizzes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DocumentTextIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No quizzes yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first quiz to start assessing your students'
                knowledge.
              </p>
              <button
                onClick={() => navigate("/create-quiz")}
                className="bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white px-6 py-2 rounded-xl font-semibold shadow-[0_2px_2px_0_#16803D] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 inline-flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Your First Quiz
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quiz Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject & Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questions & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-gray-50 transition-colors">
                      {/* Quiz Details */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {quiz.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {quiz.description || "No description"}
                          </div>
                        </div>
                      </td>

                      {/* Subject & Grade */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{quiz.subject}</div>
                        <div className="text-sm text-gray-500">
                          {getGradeLevelDisplayName(quiz.grade_level)}
                        </div>
                      </td>

                      {/* Questions & Time */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {quiz.total_questions} questions • {quiz.total_points} points
                        </div>
                        <div className="text-sm text-gray-500">
                          {quiz.time_limit_minutes} minutes
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            quiz.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {quiz.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/quiz/${quiz.id}`)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="View Quiz"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/quiz/${quiz.id}/responses`)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                            title="View Responses"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/edit-quiz/${quiz.id}`)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50 transition-colors"
                            title="Edit Quiz"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(quiz)}
                            className={`p-1 rounded-md transition-colors ${
                              quiz.is_active
                                ? "text-red-600 hover:text-red-900 hover:bg-red-50"
                                : "text-green-600 hover:text-green-900 hover:bg-green-50"
                            }`}
                            title={quiz.is_active ? "Deactivate Quiz" : "Activate Quiz"}
                          >
                            {quiz.is_active ? (
                              <XCircleIcon className="h-4 w-4" />
                            ) : (
                              <CheckCircleIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            disabled={deletingQuiz === quiz.id}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded-md transition-colors disabled:opacity-50"
                            title="Delete Quiz"
                          >
                            {deletingQuiz === quiz.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default QuizManagementPage;
