import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  SparklesIcon,
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import NoteCard from "@/components/notes/NoteCard";
import NoteViewer from "@/components/notes/NoteViewer";
import {
  searchStudyNotes,
  getNoteSubjects,
  getStudyNoteById,
  transformNoteForCard,
  deleteStudyNote,
  type NotesSearchParams,
} from "@/lib/notes";
import type { Database } from "@/types/database";

type StudyNoteWithDetails =
  Database["public"]["Functions"]["search_study_notes"]["Returns"][0];
type NoteSubject = Database["public"]["Tables"]["note_subjects"]["Row"];

const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<StudyNoteWithDetails[]>([]);
  const [subjects, setSubjects] = useState<NoteSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedNote, setSelectedNote] = useState<StudyNoteWithDetails | null>(
    null
  );
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Load subjects and initial notes
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [notesData, subjectsData] = await Promise.all([
          searchStudyNotes(),
          getNoteSubjects(),
        ]);
        setNotes(notesData);
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Search and filter notes
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const searchParams: NotesSearchParams = {};

        if (searchTerm.trim()) {
          searchParams.searchTerm = searchTerm.trim();
        }

        if (selectedSubject) {
          searchParams.subjectFilter = selectedSubject;
        }

        const filteredNotes = await searchStudyNotes(searchParams);
        setNotes(filteredNotes);
      } catch (error) {
        console.error("Error searching notes:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchTerm, selectedSubject]);

  const handleViewNote = async (noteId: string) => {
    try {
      const note = await getStudyNoteById(noteId);
      if (note) {
        setSelectedNote(note);
        setIsViewerOpen(true);
      }
    } catch (error) {
      console.error("Error fetching note:", error);
    }
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedNote(null);
  };

  const handleNoteCreated = async () => {
    // Refresh the notes list after creating a new note
    try {
      const searchParams: NotesSearchParams = {};

      if (searchTerm.trim()) {
        searchParams.searchTerm = searchTerm.trim();
      }

      if (selectedSubject) {
        searchParams.subjectFilter = selectedSubject;
      }

      const updatedNotes = await searchStudyNotes(searchParams);
      setNotes(updatedNotes);
    } catch (error) {
      console.error("Error refreshing notes:", error);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSubject("");
  };

  const hasActiveFilters = searchTerm.trim() || selectedSubject;

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteStudyNote(noteId);
      // Refresh the notes list after deletion
      await handleNoteCreated();
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-green-900 mb-3">
            My Notes
          </h1>
          <p className="text-lg text-gray-700">
            Access your study materials and resources
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="border-green-200 bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-6">
              <FunnelIcon className="w-5 h-5 text-green-900" />
              <h2 className="text-green-900 font-semibold text-lg">Filters</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Search Input */}
              <div className="space-y-2">
                <label className="text-gray-900 font-medium">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-900" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-green-900/60 focus:border-green-900 focus:ring-green-900 rounded-md"
                  />
                </div>
              </div>

              {/* Subject Filter */}
              <div className="space-y-2">
                <label className="text-gray-900 font-medium">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-green-900/60 focus:border-green-900 focus:ring-green-900 rounded-md appearance-none bg-white"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="space-y-2">
                  <label className="text-gray-900 font-medium">&nbsp;</label>
                  <button
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-700 border border-green-900/60 hover:bg-gray-50 hover:text-gray-800 rounded-md transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              )}

              {/* Create Note Button */}
              <div className="space-y-2">
                <label className="text-gray-900 font-medium">&nbsp;</label>
                <button
                  onClick={() => {
                    console.log("Create Note button clicked");
                    navigate("create");
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-green-900 hover:bg-green-800 text-white px-6 py-3 rounded-md font-medium transition-all duration-200"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Create Note</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : notes.length === 0 ? (
            <div className="col-span-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="max-w-md mx-auto">
                  <BookOpenIcon className="w-20 h-20 text-green-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-green-900 mb-3">
                    {hasActiveFilters ? "No notes found" : "No notes available"}
                  </h3>
                  <p className="text-green-700 text-lg">
                    {hasActiveFilters
                      ? "Try adjusting your filters or check back later for new notes."
                      : "Study notes will appear here once they are added by your teachers."}
                  </p>
                </div>
              </motion.div>
            </div>
          ) : (
            <AnimatePresence>
              {notes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <NoteCard
                    {...transformNoteForCard(note)}
                    onView={handleViewNote}
                    onDelete={handleDeleteNote}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Note Viewer Modal */}
      <NoteViewer
        note={selectedNote}
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
      />
    </div>
  );
};

export default NotesPage;
