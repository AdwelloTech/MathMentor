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
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import DeleteTutorNoteModal from "@/components/tutor/DeleteTutorNoteModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const totalCards = sets.reduce(
    (sum, set) => sum + (set.cards?.length || 0),
    0
  );
  const totalSets = sets.length;

  return (
    <div className="min-h-screen bg-[#D5FFC5] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)]"></div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-green-400/10 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/5 to-yellow-300/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Manage Flash Cards
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
          <Card className="shadow-[0_2px_2px_0_#16803D] border-0 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center">
                  <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Sets
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalSets}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[0_2px_2px_0_#16803D] border-0 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center">
                  <PlusIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Cards
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalCards}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-[0_2px_2px_0_#16803D] border-0 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center">
                  <EyeIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Sets
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sets.filter((s) => s.cards && s.cards.length > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
          <Card className="shadow-[0_2px_2px_0_#16803D] border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="w-4 h-4 text-white" />
                </div>
                <span>Your Flashcard Sets</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16803D] mx-auto"></div>
                  <p className="mt-2 text-gray-600">
                    Loading flashcard sets...
                  </p>
                </div>
              ) : sets.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <AcademicCapIcon className="mx-auto h-16 w-16" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No flashcard sets yet
                  </h3>
                  <p className="text-gray-500 mb-6">
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
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject/Topic
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cards
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sets.map((set, index) => (
                        <motion.tr
                          key={set.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gradient-to-r from-[#199421] to-[#94DF4A] rounded-lg flex items-center justify-center">
                                  <AcademicCapIcon className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">
                                  {set.title}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-800"
                              >
                                {set.subject}
                              </Badge>
                              {set.topic && (
                                <Badge
                                  variant="outline"
                                  className="text-gray-600"
                                >
                                  {set.topic}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {set.cards ? set.cards.length : 0}
                              </span>
                              <span className="text-xs text-gray-500">
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
            </CardContent>
          </Card>
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
