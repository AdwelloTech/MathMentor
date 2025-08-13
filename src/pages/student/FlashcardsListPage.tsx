import React, { useEffect, useState } from "react";
import { flashcards } from "@/lib/flashcards";
import type { FlashcardSet } from "@/types/flashcards";
import { useNavigate } from "react-router-dom";
import { subjectsService } from "@/lib/subjects";

const FlashcardsListPage: React.FC = () => {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState<
    { id: string; name: string; display_name: string }[]
  >([]);
  const navigate = useNavigate();

  const load = async () => {
    const data = await flashcards.student.listAvailable(subject || undefined);
    setSets(data);
  };

  useEffect(() => {
    load();
  }, [subject]);

  useEffect(() => {
    (async () => {
      const s = await subjectsService.listActive();
      setSubjects(s as any);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mt-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Flash Cards</h1>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="px-3 py-2 border rounded-md bg-white"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.name}>
              {s.display_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sets.map((s) => (
          <div
            key={s.id}
            className="bg-white border rounded-lg p-5 hover:shadow"
          >
            <div className="font-semibold text-lg">{s.title}</div>
            <div className="text-sm text-gray-600">
              {s.subject}
              {s.topic ? ` • ${s.topic}` : ""}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              By {s.tutor?.full_name}
            </div>
            <button
              onClick={() => navigate(`/student/flashcards/${s.id}`)}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md"
            >
              Study
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlashcardsListPage;
