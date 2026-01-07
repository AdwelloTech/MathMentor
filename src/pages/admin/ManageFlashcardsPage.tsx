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
  AdminFlashcard,
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="pt-6 mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Manage Flash Cards
            </h1>
            <p className="text-lg text-muted-foreground">
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
              <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <BookOpenIcon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Total Sets
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
                      <AcademicCapIcon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Total Cards
                      </p>
                      <p className="text-3xl font-bold text-foreground">
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
            <Card className="shadow-primary/20 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search flashcard sets, tutors, or subjects..."
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

          {/* Flashcard Sets Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-primary/20 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
                    <BookOpenIcon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span>Flashcard Sets</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Flashcard Set
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tutor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Cards
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
                      {filteredSets.map((set) => (
                        <tr
                          key={set.id}
                          className="hover:bg-muted/50"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {set.title}
                              </div>
                              {set.topic && (
                                <div className="text-sm text-muted-foreground">
                                  Topic: {set.topic}
                                </div>
                              )}
                              {set.grade_level && (
                                <div className="text-xs text-muted-foreground">
                                  Grade: {set.grade_level}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 text-muted-foreground mr-2" />
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {set.tutor.full_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {set.tutor.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                              {set.subject}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <BookOpenIcon className="h-4 w-4 text-muted-foreground mr-1" />
                              <span className="text-sm text-foreground">
                                {set.card_count} cards
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {set.createdAt ? new Date(set.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2" style={{ pointerEvents: 'auto' }}>
                              <button
                                onClick={() => {
                                  console.log('View button clicked for flashcard set:', set.id);
                                  handleViewSet(set);
                                }}
                                disabled={viewingSetId === set.id}
                                className={`p-1 rounded-full transition-colors ${
                                  viewingSetId === set.id
                                    ? "text-muted-foreground cursor-not-allowed"
                                    : "text-primary hover:text-primary/80 hover:bg-primary/10"
                                }`}
                                title="View Details"
                                style={{
                                  pointerEvents: viewingSetId === set.id ? 'none' : 'auto',
                                  cursor: viewingSetId === set.id ? 'not-allowed' : 'pointer',
                                  zIndex: 10,
                                  position: 'relative'
                                }}
                              >
                                {viewingSetId === set.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                ) : (
                                  <EyeIcon className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  console.log('Delete button clicked for flashcard set:', set.id);
                                  setDeletingId(set.id);
                                  setShowDeleteModal(true);
                                }}
                                className="text-destructive hover:text-destructive/80 p-1 rounded-full hover:bg-destructive/10 transition-colors"
                                title="Delete Flashcard Set"
                                style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10, position: 'relative' }}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredSets.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpenIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">
                      No flashcard sets found
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
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

        {showSetModal && selectedSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border">
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground">
                    {selectedSet.title}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Created by {selectedSet.tutor.full_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowSetModal(false)}
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
                  <p className="font-semibold text-foreground">{selectedSet.subject}</p>
                </div>
                {selectedSet.topic && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Topic</p>
                    <p className="font-semibold text-foreground">{selectedSet.topic}</p>
                  </div>
                )}
                {selectedSet.grade_level && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Grade Level</p>
                    <p className="font-semibold text-foreground">{selectedSet.grade_level}</p>
                  </div>
                )}
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Cards</p>
                  <p className="font-semibold text-foreground">{selectedSet.card_count}</p>
                </div>
              </div>

              {selectedSet.cards && selectedSet.cards.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    Cards ({selectedSet.cards.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSet.cards
                      .sort((a: AdminFlashcard, b: AdminFlashcard) => a.card_order - b.card_order)
                      .map((card: AdminFlashcard, index: number) => (
                        <div key={card.id} className="border rounded-lg p-4 border-border">
                          <div className="text-sm text-muted-foreground mb-2">
                            Card {index + 1}
                          </div>
                          <div className="mb-3">
                            <h4 className="font-medium text-foreground mb-1">
                              Front:
                            </h4>
                            <p className="text-foreground bg-muted p-2 rounded">
                              {card.front_text}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground mb-1">
                              Back:
                            </h4>
                            <p className="text-foreground bg-muted p-2 rounded">
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
          <div className="bg-card rounded-lg max-w-md w-full p-6 border">
            <div className="flex items-center mb-4">
              <TrashIcon className="h-6 w-6 text-destructive mr-3" />
              <h3 className="text-lg font-semibold text-card-foreground">
                Delete Flashcard Set
              </h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this flashcard set? This action
              cannot be undone and will also delete all cards in this set.
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
                onClick={handleDeleteSet}
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

export default ManageFlashcardsPage;
