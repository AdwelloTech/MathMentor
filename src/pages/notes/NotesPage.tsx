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
  type NotesSearchParams,
  type NoteCardProps,
} from "@/lib/notes";
import type { Database } from "@/types/database";

type NoteSubject = Database["public"]["Tables"]["note_subjects"]["Row"];

const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteCardProps[]>([]);
  const [subjects, setSubjects] = useState<NoteSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedNote, setSelectedNote] = useState<Database["public"]["Functions"]["search_study_notes"]["Returns"][0] | null>(null);
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
        setNotes(notesData.map(transformNoteForCard));
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
        setNotes(filteredNotes.map(transformNoteForCard));
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
        // Transform to the format expected by NoteViewer
        const transformedNote = {
          id: note._id,
          title: note.title,
          description: note.description || null,
          content: note.content,
          subject_name: note.subjectId?.name || null,
          subject_display_name: note.subjectId?.displayName || null,
          subject_color: note.subjectId?.color || null,
          grade_level_code: note.gradeLevelId?.code || null,
          grade_level_display: note.gradeLevelId?.displayName || null,
          viewCount: note.viewCount,
          created_at: note.createdAt,
          updated_at: note.updatedAt,
          createdBy: note.createdBy,
          isPublic: note.isPublic,
          _id: note._id,
        };
        setSelectedNote(transformedNote as any);
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


  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSubject("");
  };

  const hasActiveFilters = searchTerm.trim() || selectedSubject;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
                <p className="text-gray-600">
                  Access your study materials and resources
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                {/* Search Input */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Subject Filter */}
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
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
                  <button
                    onClick={clearFilters}
                    className="flex items-center justify-center space-x-2 px-4 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>

              {/* Create Note Button */}
              <button
                onClick={() => {
                  console.log("Create Note button clicked");
                  navigate("create");
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Create Note</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BookOpenIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasActiveFilters ? "No notes found" : "No notes available"}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your search terms or filters to find what you're looking for."
                  : "Study notes will appear here once they are added by your teachers."}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  Found {notes.length} note{notes.length !== 1 ? "s" : ""}
                </p>
                {hasActiveFilters && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <SparklesIcon className="h-4 w-4" />
                    <span>Filtered results</span>
                  </div>
                )}
              </div>

              {/* Notes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      {...note}
                      onView={handleViewNote}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </>
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
