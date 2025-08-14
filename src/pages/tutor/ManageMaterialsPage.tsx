import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CreateTutorNoteModal from "@/components/tutor/CreateTutorNoteModal";
import EditTutorNoteModal from "@/components/tutor/EditTutorNoteModal";
import DeleteTutorNoteModal from "@/components/tutor/DeleteTutorNoteModal";
import TutorNoteCard from "@/components/tutor/TutorNoteCard";
import {
  searchTutorNotes,
  getTutorNotesByTutorId,
  deleteTutorNote,
  transformTutorNoteForCard,
  type TutorNoteWithDetails,
} from "@/lib/tutorNotes";
import { subjectsService } from "@/lib/subjects";
import toast from "react-hot-toast";

const ManageMaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<TutorNoteWithDetails[]>([]);
  const [subjects, setSubjects] = useState<
    Array<{
      id: string;
      name: string;
      display_name: string;
      color: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<TutorNoteWithDetails | null>(
    null
  );
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<TutorNoteWithDetails | null>(
    null
  );

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notesData, subjectsData] = await Promise.all([
        getTutorNotesByTutorId(user!.id),
        subjectsService.listActive(),
      ]);

      setNotes(notesData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const searchResults = await searchTutorNotes({
        searchTerm,
        tutorId: user!.id,
      });
      setNotes(searchResults);
    } catch (error) {
      console.error("Error searching notes:", error);
      toast.error("Failed to search materials");
    }
  };

  const handleCreateNote = () => {
    setShowCreateModal(true);
  };

  const handleEditNote = (note: TutorNoteWithDetails) => {
    setEditingNote(note);
  };

  const handleDeleteNote = (note: TutorNoteWithDetails) => {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;

    try {
      setDeletingNoteId(noteToDelete.id);
      await deleteTutorNote(noteToDelete.id);
      setNotes(notes.filter((note) => note.id !== noteToDelete.id));
      toast.success("Material deleted successfully");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete material");
    } finally {
      setDeletingNoteId(null);
      setShowDeleteModal(false);
      setNoteToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setNoteToDelete(null);
  };

  const handleNoteCreated = () => {
    setShowCreateModal(false);
    loadData();
    toast.success("Material created successfully");
  };

  const handleNoteUpdated = () => {
    setEditingNote(null);
    loadData();
    toast.success("Material updated successfully");
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingNote(null);
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      !searchTerm ||
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.description &&
        note.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const selectedObj = subjects.find((s) => s.id === selectedSubject);
    const matchesSubject =
      !selectedSubject ||
      note.subject_id === selectedSubject ||
      (selectedObj &&
        (note.subject_display_name === selectedObj.display_name ||
          note.subject_name === selectedObj.name));

    return matchesSearch && matchesSubject;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Manage Study Materials
              </h1>
              <p className="text-gray-600">
                Upload, edit, and manage your study materials for students
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateNote}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Upload New Material
            </motion.button>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Search
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Materials
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {notes.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <StarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Premium Materials
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {notes.filter((note) => note.is_premium).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <EyeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notes.reduce((sum, note) => sum + note.view_count, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArrowDownTrayIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Downloads
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {notes.reduce((sum, note) => sum + note.download_count, 0)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Materials List */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {filteredNotes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No materials found
              </h3>
              <p className="text-gray-600 mb-6">
                {notes.length === 0
                  ? "You haven't uploaded any study materials yet. Get started by uploading your first material!"
                  : "No materials match your search criteria. Try adjusting your filters."}
              </p>
              {notes.length === 0 && (
                <button
                  onClick={handleCreateNote}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Upload Your First Material
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TutorNoteCard
                    {...transformTutorNoteForCard(note)}
                    onEdit={() => handleEditNote(note)}
                    onDelete={() => handleDeleteNote(note)}
                    isDeleting={deletingNoteId === note.id}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTutorNoteModal
            isOpen={showCreateModal}
            onClose={handleModalClose}
            onNoteCreated={handleNoteCreated}
            subjects={subjects}
          />
        )}

        {editingNote && (
          <EditTutorNoteModal
            isOpen={!!editingNote}
            onClose={handleModalClose}
            onNoteUpdated={handleNoteUpdated}
            note={editingNote}
            subjects={subjects}
          />
        )}

        {showDeleteModal && noteToDelete && (
          <DeleteTutorNoteModal
            isOpen={showDeleteModal}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            title={noteToDelete.title}
            isDeleting={deletingNoteId === noteToDelete.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageMaterialsPage;
