import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { quizPdfService } from "@/lib/quizPdfService";
import { subjectsService } from "@/lib/subjects";
import { fetchGradeLevels } from "@/lib/gradeLevels";
import { uploadPdfForAI } from "@/lib/ai";
import { useAdmin } from "@/contexts/AdminContext";
import type { QuizPdf } from "@/types/quizPdf";
import type { Subject } from "@/types/subject";
import type { GradeLevel } from "@/types/auth";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GradeSelect } from "@/components/ui/GradeSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ManageQuizPdfsPage: React.FC = () => {
  const { adminSession } = useAdmin();
  const [pdfs, setPdfs] = useState<QuizPdf[]>([]);
  const [filteredPdfs, setFilteredPdfs] = useState<QuizPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<QuizPdf | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    grade_level_id: "" as string | number | null,
    subject_id: "",
    file_name: "",
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    file_name: "",
    grade_level_id: "" as string | number | null,
    subject_id: "",
    is_active: true,
  });

  // Data for dropdowns
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPdfs();
  }, [pdfs, searchTerm, filterGrade, filterSubject, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pdfsData, gradeLevelsData, subjectsData] = await Promise.all([
        quizPdfService.list(),
        fetchGradeLevels(),
        subjectsService.listActive(),
      ]);
      setPdfs(pdfsData);
      setGradeLevels(gradeLevelsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load PDF data");
    } finally {
      setLoading(false);
    }
  };

  const filterPdfs = () => {
    let filtered = [...pdfs];

    if (searchTerm) {
      filtered = filtered.filter((pdf) =>
        pdf.file_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterGrade !== "all") {
      filtered = filtered.filter((pdf) => pdf.grade_level_id === filterGrade);
    }

    if (filterSubject !== "all") {
      filtered = filtered.filter((pdf) => pdf.subject_id === filterSubject);
    }

    if (filterStatus !== "all") {
      const isActive = filterStatus === "active";
      filtered = filtered.filter((pdf) => pdf.is_active === isActive);
    }

    setFilteredPdfs(filtered);
  };

  const handleFileUpload = async () => {
    if (!uploadForm.file || !uploadForm.subject_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!adminSession?.user?.id) {
      toast.error("Admin session not available. Please log in again.");
      return;
    }

    try {
      setLoading(true);

      // Upload PDF and get base64
      const result = await uploadPdfForAI(uploadForm.file);
      let pdfBase64: string, fileName: string, fileSize: number;

      if ("pdfs" in result && result.pdfs.length > 0) {
        ({ pdfBase64, fileName, fileSize } = result.pdfs[0]);
      } else {
        ({ pdfBase64, fileName, fileSize } = result as any);
      }

      // Create PDF record
      const pdfData: any = {
        file_name: uploadForm.file_name || uploadForm.file.name,
        file_path: pdfBase64,
        file_size: fileSize,
        subject_id: uploadForm.subject_id,
        is_active: true,
      };

      // Only include grade_level_id if it has a valid value
      if (uploadForm.grade_level_id && uploadForm.grade_level_id !== "") {
        pdfData.grade_level_id = uploadForm.grade_level_id;
      }

      // Since uploaded_by is nullable in the database, we can omit it entirely
      // This avoids any foreign key constraint issues

      // Debug: Log the data being sent
      console.log("Creating PDF with data:", pdfData);
      console.log("Admin session:", adminSession);

      const newPdf = await quizPdfService.create(pdfData);

      setPdfs((prev) => [newPdf, ...prev]);
      setShowUploadModal(false);
      resetUploadForm();
      toast.success("PDF uploaded successfully");
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast.error("Failed to upload PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedPdf) return;

    try {
      setLoading(true);
      const updatedPdf = await quizPdfService.update(selectedPdf.id, {
        file_name: editForm.file_name,
        grade_level_id: editForm.grade_level_id,
        subject_id: editForm.subject_id,
        is_active: editForm.is_active,
      });

      setPdfs((prev) =>
        prev.map((pdf) => (pdf.id === selectedPdf.id ? updatedPdf : pdf))
      );
      setShowEditModal(false);
      toast.success("PDF updated successfully");
    } catch (error) {
      console.error("Error updating PDF:", error);
      toast.error("Failed to update PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      setLoading(true);
      await quizPdfService.delete(deletingId);
      setPdfs((prev) => prev.filter((pdf) => pdf.id !== deletingId));
      setShowDeleteModal(false);
      setDeletingId(null);
      toast.success("PDF deleted successfully");
    } catch (error) {
      console.error("Error deleting PDF:", error);
      toast.error("Failed to delete PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (pdf: QuizPdf) => {
    try {
      const updatedPdf = await quizPdfService.toggleActive(pdf.id);
      setPdfs((prev) => prev.map((p) => (p.id === pdf.id ? updatedPdf : p)));
      toast.success(
        `PDF ${updatedPdf.is_active ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Error toggling PDF status:", error);
      toast.error("Failed to update PDF status");
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      file: null,
      grade_level_id: "",
      subject_id: "",
      file_name: "",
    });
  };

  const openEditModal = (pdf: QuizPdf) => {
    setSelectedPdf(pdf);
    setEditForm({
      file_name: pdf.file_name,
      grade_level_id: pdf.grade_level_id,
      subject_id: pdf.subject_id,
      is_active: pdf.is_active,
    });
    setShowEditModal(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getGradeDisplayName = (gradeId: string): string => {
    const grade = gradeLevels.find((g) => g.id === gradeId);
    return grade?.display_name || "Unknown Grade";
  };

  const getSubjectDisplayName = (subjectId: string): string => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.display_name || "Unknown Subject";
  };

  if (loading && pdfs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Quiz PDFs
          </h1>
          <p className="text-gray-600">
            Upload and manage PDFs that students can use for AI quiz generation
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Upload New PDF
          </Button>

          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search PDFs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {gradeLevels.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* PDFs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPdfs.map((pdf) => (
            <motion.div
              key={pdf.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DocumentIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {pdf.file_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(pdf.file_size)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={pdf.is_active ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {pdf.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AcademicCapIcon className="w-4 h-4" />
                    {getGradeDisplayName(pdf.grade_level_id)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpenIcon className="w-4 h-4" />
                    {getSubjectDisplayName(pdf.subject_id)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Uploaded: {new Date(pdf.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(pdf)}
                    className="flex-1"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(pdf)}
                    className={`flex-1 ${
                      pdf.is_active
                        ? "text-red-600 border-red-300 hover:bg-red-50"
                        : "text-green-600 border-green-300 hover:bg-green-50"
                    }`}
                  >
                    {pdf.is_active ? (
                      <XCircleIcon className="w-4 h-4 mr-1" />
                    ) : (
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                    )}
                    {pdf.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeletingId(pdf.id);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPdfs.length === 0 && !loading && (
          <div className="text-center py-12">
            <DocumentIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No PDFs found
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterGrade !== "all" || filterSubject !== "all"
                ? "Try adjusting your filters"
                : "Upload your first PDF to get started"}
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pdf-file">PDF File</Label>
              <Input
                id="pdf-file"
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    file: e.target.files?.[0] || null,
                  }))
                }
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="file-name">Display Name <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                id="file-name"
                value={uploadForm.file_name}
                onChange={(e) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    file_name: e.target.value,
                  }))
                }
                placeholder="Enter display name"
                className="mt-1"
                required
              />
            </div>
            <div className="w-full">
              <Label htmlFor="grade-level">Grade Level <span className="text-red-500">*</span></Label>
              <GradeSelect
                value={uploadForm.grade_level_id ? String(uploadForm.grade_level_id) : ""}
                onValueChange={(value) => {
                  setUploadForm((prev) => ({
                    ...prev,
                    grade_level_id: value,
                  }));
                }}
                placeholder="Select grade level"
                className="mt-1 w-full"
                required={true}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
              <Select
                value={uploadForm.subject_id}
                onValueChange={(value) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    subject_id: value,
                  }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleFileUpload}
                disabled={!uploadForm.file || !uploadForm.subject_id}
                className="flex-1"
              >
                <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Display Name</Label>
              <Input
                id="edit-name"
                value={editForm.file_name}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    file_name: e.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-grade">Grade Level</Label>
              <GradeSelect
                value={
                  editForm.grade_level_id ? String(editForm.grade_level_id) : ""
                }
                onChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    grade_level_id: value ? Number(value) : null,
                  }))
                }
                placeholder="Select grade level"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-subject">Subject</Label>
              <Select
                value={editForm.subject_id}
                onValueChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    subject_id: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editForm.is_active}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleEdit} className="flex-1">
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this PDF? This action cannot be
              undone.
            </p>
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1"
              >
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingId(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageQuizPdfsPage;
