import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { quizService } from "@/lib/quizService";
import { subjectsService } from "@/lib/subjects";
import { generateAIQuestions, uploadPdfForAI } from "@/lib/ai";
import type { CreateQuizData, CreateQuestionData } from "@/types/quiz";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
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
import { getGradeLevelDisplayName } from "@/lib/gradeLevels";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type NoteSubject = {
  id: string;
  name: string;
  display_name: string;
  color: string;
};

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

  // Multiple-PDF support (already referenced elsewhere in the file)
  const [pdfs, setPdfs] = useState<
    Array<{ pdfBase64: string; fileName: string; fileSize: number }>
  >([]);

  // Also referenced by the uploader UI; define these so TS/JSX compiles
  const [_pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [_pdfName, setPdfName] = useState<string | null>(null);
  const [_pdfSize, setPdfSize] = useState<number | null>(null);

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
        const subjectsData = await subjectsService.listActive();
        // Map Subject[] to NoteSubject[] with proper type handling
        const mappedSubjects: NoteSubject[] = subjectsData.map((s) => ({
          id: s.id,
          name: s.name,
          display_name: s.display_name,
          color: s.color || "", // Handle null/undefined color by defaulting to empty string
        }));
        setSubjects(mappedSubjects);
      } catch (error) {
        console.error("Error loading subjects:", error);
      }
    };
    loadSubjects();
  }, []);

  // Questions data - start with 0 questions, can add up to 40
  const [questions, setQuestions] = useState<CreateQuestionData[]>([]);

  // Helper function to get the next question order
  const getNextQuestionOrder = () => {
    if (questions.length === 0) return 1;
    const maxOrder = Math.max(...questions.map(q => q.question_order || 0));
    return maxOrder + 1;
  };

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
              answers: (q.answers ?? []).map((a, aIndex) =>
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
              answers: (q.answers ?? []).map((a, aIndex) => ({
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
      question_order: getNextQuestionOrder(),
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
      const ai: AIQuestion[] = await generateAIQuestions({
        subject: quizData.subject,
        gradeLevel: quizData.grade_level || undefined,
        numQuestions: aiNumQuestions,
        difficulty: aiDifficulty,
        questionType: aiQuestionType,
        title: quizData.title || undefined,
        pdfs: pdfs.length > 0 ? pdfs : undefined,
      });

      // Calculate the starting order for AI questions
      const currentMaxOrder = questions.length === 0 ? 0 : Math.max(...questions.map(q => q.question_order || 0));

      const mapped = ai.map((q: AIQuestion, idx: number) => ({
        question_text: q.question_text,
        question_type: q.question_type,
        points: q.points ?? 10,
        question_order: currentMaxOrder + idx + 1,
        is_ai_generated: true,
        ai_status: (q.ai_status || "pending") as
          | "approved"
          | "pending"
          | "discarded"
          | undefined,
        ai_metadata: q.ai_metadata,
        answers: (q.answers ?? []).map((a: any, i: number) => ({
          answer_text: a.answer_text,
          is_correct: a.is_correct,
          answer_order: i + 1,
        })),
      })) as CreateQuestionData[];
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
    return quizData.title.trim() !== "" && quizData.subject.trim() !== "";
  };

  const getValidationReason = () => {
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
        !(q.answers ?? []).some((a) => a.is_correct) ||
        (q.answers ?? []).some((a) => a.answer_text.trim() === "")
    );

    if (incompleteQuestions.length > 0) {
      return "Complete all questions and ensure each has a correct answer";
    }

    return "";
  };

  const validateStep2 = () => {
    const pendingAIQuestions = questions.filter((q) => {
      const isAI = (q as any).is_ai_generated === true;
      const status = (q as any).ai_status as any;
      return isAI && status === "pending";
    });

    if (pendingAIQuestions.length > 0) {
      return false;
    }

    const included = questions.filter((q) => {
      const isAI = (q as any).is_ai_generated === true;
      const status = (q as any).ai_status as any;
      return !isAI || status === "approved";
    });

    if (included.length === 0) {
      return false;
    }

    return included.every(
      (q) =>
        q.question_text.trim() !== "" &&
        (q.answers ?? []).some((a) => a.is_correct) &&
        (q.answers ?? []).every((a) => a.answer_text.trim() !== "")
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

      const createQuizData: CreateQuizData = {
        title: quizData.title,
        description: quizData.description,
        subject: quizData.subject,
        gradeLevelId: quizData.grade_level,
        timeLimit: quizData.time_limit_minutes,
        totalQuestions: included.length,
        questions: included,
        // Default values for required fields
        difficulty: 'medium',
        questionType: 'multiple_choice',
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

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <div className="min-h-screen bg-background relative overflow-auto -mx-4 sm:-mx-6 lg:-mx-8 -my-10 px-4 sm:px-6 lg:px-8 py-10">
      {/* Full page background */}
      <div className="fixed inset-0 bg-background -z-10" />

      {/* Animated background elements */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]" />

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

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 space-y-8 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={() => navigate("/quizzes")}
              className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-green-400">Create Quiz</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create a new quiz with up to 40 questions
          </p>
        </motion.div>

        {/* Progress Steps + Step 1 Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-center space-x-4">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Quiz Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Quiz Title *
              </label>
              <Input
                type="text"
                value={quizData.title}
                onChange={(e) => updateQuizData("title", e.target.value)}
                className="w-full px-3 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter quiz title"
                maxLength={100}
                showCharCount
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subject *
              </label>
              <Select
                value={quizData.subject}
                onValueChange={(value) => updateQuizData("subject", value)}
              >
                <SelectTrigger className="w-full px-3 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
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
              <label className="block text-sm font-medium text-foreground mb-2">
                Grade Level
              </label>
              <GradeSelect
                value={quizData.grade_level}
                onChange={(value) => updateQuizData("grade_level", value)}
                placeholder="Select grade level"
                className="w-full px-3 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                value={quizData.time_limit_minutes}
                onChange={(e) => {
                  const parsed = Number.parseInt(e.target.value, 10);
                  const next = Number.isNaN(parsed)
                    ? 1
                    : Math.min(180, Math.max(1, parsed));
                  updateQuizData("time_limit_minutes", next);
                }}
                className="w-full px-3 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                min={1}
                max={180}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <Textarea
                value={quizData.description}
                onChange={(e) => updateQuizData("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter quiz description (optional)"
                maxLength={500}
                showCharCount
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!validateStep1()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  1
                </button>
                <span className="text-sm font-medium">Quiz Details</span>
              </div>

              <div className="flex-1 max-w-md mx-4 h-px bg-gray-300" />

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
                  Questions &amp; Answers
                </span>
              </div>
            </div>

            {/* Next Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!validateStep1()}
                className="bg-[#16803D] hover:bg-[#126A32] text-white py-2 px-6 rounded-lg font-medium transition-colors"
              >
                Next: Add Questions
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Step 2: Questions & Answers */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* AI Generator */}
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  AI Question Generator
                </h3>
                <div className="flex items-center space-x-2 text-sm">
                  <label>Show:</label>
                  <Select
                    value={questionFilter}
                    onValueChange={(value) => setQuestionFilter(value as any)}
                  >
                    <SelectTrigger className="px-2 py-1 border border-border rounded-md">
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Difficulty
                  </label>
                  <Select
                    value={aiDifficulty}
                    onValueChange={(value) => setAiDifficulty(value as any)}
                  >
                    <SelectTrigger className="w-full px-3 py-2 border border-border rounded-md">
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Question Type
                  </label>
                  <Select
                    value={aiQuestionType}
                    onValueChange={(value) => setAiQuestionType(value as any)}
                  >
                    <SelectTrigger className="w-full px-3 py-2 border border-border rounded-md">
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Number of questions
                  </label>
                  <input
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
                    className="w-full px-3 py-2 border border-border rounded-md"
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
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Generating…
                      </>
                    ) : (
                      "Generate with AI"
                    )}
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Optional: Upload syllabus PDF for context
                </label>
                <div className="flex items-center justify-between rounded-md border-2 border-dashed border-border bg-card px-3 py-3">
                  <div className="flex items-center gap-3">
                    <input
                      id="quiz-create-pdf"
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={async (e) => {
                        const files = e.target.files
                          ? Array.from(e.target.files)
                          : [];
                        if (files.length === 0) return;

                        if (files.length > 10) {
                          toast.error(
                            "Maximum 10 PDF files allowed per selection"
                          );
                          return;
                        }

                        try {
                          const currentCount = pdfs.length;
                          if (currentCount + files.length > 10) {
                            toast.error(
                              "You can upload up to 10 PDFs in total"
                            );
                            return;
                          }

                          const result = await uploadPdfForAI(files);
                          const added = (result.pdfs || []).map((p: any) => ({
                            pdfBase64: p.pdfBase64,
                            fileName: p.fileName,
                            fileSize: p.fileSize,
                          }));
                          if (added.length > 0) {
                            const last = added[added.length - 1];
                            setPdfBase64(last.pdfBase64);
                            setPdfName(last.fileName);
                            setPdfSize(last.fileSize);

                            setPdfs((prev) => [...prev, ...added]);

                            const newTotal = currentCount + added.length;
                            if (newTotal === 1) {
                              toast.success("1 PDF loaded as AI context");
                            } else {
                              toast.success(
                                `${added.length} PDF${
                                  added.length > 1 ? "s" : ""
                                } added to AI context (Total: ${newTotal}/10)`
                              );
                            }
                          }
                        } catch (err: any) {
                          console.error(err);
                          toast.error(err?.message || "Failed to read PDF");
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="quiz-create-pdf"
                      className="inline-flex items-center px-3 py-2 bg-muted border rounded-md text-sm cursor-pointer hover:bg-muted/80"
                    >
                      Choose PDFs (up to 10)
                    </label>
                    {pdfs.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {pdfs.map((pdf, index) => (
                          <span
                            key={`${pdf.fileName}-${index}`}
                            className="text-xs text-muted-foreground bg-muted border rounded-full px-2 py-1 flex items-center gap-1"
                          >
                            {pdf.fileName} ({Math.round(pdf.fileSize / 1024)}{" "}
                            KB)
                            <button
                              onClick={() =>
                                setPdfs((prev) =>
                                  prev.filter((_, i) => i !== index)
                                )
                              }
                              className="ml-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full w-4 h-4 flex items-center justify-center"
                              title="Remove PDF"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No files selected
                      </span>
                    )}
                  </div>
                  {pdfs.length > 0 && (
                    <button
                      onClick={() => {
                        setPdfBase64(null);
                        setPdfName(null);
                        setPdfSize(null);
                        setPdfs([]);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDFs up to 10MB each, maximum 10 files. We'll use their text
                  as AI context.
                </p>
              </div>
            </div>

            {/* Quiz Summary */}
            <div className="bg-blue-700/20 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Quiz Summary
              </h3>
              <div className="text-sm text-blue-400">
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
            <Card className="border border-border shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="bg-green-600/20 w-8 h-8 rounded-lg flex items-center justify-center">
                      <PlusIcon className="w-4 h-4 text-green-400" />
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
                {visibleQuestions.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                    <div className="text-muted-foreground mb-4">
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
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No questions yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
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
                              <h4 className="text-lg font-medium text-foreground">
                                Question {question.question_order || questionIndex + 1}
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
                                      ? "bg-green-600/20 text-green-800 hover:bg-green-600/20"
                                      : aiStatus === "pending"
                                      ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-100"
                                      : "bg-muted text-muted-foreground hover:bg-muted"
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
                                <SelectTrigger className="px-3 py-1 border border-border rounded-md text-sm">
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
                                <span className="text-sm text-muted-foreground">
                                  Points:
                                </span>
                                <input
                                  type="number"
                                  value={question.points}
                                  onChange={(e) => {
                                    const parsed = Number.parseInt(
                                      e.target.value,
                                      10
                                    );
                                    const next = Number.isNaN(parsed)
                                      ? 1
                                      : Math.min(100, Math.max(1, parsed));
                                    updateQuestion(
                                      questionIndex,
                                      "points",
                                      next
                                    );
                                  }}
                                  className="w-16 px-2 py-1 border border-border rounded-md text-sm"
                                  min={1}
                                  max={100}
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
                                    onClick={() =>
                                      approveAIQuestion(originalIndex)
                                    }
                                    className="px-3 py-1 bg-green-600/20 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium"
                                    title="Approve AI question"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      discardAIQuestion(originalIndex)
                                    }
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
                                    title="Discard AI question"
                                  >
                                    Discard
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-foreground mb-2">
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
                              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Enter your question here"
                              maxLength={300}
                              showCharCount
                            />
                          </div>

                          {/* Answers */}
                          <div className="space-y-3">
                            <Label>Answers *</Label>
                            <div className="space-y-3">
                              {(question.answers ?? []).map(
                                (answer, answerIndex) => (
                                  <div
                                    key={answerIndex}
                                    className="flex items-center space-x-3 w-full"
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
                                          ? "border-green-500 bg-green-600 text-white hover:bg-green-600"
                                          : "border-gray-300 hover:border-gray-400"
                                      }`}
                                    >
                                      {answer.is_correct && (
                                        <CheckIcon className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <div className="flex-1">
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
                                        placeholder={`Answer ${
                                          answerIndex + 1
                                        }`}
                                        className="w-full"
                                      />
                                    </div>
                                    {answer.is_correct && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-600/20 text-green-800"
                                      >
                                        Correct
                                      </Badge>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* Show selected PDFs (if any) */}
                          <div className="mt-4">
                            {pdfs.length > 0 ? (
                              <div className="space-y-2 text-sm text-muted-foreground">
                                {pdfs.map((pdf, index) => (
                                  <div
                                    key={`${pdf.fileName}-${index}`}
                                    className="flex items-center"
                                  >
                                    <span>
                                      {pdf.fileName} (
                                      {(pdf.fileSize / 1024).toFixed(1)} KB)
                                    </span>
                                    <button
                                      onClick={() =>
                                        setPdfs((prev) =>
                                          prev.filter((_, i) => i !== index)
                                        )
                                      }
                                      className="ml-2 text-slate-400 hover:text-red-500"
                                      title="Remove PDF"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => setPdfs([])}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Clear All
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No files selected
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              PDFs up to 10MB each, maximum 10 files. We'll use
                              their text as AI context.
                            </p>
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
                className="border-border text-muted-foreground hover:bg-muted"
              >
                Back to Quiz Details
              </Button>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
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
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      {getValidationReason()}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover" />
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
