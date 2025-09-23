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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CreateTutorNoteModal from "@/components/tutor/CreateTutorNoteModal";
import EditTutorNoteModal from "@/components/tutor/EditTutorNoteModal";
import DeleteTutorNoteModal from "@/components/tutor/DeleteTutorNoteModal";
import TutorNoteCard from "@/components/tutor/TutorNoteCard";
import TutorPageWrapper from "@/components/ui/TutorPageWrapper";
import {
  searchTutorNotes,
  getTutorNotesByTutorId,
  deleteTutorNote,
  transformTutorNoteForCard,
  type TutorNoteWithDetails,
  getNoteSubjects, // ← use resilient subject loader
} from "@/lib/tutorNotes";
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

  const normalizeSubjects = (raw: any[]): Array<{
    id: string;
    name: string;
    display_name: string;
    color: string;
  }> => {
    const list = Array.isArray(raw) ? raw : [];
    return list.map((s: any) => ({
      id: String(s?.id ?? s?._id ?? s?.uuid ?? s?.slug ?? ""),
      name:
        s?.display_name ?? s?.displayName ?? s?.name ?? s?.title ?? "Untitled",
      display_name:
        s?.display_name ?? s?.displayName ?? s?.name ?? s?.title ?? "Untitled",
      color: s?.color ?? "#94a3b8",
    }));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [notesData, subjectsRaw] = await Promise.all([
        getTutorNotesByTutorId(user!.id),
        getNoteSubjects(), // ← replaces subjectsService.listActive()
      ]);

      setNotes(Array.isArray(notesData) ? notesData : []);
      setSubjects(normalizeSubjects(subjectsRaw));
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load materials. Please refresh the page.");
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
      <TutorPageWrapper backgroundClass="bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-900 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading study materials...</p>
          </div>
        </div>
      </TutorPageWrapper>
    );
  }

  return (
    <TutorPageWrapper backgroundClass="bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-900 rounded-3xl shadow-lg">
                    <BookOpenIcon className="h-8 w-8 text-yellow-400" />
                  </div>
                  <h1 className="text-4xl font-bold text-green-900">
                    Manage Study Materials
                  </h1>
                </div>
                <p className="text-lg text-slate-600 max-w-2xl">
                  Upload, edit, and manage your study materials for students
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateNote}
                className="inline-flex items-center px-8 py-4 bg-green-900 text-white font-bold rounded-2xl shadow-lg hover:bg-green-800 hover:shadow-xl transition-all duration-200"
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
            className="bg-white rounded-xl shadow-[0_4px_4px_0_#16803D] border-0 p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors duration-200"
                />
              </div>

              {/* Subject Filter */}
              <div className="relative">
                <FunnelIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white shadow-sm hover:border-gray-300 transition-colors duration-200"
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
            <div className="bg-white rounded-xl shadow-[0_4px_4px_0_#16803D] border-0 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-2xl shadow-lg">
                  <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-base font-semibold text-gray-600">
                    Total Materials
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {notes.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_4px_4px_0_#16803D] border-0 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-2xl shadow-lg">
                  <StarIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-base font-semibold text-gray-600">
                    Premium Materials
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {notes.filter((note) => note.is_premium).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_4px_4px_0_#16803D] border-0 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-2xl shadow-lg">
                  <EyeIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-base font-semibold text-gray-600">
                    Total Views
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {notes.reduce((sum, note) => sum + note.view_count, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_4px_4px_0_#16803D] border-0 p-6 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-2xl shadow-lg">
                  <ArrowDownTrayIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-base font-semibold text-gray-600">
                    Total Downloads
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
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
              <div className="bg-white rounded-xl shadow-[0_4px_4px_0_#16803D] border-0 p-12 text-center">
                <div className="p-4 bg-gray-100 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No materials found
                </h3>
                <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                  {notes.length === 0
                    ? "You haven't uploaded any study materials yet. Get started by uploading your first material!"
                    : "No materials match your search criteria. Try adjusting your filters."}
                </p>
                {notes.length === 0 && (
                  <button
                    onClick={handleCreateNote}
                    className="inline-flex items-center px-8 py-4 bg-green-900 text-white font-bold rounded-2xl hover:bg-green-800 shadow-lg hover:shadow-xl transition-all duration-200"
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
    </TutorPageWrapper>
  );
};

export default ManageMaterialsPage;
