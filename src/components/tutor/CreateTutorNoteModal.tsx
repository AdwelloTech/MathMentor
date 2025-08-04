import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import {
  createTutorNote,
  uploadTutorNoteFile,
  type CreateTutorNoteData,
} from "@/lib/tutorNotes";
import { getNoteSubjects } from "@/lib/notes";
import RichTextEditor from "@/components/notes/RichTextEditor";
import toast from "react-hot-toast";

interface CreateTutorNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteCreated: () => void;
  subjects: Array<{
    id: string;
    name: string;
    display_name: string;
    color: string;
  }>;
}

const CreateTutorNoteModal: React.FC<CreateTutorNoteModalProps> = ({
  isOpen,
  onClose,
  onNoteCreated,
  subjects,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    subjectId: "",
    isPremium: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to create materials");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!formData.subjectId) {
      toast.error("Please select a subject");
      return;
    }

    // Both content and file are optional, but at least one should be provided
    if (!formData.content.trim() && !selectedFile) {
      toast.error("Please provide either content or upload a file");
      return;
    }

    setLoading(true);

    try {
      // Create the note first
      const noteData: CreateTutorNoteData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        content: formData.content.trim() || undefined,
        subjectId: formData.subjectId || undefined,
        isPremium: formData.isPremium,
      };

      const newNote = await createTutorNote(noteData, user.id);

      // If a file was selected, handle the file upload
      if (selectedFile) {
        setUploadingFile(true);
        await uploadTutorNoteFile(selectedFile, newNote.id);
      }

      toast.success("Material created successfully!");
      resetForm();
      onNoteCreated();
    } catch (error) {
      console.error("Error creating material:", error);
      toast.error("Failed to create material. Please try again.");
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Please select a valid file type (PDF, Word, text, or image)"
      );
      return false;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      validateAndSetFile(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      subjectId: "",
      isPremium: false,
    });
    setSelectedFile(null);
    setIsDragOver(false);
  };

  const handleClose = () => {
    if (!loading && !uploadingFile) {
      resetForm();
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
                  Create New Study Material
                </h2>
                <button
                  onClick={handleClose}
                  disabled={loading || uploadingFile}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Material Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter the title of your study material"
                    required
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
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the material"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Subject *
                  </label>
                  <select
                    id="subject"
                    value={formData.subjectId}
                    onChange={(e) =>
                      setFormData({ ...formData, subjectId: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
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

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                      isDragOver
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex flex-col items-center"
                    >
                      <DocumentArrowUpIcon
                        className={`h-12 w-12 mb-4 transition-colors duration-200 ${
                          isDragOver ? "text-blue-500" : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-lg font-medium mb-2 transition-colors duration-200 ${
                          isDragOver ? "text-blue-700" : "text-gray-700"
                        }`}
                      >
                        {selectedFile
                          ? selectedFile.name
                          : isDragOver
                          ? "Drop your file here"
                          : "Click to select a file or drag and drop"}
                      </span>
                      <span className="text-sm text-gray-500">
                        PDF, Word, text, or image files up to 10MB
                      </span>
                    </label>
                  </div>
                  {selectedFile && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DocumentArrowUpIcon className="h-4 w-4 text-green-600" />
                          <div className="flex items-center space-x-1">
                            <span className="text-sm text-green-700">
                              File:{" "}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                // Create a temporary URL for the file and open it
                                const fileUrl =
                                  URL.createObjectURL(selectedFile);
                                window.open(fileUrl, "_blank");
                                // Clean up the URL after a short delay
                                setTimeout(
                                  () => URL.revokeObjectURL(fileUrl),
                                  1000
                                );
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium text-sm"
                              title="Click to view file"
                            >
                              {selectedFile.name}
                            </button>
                            <span className="text-sm text-green-700">
                              ({(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                              MB)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              // Create a temporary URL for the file and open it
                              const fileUrl = URL.createObjectURL(selectedFile);
                              window.open(fileUrl, "_blank");
                              // Clean up the URL after a short delay
                              setTimeout(
                                () => URL.revokeObjectURL(fileUrl),
                                1000
                              );
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors duration-200 text-xs font-medium"
                            title="Click to view file"
                          >
                            View File
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              // Force download by creating a blob URL
                              const fileUrl = URL.createObjectURL(selectedFile);
                              const link = document.createElement("a");
                              link.href = fileUrl;
                              link.download = selectedFile.name;
                              link.style.display = "none";
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              // Clean up the URL after a short delay
                              setTimeout(
                                () => URL.revokeObjectURL(fileUrl),
                                1000
                              );
                            }}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded-md transition-colors duration-200 text-xs font-medium"
                            title="Download file"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
                    disabled={loading || uploadingFile}
                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadingFile}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading || uploadingFile ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>
                          {uploadingFile ? "Uploading..." : "Creating..."}
                        </span>
                      </>
                    ) : (
                      <span>Create Study Material</span>
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

export default CreateTutorNoteModal;
