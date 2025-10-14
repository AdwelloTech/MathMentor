import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  EyeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import type { Database } from "@/types/database";
import {
  formatNoteDate,
  getSubjectColor,
  incrementNoteViewCount,
} from "@/lib/notes";
import { formatMarkdownSafe } from "@/utils/sanitize";

type StudyNoteWithDetails =
  Database["public"]["Functions"]["search_study_notes"]["Returns"][0];

interface NoteViewerProps {
  note: StudyNoteWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

const NoteViewer: React.FC<NoteViewerProps> = ({ note, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen && note) {
      // Increment view count when note is opened
      incrementNoteViewCount(note.id).catch(console.error);
    }
  }, [isOpen, note]);

  if (!note) return null;

  const subjectColor = getSubjectColor(note.subject_color);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  {note.subject_display_name && (
                    <div
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: subjectColor }}
                    >
                      {note.subject_display_name}
                    </div>
                  )}
                  {note.grade_level_display && (
                    <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      {note.grade_level_display}
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {note.title}
                </h1>

                {/* Meta Info */}
                <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-1">
                    <EyeIcon className="h-4 w-4" />
                    <span>{note.view_count} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>{formatNoteDate(note.created_at)}</span>
                  </div>
                </div>

                {/* Description */}
                {note.description && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-700">{note.description}</p>
                  </div>
                )}

                {/* Note Content */}
                <div className="prose prose-lg max-w-none">
                  <div
                    className="text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: formatMarkdownSafe(note.content),
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NoteViewer;
