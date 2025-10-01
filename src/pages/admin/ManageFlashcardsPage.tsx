import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  BookOpenIcon,
  AcademicCapIcon,
  UserIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  AdminFlashcardService,
  AdminFlashcardSet,
  FlashcardStats,
} from "@/lib/adminFlashcardService";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ManageFlashcardsPage: React.FC = () => {
  const [flashcardSets, setFlashcardSets] = useState<AdminFlashcardSet[]>([]);
  const [filteredSets, setFilteredSets] = useState<AdminFlashcardSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<AdminFlashcardSet | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");

  const [showSetModal, setShowSetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingSetId, setViewingSetId] = useState<string | null>(null);
  const [stats, setStats] = useState<FlashcardStats>({
    total: 0,
    active: 0,
    inactive: 0,
    total_cards: 0,
    by_subject: {},
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("Loading flashcard data in ManageFlashcardsPage...");

      const [setsData, statsData] = await Promise.all([
        AdminFlashcardService.getAllFlashcardSets(),
        AdminFlashcardService.getFlashcardStats(),
      ]);

      console.log("Flashcard sets data received:", setsData);
      console.log("Stats data received:", statsData);

      setFlashcardSets(setsData);
      setFilteredSets(setsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading flashcard data:", error);
      toast.error("Failed to load flashcard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter flashcard sets based on search, subject, and status
    let filtered = flashcardSets;

    if (searchTerm) {
      filtered = filtered.filter(
        (set) =>
          set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          set.tutor.full_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          set.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (set.topic &&
            set.topic.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterSubject !== "all") {
      filtered = filtered.filter((set) => set.subject === filterSubject);
    }

    setFilteredSets(filtered);
  }, [flashcardSets, searchTerm, filterSubject]);

  const handleViewSet = async (set: AdminFlashcardSet) => {
    // Prevent multiple simultaneous requests for the same set
    if (viewingSetId === set.id) {
      return;
    }

    try {
      setViewingSetId(set.id);
      const detailedSet = await AdminFlashcardService.getFlashcardSetDetails(
        set.id
      );
      if (detailedSet) {
        setSelectedSet(detailedSet);
        setShowSetModal(true);
      }
    } catch (error) {
      console.error("Error loading flashcard set details:", error);
      toast.error("Failed to load flashcard set details");
    } finally {
      setViewingSetId(null);
    }
  };

  const handleDeleteSet = async () => {
    if (!deletingId) return;

    try {
      await AdminFlashcardService.deleteFlashcardSet(deletingId);

      // Reload all data to ensure stats and counts are updated
      await loadData();

      toast.success("Flashcard set deleted successfully");
      setShowDeleteModal(false);
      setDeletingId(null);
    } catch (error) {
      console.error("Error deleting flashcard set:", error);
      toast.error("Failed to delete flashcard set");
    }
  };

  const uniqueSubjects = Array.from(
    new Set(flashcardSets.map((set) => set.subject))
  ).sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-6 pb-16 relative z-10"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="pt-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manage Flash Cards
            </h1>
            <p className="text-lg text-gray-600">
              View and manage all flashcard sets created by tutors
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
              <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-[0_2px_2px_0_#16803D]">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#16803D] w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <BookOpenIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Total Sets
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
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
              <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-[0_2px_2px_0_#16803D]">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#16803D] w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <AcademicCapIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Total Cards
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.total_cards}
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
            <Card className="shadow-[0_2px_2px_0_#16803D] border-0 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search flashcard sets, tutors, or subjects..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#34A853] focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#34A853] focus:border-transparent"
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

          {/* Flashcard Sets Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-[0_2px_2px_0_#16803D] border-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                    <BookOpenIcon className="w-4 h-4 text-white" />
                  </div>
                  <span>Flashcard Sets</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Flashcard Set
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tutor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cards
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSets.map((set) => (
                        <motion.tr
                          key={set.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {set.title}
                              </div>
                              {set.topic && (
                                <div className="text-sm text-gray-500">
                                  Topic: {set.topic}
                                </div>
                              )}
                              {set.grade_level && (
                                <div className="text-xs text-gray-400">
                                  Grade: {set.grade_level}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {set.tutor.full_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {set.tutor.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {set.subject}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <BookOpenIcon className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-900">
                                {set.card_count} cards
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(set.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleViewSet(set)}
                                disabled={viewingSetId === set.id}
                                className={`p-1 rounded-full transition-colors ${
                                  viewingSetId === set.id
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-green-600 hover:text-green-900 hover:bg-green-100"
                                }`}
                                title="View Details"
                              >
                                {viewingSetId === set.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                ) : (
                                  <EyeIcon className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingId(set.id);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition-colors"
                                title="Delete Flashcard Set"
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

                {filteredSets.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No flashcard sets found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || filterSubject !== "all"
                        ? "Try adjusting your search criteria."
                        : "No flashcard sets have been created yet."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Flashcard Set Details Modal */}
      {showSetModal && selectedSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedSet.title}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Created by {selectedSet.tutor.full_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowSetModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Subject</p>
                  <p className="font-semibold">{selectedSet.subject}</p>
                </div>
                {selectedSet.topic && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Topic</p>
                    <p className="font-semibold">{selectedSet.topic}</p>
                  </div>
                )}
                {selectedSet.grade_level && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Grade Level</p>
                    <p className="font-semibold">{selectedSet.grade_level}</p>
                  </div>
                )}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Cards</p>
                  <p className="font-semibold">{selectedSet.card_count}</p>
                </div>
              </div>

              {selectedSet.cards && selectedSet.cards.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Cards ({selectedSet.cards.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSet.cards
                      .sort((a, b) => a.card_order - b.card_order)
                      .map((card, index) => (
                        <div key={card.id} className="border rounded-lg p-4">
                          <div className="text-sm text-gray-500 mb-2">
                            Card {index + 1}
                          </div>
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-900 mb-1">
                              Front:
                            </h4>
                            <p className="text-gray-700 bg-gray-50 p-2 rounded">
                              {card.front_text}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              Back:
                            </h4>
                            <p className="text-gray-700 bg-gray-50 p-2 rounded">
                              {card.back_text}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <TrashIcon className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Flashcard Set
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this flashcard set? This action
              cannot be undone and will also delete all cards in this set.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSet}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFlashcardsPage;
