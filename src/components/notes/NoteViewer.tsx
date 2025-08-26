import React, { useEffect, useMemo } from "react";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import type { Database } from "@/types/database";
import {
  formatNoteDate,
  getSubjectColor,
  incrementNoteViewCount,
} from "@/lib/notes";

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

  // Sanitize HTML content to prevent XSS
  const sanitizedNoteContent = useMemo(
    () => DOMPurify.sanitize(formatNoteContent(note.content)),
    [note.content]
  );

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
                      __html: sanitizedNoteContent,
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

/**
 * Format markdown content for display
 */
function formatNoteContent(content: string): string {
  // Enhanced markdown to HTML conversion
  let html = content
    // Headers
    .replace(
      /^### (.*$)/gim,
      '<h3 class="text-lg font-semibold text-gray-900 mb-2 mt-4">$1</h3>'
    )
    .replace(
      /^## (.*$)/gim,
      '<h2 class="text-xl font-semibold text-gray-900 mb-3 mt-6">$1</h2>'
    )
    .replace(
      /^# (.*$)/gim,
      '<h1 class="text-2xl font-bold text-gray-900 mb-4 mt-8">$1</h1>'
    )

    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

    // Inline code
    .replace(
      /`(.*?)`/g,
      '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">$1</code>'
    )

    // Code blocks
    .replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono text-gray-800">$1</code></pre>'
    )

    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>'
    )

    // Quotes
    .replace(
      /^> (.*$)/gim,
      '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4">$1</blockquote>'
    )

    // Lists
    .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4 mb-1">$2</li>')

    // Wrap lists in ul/ol tags
    .replace(
      /(<li.*?<\/li>)/gs,
      '<ul class="list-disc list-inside mb-4">$1</ul>'
    )

    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed">')
    .replace(/\n/g, "<br>");

  // Wrap in paragraph tags if not already wrapped
  if (!html.startsWith("<")) {
    html = '<p class="mb-4 leading-relaxed">' + html + "</p>";
  }

  return html;
}

export default NoteViewer;
