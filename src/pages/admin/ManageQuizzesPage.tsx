import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { AdminQuizService, AdminQuiz, AdminQuestion, AdminAnswer, QuizStats } from "@/lib/adminQuizService";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ManageQuizzesPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<AdminQuiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<AdminQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingQuizId, setViewingQuizId] = useState<string | null>(null);
  const [stats, setStats] = useState<QuizStats>({
    total: 0,
    active: 0,
    inactive: 0,
    total_attempts: 0,
    by_subject: {},
  });

  useEffect(() => {
    loadData();
  }, []);

  // Debug state changes
  useEffect(() => {
    console.log(
      "State changed - showQuizModal:",
      showQuizModal,
      "selectedQuiz:",
      selectedQuiz?.id
    );
  }, [showQuizModal, selectedQuiz]);

  // Prevent modal from closing unexpectedly
  useEffect(() => {
    if (showQuizModal && !selectedQuiz) {
      console.warn("Modal is open but no quiz selected, closing modal");
      setShowQuizModal(false);
    }
  }, [showQuizModal, selectedQuiz]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("Loading quiz data in ManageQuizzesPage...");

      const [quizzesData, statsData] = await Promise.all([
        AdminQuizService.getAllQuizzes(),
        AdminQuizService.getQuizStats(),
      ]);

      console.log("Quizzes data received:", quizzesData);
      console.log("Stats data received:", statsData);

      setQuizzes(quizzesData);
      setFilteredQuizzes(quizzesData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading quiz data:", error);
      toast.error("Failed to load quiz data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter quizzes based on search, subject, and status
    let filtered = quizzes;

    if (searchTerm) {
      filtered = filtered.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quiz.tutor.full_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          quiz.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterSubject !== "all") {
      filtered = filtered.filter((quiz) => quiz.subject === filterSubject);
    }

    setFilteredQuizzes(filtered);
  }, [quizzes, searchTerm, filterSubject]);

  const handleViewQuiz = useCallback(
    async (quiz: AdminQuiz) => {
      // Prevent multiple simultaneous requests for the same quiz
      if (viewingQuizId === quiz.id) {
        return;
      }

      try {
        setViewingQuizId(quiz.id);
        console.log("Attempting to view quiz:", quiz);
        console.log("Quiz ID being passed:", quiz.id, "Type:", typeof quiz.id);

        const detailedQuiz = await AdminQuizService.getQuizDetails(quiz.id);
        console.log("Detailed quiz returned:", detailedQuiz);

        if (detailedQuiz) {
          console.log("Setting selected quiz and opening modal...");
          // Use a function to ensure we're working with the latest state
          setSelectedQuiz(detailedQuiz);
          // Small delay to ensure selectedQuiz is set before opening modal
          requestAnimationFrame(() => {
            setShowQuizModal(true);
            console.log(
              "Modal state set to true, selectedQuiz:",
              detailedQuiz.id
            );
          });
        } else {
          console.error("No detailed quiz returned");
          toast.error("No quiz details found");
        }
      } catch (error) {
        console.error("Error loading quiz details:", error);
        toast.error("Failed to load quiz details");
      } finally {
        setViewingQuizId(null);
      }
    },
    [viewingQuizId]
  );

  const handleDeleteQuiz = async () => {
    if (!deletingId) return;

    try {
      await AdminQuizService.deleteQuiz(deletingId);

      // Reload all data to ensure stats and counts are updated
      await loadData();

      toast.success("Quiz deleted successfully");
      setShowDeleteModal(false);
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  const uniqueSubjects = Array.from(
    new Set(quizzes.map((quiz) => quiz.subject))
  ).sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="pt-6 mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Manage Quizzes & PDFs
            </h1>
            <p className="text-lg text-muted-foreground">
              View and manage all quizzes created by tutors and PDFs for AI quiz
              generation
            </p>
          </div>


          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <DocumentTextIcon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Total Quizzes
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {stats.total}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <ChartBarIcon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Total Attempts
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {stats.total_attempts}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-primary/20 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search quizzes, tutors, or subjects..."
                        className="pl-10 pr-4 py-2 w-full border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <select
                      className="px-4 py-2 border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                    >
                      <option value="all">All Subjects</option>
                      {uniqueSubjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quizzes Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-primary/20 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span>Quizzes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Quiz
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tutor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Questions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Attempts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredQuizzes.map((quiz) => (
                        <motion.tr
                          key={quiz.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-muted/50"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {quiz.title}
                              </div>
                              {quiz.description && (
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  {quiz.description}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground flex items-center mt-1">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {quiz.time_limit_minutes} minutes
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 text-muted-foreground mr-2" />
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {quiz.tutor.full_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {quiz.tutor.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                              {quiz.subject}
                            </span>
                            {quiz.gradeLevelId && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Grade: {typeof quiz.gradeLevelId === 'string' ? quiz.gradeLevelId : quiz.gradeLevelId.displayName}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {quiz.total_questions} questions
                            <div className="text-xs text-muted-foreground">
                              {quiz.total_points} points
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {quiz.total_attempts}
                            {quiz.total_attempts > 0 && quiz.avg_score !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                Avg: {quiz.avg_score.toFixed(1)}%
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(quiz.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleViewQuiz(quiz)}
                                disabled={viewingQuizId === quiz.id}
                                className={`p-1 rounded-full transition-colors ${
                                  viewingQuizId === quiz.id
                                    ? "text-muted-foreground cursor-not-allowed"
                                    : "text-primary hover:text-primary/80 hover:bg-primary/10"
                                }`}
                                title="View Details"
                              >
                                {viewingQuizId === quiz.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                ) : (
                                  <EyeIcon className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingId(quiz.id);
                                  setShowDeleteModal(true);
                                }}
                                className="text-destructive hover:text-destructive/80 p-1 rounded-full hover:bg-destructive/10 transition-colors"
                                title="Delete Quiz"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredQuizzes.length === 0 && (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">
                      No quizzes found
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchTerm || filterSubject !== "all"
                        ? "Try adjusting your search criteria."
                        : "No quizzes have been created yet."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {showQuizModal && selectedQuiz && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground">
                    {selectedQuiz.title}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Created by {selectedQuiz.tutor.full_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowQuizModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-semibold text-foreground">{selectedQuiz.subject}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="font-semibold text-foreground">
                    {selectedQuiz.total_questions}
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Time Limit</p>
                  <p className="font-semibold text-foreground">
                    {selectedQuiz.time_limit_minutes} min
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Attempts</p>
                  <p className="font-semibold text-foreground">{selectedQuiz.total_attempts}</p>
                </div>
              </div>

              {selectedQuiz.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Description</h3>
                  <p className="text-foreground">{selectedQuiz.description}</p>
                </div>
              )}

              {selectedQuiz.questions && selectedQuiz.questions.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    Questions ({selectedQuiz.questions.length})
                  </h3>
                  <div className="space-y-6">
                    {selectedQuiz.questions.map((question: AdminQuestion, index: number) => (
                      <div
                        key={question.id}
                        className="border rounded-lg p-6 bg-muted"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-0.5 rounded">
                              Question {index + 1}
                            </span>
                            <span className="bg-accent text-accent-foreground text-xs font-medium px-2.5 py-0.5 rounded">
                              {question.question_type.replace("_", " ")}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-muted-foreground">
                            {question.points}{" "}
                            {question.points === 1 ? "point" : "points"}
                          </span>
                        </div>

                        <p className="text-foreground font-medium mb-4 text-base leading-relaxed">
                          {question.question_text}
                        </p>

                        {question.answers && question.answers.length > 0 ? (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-foreground mb-2">
                              Answer Options:
                            </h5>
                            {question.answers
                              .sort((a: AdminAnswer, b: AdminAnswer) => a.answer_order - b.answer_order)
                              .map((answer: AdminAnswer, answerIndex: number) => (
                                <div
                                  key={answer.id}
                                  className={`flex items-start p-3 rounded-lg text-sm border-2 ${
                                    answer.is_correct
                                      ? "bg-success/10 border-success text-success"
                                      : "bg-card border-border text-foreground"
                                  }`}
                                >
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-medium flex items-center justify-center mr-3 mt-0.5">
                                    {String.fromCharCode(65 + answerIndex)}
                                  </span>
                                  <div className="flex-1">
                                    <p className="leading-relaxed">
                                      {answer.answer_text}
                                    </p>
                                    {answer.is_correct && (
                                      <div className="flex items-center mt-1">
                                        <CheckCircleIcon className="h-4 w-4 text-success mr-1" />
                                        <span className="text-xs font-medium text-success">
                                          Correct Answer
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">
                            No answer options found for this question.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium text-foreground">
                    No Questions Found
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This quiz doesn't have any questions yet, or there was an
                    error loading them.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-md w-full p-6 border">
            <div className="flex items-center mb-4">
              <TrashIcon className="h-6 w-6 text-destructive mr-3" />
              <h3 className="text-lg font-semibold text-card-foreground">
                Delete Quiz
              </h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this quiz? This action cannot be
              undone and will also delete all associated questions, answers, and
              student attempts.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuiz}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ManageQuizzesPage;
