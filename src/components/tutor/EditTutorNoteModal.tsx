import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import {
  updateTutorMaterialRest,
  incrementTutorNoteDownloadCount,
  getTutorNoteSecureFile,
} from "@/lib/tutorNotes";
import type { Database } from "@/types/database";
import RichTextEditor from "@/components/notes/RichTextEditor";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import {
  DESCRIPTION_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
} from "@/constants/form";

type TutorNoteWithDetails =
  Database["public"]["Functions"]["search_tutor_notes"]["Returns"][0];

interface EditTutorNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteUpdated: () => void;
  note: TutorNoteWithDetails;
  subjects: Array<{
    id: string;
    name: string;
    display_name: string;
    color?: string;
  }>;
}

const EditTutorNoteModal: React.FC<EditTutorNoteModalProps> = ({
  isOpen,
  onClose,
  onNoteUpdated,
  note,
  subjects,
}) => {
  const [loading, setLoading] = useState(false);
  const [secureFileUrl, setSecureFileUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    subjectId: "",
    isPremium: false,
    tags: [] as string[],
  });

  const hasFile = note.file_name && note.file_size;

  // Load secure file URL when note changes
  const loadSecureFileUrl = async () => {
    if (note && note.id && note.file_name && note.file_size) {
      setLoadingFile(true);
      try {
        const secureFile = await getTutorNoteSecureFile(note.id);
        setSecureFileUrl(secureFile.fileUrl);
        if (!secureFile.fileUrl) {
          console.warn("Failed to generate secure file URL for note:", note.id);
        }
      } catch (error) {
        console.error("Error loading secure file URL:", error);
        setSecureFileUrl(null);
        toast.error("Unable to load file access. Please try refreshing the page.");
      } finally {
        setLoadingFile(false);
      }
    }
  };

  // Initialize form data and load secure file URL when note changes
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        description: note.description || "",
        content: note.content || "",
        subjectId: note.subject_id || "",
        isPremium: note.is_premium,
        tags: note.tags || [],
      });
      // Reset secure file URL when note changes
      setSecureFileUrl(null);
      // Load secure file URL if there's a file
      loadSecureFileUrl();
    }
  }, [note?.id]); // Only depend on note.id to avoid unnecessary re-renders

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    // Content is optional if there's a file, but required if no file
    if (!hasFile && !formData.content.trim()) {
      toast.error("Please enter content for your material");
      return;
    }

    setLoading(true);

    try {
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title.trim());
      if (formData.description.trim()) {
        submitFormData.append('description', formData.description.trim());
      }
      if (formData.content.trim()) {
        submitFormData.append('content', formData.content.trim());
      }
      if (formData.subjectId && formData.subjectId.trim()) {
        submitFormData.append('subjectId', formData.subjectId.trim());
      }
      submitFormData.append('isPremium', formData.isPremium.toString());

      // Add tags if any
      if (formData.tags && formData.tags.length > 0) {
        submitFormData.append('tags', JSON.stringify(formData.tags));
      }

      await updateTutorMaterialRest(note.id, submitFormData);

      toast.success("Material updated successfully!");
      onNoteUpdated();
    } catch (error) {
      console.error("Error updating material:", error);
      toast.error("Failed to update material. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit Study Material
                </h2>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Material Type Indicator */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    {hasFile ? (
                      <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
                    ) : (
                      <DocumentTextIcon className="h-5 w-5 text-green-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {hasFile ? "File Upload" : "Text Note"}
                    </span>
                  </div>
                  {hasFile && (
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-600">File: </span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (secureFileUrl) {
                              window.open(secureFileUrl, "_blank");
                            } else if (!loadingFile) {
                              // Try to reload secure URL if not available
                              await loadSecureFileUrl();
                              // After loading, try to open if URL is now available
                              if (secureFileUrl) {
                                window.open(secureFileUrl, "_blank");
                              } else {
                                toast.error("Unable to access file. Please try again.");
                              }
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium text-sm"
                          title="Click to view file"
                          disabled={loadingFile}
                        >
                          {loadingFile ? "Loading..." : note.file_name}
                        </button>
                        <span className="text-sm text-gray-600">
                          ({(note.file_size || 0) / 1024 / 1024} MB)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (secureFileUrl) {
                              window.open(secureFileUrl, "_blank");
                            } else if (!loadingFile) {
                              // Try to reload secure URL if not available
                              await loadSecureFileUrl();
                              // After loading, try to open if URL is now available
                              if (secureFileUrl) {
                                window.open(secureFileUrl, "_blank");
                              } else {
                                toast.error("Unable to access file. Please try again.");
                              }
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors duration-200 text-xs font-medium"
                          title="Click to view file"
                          disabled={loadingFile}
                        >
                          {loadingFile ? "Loading..." : "View File"}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (secureFileUrl) {
                              try {
                                // Increment download count
                                await incrementTutorNoteDownloadCount(note.id);

                                // Force download by fetching the file and creating a blob
                                const response = await fetch(secureFileUrl);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = note.file_name || "download";
                                link.style.display = "none";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                              } catch (error) {
                                console.error("Error downloading file:", error);
                                toast.error("Failed to download file. Please try again.");
                              }
                            } else if (!loadingFile) {
                              // Try to reload secure URL if not available
                              await loadSecureFileUrl();
                              // After loading, try to download if URL is now available
                              if (secureFileUrl) {
                                try {
                                  await incrementTutorNoteDownloadCount(note.id);
                                  const response = await fetch(secureFileUrl);
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = note.file_name || "download";
                                  link.style.display = "none";
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                } catch (error) {
                                  console.error("Error downloading file:", error);
                                  toast.error("Failed to download file. Please try again.");
                                }
                              } else {
                                toast.error("Unable to access file for download. Please try again.");
                              }
                            }
                          }}
                          className="text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded-md transition-colors duration-200 text-xs font-medium"
                          title="Download file"
                          disabled={loadingFile}
                        >
                          {loadingFile ? "Loading..." : "Download"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Material Title *
                  </label>
                  <Input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full"
                    placeholder="Enter the title of your study material"
                    required
                    maxLength={NOTE_TITLE_MAX_LENGTH}
                    showCharCount
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter a detailed description of the study material..."
                    value={formData.description}
                    onChange={handleInputChange}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    className="w-full"
                    rows={4}
                    showCharCount
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Subject
                  </label>
                  <select
                    id="subject"
                    value={formData.subjectId}
                    onChange={(e) =>
                      setFormData({ ...formData, subjectId: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a subject (optional)</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) =>
                      setFormData({ ...formData, content })
                    }
                    placeholder="Write your study material content here..."
                  />
                </div>

                {/* Premium Toggle */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isPremium"
                    checked={formData.isPremium}
                    onChange={(e) =>
                      setFormData({ ...formData, isPremium: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isPremium"
                    className="text-sm font-medium text-gray-700"
                  >
                    Mark as Premium Material
                  </label>
                  <span className="text-xs text-gray-500">
                    (Only accessible to premium package students)
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Material</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditTutorNoteModal;
