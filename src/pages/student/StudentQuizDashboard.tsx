import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpenIcon,
  SparklesIcon,
  ArrowRightIcon,
  AcademicCapIcon,
  ClockIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  TrophyIcon,
  PlayIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

import StudentPageWrapper from "@/components/ui/StudentPageWrapper";
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
import { quizService } from "@/lib/quizService";
import { subjectsService } from "@/lib/subjects";
import type { Quiz } from "@/types/quiz";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

type NoteSubject = {
  id: string;
  name: string;
  display_name: string;
  color: string;
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
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("Loading quizzes for user:", user!.id);

      const [quizzesData, subjectsData] = await Promise.all([
        quizService.studentQuizzes.getAvailableQuizzes(user!.id),
        subjectsService.listActive(),
      ]);

      console.log("Quizzes loaded:", quizzesData);
      console.log("Subjects loaded:", subjectsData);

      setAllQuizzes(quizzesData);
      setQuizzes(quizzesData);
      setSubjects(subjectsData as any);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load quizzes");
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
            quiz.title?.toLowerCase().includes(term) ||
            quiz.description?.toLowerCase().includes(term) ||
            quiz.subject?.toLowerCase().includes(term) ||
            quiz.tutor?.full_name?.toLowerCase().includes(term)
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
      // Check quiz status
      const quiz = allQuizzes.find((q) => q.id === quizId);
      if (quiz?.attempt_status === "completed") {
        toast.error("You have already completed this quiz");
        return;
      }
      if (quiz?.attempt_expired) {
        toast.error("This quiz attempt has expired. Please start a new attempt.");
        return;
      }

      // Start the quiz attempt
      const attempt = await quizService.studentQuizzes.startQuizAttempt(quizId);

      // Navigate to the quiz taking page
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
    searchTerm.trim() || (selectedSubject && selectedSubject !== "all");

  if (loading) {
    return (
      <StudentPageWrapper backgroundClass="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-10 w-64 mb-3" />
              <Skeleton className="h-6 w-96" />
            </div>
            <Skeleton className="h-12 w-48 rounded-lg" />
          </div>

          {/* Filter Card Skeleton */}
          <Card className="shadow-lg border-border bg-card">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="shadow-lg border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="ml-4 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quiz Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="shadow-lg border-border bg-card">
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <div className="pt-4">
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </StudentPageWrapper>
    );
  }

  return (
    <StudentPageWrapper backgroundClass="bg-background" className="text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                My Quizzes
              </h1>
              <p className="text-lg text-muted-foreground">
                Test your knowledge with quizzes from your tutors.
              </p>
            </div>
            <Button
              onClick={() => navigate("/student/ai-generate-quiz")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
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
          <Card className="border-border shadow-lg bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <FunnelIcon className="w-5 h-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-card-foreground font-medium">
                    Search Quizzes
                  </Label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search by title, subject, or tutor..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchTerm(e.target.value)
                      }
                      className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Subject Filter */}
                <div className="space-y-2">
                  <Label
                    htmlFor="subject"
                    className="text-card-foreground font-medium"
                  >
                    Filter by Subject
                  </Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                  >
                    <SelectTrigger className="bg-input border-border text-foreground focus:ring-primary">
                      <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map((subject) => (
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
                <div className="mt-6 flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <span className="text-sm text-secondary-foreground font-medium">
                    Showing filtered results
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:bg-muted"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
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
          <Card className="border-border shadow-lg bg-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BookOpenIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Available Quizzes
                  </p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {quizzes.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg bg-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Subjects</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {new Set(quizzes.map((q) => q.subject)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg bg-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Time Limit
                  </p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {quizzes.length > 0
                      ? Math.round(
                          quizzes.reduce(
                            (sum, q) => sum + q.time_limit_minutes,
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

        {/* View Results Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <Card className="border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrophyIcon className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">Quiz Results</h3>
                    <p className="text-sm text-muted-foreground">View your completed quiz attempts and scores</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/student/quiz-results")}
                  variant="outline"
                  className="font-semibold"
                >
                  View All Results
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
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
            <Card className="border-border bg-card">
              <CardContent className="p-12 text-center">
                <BookOpenIcon className="h-20 w-20 text-muted-foreground/50 mx-auto mb-6" />
                <CardTitle className="text-2xl text-card-foreground mb-3">
                  No quizzes available
                </CardTitle>
                <CardDescription className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                  {allQuizzes.length === 0
                    ? "You haven't booked any sessions with tutors yet. Book a session to access their quizzes!"
                    : "No quizzes match your search criteria. Try adjusting your filters."}
                </CardDescription>
                {allQuizzes.length === 0 && (
                  <Button
                    onClick={() => navigate("/student/book-session")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    size="lg"
                  >
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Book Your First Session
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id || `quiz-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="h-full"
                >
                  <Card className="border-border bg-card hover:shadow-xl transition-all duration-200 h-full flex flex-col">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-card-foreground text-xl line-clamp-2">
                        {quiz.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                      {/* Quiz Details */}
                      <div className="space-y-3 text-sm text-muted-foreground">
                        {quiz.attempt_expired && (
                          <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                            <ClockIcon className="h-4 w-4 flex-shrink-0" />
                            <span>Previous attempt expired</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium">
                            {quiz.tutor?.full_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <BookOpenIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium">
                            {quiz.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <ClockIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium">
                            {quiz.time_limit_minutes} minutes
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium">
                            {quiz.total_questions} questions
                          </span>
                        </div>
                      </div>

                      {/* Quiz Status & Action */}
                      <div className="pt-4">
                        {quiz.attempt_expired ? (
                          <Button
                            onClick={() => handleStartQuiz(quiz.id)}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          >
                            <PlayIcon className="h-4 w-4 mr-2" />
                            Start New Attempt
                          </Button>
                        ) : quiz.attempt_status === "completed" ? (
                          <div className="space-y-3">
                            <Button
                              onClick={() =>
                                navigate(
                                  `/student/quiz-results/${quiz.attempt_id}`
                                )
                              }
                              variant="outline"
                              className="w-full font-semibold"
                            >
                              <TrophyIcon className="h-4 w-4 mr-2" />
                              View Results
                            </Button>
                          </div>
                        ) : quiz.attempt_status === "in_progress" ? (
                          <Button
                            onClick={() =>
                              navigate(`/student/take-quiz/${quiz.attempt_id}`)
                            }
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          >
                            <ClockIcon className="h-4 w-4 mr-2" />
                            Continue Quiz
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleStartQuiz(quiz.id)}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                          >
                            <PlayIcon className="h-4 w-4 mr-2" />
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
