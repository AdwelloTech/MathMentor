import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  BookOpen,
  Target,
  Award,
  Timer,
  User,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { quizService } from "@/lib/quizService";
import type { Quiz, Question, Answer, QuizAttempt } from "@/types/quiz";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <Card className="border-green-200 bg-white max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-green-900 mb-2">
              Quiz Not Found
            </CardTitle>
            <p className="text-green-700 mb-6">
              The quiz you're looking for doesn't exist or you don't have access
              to it.
            </p>
            <Button
              onClick={() => navigate("/student/quizzes")}
              className="bg-green-900 hover:bg-green-800 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          <div className="space-y-6">
            {/* Question Navigation */}
            <Card className="border-green-200 bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {/* Question Grid */}
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {quiz.questions?.map((_, index) => (
                    <Button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      variant="outline"
                      size="sm"
                      className={`transition-all duration-200 ${
                        index === currentQuestionIndex
                          ? "bg-green-900 text-white border-green-900 hover:bg-green-800"
                          : isQuestionAnswered(index)
                          ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                          : "bg-white text-green-700 border-green-200 hover:bg-green-50"
                      }`}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            {currentQuestion && (
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border-green-200 bg-white">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-green-900 mb-6">
                        {currentQuestion.question_text}
                      </h3>

                      {(currentQuestion.question_type === "multiple_choice" ||
                        currentQuestion.question_type === "true_false") && (
                        <div className="space-y-3">
                          {currentQuestion.answers?.map((answer) => (
                            <label
                              key={answer.id}
                              className="flex items-center p-4 border border-green-200 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                value={answer.id}
                                checked={
                                  getCurrentAnswer()?.selectedAnswerId ===
                                  answer.id
                                }
                                onChange={() =>
                                  handleAnswerChange(
                                    currentQuestion.id,
                                    answer.id
                                  )
                                }
                                className="h-4 w-4 text-green-600 focus:ring-green-500"
                              />
                              <span className="ml-3 text-green-900">
                                {answer.answer_text}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      {currentQuestion.question_type === "short_answer" && (
                        <Textarea
                          value={getCurrentAnswer()?.answerText || ""}
                          onChange={(e) =>
                            handleAnswerChange(
                              currentQuestion.id,
                              undefined,
                              e.target.value
                            )
                          }
                          placeholder="Type your answer here..."
                          className="w-full border-green-200 focus:border-green-900 focus:ring-green-900"
                          rows={4}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-green-900/60 "
              >
                Previous
              </Button>

              <div className="flex items-center space-x-4">
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button
                    onClick={handleNextQuestion}
                    className="bg-green-900 hover:bg-green-800 text-white"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                    className="bg-yellow-500 hover:bg-yellow-600 text-green-900 font-semibold"
                  >
                    {submitting ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Quiz
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Results Page */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-green-900/60 border-2 bg-white max-w-2xl mx-auto justify-center items-center flex flex-col">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-green-900 mb-2">
                    Quiz Completed!
                  </h2>
                  <p className="text-gray-700">Here are your results</p>
                </div>

                {results && (
                  <div className="text-center mb-8">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {results.correctAnswers}/{results.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      Questions Correct
                    </div>
                    <div className="text-xl text-gray-700 mb-4">
                      {results.percentage}%
                    </div>
                    <div className="text-sm text-gray-700">
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
                  <Button
                    onClick={() => navigate("/student/quizzes")}
                    className="bg-green-900 hover:bg-green-800 text-white"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Back to Quizzes
                  </Button>
                  <Button
                    onClick={() =>
                      navigate(`/student/quiz-results/${attemptId}`)
                    }
                    variant="outline"
                    className="border-green-900 text-gray-700 hover:bg-gray-300"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    View Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TakeQuizPage;
