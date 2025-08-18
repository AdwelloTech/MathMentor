import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  StarIcon,
  UserIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import {
  formatStudentTutorMaterialDate,
  formatFileSize,
  getStudentTutorMaterialSubjectColor,
  incrementStudentTutorMaterialDownloadCount,
  type StudentTutorMaterial,
} from "@/lib/studentTutorMaterials";

interface StudentTutorMaterialViewerProps {
  isOpen: boolean;
  onClose: () => void;
  material: StudentTutorMaterial;
  hasPremiumAccess: boolean;
}

const StudentTutorMaterialViewer: React.FC<StudentTutorMaterialViewerProps> = ({
  isOpen,
  onClose,
  material,
  hasPremiumAccess,
}) => {
  const [loading, setLoading] = useState(false);
  const hasFile = material.file_url && material.file_name;
  const hasContent = material.content && material.content.trim().length > 0;

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleDownload = async () => {
    if (!hasFile) return;

    try {
      setLoading(true);
      // Increment download count
      await incrementStudentTutorMaterialDownloadCount(material.id);

      // Force download by fetching the file and creating a blob
      const response = await fetch(material.file_url!);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = material.file_name || "download";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      // Fallback: try direct download
      const link = document.createElement("a");
      link.href = material.file_url!;
      link.download = material.file_name || "download";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = () => {
    if (material.file_url) {
      window.open(material.file_url, "_blank");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {hasFile ? (
                    <DocumentArrowUpIcon className="h-6 w-6 text-blue-600" />
                  ) : (
                    <DocumentTextIcon className="h-6 w-6 text-green-600" />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {material.title || "Untitled Material"}
                    </h2>
                    <div className="flex items-center space-x-2 mt-1">
                      {material.is_premium && (
                        <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          <StarIcon className="h-3 w-3" />
                          <span>PREMIUM</span>
                        </div>
                      )}
                      <span className="text-sm text-gray-500">
                        by {material.tutor_name || "Unknown Tutor"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Material Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Description */}
                    {material.description && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                          Description
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {material.description}
                        </p>
                      </div>
                    )}

                    {/* Subject and Grade */}
                    <div className="flex items-center space-x-3">
                      {material.subject_display_name && (
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor: `${getStudentTutorMaterialSubjectColor(
                              material.subject_color
                            )}20`,
                            color: getStudentTutorMaterialSubjectColor(
                              material.subject_color
                            ),
                          }}
                        >
                          {material.subject_display_name}
                        </span>
                      )}
                      {material.grade_level_display && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                          {material.grade_level_display}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <EyeIcon className="h-4 w-4" />
                        <span>{material.view_count} views</span>
                      </div>
                      {hasFile && (
                        <div className="flex items-center space-x-1">
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          <span>{material.download_count} downloads</span>
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="text-sm text-gray-500">
                      Created{" "}
                      {formatStudentTutorMaterialDate(material.created_at)}
                    </div>
                  </div>

                  {/* Right Column - File Info */}
                  {hasFile && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        Attached File
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {material.file_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(material.file_size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleViewFile}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span>View File</span>
                          </button>
                          <button
                            onClick={handleDownload}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                {hasContent && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Content
                    </h3>
                    <div
                      className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: material.content || "",
                      }}
                    />
                  </div>
                )}

                {/* No Content Message */}
                {!hasContent && !hasFile && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="text-center py-8">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No content available
                      </h3>
                      <p className="text-gray-600">
                        This material doesn't have any text content or attached
                        files.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StudentTutorMaterialViewer;
