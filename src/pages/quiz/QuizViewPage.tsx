import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { quizService } from "@/lib/quizService";
import type { Quiz, Question, Answer } from "@/types/quiz";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
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
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Quiz not found
        </h2>
        <p className="text-gray-600 mb-4">
          The quiz you're looking for doesn't exist.
        </p>
        <button
          onClick={() => navigate("/quizzes")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="mt-2 text-sm text-gray-600">
                Created by {quiz.tutor?.full_name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(`/edit-quiz/${quiz.id}`)}
              className="px-3 py-2 text-indigo-600 hover:text-indigo-900 flex items-center"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-red-600 hover:text-red-900 flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quiz Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Description
            </h3>
            <p className="text-gray-900">
              {quiz.description || "No description provided"}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Subject</h3>
            <p className="text-gray-900">{quiz.subject}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Grade Level
            </h3>
            <p className="text-gray-900">{quiz.grade_level || "All grades"}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Time Limit
            </h3>
            <p className="text-gray-900">{quiz.time_limit_minutes} minutes</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">Questions</p>
                <p className="text-lg font-bold text-blue-900">
                  {quiz.total_questions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <AcademicCapIcon className="h-6 w-6 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Total Points
                </p>
                <p className="text-lg font-bold text-green-900">
                  {quiz.total_points}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Time Limit
                </p>
                <p className="text-lg font-bold text-yellow-900">
                  {quiz.time_limit_minutes}m
                </p>
              </div>
            </div>
          </div>

          <div
            className={`border rounded-lg p-4 ${
              quiz.is_active
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center">
              {quiz.is_active ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-600 mr-2" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    quiz.is_active ? "text-green-800" : "text-red-800"
                  }`}
                >
                  Status
                </p>
                <p
                  className={`text-lg font-bold ${
                    quiz.is_active ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {quiz.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      {quiz.questions && quiz.questions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {quiz.questions.map((question, questionIndex) => (
              <div key={question.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                      Question {questionIndex + 1}
                    </span>
                    <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded">
                      {question.points} points
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded capitalize">
                      {question.question_type.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-900 text-lg">
                    {question.question_text}
                  </p>
                </div>

                {question.answers && question.answers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Answers:
                    </h4>
                    {question.answers.map((answer, answerIndex) => (
                      <div
                        key={answer.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border ${
                          answer.is_correct
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            answer.is_correct
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {answer.is_correct && (
                            <CheckCircleIcon className="h-3 w-3" />
                          )}
                        </div>
                        <span
                          className={`text-sm ${
                            answer.is_correct
                              ? "text-green-800 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          {answer.answer_text}
                        </span>
                        {answer.is_correct && (
                          <span className="text-xs text-green-600 font-medium">
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
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">
          <p>Created: {new Date(quiz.created_at).toLocaleDateString()}</p>
          <p>Last updated: {new Date(quiz.updated_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default QuizViewPage;
