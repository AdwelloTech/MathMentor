import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { QuizAttempt } from "@/types/quiz";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AttemptRow extends QuizAttempt {
  answered_count?: number;
}

const QuizResponsesPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!quizId) return;
    load();
  }, [quizId]);

  const load = async () => {
    try {
      setLoading(true);
      // Fetch attempts for this quiz with student info
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select(
          `
          *,
          student:profiles(id, full_name, email)
        `
        )
        .eq("quiz_id", quizId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For answered_count, query counts from student_answers grouped by attempt
      const { data: counts } = await supabase
        .from("student_answers")
        .select("attempt_id, count:attempt_id", { count: "exact", head: false })
        .in(
          "attempt_id",
          (data || []).map((a: QuizAttempt) => a.id)
        );

      const attemptIdToCount = new Map<string, number>();
      (counts || []).forEach((row: any) => {
        // Supabase returns rows; count must be computed per attempt via separate query if needed.
        // Fallback: compute by filtering later when we have answers (not ideal but fine for list)
        if (row.attempt_id && typeof row.count === "number") {
          attemptIdToCount.set(row.attempt_id, row.count);
        }
      });

      const rows: AttemptRow[] = (data || []).map((a: QuizAttempt) => ({
        ...a,
        answered_count:
          attemptIdToCount.get(a.id) ?? a.correct_answers ?? undefined,
      }));

      setAttempts(rows);
    } catch (e) {
      console.error("Failed to load attempts", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return attempts;
    return attempts.filter(
      (a) =>
        (a.student?.full_name || "").toLowerCase().includes(q) ||
        (a.student?.email || "").toLowerCase().includes(q)
    );
  }, [attempts, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Responses</h1>
          <p className="text-sm text-gray-600">
            View student submissions for this quiz.
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name or email"
          className="px-3 py-2 border rounded-md w-72"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Answered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Correct/Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {a.student?.full_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {a.student?.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {a.completed_at
                    ? new Date(a.completed_at).toLocaleString()
                    : "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {a.answered_count ?? "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {a.correct_answers ?? 0}/{a.total_questions ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => navigate(`/quiz/attempt/${a.id}`)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuizResponsesPage;
