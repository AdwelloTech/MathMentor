import React from "react";
import { motion } from "framer-motion";
import {
  BookOpenIcon,
  EyeIcon,
  ClockIcon,
  AcademicCapIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import type { NoteCardProps } from "@/lib/notes";
import { formatNoteDate, getSubjectColor, truncateText } from "@/lib/notes";

interface NoteCardComponentProps extends NoteCardProps {
  onView: (noteId: string) => void;
  onDelete?: (noteId: string) => void;
}

const NoteCard: React.FC<NoteCardComponentProps> = ({
  id,
  title,
  description,
  subjectName,
  subjectDisplayName,
  subjectColor,
  gradeLevelDisplay,
  viewCount,
  createdAt,
  onView,
  onDelete,
}) => {
  const navigate = useNavigate();
  const subjectBgColor = getSubjectColor(subjectColor);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white rounded-xl shadow-sm border border-green-900/60 hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col"
    >
      {/* Subject Badge */}
      {subjectDisplayName && (
        <div
          className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: subjectBgColor }}
        >
          {subjectDisplayName}
        </div>
      )}

      {/* Grade Level Badge */}
      {gradeLevelDisplay && (
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {gradeLevelDisplay}
        </div>
      )}

      {/* Card Content */}
      <div className="p-6 pt-16 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-900 transition-colors">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
            {truncateText(description, 150)}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <EyeIcon className="h-4 w-4" />
              <span>{viewCount} views</span>
            </div>
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>{formatNoteDate(createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-auto">
          <button
            onClick={() => onView(id)}
            className="flex-1 bg-green-900 hover:bg-green-800 text-white font-medium py-2.5 px-4 rounded-md transition-all duration-200 flex items-center justify-center space-x-2 group/btn"
          >
            <BookOpenIcon className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
            <span>View</span>
          </button>
          <button
            onClick={() => navigate(`edit/${id}`)}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 group/btn"
          >
            <PencilIcon className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-md transition-all duration-200 flex items-center justify-center space-x-2 group/btn"
            >
              <TrashIcon className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-50/0 to-gray-50/0 group-hover:from-gray-50/20 group-hover:to-gray-50/10 transition-all duration-200 pointer-events-none" />
    </motion.div>
  );
};

export default NoteCard;
