import React, { useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  StarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  formatStudentTutorMaterialDate,
  formatFileSize,
  getStudentTutorMaterialSubjectColor,
  truncateStudentTutorMaterialText,
  incrementStudentTutorMaterialViewCountUnique,
  incrementStudentTutorMaterialDownloadCount,
  type StudentTutorMaterialCardProps,
} from "@/lib/studentTutorMaterials";

interface StudentTutorMaterialCardComponentProps
  extends StudentTutorMaterialCardProps {
  onView: () => void;
  onViewCountUpdate?: (materialId: string, newCount: number) => void;
}

const StudentTutorMaterialCard: React.FC<
  StudentTutorMaterialCardComponentProps
> = ({
  id,
  title,
  description,
  subjectName,
  subjectDisplayName,
  subjectColor,
  gradeLevelDisplay,
  tutorName,
  isPremium,
  viewCount,
  downloadCount,
  fileUrl,
  fileName,
  fileSize,
  createdAt,
  hasAccess,
  onView,
  onViewCountUpdate,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasFile = fileUrl && fileName;
  const hasTrackedView = useRef(false);

  // Remove automatic view tracking - only track when user clicks View button

  const handleView = async () => {
    if (!hasAccess) {
      // This should be handled by the parent component, but as a fallback
      return;
    }

    // Track the view when user clicks View button
    if (user && !hasTrackedView.current) {
      try {
        console.log("Tracking view for material:", id);
        await incrementStudentTutorMaterialViewCountUnique(id, user.id);
        console.log("View tracking completed successfully");

        // Update the local view count after successful tracking
        if (onViewCountUpdate) {
          console.log("Updating local view count by 1");
          onViewCountUpdate(id, 1);
        }

        // Mark that we've tracked this view
        hasTrackedView.current = true;
      } catch (error) {
        console.error("Error tracking view:", error);
        // Don't throw error - view tracking failure shouldn't break the component
      }
    }

    onView();
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!hasAccess || !fileUrl) return;

    try {
      // Increment download count
      await incrementStudentTutorMaterialDownloadCount(id);

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
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group ${
        !hasAccess ? "opacity-75" : ""
      }`}
      onClick={handleView}
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
              ? truncateStudentTutorMaterialText(description, 100)
              : "No description provided"}
          </p>
        )}

        {/* Tutor Name */}
        {tutorName && (
          <div className="flex items-center space-x-2 mb-3">
            <UserIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">
              {tutorName}
            </span>
          </div>
        )}

        {/* Subject and Grade */}
        <div className="flex items-center space-x-3 mb-3">
          {subjectDisplayName && (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${getStudentTutorMaterialSubjectColor(
                  subjectColor
                )}20`,
                color: getStudentTutorMaterialSubjectColor(subjectColor),
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
            <span className="text-blue-600 font-medium">{fileName}</span>
            <span>•</span>
            <span>{formatFileSize(fileSize)}</span>
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
            {formatStudentTutorMaterialDate(createdAt)}
          </span>

          <div className="flex items-center space-x-2">
            {!hasAccess ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/student/packages");
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium text-sm hover:from-yellow-600 hover:to-orange-600 transition-all duration-200"
              >
                <LockClosedIcon className="h-4 w-4" />
                <span>Upgrade to Access</span>
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView();
                  }}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-all duration-200"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>View</span>
                </motion.button>

                {hasFile && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-all duration-200"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>Download</span>
                  </motion.button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentTutorMaterialCard;
