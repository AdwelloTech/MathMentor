import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { flashcards } from "@/lib/flashcards";
import type { FlashcardSet } from "@/types/flashcards";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import DeleteTutorNoteModal from "@/components/tutor/DeleteTutorNoteModal";

const ManageFlashcardsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    load();
  }, [profile]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await flashcards.sets.byTutor(profile!.id);
      setSets(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (setId: string) => {
    setConfirmId(setId);
  };

  const doDelete = async () => {
    if (!confirmId) return;
    try {
      setDeleting(true);
      await flashcards.sets.remove(confirmId);
      await load();
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Manage Flash Cards
            </h1>
            <p className="text-sm text-gray-600">
              Create and manage flash card sets for your students.
            </p>
          </div>
          <button
            onClick={() => navigate("/tutor/flashcards/create")}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md"
          >
            <PlusIcon className="h-4 w-4 mr-2" /> New Set
          </button>
        </div>

        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Subject/Topic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cards
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sets.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{s.title}</td>
                  <td className="px-6 py-4">
                    {s.subject}
                    {s.topic ? ` • ${s.topic}` : ""}
                  </td>
                  <td className="px-6 py-4">{s.cards ? s.cards.length : 0}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => navigate(`/flashcards/${s.id}`)}
                      className="text-blue-600"
                    >
                      <EyeIcon className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => navigate(`/tutor/flashcards/edit/${s.id}`)}
                      className="text-indigo-600"
                    >
                      <PencilIcon className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-600"
                    >
                      <TrashIcon className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <DeleteTutorNoteModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={doDelete}
        isDeleting={deleting}
        title={
          sets.find((s) => s.id === confirmId)?.title || "this flash card set"
        }
      />
    </>
  );
};

export default ManageFlashcardsPage;
