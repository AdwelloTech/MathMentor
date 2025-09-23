import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
import { Search, Star, Sparkles } from "lucide-react";
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
import { quizService } from "@/lib/lib/quizService";
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
          const res1 = await ((supabase as any)
            .from("note_subjects")
            .select("*")
            .limit(200)
            ._exec() as Promise<{ data?: any[]; error?: any }>);
          if (!res1?.error) {
            normalizedSubjects = normalizeSubjects(res1?.data as any[]);
          }
        } catch {
          /* ignore */
        }
      }
      if (normalizedSubjects.length === 0) {
        try {
          const res2 = await ((supabase as any)
            .from("subjects")
            .select("*")
            .limit(200)
            ._exec() as Promise<{ data?: any[]; error?: any }>);
          if (!res2?.error) {
            normalizedSubjects = normalizeSubjects(res2?.data as any[]);
          }
        } catch {
          /* ignore */
        }
      }

      setAllQuizzes(Array.isArray(quizzesData) ? quizzesData as Quiz[] : []);
      setQuizzes(Array.isArray(quizzesData) ? quizzesData as Quiz[] : []);
      setSubjects(normalizedSubjects); //z ✅ never undefined
    } catch (error) {
      console.error("Error loading data:", error);
      // toast.error("Failed to load quizzes");
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
      <StudentPageWrapper backgroundClass="bg-[#0f172a]">
        <div
          className="min-h-screen relative overflow-hidden"
          style={{
            background:
              "radial-gradient(1000px 600px at 50% -100px, rgba(255,255,255,0.08), transparent)",
          }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner />
          </div>
        </div>
      </StudentPageWrapper>
    );
  }

  return (
    <StudentPageWrapper backgroundClass="bg-[#0f172a]">
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          background:
            "radial-gradient(1000px 600px at 50% -100px, rgba(255,255,255,0.08), transparent)",
        }}
      >
        <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-900/90 rounded-lg shadow-sm shadow-black/30">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold text-yellow-300 drop-shadow-md tracking-tight">
                    Quiz Center
                  </h1>
                  <Badge
                    variant="outline"
                    className="border-yellow-300/40 text-yellow-300 mt-2 bg-green-900/60"
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    Learning Hub
                  </Badge>
                </div>
              </div>
              <p className="text-lg text-white/90 max-w-2xl drop-shadow">
                Challenge yourself with quizzes created by your expert tutors.
                Test your knowledge and track your progress across different subjects.
              </p>
            </div>
            <Button
              onClick={() => navigate("/student/ai-generate-quiz")}
              className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold shadow-lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              AI Quiz Generator
              <Star className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>

        {/* Search and Filter (Fantasy wood panel) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 rounded-2xl shadow-2xl border border-yellow-400/30"
          style={{
            background:
              "linear-gradient(180deg, rgba(120,53,15,0.95), rgba(100,44,12,0.95)), repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 6px, rgba(0,0,0,0.08) 6px, rgba(0,0,0,0.08) 12px)",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div className="px-6 pt-8">
            <h2 className="text-2xl font-extrabold text-yellow-300 flex items-center gap-2 drop-shadow">
              <Filter className="w-5 h-5 text-yellow-300" />
              Search & Filter
            </h2>
            <p className="text-white/90 mt-1">
              Find the perfect quiz to challenge your knowledge
            </p>
          </div>
          <div className="px-6 pb-8 pt-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium text-white">
                  Search Quizzes
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by title, description, subject, or tutor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/90 backdrop-blur placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Subject Filter */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium text-white">
                  Filter by Subject
                </Label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger className="bg-white/90 backdrop-blur">
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
              <div className="border border-yellow-300/40 bg-yellow-200/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-200 font-medium">
                    Showing filtered results
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="bg-white/90"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Available Quizzes
                  </p>
                  <p className="text-3xl font-extrabold text-yellow-300 drop-shadow">
                    {quizzes.length}
                  </p>
                </div>
                <div className="p-3 bg-green-900/80 rounded-lg shadow-inner">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Subjects</p>
                  <p className="text-3xl font-extrabold text-yellow-300 drop-shadow">
                    {new Set(quizzes.map((q) => q.subject)).size}
                  </p>
                </div>
                <div className="p-3 bg-green-900/80 rounded-lg shadow-inner">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Avg Time Limit
                  </p>
                  <p className="text-3xl font-extrabold text-yellow-300 drop-shadow">
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
                <div className="p-3 bg-green-900/80 rounded-lg shadow-inner">
                  <Clock className="h-6 w-6 text-white" />
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
            <Card className="bg-green-950/30 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
              <CardContent className="p-16 text-center">
                <div className="space-y-6">
                  <div className="relative mx-auto w-24 h-24">
                    <BookOpen className="h-24 w-24 text-muted-foreground/50 mx-auto" />
                    <div className="absolute -top-2 -right-2 p-2 bg-yellow-400 rounded-full">
                      <Search className="h-4 w-4 text-green-900" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-yellow-300">
                      No quizzes available
                    </h3>
                    <p className="text-white/80 text-lg max-w-md mx-auto">
                      {allQuizzes.length === 0
                        ? "Start your learning journey by booking a session with one of our expert tutors!"
                        : "No quizzes match your search criteria. Try adjusting your filters or search terms."}
                    </p>
                  </div>
                  {allQuizzes.length === 0 && (
                    <Button
                      onClick={() => navigate("/student/book-session")}
                      className="bg-green-900 hover:bg-green-800 text-white"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Book Your First Session
                      <Play className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
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
                  <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl h-full flex flex-col hover:shadow-2xl hover:shadow-green-900/20 transition-all duration-300">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-yellow-300 text-xl line-clamp-2 mb-2 drop-shadow">
                        {quiz.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-4">
                      {/* Quiz Details */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-[#D5FFC5] rounded-[10px] shadow-sm">
                          <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black truncate">
                              {quiz.tutor?.full_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-[#D5FFC5] rounded-[10px] shadow-sm">
                          <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black truncate">
                              {quiz.subject}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-[#D5FFC5] rounded-[10px] shadow-sm">
                          <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                            <Clock className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black">
                              {quiz.time_limit_minutes ?? 0} minutes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-[#D5FFC5] rounded-[10px] shadow-sm">
                          <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black">
                              {quiz.total_questions ?? 0} questions
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quiz Status & Action */}
                      <div className="mt-auto pt-4">
                        {quiz.attempt_status === "completed" ? (
                          <Button
                            onClick={() =>
                              navigate(
                                `/student/quiz-results/${quiz.attempt_id}`
                              )
                            }
                            className="w-full bg-yellow-400 text-green-900 hover:bg-yellow-500 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            View Results
                          </Button>
                        ) : quiz.attempt_status === "in_progress" ? (
                          <Button
                            onClick={() =>
                              navigate(`/student/take-quiz/${quiz.attempt_id}`)
                            }
                            className="w-full bg-yellow-400 text-green-900 hover:bg-yellow-500 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Continue Quiz
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleStartQuiz(quiz.id)}
                            className="w-full bg-yellow-400 text-green-900 hover:bg-yellow-500 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
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
      </div>
    </StudentPageWrapper>
  );
};

export default StudentQuizDashboard;
