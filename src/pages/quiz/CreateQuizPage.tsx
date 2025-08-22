import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { quizService } from "@/lib/quizService";
import { getNoteSubjects } from "@/lib/notes";
import { generateAIQuestions, uploadPdfForAI } from "@/lib/ai";
import type {
  CreateQuizData,
  CreateQuestionData,
  CreateAnswerData,
} from "@/types/quiz";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type NoteSubject = {
  id: string;
  name: string;
  display_name: string;
  color: string;
};

const CreateQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [subjects, setSubjects] = useState<NoteSubject[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNumQuestions, setAiNumQuestions] = useState(4);
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [aiQuestionType, setAiQuestionType] = useState<
    "multiple_choice" | "true_false"
  >("multiple_choice");
  const [questionFilter, setQuestionFilter] = useState<"all" | "manual" | "ai">(
    "all"
  );
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState<number | null>(null);

  // Quiz basic info
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    subject: "",
    grade_level: "",
    time_limit_minutes: 60,
  });

  // Load subjects on component mount
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subjectsData = await getNoteSubjects();
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Error loading subjects:", error);
      }
    };
    loadSubjects();
  }, []);

  // Questions data - start with 0 questions, can add up to 40
  const [questions, setQuestions] = useState<CreateQuestionData[]>([]);

  const visibleQuestions = questions.filter((q) => {
    const isAI = (q as any).is_ai_generated === true;
    if (questionFilter === "manual") return !isAI;
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

  const addQuestion = () => {
    if (questions.length >= 40) {
      toast.error("Maximum 40 questions allowed per quiz.");
      return;
    }

    const newQuestion: CreateQuestionData = {
      question_text: "",
      question_type: "multiple_choice",
      points: 10,
      question_order: questions.length + 1,
      answers: [
        { answer_text: "", is_correct: false, answer_order: 1 },
        { answer_text: "", is_correct: false, answer_order: 2 },
        { answer_text: "", is_correct: false, answer_order: 3 },
        { answer_text: "", is_correct: false, answer_order: 4 },
      ],
    };

    setQuestions((prev) => [...prev, newQuestion]);
  };

  const approveAIQuestion = (originalIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === originalIndex ? { ...q, ai_status: "approved" } : q
      )
    );
  };

  const discardAIQuestion = (originalIndex: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== originalIndex));
  };

  const handleGenerateAI = async () => {
    if (!quizData.subject) {
      toast.error("Please select a subject first.");
      return;
    }
    setAiLoading(true);
    try {
      const ai = await generateAIQuestions({
        subject: quizData.subject,
        gradeLevel: quizData.grade_level || undefined,
        numQuestions: aiNumQuestions,
        difficulty: aiDifficulty,
        questionType: aiQuestionType,
        title: quizData.title || undefined,
        pdfBase64: pdfBase64 || undefined,
      });
      const mapped = ai.map((q, idx) => ({
        question_text: q.question_text,
        question_type: q.question_type,
        points: q.points ?? 10,
        question_order: questions.length + idx + 1,
        is_ai_generated: true,
        ai_status: q.ai_status || "pending",
        ai_metadata: q.ai_metadata,
        answers: q.answers.map((a, i) => ({
          answer_text: a.answer_text,
          is_correct: a.is_correct,
          answer_order: i + 1,
        })),
      }));
      setQuestions((prev) => [...prev, ...mapped]);
      setQuestionFilter("ai");
      // Reset number of questions to 1 after generation
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

  const removeQuestion = (questionIndex: number) => {
    setQuestions((prev) => {
      const newQuestions = prev.filter((_, index) => index !== questionIndex);
      // Update question order numbers
      return newQuestions.map((q, index) => ({
        ...q,
        question_order: index + 1,
      }));
    });
  };

  const validateStep1 = () => {
    return quizData.title.trim() !== "" && quizData.subject.trim() !== "";
  };

  const getValidationReason = () => {
    // Check for pending AI questions
    const pendingAIQuestions = questions.filter((q) => {
      const isAI = (q as any).is_ai_generated === true;
      const status = (q as any).ai_status as any;
      return isAI && status === "pending";
    });

    if (pendingAIQuestions.length > 0) {
      return `Please approve or discard ${
        pendingAIQuestions.length
      } pending AI question${pendingAIQuestions.length > 1 ? "s" : ""}`;
    }

    const included = questions.filter((q) => {
      const isAI = (q as any).is_ai_generated === true;
      const status = (q as any).ai_status as any;
      return !isAI || status === "approved";
    });

    if (included.length === 0) {
      return "Add at least one question to create a quiz";
    }

    const incompleteQuestions = included.filter(
      (q) =>
        q.question_text.trim() === "" ||
        !q.answers.some((a) => a.is_correct) ||
        q.answers.some((a) => a.answer_text.trim() === "")
    );

    if (incompleteQuestions.length > 0) {
      return "Complete all questions and ensure each has a correct answer";
    }

    return "";
  };

  const validateStep2 = () => {
    // Check for pending AI questions - must approve or discard all
    const pendingAIQuestions = questions.filter((q) => {
      const isAI = (q as any).is_ai_generated === true;
      const status = (q as any).ai_status as any;
      return isAI && status === "pending";
    });

    if (pendingAIQuestions.length > 0) {
      return false; // Cannot create quiz with pending AI questions
    }

    const included = questions.filter((q) => {
      const isAI = (q as any).is_ai_generated === true;
      const status = (q as any).ai_status as any;
      return !isAI || status === "approved"; // only approved AI go through
    });

    // Check if there are any valid questions
    if (included.length === 0) {
      return false;
    }

    return included.every(
      (q) =>
        q.question_text.trim() !== "" &&
        q.answers.some((a) => a.is_correct) &&
        q.answers.every((a) => a.answer_text.trim() !== "")
    );
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      const included = questions.filter((q) => {
        const isAI = (q as any).is_ai_generated === true;
        const status = (q as any).ai_status as any;
        return !isAI || status === "approved";
      });

      if (included.length === 0) {
        toast.error(
          "Please add at least one question to your quiz. You can either:\n\n1. Add manual questions using the '+ Add Question' button\n2. Generate AI questions and approve them"
        );
      } else {
        toast.error(
          "Please complete all questions and ensure each question has a correct answer."
        );
      }
      return;
    }

    setLoading(true);
    try {
      const included = questions.filter((q) => {
        const isAI = (q as any).is_ai_generated === true;
        const status = (q as any).ai_status as any;
        return !isAI || status === "approved";
      });

      const totalPoints = included.reduce((sum, q) => sum + q.points, 0);
      const createQuizData: CreateQuizData = {
        ...quizData,
        total_questions: included.length,
        total_points: totalPoints,
        questions: included,
      };

      await quizService.quizzes.create(profile!.id, createQuizData);
      navigate("/quizzes", {
        state: { message: "Quiz created successfully!" },
      });
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("Failed to create quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

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

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={() => navigate("/quizzes")}
              className="text-gray-600 hover:text-gray-900 p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-4xl font-bold text-gray-900">Create Quiz</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create a new quiz with up to 40 questions
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center space-x-4"
        >
          <div
            className={`flex items-center ${
              currentStep >= 1 ? "text-[#16803D]" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 1
                  ? "border-[#16803D] bg-[#16803D] text-white"
                  : "border-gray-300"
              }`}
            >
              1
            </div>
            <span className="ml-3 text-sm font-medium">Quiz Details</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 max-w-32"></div>
          <div
            className={`flex items-center ${
              currentStep >= 2 ? "text-[#16803D]" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                currentStep >= 2
                  ? "border-[#16803D] bg-[#16803D] text-white"
                  : "border-gray-300"
              }`}
            >
              2
            </div>
            <span className="ml-3 text-sm font-medium">
              Questions & Answers
            </span>
          </div>
        </motion.div>

        {/* Step 1: Quiz Details */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-[0_2px_2px_0_#16803D] border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                    <CheckIcon className="w-4 h-4 text-white" />
                  </div>
                  <span>Quiz Information</span>
                </CardTitle>
                <CardDescription>
                  Fill in the basic details for your quiz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="quiz-title">Quiz Title *</Label>
                    <Input
                      id="quiz-title"
                      type="text"
                      value={quizData.title}
                      onChange={(e) => updateQuizData("title", e.target.value)}
                      placeholder="Enter quiz title"
                      className="focus:ring-2 focus:ring-[#16803D] focus:border-[#16803D]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quiz-subject">Subject *</Label>
                    <Select
                      value={quizData.subject}
                      onValueChange={(value) =>
                        updateQuizData("subject", value)
                      }
                    >
                      <SelectTrigger className="focus:ring-2 focus:ring-[#16803D] focus:border-[#16803D]">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.name}>
                            {subject.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quiz-grade">Grade Level</Label>
                    <Input
                      id="quiz-grade"
                      type="text"
                      value={quizData.grade_level}
                      onChange={(e) =>
                        updateQuizData("grade_level", e.target.value)
                      }
                      placeholder="e.g., Grade 10, High School"
                      className="focus:ring-2 focus:ring-[#16803D] focus:border-[#16803D]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quiz-time">Time Limit (minutes)</Label>
                    <Input
                      id="quiz-time"
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
                      className="focus:ring-2 focus:ring-[#16803D] focus:border-[#16803D]"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="quiz-description">Description</Label>
                    <Textarea
                      id="quiz-description"
                      value={quizData.description}
                      onChange={(e) =>
                        updateQuizData("description", e.target.value)
                      }
                      rows={3}
                      placeholder="Enter quiz description (optional)"
                      className="focus:ring-2 focus:ring-[#16803D] focus:border-[#16803D]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!validateStep1()}
                    className="bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white shadow-[0_2px_2px_0_#16803D] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                  >
                    Next: Questions & Answers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Questions & Answers */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* AI Generator */}
            <Card className="shadow-[0_2px_2px_0_#16803D] border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="bg-purple-100 w-8 h-8 rounded-lg flex items-center justify-center">
                    <PlusIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <span>AI Question Generator</span>
                </CardTitle>
                <CardDescription>
                  Generate questions automatically using AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm">
                    <Label>Show:</Label>
                    <Select
                      value={questionFilter}
                      onValueChange={(value) => setQuestionFilter(value as any)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="ai">AI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={aiDifficulty}
                      onValueChange={(value) => setAiDifficulty(value as any)}
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

                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select
                      value={aiQuestionType}
                      onValueChange={(value) => setAiQuestionType(value as any)}
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

                  <div className="space-y-2">
                    <Label>Number of questions</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={aiNumQuestions}
                      onChange={(e) =>
                        setAiNumQuestions(
                          Math.max(
                            1,
                            Math.min(20, parseInt(e.target.value || "1"))
                          )
                        )
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleGenerateAI}
                      disabled={aiLoading}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {aiLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating…
                        </>
                      ) : (
                        "Generate with AI"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Optional: Upload syllabus PDF for context</Label>
                  <div className="flex items-center justify-between rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-4 hover:border-[#16803D] transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        id="quiz-create-pdf"
                        type="file"
                        accept="application/pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const { pdfBase64, fileName, fileSize } =
                              await uploadPdfForAI(file);
                            setPdfBase64(pdfBase64);
                            setPdfName(fileName);
                            setPdfSize(fileSize);
                            toast.success("Syllabus loaded as AI context");
                          } catch (err: any) {
                            console.error(err);
                            toast.error(err?.message || "Failed to read PDF");
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="quiz-create-pdf"
                        className="inline-flex items-center px-3 py-2 bg-white border rounded-md text-sm cursor-pointer hover:bg-gray-50"
                      >
                        Choose PDF
                      </label>
                      {pdfName ? (
                        <Badge variant="secondary" className="bg-white">
                          {pdfName}
                          {pdfSize && ` (${(pdfSize / 1024).toFixed(1)} KB)`}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-500">
                          No file selected
                        </span>
                      )}
                    </div>
                    {pdfName && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPdfBase64(null);
                          setPdfName(null);
                          setPdfSize(null);
                        }}
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF up to 10MB. We'll use its text as AI context.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-800 text-base">
                  Quiz Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700 space-y-1">
                <p>
                  <strong>Title:</strong> {quizData.title}
                </p>
                <p>
                  <strong>Subject:</strong> {quizData.subject}
                </p>
                <p>
                  <strong>Grade Level:</strong>{" "}
                  {quizData.grade_level || "Not specified"}
                </p>
                <p>
                  <strong>Time Limit:</strong> {quizData.time_limit_minutes}{" "}
                  minutes
                </p>
                <p>
                  <strong>Questions:</strong> {questions.length}
                </p>
                <p>
                  <strong>Total Points:</strong> {totalPoints}
                </p>
              </CardContent>
            </Card>

            {/* Question Management */}
            <Card className="shadow-[0_2px_2px_0_#16803D] border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="bg-green-100 w-8 h-8 rounded-lg flex items-center justify-center">
                      <PlusIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <span>
                      Questions ({visibleQuestions.length}/{questions.length}{" "}
                      shown)
                    </span>
                  </CardTitle>
                  <Button
                    onClick={addQuestion}
                    disabled={questions.length >= 40}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Questions */}
                {visibleQuestions.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-gray-500 mb-4">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No questions yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Get started by adding manual questions or generating AI
                      questions
                    </p>
                    <div className="flex justify-center space-x-4">
                      <Button
                        onClick={addQuestion}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Manual Question
                      </Button>
                    </div>
                  </div>
                ) : (
                  visibleQuestions.map((question) => {
                    const originalIndex = questions.findIndex(
                      (q) => q === question
                    );
                    const questionIndex = originalIndex;
                    const isAI = (question as any).is_ai_generated;
                    const aiStatus = (question as any).ai_status as any;
                    return (
                      <Card key={questionIndex} className="mb-6">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-medium text-gray-900">
                                Question {questionIndex + 1}
                              </h4>
                              {isAI && (
                                <Badge
                                  variant={
                                    aiStatus === "approved"
                                      ? "default"
                                      : aiStatus === "pending"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className={
                                    aiStatus === "approved"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : aiStatus === "pending"
                                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                                  }
                                >
                                  AI {aiStatus || "pending"}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4">
                              <Select
                                value={question.question_type}
                                onValueChange={(value) =>
                                  updateQuestion(
                                    questionIndex,
                                    "question_type",
                                    value
                                  )
                                }
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="multiple_choice">
                                    Multiple Choice
                                  </SelectItem>
                                  <SelectItem value="true_false">
                                    True/False
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm text-gray-600">
                                  Points:
                                </Label>
                                <Input
                                  type="number"
                                  value={question.points}
                                  onChange={(e) =>
                                    updateQuestion(
                                      questionIndex,
                                      "points",
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className="w-16"
                                  min="1"
                                  max="100"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(questionIndex)}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                              {isAI && aiStatus === "pending" && (
                                <>
                                  <Button
                                    onClick={() =>
                                      approveAIQuestion(originalIndex)
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      discardAIQuestion(originalIndex)
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                                  >
                                    Discard
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Question Text */}
                          <div className="space-y-2">
                            <Label htmlFor={`question-${questionIndex}`}>
                              Question Text *
                            </Label>
                            <Textarea
                              id={`question-${questionIndex}`}
                              value={question.question_text}
                              onChange={(e) =>
                                updateQuestion(
                                  questionIndex,
                                  "question_text",
                                  e.target.value
                                )
                              }
                              rows={3}
                              placeholder="Enter your question here"
                            />
                          </div>

                          {/* Answers */}
                          <div className="space-y-3">
                            <Label>Answers *</Label>
                            <div className="space-y-3">
                              {question.answers.map((answer, answerIndex) => (
                                <div
                                  key={answerIndex}
                                  className="flex items-center space-x-3"
                                >
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setCorrectAnswer(
                                        questionIndex,
                                        answerIndex
                                      )
                                    }
                                    className={`w-6 h-6 rounded-full p-0 ${
                                      answer.is_correct
                                        ? "border-green-500 bg-green-500 text-white hover:bg-green-600"
                                        : "border-gray-300 hover:border-gray-400"
                                    }`}
                                  >
                                    {answer.is_correct && (
                                      <CheckIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Input
                                    type="text"
                                    value={answer.answer_text}
                                    onChange={(e) =>
                                      updateAnswer(
                                        questionIndex,
                                        answerIndex,
                                        "answer_text",
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Answer ${answerIndex + 1}`}
                                    className="flex-1"
                                  />
                                  {answer.is_correct && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-100 text-green-800"
                                    >
                                      Correct
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back to Quiz Details
              </Button>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Questions: {questions.length} | Total Points: {totalPoints}
                </div>
                <div className="relative group">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !validateStep2()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Creating Quiz...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Create Quiz
                      </>
                    )}
                  </Button>
                  {!validateStep2() && !loading && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      {getValidationReason()}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CreateQuizPage;
