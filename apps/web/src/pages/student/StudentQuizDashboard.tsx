import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SparklesIcon } from "@heroicons/react/24/outline";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import {
  Filter,
  Clock,
  User,
  BookOpen,
  CheckCircle,
  Play,
  GraduationCap,
  X,
} from "lucide-react";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StudentPageWrapper from "@/components/ui/StudentPageWrapper";
import { quizService } from "@/lib/quizService";
import { subjectsService } from "@/lib/subjects";
import type { Quiz } from "@/types/quiz";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase"; // ⬅️ fallback fetches use our axios-backed client

type NoteSubject = {
  id: string;
  name: string;
  display_name: string;
  color: string;
};

// ---------- helpers ----------
type RawSubject = any;
const normalizeSubjects = (
  arr: RawSubject[] | undefined | null
): NoteSubject[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((s) => ({
      id: String(s.id ?? s._id ?? s.uuid ?? s.code ?? s.name ?? ""),
      name: String(s.name ?? s.code ?? "").trim(),
      display_name: String(s.display_name ?? s.name ?? s.code ?? "Subject"),
      color: s.color ?? "#16a34a",
    }))
    .filter((s) => s.id && s.name);
};

const StudentQuizDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<NoteSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  useEffect(() => {
    if (user) void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!user) return;

      console.log("Loading quizzes for user:", user.id);

      const [quizzesData, subjectsDataRaw] = await Promise.all([
        quizService.studentQuizzes.getAvailableQuizzes(user.id),
        subjectsService.listActive(), // may be undefined in your current wiring
      ]);

      console.log("Quizzes loaded:", quizzesData);
      console.log("Subjects loaded:", subjectsDataRaw);

      // normalize subjects from service
      let normalizedSubjects = normalizeSubjects(subjectsDataRaw as any[]);

      // ----- fallbacks if the service returns nothing -----
      if (normalizedSubjects.length === 0) {
        try {
          const res1 = await (supabase as any)
            .from("note_subjects")
            .select("*")
            .limit(200)
            ._exec<any[]>();
          if (!res1?.error) {
            normalizedSubjects = normalizeSubjects(res1?.data as any[]);
          }
        } catch {
          /* ignore */
        }
      }
      if (normalizedSubjects.length === 0) {
        try {
          const res2 = await (supabase as any)
            .from("subjects")
            .select("*")
            .limit(200)
            ._exec<any[]>();
          if (!res2?.error) {
            normalizedSubjects = normalizeSubjects(res2?.data as any[]);
          }
        } catch {
          /* ignore */
        }
      }

      setAllQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
      setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
      setSubjects(normalizedSubjects); // ✅ never undefined
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load quizzes");
      setAllQuizzes([]);
      setQuizzes([]);
      setSubjects([]); // ✅ keep UI safe
    } finally {
      setLoading(false);
    }
  };

  // Real-time filtering effect
  useEffect(() => {
    const filterQuizzes = () => {
      let filtered = [...allQuizzes];

      // Filter by search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(
          (quiz) =>
            (quiz.title || "").toLowerCase().includes(term) ||
            (quiz.description || "").toLowerCase().includes(term) ||
            (quiz.subject || "").toLowerCase().includes(term) ||
            (quiz.tutor?.full_name || "").toLowerCase().includes(term)
        );
      }

      // Filter by subject
      if (selectedSubject && selectedSubject !== "all") {
        filtered = filtered.filter((quiz) => quiz.subject === selectedSubject);
      }

      setQuizzes(filtered);
    };

    filterQuizzes();
  }, [searchTerm, selectedSubject, allQuizzes]);

  const handleStartQuiz = async (quizId: string) => {
    try {
      const quiz = allQuizzes.find((q) => q.id === quizId);
      if (quiz?.attempt_status === "completed") {
        toast.error("You have already completed this quiz");
        return;
      }

      const attempt = await quizService.studentQuizzes.startQuizAttempt(
        quizId,
        user!.id
      );

      navigate(`/student/take-quiz/${attempt.id}`);
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast.error("Failed to start quiz");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSubject("all");
  };

  const hasActiveFilters =
    !!searchTerm.trim() || (selectedSubject && selectedSubject !== "all");

  if (loading) {
    return (
      <StudentPageWrapper backgroundClass="bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </StudentPageWrapper>
    );
  }

  return (
    <StudentPageWrapper backgroundClass="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-green-900 mb-3">
                Study
              </h1>
              <p className="text-lg text-gray-700">
                Quizzes and flash cards from your tutors
              </p>
            </div>
            <Button
              onClick={() => navigate("/student/ai-generate-quiz")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              AI Quiz Generator
            </Button>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-green-900/60 border-2 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-gray-700 font-medium">
                    Search Quizzes
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-900" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search quizzes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-700 focus:border-gray-900 focus:ring-gray-900"
                    />
                  </div>
                </div>

                {/* Subject Filter */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-gray-900 font-medium">
                    Filter by Subject
                  </Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                  >
                    <SelectTrigger className="border-gray-700 focus:border-gray-900 focus:ring-gray-900">
                      <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {(subjects ?? []).map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          {subject.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="mt-6 flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-700 font-medium">
                    Showing filtered results
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="border-green-900/60 border-2 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-900 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">
                    Available Quizzes
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {quizzes.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-900/60 border-2 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-900 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">Subjects</p>
                  <p className="text-2xl font-bold text-green-900">
                    {new Set(quizzes.map((q) => q.subject)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-900/60 border-2 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-900 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">
                    Avg Time Limit
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {quizzes.length > 0
                      ? Math.round(
                          quizzes.reduce(
                            (sum, q) => sum + (q.time_limit_minutes || 0),
                            0
                          ) / quizzes.length
                        )
                      : 0}{" "}
                    min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quizzes List */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {quizzes.length === 0 ? (
            <Card className="border-green-200 bg-white">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-20 w-20 text-green-300 mx-auto mb-6" />
                <CardTitle className="text-2xl text-green-900 mb-3">
                  No quizzes available
                </CardTitle>
                <CardDescription className="text-green-700 text-lg mb-6">
                  {allQuizzes.length === 0
                    ? "You haven't booked any sessions with tutors yet. Book a session to access their quizzes!"
                    : "No quizzes match your search criteria. Try adjusting your filters."}
                </CardDescription>
                {allQuizzes.length === 0 && (
                  <Button
                    onClick={() => navigate("/student/book-session")}
                    className="bg-green-900 hover:bg-green-800 text-white font-semibold px-8 py-3"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Book Your First Session
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-green-900/60 border-2 bg-white hover:shadow-lg transition-all duration-200 h-[320px] flex flex-col p-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-green-900 text-xl line-clamp-2 mb-2">
                        {quiz.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-4">
                      {/* Quiz Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 rounded-lg">
                          <User className="h-4 w-4 text-gray-700" />
                          <span className="text-sm text-gray-700 font-medium">
                            {quiz.tutor?.full_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                          <BookOpen className="h-4 w-4 text-gray-700" />
                          <span className="text-sm font-medium">
                            {quiz.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                          <Clock className="h-4 w-4 text-gray-700" />
                          <span className="text-sm font-medium">
                            {quiz.time_limit_minutes ?? 0} minutes
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                          <CheckCircle className="h-4 w-4 text-gray-700" />
                          <span className="text-sm font-medium">
                            {quiz.total_questions ?? 0} questions
                          </span>
                        </div>
                      </div>

                      {/* Quiz Status & Action */}
                      <div className="mt-auto pt-4">
                        {quiz.attempt_status === "completed" ? (
                          <div className="space-y-3">
                            <Button
                              onClick={() =>
                                navigate(
                                  `/student/quiz-results/${quiz.attempt_id}`
                                )
                              }
                              className="w-full bg-green-900 hover:bg-green-800 text-white font-semibold"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              View Results
                            </Button>
                          </div>
                        ) : quiz.attempt_status === "in_progress" ? (
                          <Button
                            onClick={() =>
                              navigate(`/student/take-quiz/${quiz.attempt_id}`)
                            }
                            className="w-full bg-green-900 hover:bg-green-800 text-white font-semibold"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Continue Quiz
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleStartQuiz(quiz.id)}
                            className="w-full bg-green-900 hover:bg-green-800 text-white font-semibold"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Quiz
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </StudentPageWrapper>
  );
};

export default StudentQuizDashboard;
