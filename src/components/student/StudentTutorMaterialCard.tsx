import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Eye,
  Download,
  FileText,
  Upload,
  Lock,
  User,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  formatStudentTutorMaterialDate,
  formatFileSize,
  getStudentTutorMaterialSubjectColor,
  truncateStudentTutorMaterialText,
  incrementStudentTutorMaterialDownloadCount,
  type StudentTutorMaterialCardProps,
} from "@/lib/studentTutorMaterials";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

interface StudentTutorMaterialCardComponentProps
  extends StudentTutorMaterialCardProps {
  onView: () => void;
  onDownloadCountUpdate?: (materialId: string, newCount: number) => void;
}

const StudentTutorMaterialCard: React.FC<
  StudentTutorMaterialCardComponentProps
> = ({
  id,
  title,
  description,
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
  onDownloadCountUpdate,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasFile = fileUrl && fileName;

  // View tracking is handled by the StudentTutorMaterialViewer when it opens

  const handleView = () => {
    if (!hasAccess) {
      return;
    }

    onView();
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!hasAccess || !fileUrl) return;

    try {
      // Increment download count
      const didIncrement = await incrementStudentTutorMaterialDownloadCount(id);

      // Update the local download count after successful tracking
      if (didIncrement && onDownloadCountUpdate) {
        console.log("Updating local download count by 1");
        onDownloadCountUpdate(id, 1);
      } else if (!didIncrement) {
        console.log("Download count increment failed, skipping local update");
      }

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
    <Card
      className={`group transition-all duration-300 hover:shadow-xl hover:shadow-green-900/10 border-0 shadow-lg h-[245px] w-[400px] flex flex-col overflow-hidden ${
        !hasAccess ? "opacity-75" : ""
      } ${isPremium ? "ring-2 ring-yellow-400/20" : ""}`}
      onClick={handleView}
    >
      {/* Premium Indicator */}
      {isPremium && (
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-yellow-400 z-10">
          <Star className="absolute -top-8 -right-7 h-4 w-4 text-green-900 transform rotate-45" />
        </div>
      )}

      <CardHeader className="pb-3 relative">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-900 to-green-800 shadow-lg shrink-0">
            {hasFile ? (
              <Upload className="h-5 w-5 text-white" />
            ) : (
              <FileText className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-green-900 line-clamp-2 leading-tight mb-1">
              {title || "Untitled Material"}
            </h3>
            {isPremium && (
              <Badge className="bg-yellow-400 text-black border-0 text-xs font-bold">
                PREMIUM
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Tutor Name */}
        {tutorName && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg">
            <div className="p-2 rounded-lg bg-white shadow-sm">
              <User className="h-4 w-4 text-green-900" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Instructor</p>
              <p className="text-sm text-green-900 font-semibold">
                {tutorName}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">
              {formatStudentTutorMaterialDate(createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!hasAccess ? (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/student/packages");
                }}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-green-900 text-xs font-bold shadow-lg border-0"
              >
                <Lock className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleView();
                }}
                className="bg-gradient-to-r from-green-900 to-green-800 hover:from-green-800 hover:to-green-700 text-white text-xs font-semibold shadow-lg"
              >
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Remove the Stats Footer - not needed on the card */}
    </Card>
  );
};

export default StudentTutorMaterialCard;
