import React, { useEffect, useState } from "react";
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
  getTutorNoteSecureFile,
  incrementTutorNoteDownloadCount,
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
  const hasFile = fileName && fileSize;
  const [loadingFile, setLoadingFile] = useState(false);
  const [secureFileUrl, setSecureFileUrl] = useState<string | null>(null);

  // Track unique view when component mounts (only for student views, not tutor views)
  useEffect(() => {
    const trackUniqueView = async () => {
      if (user && user.role === 'student') {
        try {
          await incrementTutorNoteViewCountUnique(id, user.id);
        } catch (error) {
          // View tracking failure shouldn't break the component - log at debug level
          console.debug("View tracking failed:", error);
        }
      }
    };

    // Only track view if user is authenticated AND is a student
    if (user && user.role === 'student') {
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

  const handleViewFile = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!hasFile) return;

    if (secureFileUrl) {
      window.open(secureFileUrl, "_blank");
      return;
    }

    // Load secure file URL if not available
    setLoadingFile(true);
    try {
      const secureFile = await getTutorNoteSecureFile(id);
      if (secureFile.fileUrl) {
        setSecureFileUrl(secureFile.fileUrl);
        window.open(secureFile.fileUrl, "_blank");
      }
    } catch (error) {
      console.error("Error loading secure file URL:", error);
    } finally {
      setLoadingFile(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!hasFile) return;

    let fileUrl = secureFileUrl;

    // Load secure file URL if not available
    if (!fileUrl) {
      setLoadingFile(true);
      try {
        const secureFile = await getTutorNoteSecureFile(id);
        if (secureFile.fileUrl) {
          fileUrl = secureFile.fileUrl;
          setSecureFileUrl(fileUrl);
        } else {
          setLoadingFile(false);
          return;
        }
      } catch (error) {
        console.error("Error loading secure file URL:", error);
        setLoadingFile(false);
        return;
      }
      setLoadingFile(false);
    }

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
      console.error("Error downloading file:", error);
      // Fallback: try direct download
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName || "download";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-[0_4px_4px_0_#16803D] border-0 overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer group"
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
            {hasFile && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewFile}
                  disabled={loadingFile}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                  title="View file"
                >
                  <EyeIcon className="h-4 w-4" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownload}
                  disabled={loadingFile}
                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                  title="Download file"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </motion.button>
              </>
            )}

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
