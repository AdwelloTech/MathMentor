import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizService } from "@/lib/quizService";
import type { Quiz } from "@/types/quiz";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

const QuizViewPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const data = await quizService.quizzes.getById(quizId!);
      setQuiz(data);
    } catch (error) {
      console.error("Error loading quiz:", error);
      toast.error("Failed to load quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await quizService.quizzes.delete(quizId!);
      navigate("/quizzes", {
        state: { message: "Quiz deleted successfully!" },
      });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-800 flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-200 mb-2">
            Quiz not found
          </h2>
          <p className="text-slate-400 mb-4">
            The quiz you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/quizzes")}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800 relative overflow-auto -mx-4 sm:-mx-6 lg:-mx-8 -my-10 px-4 sm:px-6 lg:px-8 py-10">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]" />

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-green-400/10 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/5 to-yellow-300/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-600 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/quizzes")}
                className="text-slate-300 hover:text-slate-200"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-green-400">{quiz.title}</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Created by {quiz.tutor?.full_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate(`/edit-quiz/${quiz.id}`)}
                className="px-3 py-2 text-blue-400 hover:text-blue-300 flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-2 text-red-400 hover:text-red-300 flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Quiz Info */}
        <div className="bg-slate-700/50 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">
            Quiz Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">
                Description
              </h3>
              <p className="text-slate-200">
                {quiz.description || "No description provided"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Subject</h3>
              <p className="text-slate-200">{quiz.subject}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">
                Grade Level
              </h3>
              <p className="text-slate-200">
                {quiz.gradeLevelId?.displayName || "Not specified"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">
                Time Limit
              </h3>
              <p className="text-slate-200">{quiz.time_limit_minutes} minutes</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
              <div className="flex items-center">
                <div className="bg-blue-600/20 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                  <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Questions</p>
                  <p className="text-lg font-bold text-slate-200">
                    {quiz.total_questions}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
              <div className="flex items-center">
                <div className="bg-green-600/20 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                  <AcademicCapIcon className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Total Points
                  </p>
                  <p className="text-lg font-bold text-slate-200">
                    {quiz.total_points}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
              <div className="flex items-center">
                <div className="bg-yellow-600/20 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                  <ClockIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Time Limit
                  </p>
                  <p className="text-lg font-bold text-slate-200">
                    {quiz.time_limit_minutes}m
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
              <div className="flex items-center">
                <div className={`bg-${quiz.isPublic ? 'green' : 'red'}-600/20 w-10 h-10 rounded-lg flex items-center justify-center mr-3`}>
                  {quiz.isPublic ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Status
                  </p>
                  <p className={`text-lg font-bold ${
                    quiz.isPublic ? "text-green-400" : "text-red-400"
                  }`}>
                    {quiz.isPublic ? "Published" : "Unpublished"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        {quiz.questions && quiz.questions.length > 0 && (
          <div className="bg-slate-700/50 rounded-lg shadow-lg">
            <div className="p-6 border-b border-slate-600">
              <h2 className="text-lg font-semibold text-slate-200">Questions</h2>
            </div>

            <div className="divide-y divide-slate-600/50">
              {quiz.questions.map((question, questionIndex) => (
                <div key={question.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="bg-blue-600/20 text-blue-400 text-sm font-medium px-2.5 py-0.5 rounded">
                        Question {questionIndex + 1}
                      </span>
                      <span className="bg-slate-600/50 text-slate-300 text-sm font-medium px-2.5 py-0.5 rounded">
                        {question.points} points
                      </span>
                      <span className="bg-purple-600/20 text-purple-400 text-sm font-medium px-2.5 py-0.5 rounded capitalize">
                        {question.question_type.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-slate-200 text-lg">
                      {question.question_text}
                    </p>
                  </div>

                  {question.answers && question.answers.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">
                        Answers:
                      </h4>
                      {question.answers.map((answer, _answerIndex) => (
                        <div
                          key={answer.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border ${
                            answer.is_correct
                              ? "bg-green-600/20 border-green-500/50"
                              : "bg-slate-800/50 border-slate-600"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              answer.is_correct
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-slate-500"
                            }`}
                          >
                            {answer.is_correct && (
                              <CheckCircleIcon className="h-3 w-3" />
                            )}
                          </div>
                          <span
                            className={`text-sm ${
                              answer.is_correct
                                ? "text-green-400 font-medium"
                                : "text-slate-300"
                            }`}
                          >
                            {answer.answer_text}
                          </span>
                          {answer.is_correct && (
                            <span className="text-xs text-green-400 font-medium">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Created Info */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
          <div className="text-sm text-slate-400">
            <p>Created: {new Date(quiz.createdAt).toLocaleDateString()}</p>
            <p>Last updated: {new Date(quiz.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizViewPage;