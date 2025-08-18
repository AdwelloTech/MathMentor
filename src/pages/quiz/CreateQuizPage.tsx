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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GradeSelect } from "@/components/ui/GradeSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { quizService } from "@/lib/quizService";
import { getNoteSubjects } from "@/lib/notes";
import { generateAIQuestions, uploadPdfForAI } from "@/lib/ai";
import { getGradeLevelDisplayName } from "@/lib/gradeLevels";
import type {
  CreateQuizData,
  CreateQuestionData,
  CreateAnswerData,
} from "@/types/quiz";
import toast from "react-hot-toast";

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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/quizzes")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Quiz</h1>
              <p className="mt-2 text-sm text-gray-600">
                Create a new quiz with up to 40 questions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4">
        <div
          className={`flex items-center ${
            currentStep >= 1 ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep >= 1
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300"
            }`}
          >
            1
          </div>
          <span className="ml-2 text-sm font-medium">Quiz Details</span>
        </div>
        <div className="flex-1 h-px bg-gray-300"></div>
        <div
          className={`flex items-center ${
            currentStep >= 2 ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep >= 2
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300"
            }`}
          >
            2
          </div>
          <span className="ml-2 text-sm font-medium">Questions & Answers</span>
        </div>
      </div>

      {/* Step 1: Quiz Details */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Quiz Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title *
              </label>
              <Input
                type="text"
                value={quizData.title}
                onChange={(e) => updateQuizData("title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quiz title"
                maxLength={100}
                showCharCount
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <Select
                value={quizData.subject}
                onValueChange={(value) => updateQuizData("subject", value)}
              >
                <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              <GradeSelect
                value={quizData.grade_level}
                onChange={(value) => updateQuizData("grade_level", value)}
                placeholder="Select grade level"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                value={quizData.time_limit_minutes}
                onChange={(e) =>
                  updateQuizData("time_limit_minutes", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="180"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={quizData.description}
                onChange={(e) => updateQuizData("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quiz description (optional)"
                maxLength={500}
                showCharCount
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!validateStep1()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Questions & Answers
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Questions & Answers */}
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* AI Generator */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                AI Question Generator
              </h3>
              <div className="flex items-center space-x-2 text-sm">
                <label>Show:</label>
                <Select
                  value={questionFilter}
                  onValueChange={(value) => setQuestionFilter(value as any)}
                >
                  <SelectTrigger className="px-2 py-1 border border-gray-300 rounded-md">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <Select
                  value={aiDifficulty}
                  onValueChange={(value) => setAiDifficulty(value as any)}
                >
                  <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <Select
                  value={aiQuestionType}
                  onValueChange={(value) => setAiQuestionType(value as any)}
                >
                  <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={aiNumQuestions}
                  onChange={(e) =>
                    setAiNumQuestions(
                      Math.max(1, Math.min(20, parseInt(e.target.value || "1")))
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {aiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating…
                    </>
                  ) : (
                    "Generate with AI"
                  )}
                </button>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optional: Upload syllabus PDF for context
              </label>
              <div className="flex items-center justify-between rounded-md border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-3">
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
                    <span className="text-xs text-gray-700 bg-white border rounded-full px-2 py-1">
                      {pdfName}
                      {pdfSize && ` (${(pdfSize / 1024).toFixed(1)} KB)`}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      No file selected
                    </span>
                  )}
                </div>
                {pdfName && (
                  <button
                    onClick={() => {
                      setPdfBase64(null);
                      setPdfName(null);
                      setPdfSize(null);
                    }}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                PDF up to 10MB. We'll use its text as AI context.
              </p>
            </div>
          </div>
          {/* Quiz Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Quiz Summary
            </h3>
            <div className="text-sm text-blue-700">
              <p>
                <strong>Title:</strong> {quizData.title}
              </p>
              <p>
                <strong>Subject:</strong> {quizData.subject}
              </p>
              <p>
                <strong>Grade Level:</strong>{" "}
                {getGradeLevelDisplayName(quizData.grade_level)}
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
            </div>
          </div>

          {/* Question Management */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Questions ({visibleQuestions.length}/{questions.length} shown)
              </h3>
              <button
                onClick={addQuestion}
                disabled={questions.length >= 40}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Question
              </button>
            </div>

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
                  <button
                    onClick={addQuestion}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Manual Question
                  </button>
                </div>
              </div>
            ) : (
              visibleQuestions.map((question) => {
                const originalIndex = questions.findIndex(
                  (q) => q === question
                );
                const questionIndex = originalIndex; // use original index for updates
                const isAI = (question as any).is_ai_generated;
                const aiStatus = (question as any).ai_status as any;
                return (
                  <div
                    key={questionIndex}
                    className="border border-gray-200 rounded-lg p-6 mb-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        Question {questionIndex + 1}
                        {isAI && (
                          <span
                            className={`ml-2 text-xs px-2 py-1 rounded-full ${
                              aiStatus === "approved"
                                ? "bg-green-100 text-green-800"
                                : aiStatus === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            AI {aiStatus || "pending"}
                          </span>
                        )}
                      </h4>
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
                          <SelectTrigger className="px-3 py-1 border border-gray-300 rounded-md text-sm">
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
                          <span className="text-sm text-gray-600">Points:</span>
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) =>
                              updateQuestion(
                                questionIndex,
                                "points",
                                parseInt(e.target.value)
                              )
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                            min="1"
                            max="100"
                          />
                        </div>
                        <button
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-red-600 hover:text-red-900"
                          title="Remove Question"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        {isAI && aiStatus === "pending" && (
                          <>
                            <button
                              onClick={() => approveAIQuestion(originalIndex)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium"
                              title="Approve AI question"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => discardAIQuestion(originalIndex)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
                              title="Discard AI question"
                            >
                              Discard
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text *
                      </label>
                      <Textarea
                        value={question.question_text}
                        onChange={(e) =>
                          updateQuestion(
                            questionIndex,
                            "question_text",
                            e.target.value
                          )
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your question here"
                        maxLength={300}
                        showCharCount
                      />
                    </div>

                    {/* Answers */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Answers *
                      </label>
                      <div className="space-y-3">
                        {question.answers.map((answer, answerIndex) => (
                          <div
                            key={answerIndex}
                            className="flex items-center space-x-3"
                          >
                            <button
                              onClick={() =>
                                setCorrectAnswer(questionIndex, answerIndex)
                              }
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                answer.is_correct
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {answer.is_correct && (
                                <CheckIcon className="h-4 w-4" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Answer ${answerIndex + 1}`}
                                maxLength={150}
                              />
                            </div>
                            {answer.is_correct && (
                              <span className="text-sm text-green-600 font-medium flex-shrink-0">
                                Correct
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Back to Quiz Details
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Questions: {questions.length} | Total Points: {totalPoints}
              </div>
              <div className="relative group">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !validateStep2()}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                </button>
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
  );
};

export default CreateQuizPage;
