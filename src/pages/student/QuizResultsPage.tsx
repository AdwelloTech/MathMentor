import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  GraduationCap,
  Calendar,
  BarChart3,
  BookOpen,
  Target,
  Award,
  TrashIcon,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { quizService } from "@/lib/quizService";
import type { QuizAttempt, Question, StudentAnswer } from "@/types/quiz";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

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

  const deleteAttempt = async (attemptId: string, attemptTitle: string) => {
    if (!confirm(`Are you sure you want to delete the attempt for "${attemptTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await quizService.studentQuizzes.deleteQuizAttempt(attemptId);
      toast.success("Quiz attempt deleted successfully");

      // Reload attempts if we're on the list view
      if (!selectedAttempt) {
        await loadAttempts();
      }
    } catch (error) {
      console.error("Error deleting attempt:", error);
      toast.error("Failed to delete quiz attempt");
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-900";
    if (percentage >= 60) return "text-yellow-700";
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!selectedAttempt && !attemptId && (
                <Button
                  onClick={() => navigate("/student/quizzes")}
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:text-green-900 hover:bg-green-100"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Quizzes
                </Button>
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-green-900 mb-3">
                  Quiz Results
                </h1>
                <p className="text-lg text-gray-700">
                  Review your quiz attempts and performance
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {!selectedAttempt && !attemptId ? (
          /* Attempts List */
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {attempts.length === 0 ? (
              <Card className="border-green-200 bg-white">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-20 w-20 text-green-300 mx-auto mb-6" />
                  <CardTitle className="text-2xl text-green-900 mb-3">
                    No quiz attempts yet
                  </CardTitle>
                  <CardDescription className="text-green-700 text-lg mb-6">
                    You haven't taken any quizzes yet. Start by taking a quiz
                    from your available quizzes.
                  </CardDescription>
                  <Button
                    onClick={() => navigate("/student/quizzes")}
                    className="bg-green-900 hover:bg-green-800 text-white font-semibold px-8 py-3"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Take a Quiz
                  </Button>
                </CardContent>
              </Card>
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
                    >
                      <Card
                        className="border-green-200 bg-white hover:shadow-lg transition-all duration-200 h-full flex flex-col cursor-pointer"
                        onClick={() => loadAttemptDetails(attempt.id)}
                      >
                        <CardHeader className="pb-4">
                          <CardTitle className="text-green-900 text-xl line-clamp-2 mb-2">
                            {attempt.quiz?.title || "Untitled Quiz"}
                          </CardTitle>
                          <CardDescription className="text-green-700">
                            by {attempt.quiz?.tutor?.full_name}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-1 space-y-4">
                          {/* Score Display */}
                          <div
                            className={`rounded-lg p-4 ${getScoreBgColor(
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
                              <div className="text-sm text-gray-700 mt-1 font-medium">
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
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-800 font-medium">
                                {formatDate(attempt.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-green-700">
                              <Clock className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">
                                {attempt.completed_at
                                  ? (() => {
                                      const endMs = Date.parse(
                                        attempt.completed_at as string
                                      );
                                      const startMs = attempt.started_at
                                        ? Date.parse(
                                            attempt.started_at as string
                                          )
                                        : NaN;
                                      if (
                                        Number.isFinite(endMs) &&
                                        Number.isFinite(startMs)
                                      ) {
                                        const minutes = Math.max(
                                          0,
                                          Math.round(
                                            (endMs - (startMs as number)) /
                                              60000
                                          )
                                        );
                                        return `Completed in ${minutes} minutes`;
                                      }
                                      return `Completed: ${formatDate(
                                        attempt.completed_at
                                      )}`;
                                    })()
                                  : "In progress"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-green-700">
                              <GraduationCap className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">
                                {attempt.quiz?.subject}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                loadAttemptDetails(attempt.id);
                              }}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Details
                            </Button>

                            {/* Delete button for incomplete attempts */}
                            {attempt.status !== 'completed' && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAttempt(attempt.id, attempt.quiz?.title || "Untitled Quiz");
                                }}
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                              >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete Attempt
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* Detailed Results View */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Back Button */}
            <Button
              onClick={() => {
                if (attemptId) {
                  navigate("/student/quizzes");
                } else {
                  setSelectedAttempt(null);
                }
              }}
              variant="ghost"
              size="sm"
              className="text-gray-700 hover:text-green-900 hover:bg-green-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {attemptId ? "Back to Quizzes" : "Back to Results"}
            </Button>

            {/* Quiz Summary */}
            <Card className="border-green-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-green-900 mb-2">
                      {selectedAttempt?.attempt.quiz?.title}
                    </h2>
                    <p className="text-gray-700">
                      by {selectedAttempt?.attempt.quiz?.tutor?.full_name}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      {selectedAttempt?.attempt.correct_answers || 0}/
                      {selectedAttempt?.attempt.total_questions || 0}
                    </div>
                    <div className="text-sm text-gray-700 mb-1">
                      Questions Correct
                    </div>
                    <div className="text-lg text-gray-700">
                      {selectedAttempt?.attempt.max_score &&
                      selectedAttempt?.attempt.score
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      Started: {formatDate(selectedAttempt?.attempt.started_at)}
                    </span>
                  </div>
                  {selectedAttempt?.attempt.completed_at && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>
                        Completed:{" "}
                        {formatDate(selectedAttempt?.attempt.completed_at)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    <span>{selectedAttempt?.attempt.quiz?.subject}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tutor Feedback */}
            {selectedAttempt?.attempt?.tutor_feedback && (
              <Card className="border-green-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-green-900 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Tutor Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">
                    {selectedAttempt.attempt.tutor_feedback}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Question-by-Question Review */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-green-900 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Question Review
              </h3>

              {selectedAttempt?.questions.map((question, index) => {
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
                  >
                    <Card className="border-green-900/60 border-2 bg-white">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-lg font-medium text-black">
                            Question {index + 1}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">
                              {studentAnswer?.points_earned || 0}/
                              {question.points} points
                            </span>
                            {isCorrect === true ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : isCorrect === false ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <>
                                <Clock className="h-5 w-5 text-yellow-600" />
                                <span className="text-sm text-yellow-700">
                                  Pending grading
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4">
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
                                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                  )}
                                  {isSelected && !isCorrectAnswer && (
                                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                                  )}
                                  <span className="text-gray-700">
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
                              <div className="text-sm font-medium text-green-700 mb-1">
                                Your answer:
                              </div>
                              <div className="text-green-900">
                                {studentAnswer?.answer_text ||
                                  "No answer provided"}
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
                      </CardContent>
                    </Card>
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
