import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import {
  formatStudentTutorMaterialDate,
  formatFileSize,
  getStudentTutorMaterialSubjectColor,
  incrementStudentTutorMaterialDownloadCount,
  type StudentTutorMaterial,
} from "@/lib/studentTutorMaterials";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface StudentTutorMaterialViewerProps {
  isOpen: boolean;
  onClose: () => void;
  material: StudentTutorMaterial;
}

const StudentTutorMaterialViewer: React.FC<StudentTutorMaterialViewerProps> = ({
  isOpen,
  onClose,
  material,
}) => {
  const [loading, setLoading] = useState(false);
  const hasFile = material.file_url && material.file_name;
  const hasContent = material.content && material.content.trim().length > 0;
  const isPdfFile =
    hasFile && material.file_name?.toLowerCase().endsWith(".pdf");

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-10"
          >
            <div className="bg-gray-200 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-green-900/10">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-green-900 to-green-800 text-white p-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {material.title || "Untitled Material"}
                      </h2>
                      <div className="flex flex-col items-start space-x-3">
                        {material.is_premium && (
                          <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white border-0 text-xs font-bold hover:from-green-500 hover:to-green-600">
                            PREMIUM
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleClose}
                    disabled={loading}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 hover:text-white h-10 w-10 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
                {/* Material Info Cards */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Description Card */}
                    {material.description && (
                      <Card className="lg:col-span-2 border-green-900/60 border-2 shadow-sm">
                        <CardHeader className="pb-3">
                          <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Description
                          </h3>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-700 leading-relaxed">
                            {material.description}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Info Card */}
                    <Card className=" border-green-900/60 border-2 shadow-sm">
                      <CardHeader className="pb-3">
                        <h3 className="text-lg font-semibold text-green-900">
                          Material Info
                        </h3>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Stats */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-black" />
                              <span className="text-sm font-semibold text-black">
                                Views
                              </span>
                            </div>
                            <span className="text-sm font-bold text-black">
                              {material.view_count}
                            </span>
                          </div>
                          {hasFile && (
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Download className="h-4 w-4 text-black" />
                                <span className="text-sm font-semibold text-black">
                                  Downloads
                                </span>
                              </div>
                              <span className="text-sm font-bold text-black">
                                {material.download_count}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Date */}
                      </CardContent>
                    </Card>
                  </div>

                  {/* File Info Card */}
                  {hasFile && (
                    <Card className="border-green-900/60 border-2 shadow-sm">
                      <CardHeader className="pb-3">
                        <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Attached File
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between p-4  rounded-xl border border-green-900">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-900">
                              <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-black truncate">
                                {material.file_name}
                              </p>
                              <p className="text-xs text-gray-700 font-medium">
                                {formatFileSize(material.file_size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!isPdfFile && (
                              <Button
                                onClick={handleViewFile}
                                disabled={loading}
                                size="sm"
                                className="bg-green-900 hover:bg-green-900 text-white"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View File
                              </Button>
                            )}
                            {isPdfFile && (
                              <Button
                                onClick={handleDownload}
                                disabled={loading}
                                size="sm"
                                className="bg-green-900 hover:bg-green-900  text-white"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* PDF Viewer */}
                {isPdfFile && (
                  <div className="px-6 pb-6">
                    <Card className="border-green-900/60 border-2 shadow-sm">
                      <CardHeader className="pb-3">
                        <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          PDF Document
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                          <iframe
                            src={material.file_url || ""}
                            title={`PDF: ${material.file_name || "document"}`}
                            className="w-full h-[700px] border border-slate-300 rounded-lg shadow-inner"
                            style={{ minHeight: "700px" }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Content */}
                {hasContent && (
                  <div className="px-6 pb-6">
                    <Card className="border-green-900/60 border-2 shadow-sm">
                      <CardHeader className="pb-3">
                        <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Content
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div
                          className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: material.content || "",
                          }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* No Content Message */}
                {!hasContent && !hasFile && (
                  <div className="px-6 pb-6">
                    <Card className="border-green-900/10 shadow-sm">
                      <CardContent className="text-center py-12">
                        <div className="p-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <FileText className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          No content available
                        </h3>
                        <p className="text-slate-600 max-w-md mx-auto">
                          This material doesn't have any text content or
                          attached files yet.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Footer */}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StudentTutorMaterialViewer;
