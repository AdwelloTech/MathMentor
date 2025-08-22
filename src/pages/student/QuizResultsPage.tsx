import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  CalendarIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { quizService } from "@/lib/quizService";
import type { QuizAttempt, Question, StudentAnswer } from "@/types/quiz";
import toast from "react-hot-toast";

const QuizResultsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId: string }>();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<{
    attempt: QuizAttempt;
    studentAnswers: StudentAnswer[];
    questions: Question[];
  } | null>(null);

  useEffect(() => {
    if (user) {
      if (attemptId) {
        // Load specific attempt details
        loadAttemptDetails(attemptId);
      } else {
        // Load all attempts
        loadAttempts();
      }
    }
  }, [user, attemptId]);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      const attemptsData = await quizService.studentQuizzes.getStudentAttempts(
        user!.id
      );
      setAttempts(attemptsData);
    } catch (error) {
      console.error("Error loading attempts:", error);
      toast.error("Failed to load quiz attempts");
    } finally {
      setLoading(false);
    }
  };

  const loadAttemptDetails = async (attemptId: string) => {
    try {
      setLoading(true);
      console.log("Loading attempt details for ID:", attemptId);

      const details = await quizService.studentQuizzes.getAttemptDetails(
        attemptId
      );

      console.log("Attempt details loaded:", details);
      setSelectedAttempt(details);
    } catch (error) {
      console.error("Error loading attempt details:", error);

      // Check if it's a "not found" error
      if (error instanceof Error && error.message.includes("not found")) {
        toast.error("Quiz attempt not found. It may have been deleted.");
      } else {
        toast.error("Failed to load attempt details. Please try again.");
      }

      // Navigate back to quiz dashboard if attempt not found
      setTimeout(() => {
        navigate("/student/quizzes");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-100";
    if (percentage >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {!selectedAttempt && !attemptId && (
              <button
                onClick={() => navigate("/student/quizzes")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quiz Results</h1>
              <p className="text-gray-600">
                Review your quiz attempts and performance
              </p>
            </div>
          </div>
        </div>

        {!selectedAttempt && !attemptId ? (
          /* Attempts List */
          <div className="space-y-6">
            {attempts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No quiz attempts yet
                </h3>
                <p className="text-gray-600 mb-6">
                  You haven't taken any quizzes yet. Start by taking a quiz from
                  your available quizzes.
                </p>
                <button
                  onClick={() => navigate("/student/quizzes")}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Take a Quiz
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attempts.map((attempt, index) => {
                  const percentage =
                    attempt.max_score && attempt.score
                      ? Math.round((attempt.score / attempt.max_score) * 100)
                      : 0;

                  return (
                    <motion.div
                      key={attempt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => loadAttemptDetails(attempt.id)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                              {attempt.quiz?.title || "Untitled Quiz"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              by {attempt.quiz?.tutor?.full_name}
                            </p>
                          </div>
                        </div>

                        {/* Score Display */}
                        <div
                          className={`rounded-lg p-4 mb-4 ${getScoreBgColor(
                            percentage
                          )}`}
                        >
                          <div className="text-center">
                            <div
                              className={`text-2xl font-bold ${getScoreColor(
                                percentage
                              )}`}
                            >
                              {attempt.correct_answers || 0}/
                              {attempt.total_questions || 0}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Questions Correct
                            </div>
                            <div
                              className={`text-lg font-medium ${getScoreColor(
                                percentage
                              )}`}
                            >
                              {percentage}%
                            </div>
                          </div>
                        </div>

                        {/* Attempt Details */}
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            <span>{formatDate(attempt.created_at)}</span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            <span>
                              {attempt.completed_at
                                ? `Completed in ${Math.round(
                                    (new Date(attempt.completed_at).getTime() -
                                      new Date(attempt.started_at).getTime()) /
                                      1000 /
                                      60
                                  )} minutes`
                                : "In progress"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <AcademicCapIcon className="h-4 w-4 mr-2" />
                            <span>{attempt.quiz?.subject}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => loadAttemptDetails(attempt.id)}
                          className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Detailed Results View */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Back Button */}
            <button
              onClick={() => {
                if (attemptId) {
                  navigate("/student/quizzes");
                } else {
                  setSelectedAttempt(null);
                }
              }}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              {attemptId ? "Back to Quizzes" : "Back to Results"}
            </button>

            {/* Quiz Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedAttempt.attempt.quiz?.title}
                  </h2>
                  <p className="text-gray-600">
                    by {selectedAttempt.attempt.quiz?.tutor?.full_name}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedAttempt.attempt.correct_answers || 0}/
                    {selectedAttempt.attempt.total_questions || 0}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Questions Correct
                  </div>
                  <div className="text-lg text-gray-600">
                    {selectedAttempt.attempt.max_score &&
                    selectedAttempt.attempt.score
                      ? Math.round(
                          (selectedAttempt.attempt.score /
                            selectedAttempt.attempt.max_score) *
                            100
                        )
                      : 0}
                    %
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>
                    Started: {formatDate(selectedAttempt.attempt.started_at)}
                  </span>
                </div>
                {selectedAttempt.attempt.completed_at && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>
                      Completed:{" "}
                      {formatDate(selectedAttempt.attempt.completed_at)}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  <span>{selectedAttempt.attempt.quiz?.subject}</span>
                </div>
              </div>
            </div>

            {/* Tutor Feedback */}
            {selectedAttempt?.attempt?.tutor_feedback && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Tutor Feedback
                </h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {selectedAttempt.attempt.tutor_feedback}
                </p>
              </div>
            )}

            {/* Question-by-Question Review */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Question Review
              </h3>

              {selectedAttempt.questions.map((question, index) => {
                const studentAnswer = selectedAttempt.studentAnswers.find(
                  (sa) => sa.question_id === question.id
                );
                const correctAnswer = question.answers?.find(
                  (a) => a.is_correct
                );
                const isCorrect = studentAnswer?.is_correct;

                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-sm border p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        Question {index + 1}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {studentAnswer?.points_earned || 0}/{question.points}{" "}
                          points
                        </span>
                        {isCorrect ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>

                    <p className="text-gray-900 mb-4">
                      {question.question_text}
                    </p>

                    {question.question_type === "multiple_choice" ||
                    question.question_type === "true_false" ? (
                      <div className="space-y-2">
                        {question.answers?.map((answer) => {
                          const isSelected =
                            studentAnswer?.selected_answer_id === answer.id;
                          const isCorrectAnswer = answer.is_correct;

                          let bgColor = "bg-gray-50";
                          let borderColor = "border-gray-200";

                          if (isCorrectAnswer) {
                            bgColor = "bg-green-50";
                            borderColor = "border-green-200";
                          } else if (isSelected && !isCorrectAnswer) {
                            bgColor = "bg-red-50";
                            borderColor = "border-red-200";
                          }

                          return (
                            <div
                              key={answer.id}
                              className={`p-3 rounded-lg border ${bgColor} ${borderColor} flex items-center`}
                            >
                              {isCorrectAnswer && (
                                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                              )}
                              {isSelected && !isCorrectAnswer && (
                                <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
                              )}
                              <span className="text-gray-900">
                                {answer.answer_text}
                              </span>
                              {isSelected && (
                                <span className="ml-auto text-sm font-medium text-blue-600">
                                  Your answer
                                </span>
                              )}
                              {isCorrectAnswer && !isSelected && (
                                <span className="ml-auto text-sm font-medium text-green-600">
                                  Correct answer
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Short Answer */
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Your answer:
                          </div>
                          <div className="text-gray-900">
                            {studentAnswer?.answer_text || "No answer provided"}
                          </div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-sm font-medium text-green-700 mb-1">
                            Correct answer:
                          </div>
                          <div className="text-green-900">
                            {correctAnswer?.answer_text ||
                              "Manual grading required"}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuizResultsPage;
