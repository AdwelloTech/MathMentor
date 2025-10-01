import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  AlertTriangle,
  BookOpen,
  Target,
  Clock as ClockIcon,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Textarea } from "@/components/ui/textarea";
import { quizService } from "@/lib/quizService";
import type { Quiz, QuizAttempt } from "@/types/quiz";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StudentPageWrapper from "@/components/ui/StudentPageWrapper";

interface StudentAnswer {
  questionId: string;
  selectedAnswerId?: string;
  answerText?: string;
}

const TakeQuizPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
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
          // Show warning when 5 minutes remaining
          if (prev === 300) {
            toast("⚠️ 5 minutes remaining!", { icon: "⚠️" });
          }
          // Show warning when 1 minute remaining
          if (prev === 60) {
            toast("⚠️ 1 minute remaining!", { icon: "⚠️" });
          }
          if (prev <= 1) {
            // Auto-submit when time runs out
            toast.error("Time's up! Submitting your quiz...");
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, showResults]);

  // Format remaining time for display
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const loadQuizData = async () => {
    try {
      setLoading(true);

      // Get attempt details
      const attemptData = await quizService.studentQuizzes.getAttemptDetails(
        attemptId!
      );
      setAttempt(attemptData.attempt);

      // Get quiz data
      const quizData = await quizService.studentQuizzes.getQuizForTaking(
        attemptData.attempt.quiz_id
      );

      // Get questions for the quiz
      const questionsData = await quizService.questions.getByQuizId(
        attemptData.attempt.quiz_id
      );

      // Combine quiz data with questions
      const quizWithQuestions = {
        ...quizData,
        questions: questionsData,
      };

      setQuiz(quizWithQuestions);

      // Initialize answers array
      const initialAnswers: StudentAnswer[] =
        questionsData?.map((q) => ({
          questionId: q.id,
        })) || [];
      setAnswers(initialAnswers);

      // Set time remaining
      setTimeRemaining(quizWithQuestions.time_limit_minutes * 60);
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

      // Include all answers, keeping original structure
      const submittedAnswers = answers.map(answer => ({
        questionId: answer.questionId,
        selectedAnswerId: answer.selectedAnswerId,
        answerText: answer.answerText || undefined
      }));

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
      
      // More descriptive error message
      if (error instanceof Error) {
        if (error.message.includes("not found") || error.message.includes("access denied")) {
          toast.error("Quiz session has expired or is no longer valid. Please start a new quiz attempt.");
          navigate("/student/quizzes");
        } else {
          toast.error(`Failed to submit quiz: ${error.message}`);
        }
      } else {
        toast.error("Failed to submit quiz. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
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
      <StudentPageWrapper backgroundClass="bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </StudentPageWrapper>
    );
  }

  if (!quiz || !attempt) {
    return (
      <StudentPageWrapper backgroundClass="bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="border-border bg-card max-w-md">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <CardTitle className="text-xl text-card-foreground mb-2">
                Quiz Not Found
              </CardTitle>
              <p className="text-muted-foreground mb-6">
                The quiz you're looking for doesn't exist or you don't have
                access to it.
              </p>
              <Button
                onClick={() => navigate("/student/quizzes")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quizzes
              </Button>
            </CardContent>
          </Card>
        </div>
      </StudentPageWrapper>
    );
  }

  const currentQuestion = quiz.questions?.[currentQuestionIndex];
  const totalQuestions = quiz.questions?.length || 0;

  return (
    <StudentPageWrapper backgroundClass="bg-background" className="text-foreground">
      {/* Header */}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResults ? (
          <div className="space-y-6">
            {/* Question Navigation */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ClockIcon className="h-5 w-5" />
                    Time Remaining: {formatTimeRemaining()}
                  </div>
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
                          ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                          : isQuestionAnswered(index)
                          ? "bg-primary/10 text-primary-foreground border-primary/20 hover:bg-primary/20"
                          : "bg-card text-foreground border-border hover:bg-muted"
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
                <Card className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-card-foreground mb-6">
                        {currentQuestion.question_text}
                      </h3>

                      {(currentQuestion.question_type === "multiple_choice" ||
                        currentQuestion.question_type === "true_false") && (
                        <div className="space-y-3">
                          {currentQuestion.answers?.map((answer) => (
                            <label
                              key={answer.id}
                              className="flex items-center p-4 border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors"
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
                                className="h-4 w-4 text-primary focus:ring-primary"
                              />
                              <span className="ml-3 text-foreground">
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
                          className="w-full"
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
              >
                Previous
              </Button>

              <div className="flex items-center space-x-4">
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button
                    onClick={handleNextQuestion}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
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
            <Card className="border-border bg-card max-w-2xl mx-auto justify-center items-center flex flex-col">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-card-foreground mb-2">
                    Quiz Completed!
                  </h2>
                  <p className="text-muted-foreground">Here are your results</p>
                </div>

                {results && (
                  <div className="text-center mb-8">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {results.correctAnswers}/{results.totalQuestions}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Questions Correct
                    </div>
                    <div className="text-xl text-muted-foreground mb-4">
                      {results.percentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">
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
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Back to Quizzes
                  </Button>
                  <Button
                    onClick={() =>
                      navigate(`/student/quiz-results/${attemptId}`)
                    }
                    variant="outline"
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
    </StudentPageWrapper>
  );
};

export default TakeQuizPage;
