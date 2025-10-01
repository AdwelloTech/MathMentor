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
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import CreateTutorNoteModal from "@/components/tutor/CreateTutorNoteModal";
import EditTutorNoteModal from "@/components/tutor/EditTutorNoteModal";
import DeleteTutorNoteModal from "@/components/tutor/DeleteTutorNoteModal";
import TutorNoteCard from "@/components/tutor/TutorNoteCard";
import {
  searchTutorMaterialsRest,
  getTutorMaterialsRest,
  deleteTutorMaterialRest,
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
      color?: string | null;
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
        getTutorMaterialsRest(),
        subjectsService.listActive(),
      ]);

      setNotes(notesData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load materials. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      if (searchTerm.trim()) {
        const searchResults = await searchTutorMaterialsRest(searchTerm);
        setNotes(searchResults);
      } else {
        // If search term is empty, reload all materials
        await loadData();
      }
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
      await deleteTutorMaterialRest(noteToDelete.id);
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

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg">Loading study materials...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-600 rounded-3xl shadow-lg">
                    <BookOpenIcon className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-green-400">
                    Manage Study Materials
                  </h1>
                </div>
                <p className="text-lg text-slate-300 max-w-2xl">
                  Upload, edit, and manage your study materials for students
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateNote}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white font-bold rounded-2xl shadow-[0_2px_2px_0_#16803D] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <PlusIcon className="h-6 w-6 mr-3" />
                Upload New Material
              </motion.button>
            </div>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-700/50 rounded-xl shadow-lg p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-600 rounded-2xl bg-slate-600/50 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:border-slate-500 transition-colors duration-200"
                />
              </div>

              {/* Subject Filter */}
              <div className="relative">
                <FunnelIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-600 rounded-2xl bg-slate-600/50 text-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none shadow-sm hover:border-slate-500 transition-colors duration-200"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-slate-700/50 p-6 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-2xl shadow-lg">
                  <DocumentTextIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-base font-semibold text-slate-400">
                    Total Materials
                  </p>
                  <p className="text-3xl font-bold text-slate-200">
                    {notes.length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-slate-700/50 p-6 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-2xl shadow-lg">
                  <StarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-base font-semibold text-slate-400">
                    Premium Materials
                  </p>
                  <p className="text-3xl font-bold text-slate-200">
                    {notes.filter((note) => note.is_premium).length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-slate-700/50 p-6 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-2xl shadow-lg">
                  <EyeIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-base font-semibold text-slate-400">
                    Total Views
                  </p>
                  <p className="text-3xl font-bold text-slate-200">
                    {notes.reduce((sum, note) => sum + note.view_count, 0)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-slate-700/50 p-6 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-2xl shadow-lg">
                  <ArrowDownTrayIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-base font-semibold text-slate-400">
                    Total Downloads
                  </p>
                  <p className="text-3xl font-bold text-slate-200">
                    {notes.reduce((sum, note) => sum + note.download_count, 0)}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Materials List */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {filteredNotes.length === 0 ? (
              <div className="bg-slate-700/50 rounded-xl shadow-lg p-12 text-center">
                <div className="p-4 bg-slate-800/50 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <DocumentTextIcon className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-200 mb-3">
                  No materials found
                </h3>
                <p className="text-lg text-slate-400 mb-8 max-w-md mx-auto">
                  {notes.length === 0
                    ? "You haven't uploaded any study materials yet. Get started by uploading your first material!"
                    : "No materials match your search criteria. Try adjusting your filters."}
                </p>
                {notes.length === 0 && (
                  <button
                    onClick={handleCreateNote}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white font-bold rounded-2xl shadow-[0_2px_2px_0_#16803D] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <PlusIcon className="h-6 w-6 mr-3" />
                    Upload Your First Material
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTutorNoteModal
            isOpen={showCreateModal}
            onClose={handleModalClose}
            onNoteCreated={handleNoteCreated}
            subjects={subjects.map(s => ({ ...s, color: s.color || undefined }))}
          />
        )}

        {editingNote && (
          <EditTutorNoteModal
            isOpen={!!editingNote}
            onClose={handleModalClose}
            onNoteUpdated={handleNoteUpdated}
            note={editingNote}
            subjects={subjects.map(s => ({ ...s, color: s.color || undefined }))}
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
    </>
  );
};

export default ManageMaterialsPage;
