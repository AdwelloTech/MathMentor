import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { generateAIQuestions } from "@/lib/ai";
import type { CreateQuestionData } from "@/types/quiz";
import type { QuizPdf } from "@/types/quizPdf";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StudentPageWrapper from "@/components/ui/StudentPageWrapper";
import PDFSelector from "@/components/quiz/PDFSelector";

interface AIQuestion {
  question_text: string;
  question_type: "multiple_choice" | "true_false";
  points?: number;
  ai_status?: string;
  ai_metadata?: any;
  answers: Array<{
    answer_text: string;
    is_correct: boolean;
  }>;
}

const StudentAIGenerateQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNumQuestions, setAiNumQuestions] = useState(4);
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [aiQuestionType, setAiQuestionType] = useState<
    "multiple_choice" | "true_false"
  >("multiple_choice");
  const [questionFilter, setQuestionFilter] = useState<"all" | "ai">("all");

  // PDF context
  const [selectedPDF, setSelectedPDF] = useState<QuizPdf | null>(null);
  
  // Reset questions when PDF changes
  useEffect(() => {
    setQuestions([]);
    setScore(0);
    setTotalPossible(0);
    setIsSubmitted(false);
  }, [selectedPDF]);

  // Quiz basic info
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    time_limit_minutes: 60,
  });

  // Questions data with required answers array
  interface QuizQuestion extends Omit<CreateQuestionData, 'answers'> {
    answers: Array<{
      answer_text: string;
      is_correct: boolean;
      answer_order?: number;
    }>;
    selectedAnswer?: number;
  }
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const POINTS_PER_QUESTION = 10;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPossible, setTotalPossible] = useState(0);

  const visibleQuestions = questions.filter((q) => {
    const isAI = (q as any).is_ai_generated === true;
    if (questionFilter === "ai") return isAI;
    return true;
  });

  const updateQuizData = (field: string, value: string | number) => {
    setQuizData((prev) => ({ ...prev, [field]: value }));
  };

  const updateQuestion = (
    questionIndex: number,
    field: string,
    value: string | number
  ) => {
    setQuestions((prev) =>
      prev.map((q, index) =>
        index === questionIndex ? { ...q, [field]: value } : q
      )
    );
  };

  const updateAnswer = (
    questionIndex: number,
    answerIndex: number,
    field: string,
    value: string | boolean
  ) => {
    setQuestions((prev) =>
      prev.map((q, qIndex) =>
        qIndex === questionIndex
          ? {
              ...q,
              answers: q.answers.map((a, aIndex) =>
                aIndex === answerIndex ? { ...a, [field]: value } : a
              ),
            }
          : q
      )
    );
  };

  const setCorrectAnswer = (questionIndex: number, answerIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, qIndex) =>
        qIndex === questionIndex
          ? {
              ...q,
              answers: q.answers.map((a, aIndex) => ({
                ...a,
                is_correct: aIndex === answerIndex,
              })),
            }
          : q
      )
    );
  };

  const removeQuestion = (questionIndex: number) => {
    setQuestions((prev) => {
      const newQuestions = prev.filter((_, index) => index !== questionIndex);
      return newQuestions.map((q, index) => ({
        ...q,
        question_order: index + 1,
      }));
    });
  };

  const validateStep1 = () => {
    return true; // Temporarily removing validation for testing
  };

  const validateStep2 = () => {
    if (questions.length === 0) return false;

    return questions.every(
      (q: QuizQuestion) =>
        q.question_text.trim() !== "" &&
        q.answers.length > 0 &&
        q.answers.some((a) => a.is_correct) &&
        q.answers.every((a) => a.answer_text.trim() !== "")
    );
  };

  const handleGenerateAI = async () => {
    if (!selectedPDF) {
      toast.error("Please select a PDF first.");
      return;
    }
    
    // Clear previous questions before generating new ones
    setQuestions([]);
    setScore(0);
    setTotalPossible(0);
    setIsSubmitted(false);

    setAiLoading(true);
    try {
      // Convert PDF to base64 format for AI processing
      const pdfs = [
        {
          pdfBase64: selectedPDF.file_path, // This should be the PDF content in base64
          fileName: selectedPDF.file_name,
          fileSize: selectedPDF.file_size,
        },
      ];

      const ai: AIQuestion[] = await generateAIQuestions({
        subject: selectedPDF.subject?.name || "general",
        gradeLevel: selectedPDF.grade_level?.code || "",
        numQuestions: aiNumQuestions,
        difficulty: aiDifficulty,
        questionType: aiQuestionType,
        title: quizData.title || undefined,
        pdfs: pdfs,
      });

      const mapped: QuizQuestion[] = ai.map((q: AIQuestion, idx: number) => ({
        question_text: q.question_text,
        question_type: q.question_type,
        points: POINTS_PER_QUESTION,
        question_order: questions.length + idx + 1,
        is_ai_generated: true,
        ai_status: "approved" as const, // Auto-approve for students
        ai_metadata: q.ai_metadata,
        answers: q.answers.map((a: any, i: number) => ({
          answer_text: a.answer_text,
          is_correct: a.is_correct,
          answer_order: i + 1,
        })),
        selectedAnswer: undefined, // Initialize with no selected answer
      }));

      setQuestions((prev) => [...prev, ...mapped]);
      setQuestionFilter("ai");
      setAiNumQuestions(1);
      toast.success(
        `Generated ${mapped.length} question${mapped.length > 1 ? "s" : ""}`
      );
    } catch (e) {
      console.error(e);
      toast.error("AI question generation failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitQuiz = () => {
    let calculatedScore = 0;
    let totalPossibleScore = 0;

    questions.forEach((question) => {
      totalPossibleScore += question.points || 1;
      const selectedAnswer = question.answers[question.selectedAnswer || 0];
      if (selectedAnswer?.is_correct) {
        calculatedScore += question.points || 1;
      }
    });

    setScore(calculatedScore);
    setTotalPossible(totalPossibleScore);
    setIsSubmitted(true);
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (isSubmitted) return;
    
    setQuestions(prev => {
      const newQuestions = [...prev];
      const question = { ...newQuestions[questionIndex] };
      
      // Ensure answers array exists
      if (!question.answers) {
        question.answers = [];
      }
      
      newQuestions[questionIndex] = {
        ...question,
        selectedAnswer: answerIndex
      };
      return newQuestions;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clear existing questions and reset state
      setQuestions([]);
      setScore(0);
      setTotalPossible(0);
      setIsSubmitted(false);
      
      // Go back to step 1 to allow generating new questions
      setCurrentStep(1);
      
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      toast.success('Quiz has been reset. You can now generate new questions.');
    } catch (error) {
      console.error("Error resetting quiz:", error);
      toast.error("Failed to reset quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Remove unused totalPoints since it's not being used

  return (
    <StudentPageWrapper>
      <div className="min-h-screen bg-[#D5FFC5] relative overflow-auto">
        {/* Full page background */}
        <div className="fixed inset-0 bg-[#D5FFC5] -z-10" />

        {/* Animated background elements */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_70%)]" />

        {/* Floating decorative elements */}
        <div className="fixed top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="fixed top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-green-400/10 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="fixed bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/5 to-yellow-300/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/student/quizzes')}
              className="mb-4 text-green-700 hover:text-green-800 hover:bg-green-100 z-50 relative"
              style={{ pointerEvents: 'auto' }}
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Quiz Dashboard
            </Button>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold text-green-800 mb-2">
                AI Quiz Generator
              </h1>
              <p className="text-lg text-green-600 max-w-2xl mx-auto">
                Generate personalized quizzes using AI with context from
                admin-uploaded PDFs
              </p>
            </motion.div>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= 1
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-white border-gray-300 text-gray-500"
                }`}
              >
                {currentStep > 1 ? <CheckIcon className="w-6 h-6" /> : "1"}
              </div>
              <div className="w-16 h-0.5 bg-gray-300" />
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= 2
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-white border-gray-300 text-gray-500"
                }`}
              >
                {currentStep > 2 ? <CheckIcon className="w-6 h-6" /> : "2"}
              </div>
            </div>
          </div>

          {/* Step 1: Quiz Setup & PDF Selection */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <SparklesIcon className="w-6 h-6" />
                    Quiz Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="quiz-title"
                      className="text-green-700 font-medium"
                    >
                      Quiz Title
                    </Label>
                    <Input
                      id="quiz-title"
                      value={quizData.title}
                      onChange={(e) => updateQuizData("title", e.target.value)}
                      placeholder="Enter quiz title"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="quiz-description"
                      className="text-green-700 font-medium"
                    >
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="quiz-description"
                      value={quizData.description}
                      onChange={(e) =>
                        updateQuizData("description", e.target.value)
                      }
                      placeholder="Enter quiz description"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="time-limit"
                      className="text-green-700 font-medium"
                    >
                      Time Limit (minutes)
                    </Label>
                    <Input
                      id="time-limit"
                      type="number"
                      value={quizData.time_limit_minutes}
                      onChange={(e) =>
                        updateQuizData(
                          "time_limit_minutes",
                          parseInt(e.target.value)
                        )
                      }
                      min="1"
                      max="180"
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* PDF Selector */}
              <PDFSelector
                onPDFSelect={setSelectedPDF}
                selectedPDF={selectedPDF}
              />

              {/* Navigation */}
              <div className="flex justify-end mt-8">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentStep(2);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 relative z-50"
                  style={{ pointerEvents: 'auto' }}
                >
                  Continue to Questions
                  <ArrowLeftIcon className="w-5 h-5 ml-2 rotate-180" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: AI Generation & Questions */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-6xl mx-auto"
            >
              {/* AI Generation Controls */}
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <SparklesIcon className="w-6 h-6" />
                    AI Question Generation
                  </CardTitle>
                  <p className="text-sm text-green-600">
                    Generate questions using AI with context from:{" "}
                    {selectedPDF?.file_name}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-green-700 font-medium">
                        Number of Questions
                      </Label>
                      <Input
                        type="number"
                        value={aiNumQuestions}
                        onChange={(e) =>
                          setAiNumQuestions(
                            Math.max(
                              1,
                              Math.min(20, parseInt(e.target.value || "1"))
                            )
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <Label className="text-green-700 font-medium">
                        Difficulty
                      </Label>
                      <Select
                        value={aiDifficulty}
                        onValueChange={(value: any) => setAiDifficulty(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-green-700 font-medium">
                        Question Type
                      </Label>
                      <Select
                        value={aiQuestionType}
                        onValueChange={(value: any) => setAiQuestionType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">
                            Multiple Choice
                          </SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleGenerateAI}
                        disabled={aiLoading}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
                      >
                        {aiLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Generating…
                          </>
                        ) : (
                          "Generate with AI"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Questions Display */}
              {questions.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200 mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-green-800">
                        Generated Questions ({questions.length})
                      </CardTitle>
                      <div className="flex items-center gap-4">
                        <Select
                          value={questionFilter}
                          onValueChange={(value: any) =>
                            setQuestionFilter(value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="ai">AI Generated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {visibleQuestions.map((question, questionIndex) => (
                        <motion.div
                          key={questionIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 border border-gray-200 rounded-lg bg-white"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-500">
                                Q{question.question_order}
                              </span>
                              {question.is_ai_generated && (
                                <Badge variant="secondary" className="text-xs">
                                  AI Generated
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuestion(questionIndex)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-gray-700 font-medium">
                                Question
                              </Label>
                              <Textarea
                                value={question.question_text}
                                onChange={(e) =>
                                  updateQuestion(
                                    questionIndex,
                                    "question_text",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter question text"
                                className="mt-1"
                                rows={2}
                              />
                            </div>


                            {/* Answers */}
                            <div>
                              <Label className="text-gray-700 font-medium">
                                Answers
                              </Label>
                              <div className="space-y-2 mt-2">
                                {question.answers.map((answer, answerIndex) => (
                                  <div
                                    key={answerIndex}
                                    className={`p-3 rounded-lg border ${
                                      isSubmitted
                                        ? answer.is_correct
                                          ? 'border-green-500 bg-green-50'
                                          : question.selectedAnswer === answerIndex
                                          ? 'border-red-500 bg-red-50'
                                          : 'border-gray-200'
                                        : 'border-gray-200 hover:border-blue-300 cursor-pointer'
                                    } transition-colors`}
                                    onClick={() => handleAnswerSelect(questionIndex, answerIndex)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                        isSubmitted && answer.is_correct 
                                          ? 'bg-green-100 border-green-500' 
                                          : question.selectedAnswer === answerIndex
                                          ? 'bg-blue-100 border-blue-500'
                                          : 'border-gray-400'
                                      }`}>
                                        {isSubmitted && answer.is_correct && (
                                          <CheckIcon className="w-3.5 h-3.5 text-green-600" />
                                        )}
                                        {!isSubmitted && question.selectedAnswer === answerIndex && (
                                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        )}
                                      </div>
                                      <span className={isSubmitted && answer.is_correct ? 'font-medium text-green-700' : ''}>
                                        {answer.answer_text}
                                      </span>
                                    </div>
                                    {isSubmitted && answer.is_correct && (
                                      <div className="mt-1 text-sm text-green-600">
                                        Correct Answer
                                      </div>
                                    )}
                                    {isSubmitted && !answer.is_correct && question.selectedAnswer === answerIndex && (
                                      <div className="mt-1 text-sm text-red-600">
                                        Your Answer
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentStep(1);
                  }}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50 relative z-50"
                  style={{ pointerEvents: 'auto' }}
                >
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  Back to Setup
                </Button>
                {!isSubmitted ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmitQuiz();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 relative z-50"
                    style={{ pointerEvents: 'auto' }}
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <div className="text-xl font-bold text-green-700">
                    Score: {score} / {totalPossible}
                  </div>
                )}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmit(e as any);
                  }}
                  disabled={!validateStep2() || loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 relative z-50"
                  style={{ pointerEvents: 'auto' }}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Generating Quiz...
                    </>
                  ) : (
                    "Generate New Quiz"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </StudentPageWrapper>
  );
};

export default StudentAIGenerateQuizPage;
