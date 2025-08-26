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
    "multiple_choice" | "true_false" | "short_answer"
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
        qIndex === questionIndex && q.question_type !== "short_answer"
          ? {
              ...q,
              answers: q.answers.map((a: any, aIndex: number) =>
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
        qIndex === questionIndex && q.question_type !== "short_answer"
          ? {
              ...q,
              answers: q.answers.map((a: any, aIndex: number) => ({
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
      const mapped = ai.map((q: any, idx: number) => ({
        question_text: q.question_text,
        question_type: q.question_type,
        points: q.points ?? 10,
        question_order: questions.length + idx + 1,
        is_ai_generated: true,
        ai_status: q.ai_status || "pending",
        ai_metadata: q.ai_metadata,
        answers:
          q.question_type === "short_answer"
            ? []
            : (q.answers ?? []).map((a: any, i: number) => ({
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

    const incompleteQuestions = included.filter((q) => {
      const emptyText = q.question_text.trim() === "";
      if (q.question_type === "short_answer") return emptyText;
      return (
        emptyText ||
        !q.answers?.some((a) => a.is_correct) ||
        q.answers?.some((a) => a.answer_text.trim() === "")
      );
    });

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

    return included.every((q) => {
      const hasText = q.question_text.trim() !== "";
      if (q.question_type === "short_answer") return hasText;
      return (
        hasText &&
        q.answers?.some((a) => a.is_correct) &&
        q.answers?.every((a) => a.answer_text.trim() !== "")
      );
    });
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

      if (!profile?.id) {
        toast.error("You must be signed in to create a quiz.");
        return;
      }
      await quizService.quizzes.create(profile.id, createQuizData);
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
              <input
                type="text"
                value={quizData.title}
                onChange={(e) => updateQuizData("title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quiz title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={quizData.subject}
                onChange={(e) => updateQuizData("subject", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.name}>
                    {subject.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              <input
                type="text"
                value={quizData.grade_level}
                onChange={(e) => updateQuizData("grade_level", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Grade 10, High School"
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
              <textarea
                value={quizData.description}
                onChange={(e) => updateQuizData("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quiz description (optional)"
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
                <select
                  value={questionFilter}
                  onChange={(e) => setQuestionFilter(e.target.value as any)}
                  className="px-2 py-1 border border-gray-300 rounded-md"
                >
                  <option value="all">All</option>
                  <option value="manual">Manual</option>
                  <option value="ai">AI</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={aiQuestionType}
                  onChange={(e) => setAiQuestionType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
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
                        <select
                          value={question.question_type}
                          onChange={(e) => {
                            const nextType = e.target.value as
                              | "multiple_choice"
                              | "true_false"
                              | "short_answer";
                            setQuestions((prev) =>
                              prev.map((q, idx) => {
                                if (idx !== questionIndex) return q;
                                if (nextType === "short_answer") {
                                  return {
                                    ...q,
                                    question_type: nextType,
                                    answers: [],
                                  };
                                }
                                // Seed defaults when moving into MC/TF
                                if (nextType === "true_false") {
                                  return {
                                    ...q,
                                    question_type: nextType,
                                    answers: [
                                      {
                                        answer_text: "True",
                                        is_correct: true,
                                        answer_order: 1,
                                      },
                                      {
                                        answer_text: "False",
                                        is_correct: false,
                                        answer_order: 2,
                                      },
                                    ],
                                  };
                                }
                                // multiple_choice: 4 options with placeholders; mark first as correct
                                return {
                                  ...q,
                                  question_type: nextType,
                                  answers: [
                                    {
                                      answer_text: "Option 1",
                                      is_correct: true,
                                      answer_order: 1,
                                    },
                                    {
                                      answer_text: "Option 2",
                                      is_correct: false,
                                      answer_order: 2,
                                    },
                                    {
                                      answer_text: "Option 3",
                                      is_correct: false,
                                      answer_order: 3,
                                    },
                                    {
                                      answer_text: "Option 4",
                                      is_correct: false,
                                      answer_order: 4,
                                    },
                                  ],
                                };
                              })
                            );
                          }}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="multiple_choice">
                            Multiple Choice
                          </option>
                          <option value="true_false">True/False</option>
                          <option value="short_answer">Short Answer</option>
                        </select>
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
                      <textarea
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
                      />
                    </div>

                    {/* Answers (MC/TF only) */}
                    {question.question_type !== "short_answer" && (
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
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  answer.is_correct
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-gray-300 hover:border-gray-400"
                                }`}
                              >
                                {answer.is_correct && (
                                  <CheckIcon className="h-4 w-4" />
                                )}
                              </button>
                              <input
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
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Answer ${answerIndex + 1}`}
                              />
                              {answer.is_correct && (
                                <span className="text-sm text-green-600 font-medium">
                                  Correct
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
