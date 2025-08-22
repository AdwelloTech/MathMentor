import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { quizService } from "@/lib/quizService";
import type { Quiz, Question, Answer, QuizAttempt } from "@/types/quiz";
import toast from "react-hot-toast";

interface StudentAnswer {
  questionId: string;
  selectedAnswerId?: string;
  answerText?: string;
}

const TakeQuizPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
    correctAnswers: number;
    totalQuestions: number;
  } | null>(null);

  useEffect(() => {
    if (attemptId) {
      loadQuizData();
    }
  }, [attemptId]);

  useEffect(() => {
    if (timeRemaining > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, showResults]);

  const loadQuizData = async () => {
    try {
      setLoading(true);

      // Get attempt details
      const attemptData = await quizService.studentQuizzes.getAttemptDetails(
        attemptId!
      );
      setAttempt(attemptData.attempt);

      // Get quiz with questions
      const quizData = await quizService.studentQuizzes.getQuizForTaking(
        attemptData.attempt.quiz_id
      );
      setQuiz(quizData);

      // Initialize answers array
      const initialAnswers: StudentAnswer[] =
        quizData.questions?.map((q) => ({
          questionId: q.id,
        })) || [];
      setAnswers(initialAnswers);

      // Set time remaining
      setTimeRemaining(quizData.time_limit_minutes * 60);
    } catch (error) {
      console.error("Error loading quiz data:", error);
      toast.error("Failed to load quiz");
      navigate("/student/quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (
    questionId: string,
    answerId?: string,
    answerText?: string
  ) => {
    setAnswers((prev) =>
      prev.map((answer) =>
        answer.questionId === questionId
          ? { ...answer, selectedAnswerId: answerId, answerText }
          : answer
      )
    );
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);

      // Filter out unanswered questions
      const submittedAnswers = answers.filter(
        (answer) => answer.selectedAnswerId || answer.answerText
      );

      const results = await quizService.studentQuizzes.submitQuizAttempt(
        attemptId!,
        submittedAnswers
      );

      setResults(results);
      setShowResults(true);

      toast.success(
        `Quiz completed! ${results.correctAnswers}/${results.totalQuestions} questions correct (${results.percentage}%)`
      );
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getCurrentAnswer = () => {
    return answers.find(
      (a) => a.questionId === quiz?.questions?.[currentQuestionIndex]?.id
    );
  };

  const isQuestionAnswered = (questionIndex: number) => {
    const question = quiz?.questions?.[questionIndex];
    if (!question) return false;

    const answer = answers.find((a) => a.questionId === question.id);
    return !!(answer?.selectedAnswerId || answer?.answerText);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!quiz || !attempt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Quiz Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The quiz you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <button
            onClick={() => navigate("/student/quizzes")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions?.[currentQuestionIndex];
  const totalQuestions = quiz.questions?.length || 0;
  const answeredQuestions = answers.filter(
    (a) => a.selectedAnswerId || a.answerText
  ).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/student/quizzes")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {quiz.title}
                </h1>
                <p className="text-sm text-gray-600">
                  by {quiz.tutor?.full_name}
                </p>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-5 w-5 text-gray-600" />
                <span
                  className={`font-mono text-lg ${
                    timeRemaining < 300 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Progress */}
              <div className="text-sm text-gray-600">
                {answeredQuestions}/{totalQuestions} answered
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          <div className="space-y-6">
            {/* Question Navigation */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </h2>
                <div className="text-sm text-gray-600">
                  {currentQuestion?.points} points
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {quiz.questions?.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                      index === currentQuestionIndex
                        ? "bg-blue-600 text-white"
                        : isQuestionAnswered(index)
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {currentQuestion.question_text}
                  </h3>

                  {currentQuestion.question_type === "multiple_choice" && (
                    <div className="space-y-3">
                      {currentQuestion.answers?.map((answer) => (
                        <label
                          key={answer.id}
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={answer.id}
                            checked={
                              getCurrentAnswer()?.selectedAnswerId === answer.id
                            }
                            onChange={() =>
                              handleAnswerChange(currentQuestion.id, answer.id)
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 text-gray-900">
                            {answer.answer_text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.question_type === "true_false" && (
                    <div className="space-y-3">
                      {currentQuestion.answers?.map((answer) => (
                        <label
                          key={answer.id}
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={answer.id}
                            checked={
                              getCurrentAnswer()?.selectedAnswerId === answer.id
                            }
                            onChange={() =>
                              handleAnswerChange(currentQuestion.id, answer.id)
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 text-gray-900">
                            {answer.answer_text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.question_type === "short_answer" && (
                    <textarea
                      value={getCurrentAnswer()?.answerText || ""}
                      onChange={(e) =>
                        handleAnswerChange(
                          currentQuestion.id,
                          undefined,
                          e.target.value
                        )
                      }
                      placeholder="Type your answer here..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </button>

              <div className="flex items-center space-x-4">
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                        Submit Quiz
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Results Page */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border p-8"
          >
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Quiz Completed!
              </h2>
              <p className="text-gray-600">Here are your results</p>
            </div>

            {results && (
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {results.correctAnswers}/{results.totalQuestions}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Questions Correct
                </div>
                <div className="text-xl text-gray-600 mb-4">
                  {results.percentage}%
                </div>
                <div className="text-sm text-gray-500">
                  {results.percentage >= 80
                    ? "Excellent!"
                    : results.percentage >= 60
                    ? "Good job!"
                    : results.percentage >= 40
                    ? "Keep practicing!"
                    : "Review the material and try again!"}
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate("/student/quizzes")}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Quizzes
              </button>
              <button
                onClick={() => navigate(`/student/quiz-results/${attemptId}`)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                View Detailed Results
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TakeQuizPage;
