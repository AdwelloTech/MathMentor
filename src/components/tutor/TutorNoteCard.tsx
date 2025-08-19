import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  StarIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import {
  formatTutorNoteDate,
  formatFileSize,
  getTutorNoteSubjectColor,
  truncateTutorNoteText,
  incrementTutorNoteDownloadCount,
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
  const hasContent = !hasFile; // If no file, assume it has text content

  // Track unique view when component mounts (student views the material)
  useEffect(() => {
    const trackUniqueView = async () => {
      // Check if we've already tracked this view in this session
      const viewKey = `view_tracked_${id}_${user?.id}`;
      const hasTrackedInSession = sessionStorage.getItem(viewKey);

      if (user && !hasTrackedInSession) {
        try {
          await incrementTutorNoteViewCountUnique(id, user.id);
          // Mark that we've tracked this view in this session
          sessionStorage.setItem(viewKey, "true");
        } catch (error) {
          console.error("Error tracking unique view:", error);
          // Don't throw error - view tracking failure shouldn't break the component
        }
      }
    };

    // Only track view once when component mounts
    trackUniqueView();
  }, [id, user]); // Keep minimal dependencies

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons or file links
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("a") ||
      (e.target as HTMLElement).tagName === "BUTTON" ||
      (e.target as HTMLElement).tagName === "A"
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
            {hasFile ? (
              <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
            ) : (
              <DocumentTextIcon className="h-5 w-5 text-green-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {title || "Untitled Material"}
            </h3>
          </div>
          {isPremium && (
            <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
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

        {/* File Info */}
        {hasFile && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
            <DocumentArrowUpIcon className="h-4 w-4" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (fileUrl) {
                  // Open PDF in new tab
                  window.open(fileUrl, "_blank");
                }
              }}
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
              title="Click to view file"
            >
              {fileName}
            </button>
            <span>•</span>
            <span>{formatFileSize(fileSize)}</span>
            <span>•</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileUrl) {
                    // Open PDF in new tab
                    window.open(fileUrl, "_blank");
                  }
                }}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors duration-200"
                title="View file"
              >
                <EyeIcon className="h-3 w-3" />
                <span className="text-xs font-medium">View</span>
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (fileUrl) {
                    try {
                      // Increment download count
                      await incrementTutorNoteDownloadCount(id);

                      // Force download by fetching the file and creating a blob
                      const response = await fetch(fileUrl);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = fileName || "download";
                      link.style.display = "none";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error("Error tracking download:", error);
                      // Fallback: try direct download
                      const link = document.createElement("a");
                      link.href = fileUrl;
                      link.download = fileName || "download";
                      link.target = "_blank";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }
                }}
                className="flex items-center space-x-1 text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded-md transition-colors duration-200"
                title="Download file"
              >
                <ArrowDownTrayIcon className="h-3 w-3" />
                <span className="text-xs font-medium">Download</span>
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <EyeIcon className="h-4 w-4" />
            <span>{viewCount} views</span>
          </div>
          {hasFile && (
            <div className="flex items-center space-x-1">
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>{downloadCount} downloads</span>
            </div>
          )}
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
