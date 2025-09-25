import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { quizService } from "@/lib/quizService";
import type { QuizAttempt, Question, StudentAnswer } from "@/types/quiz";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

const QuizAttemptReviewPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
alert()
  useEffect(() => {
    if (!attemptId) return;
    load();
  }, [attemptId]);

  const load = async () => {
    try {
      setLoading(true);
      const details = await quizService.studentQuizzes.getAttemptDetails(
        attemptId!
      );
      setAttempt(details.attempt);
      setQuestions(details.questions);
      setStudentAnswers(details.studentAnswers);
      setFeedback(details.attempt.tutor_feedback || "");
    } catch (e) {
      console.error("Failed to load attempt details", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!attemptId) return;
    try {
      setSaving(true);
      await quizService.attempts.saveTutorFeedback(attemptId, feedback.trim());
      toast.success("Feedback sent to student");
      setAttempt((prev) =>
        prev ? { ...prev, tutor_feedback: feedback.trim() } : prev
      );
    } catch (e) {
      console.error("Failed to save feedback", e);
      toast.error("Failed to send feedback");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!attempt) return null;

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Attempt Review</h1>
        <p className="text-sm text-gray-600">
          {attempt.student?.full_name} • {attempt.quiz?.title}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 space-y-4">
          {questions.map((q, index) => {
            const ans = studentAnswers.find((a) => a.question_id === q.id);
            const correct = q.answers?.find((a) => a.is_correct);
            return (
              <div key={q.id} className="border rounded-md p-4">
                <div className="text-sm text-gray-500 mb-1">
                  Question {index + 1}
                </div>
                <div className="font-medium mb-2">{q.question_text}</div>
                <div className="text-sm">
                  <div className="mb-1">
                    <span className="text-gray-600">Student answer:</span>{" "}
                    <span className="font-medium">
                      {ans?.selected_answer?.answer_text ||
                        ans?.answer_text ||
                        "—"}
                    </span>
                    {ans?.is_correct === true && (
                      <span className="ml-2 text-green-700">(correct)</span>
                    )}
                    {ans?.is_correct === false && (
                      <span className="ml-2 text-red-700">(incorrect)</span>
                    )}
                  </div>
                  {correct && (
                    <div className="text-gray-600">
                      Correct answer:{" "}
                      <span className="font-medium">{correct.answer_text}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 space-y-3">
          <div className="font-medium">Tutor Feedback (optional)</div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={5}
            className="w-full border rounded-md p-3"
            placeholder="Share appreciation or suggestions to improve..."
          />
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !!attempt?.tutor_feedback}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            >
              {attempt?.tutor_feedback
                ? "Feedback Sent"
                : saving
                ? "Sending..."
                : "Send Feedback"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAttemptReviewPage;
