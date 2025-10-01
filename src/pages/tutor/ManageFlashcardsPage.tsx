import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { flashcards } from "@/lib/flashcards";
import type { FlashcardSet } from "@/types/flashcards";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import DeleteTutorNoteModal from "@/components/tutor/DeleteTutorNoteModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ManageFlashcardsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState<string | null>(null);

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

  const togglePublic = async (setId: string, currentIsPublic: boolean) => {
    try {
      setTogglingPublic(setId);
      await flashcards.sets.update(setId, {
        grade_level: undefined,
        is_public: !currentIsPublic,
      });
      await load();
    } finally {
      setTogglingPublic(null);
    }
  };

  const totalCards = sets.reduce(
    (sum, set) => sum + (set.flashcardCount || 0),
    0
  );
  const totalSets = sets.length;

  return (
    <div className="min-h-screen bg-slate-800 relative overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 -my-10 px-4 sm:px-6 lg:px-8 py-10">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/15 to-yellow-400/15 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/15 to-green-400/15 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/10 to-yellow-300/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-green-400 mb-4">
            Manage Flash Cards
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Create and manage flash card sets for your students to enhance their
            learning experience.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-slate-700/50 p-6 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
          >
            <div className="flex items-center">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                <AcademicCapIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Total Sets
                </p>
                <p className="text-2xl font-bold text-slate-200">
                  {totalSets}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-slate-700/50 p-6 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
          >
            <div className="flex items-center">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                <PlusIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Total Cards
                </p>
                <p className="text-2xl font-bold text-slate-200">
                  {totalCards}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-slate-700/50 p-6 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
          >
            <div className="flex items-center">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mr-4">
                <EyeIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Active Sets
                </p>
                <p className="text-2xl font-bold text-slate-200">
                  {sets.filter((s) => s.flashcardCount && s.flashcardCount > 0).length}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <Button
            onClick={() => navigate("/tutor/flashcards/create")}
            className="bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white shadow-[0_2px_2px_0_#16803D] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 px-8 py-3 text-lg font-semibold"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Flashcard Set
          </Button>
        </motion.div>

        {/* Flashcard Sets Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="bg-slate-700/50 rounded-xl shadow-lg"
          >
            <div className="p-6 border-b border-slate-600">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center space-x-2">
                <div className="bg-green-600 w-8 h-8 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="w-4 h-4 text-white" />
                </div>
                <span>Your Flashcard Sets</span>
              </h2>
            </div>
            <div className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16803D] mx-auto"></div>
                  <p className="mt-2 text-slate-400">
                    Loading flashcard sets...
                  </p>
                </div>
              ) : sets.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AcademicCapIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-200 mb-2">
                    No flashcard sets yet
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Get started by creating your first flashcard set for your
                    students.
                  </p>
                  <Button
                    onClick={() => navigate("/tutor/flashcards/create")}
                    className="bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white shadow-[0_2px_2px_0_#16803D] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create First Set
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-600/50">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Subject/Topic
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Cards
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600/50">
                      {sets.map((set, index) => (
                        <motion.tr
                          key={set.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="hover:bg-slate-600/30 transition-colors duration-200"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gradient-to-r from-[#199421] to-[#94DF4A] rounded-lg flex items-center justify-center">
                                  <AcademicCapIcon className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-slate-200">
                                    {set.title}
                                  </p>
                                  {set.is_public ? (
                                    <GlobeAltIcon className="w-4 h-4 text-green-600" title="Public - visible to students" />
                                  ) : (
                                    <LockClosedIcon className="w-4 h-4 text-gray-500" title="Private - only visible to you" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="secondary"
                                className="bg-blue-500/20 text-blue-300"
                              >
                                {set.subject}
                              </Badge>
                              {set.topic && (
                                <Badge
                                  variant="outline"
                                  className="text-slate-400 border-slate-600"
                                >
                                  {set.topic}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-slate-200">
                                {set.flashcardCount || 0}
                              </span>
                              <span className="text-xs text-slate-400">
                                cards
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/flashcards/${set.id}`)}
                              className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                              title="View Set"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/tutor/flashcards/edit/${set.id}`)
                              }
                              className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                              title="Edit Set"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePublic(set.id, set.is_public || false)}
                              disabled={togglingPublic === set.id}
                              className={`${
                                set.is_public
                                  ? "text-orange-600 hover:text-orange-900 hover:bg-orange-50"
                                  : "text-green-600 hover:text-green-900 hover:bg-green-50"
                              }`}
                              title={set.is_public ? "Make Private" : "Make Public"}
                            >
                              {togglingPublic === set.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : set.is_public ? (
                                <LockClosedIcon className="h-4 w-4" />
                              ) : (
                                <GlobeAltIcon className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(set.id)}
                              className="text-red-600 hover:text-red-900 hover:bg-red-50"
                              title="Delete Set"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
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
    </div>
  );
};

export default ManageFlashcardsPage;
