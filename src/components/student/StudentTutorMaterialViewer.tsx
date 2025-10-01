import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import DOMPurify from "dompurify";
import {
  formatFileSize,
  type StudentTutorMaterial,
} from "@/lib/studentTutorMaterials";
import {
  incrementTutorNoteDownloadCount,
  getTutorNoteSecureFile,
} from "@/lib/tutorNotes";
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
  const [secureFileUrl, setSecureFileUrl] = useState<string | null>(null);
  const hasFile = material.file_url && material.file_name;
  const hasContent = material.content && material.content.trim().length > 0;
  const isPdfFile =
    hasFile && material.file_name?.toLowerCase().endsWith(".pdf");

  // Load a signed URL whenever the modal opens or the material changes
  useEffect(() => {
    const loadSignedUrl = async () => {
      if (!hasFile) {
        setSecureFileUrl(null);
        return;
      }
      try {
        const { fileUrl } = await getTutorNoteSecureFile(material.id);
        setSecureFileUrl(fileUrl);
      } catch (e) {
        // Fall back to raw path if signed URL fails
        setSecureFileUrl(material.file_url || null);
      }
    };
    if (isOpen) {
      loadSignedUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, material.id]);

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
      await incrementTutorNoteDownloadCount(material.id);

      // Force download by fetching the file and creating a blob
      const response = await fetch(secureFileUrl || material.file_url!);
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
    if (secureFileUrl || material.file_url) {
      window.open(secureFileUrl || material.file_url!, "_blank");
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
            <div className="bg-background rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-border">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary to-primary/90 text-primary-foreground p-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h2 className="text-2xl font-bold text-primary-foreground mb-1">
                        {material.title || "Untitled Material"}
                      </h2>
                      <div className="flex flex-col items-start space-x-3">
                        {material.is_premium && (
                          <Badge variant="secondary" className="font-semibold">
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
                    className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground h-10 w-10 p-0 rounded-full"
                  >
                    <XMarkIcon className="h-5 w-5" />
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
                      <Card className="lg:col-span-2 border-border bg-card shadow-sm">
                        <CardHeader className="pb-3">
                          <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                            <BookOpenIcon className="h-5 w-5" />
                            Description
                          </h3>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground leading-relaxed">
                            {material.description}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Info Card */}
                    <Card className="border-border bg-card shadow-sm">
                      <CardHeader className="pb-3">
                        <h3 className="text-lg font-semibold text-card-foreground">
                          Material Info
                        </h3>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Stats */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                            <div className="flex items-center gap-2">
                              <EyeIcon className="h-4 w-4 text-secondary-foreground" />
                              <span className="text-sm font-semibold text-secondary-foreground">
                                Views
                              </span>
                            </div>
                            <span className="text-sm font-bold text-secondary-foreground">
                              {material.view_count}
                            </span>
                          </div>
                          {hasFile && (
                            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                              <div className="flex items-center gap-2">
                                <ArrowDownTrayIcon className="h-4 w-4 text-secondary-foreground" />
                                <span className="text-sm font-semibold text-secondary-foreground">
                                  Downloads
                                </span>
                              </div>
                              <span className="text-sm font-bold text-secondary-foreground">
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
                    <Card className="border-border bg-card shadow-sm">
                      <CardHeader className="pb-3">
                        <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                          <DocumentTextIcon className="h-5 w-5" />
                          Attached File
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between p-4 bg-secondary rounded-xl border border-border">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <DocumentTextIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-card-foreground truncate">
                                {material.file_name}
                              </p>
                              <p className="text-xs text-muted-foreground font-medium">
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
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View File
                              </Button>
                            )}
                            {isPdfFile && (
                              <Button
                                onClick={handleDownload}
                                disabled={loading}
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
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
                    <Card className="border-border bg-card shadow-sm">
                      <CardHeader className="pb-3">
                        <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                          <DocumentTextIcon className="h-5 w-5" />
                          PDF Document
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-secondary rounded-xl p-4 border border-border">
                          <iframe
                            src={secureFileUrl || material.file_url || ""}
                            title={`PDF: ${material.file_name || "document"}`}
                            className="w-full h-[700px] border border-border rounded-lg shadow-inner"
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
                    <Card className="border-border bg-card shadow-sm">
                      <CardHeader className="pb-3">
                        <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                          <BookOpenIcon className="h-5 w-5" />
                          Content
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(material.content || ""),
                          }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* No Content Message */}
                {!hasContent && !hasFile && (
                  <div className="px-6 pb-6">
                    <Card className="border-border bg-card shadow-sm">
                      <CardContent className="text-center py-12">
                        <div className="p-4 rounded-full bg-secondary w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <DocumentTextIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-card-foreground mb-2">
                          No content available
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
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
