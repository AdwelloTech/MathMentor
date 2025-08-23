import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  StarIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import {
  formatTutorNoteDate,
  getTutorNoteSubjectColor,
  truncateTutorNoteText,
  incrementTutorNoteViewCountUnique,
  type TutorNoteCardProps,
} from "@/lib/tutorNotes";
import { useAuth } from "@/contexts/AuthContext";

interface TutorNoteCardComponentProps extends TutorNoteCardProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

const TutorNoteCard: React.FC<TutorNoteCardComponentProps> = ({
  id,
  title,
  description,
  subjectName,
  subjectDisplayName,
  subjectColor,
  gradeLevelDisplay,
  isPremium,
  viewCount,
  downloadCount,
  fileUrl,
  fileName,
  fileSize,
  createdAt,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const { user } = useAuth();
  const hasFile = fileUrl && fileName;

  // Track unique view when component mounts (student views the material)
  useEffect(() => {
    const trackUniqueView = async () => {
      if (user) {
        try {
          await incrementTutorNoteViewCountUnique(id, user.id);
        } catch (error) {
          console.error("Error tracking unique view:", error);
          // Don't throw error - view tracking failure shouldn't break the component
        }
      }
    };

    // Only track view if user is authenticated (student viewing)
    if (user) {
      trackUniqueView();
    }
  }, [id, user]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).tagName === "BUTTON"
    ) {
      return;
    }
    onEdit();
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100 group-hover:bg-gray-50 transition-colors duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {title || "Untitled Material"}
            </h3>
          </div>
          {isPremium && (
            <div className="flex items-center space-x-1 bg-gradient-to-r from-green-600 to-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <StarIcon className="h-3 w-3" />
              <span>PREMIUM</span>
            </div>
          )}
        </div>

        {(description || !title) && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {description
              ? truncateTutorNoteText(description, 100)
              : "No description provided"}
          </p>
        )}

        {/* Subject and Grade */}
        <div className="flex items-center space-x-3 mb-3">
          {subjectDisplayName && (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${getTutorNoteSubjectColor(subjectColor)}20`,
                color: getTutorNoteSubjectColor(subjectColor),
              }}
            >
              {subjectDisplayName}
            </span>
          )}
          {gradeLevelDisplay && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {gradeLevelDisplay}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <EyeIcon className="h-4 w-4" />
            <span>{viewCount} views</span>
          </div>
          <div className="flex items-center space-x-1">
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>{downloadCount} downloads</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {formatTutorNoteDate(createdAt)}
          </span>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Edit material"
            >
              <PencilIcon className="h-4 w-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isDeleting
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-red-600 hover:bg-red-50"
              }`}
              title="Delete material"
            >
              <TrashIcon className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TutorNoteCard;
