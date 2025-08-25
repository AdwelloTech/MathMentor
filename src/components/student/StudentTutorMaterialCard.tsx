import React, { useRef } from "react";
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
  incrementStudentTutorMaterialViewCountUnique,
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
  onViewCountUpdate?: (materialId: string, newCount: number) => void;
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
  onViewCountUpdate,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasFile = fileUrl && fileName;
  const hasTrackedView = useRef(false);

  const handleView = async () => {
    if (!hasAccess) {
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
      // Force download by fetching the file and creating a blob
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
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
      await incrementStudentTutorMaterialDownloadCount(id);
    } catch (error) {
      console.error("Error downloading file:", error);
      // Fallback: try direct download
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName || "download";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      try {
        await incrementStudentTutorMaterialDownloadCount(id);
      } catch (e) {
        console.warn("Failed to record download count in fallback path:", e);
      }
    }
  };

  return (
    <Card
      className={`group  transition-all duration-300 hover:shadow-xl hover:shadow-green-900/10 border-0 shadow-lg h-[245px] w-[400px] flex flex-col overflow-hidden ${
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

        {/*{(description || !title) && (
          <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
            {description
              ? truncateStudentTutorMaterialText(description, 120)
              : "No description provided"}
          </p>
        )} */}
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
              <>
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
              </>
            )}
          </div>
        </div>
      </CardContent>

      {/*<CardFooter className="pt-4 border-t border-slate-100 bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-green-100">
                <Eye className="h-3 w-3 text-green-700" />
              </div>
              <span className="text-xs font-semibold text-green-700">
                {viewCount} views
              </span>
            </div>
            {hasFile && (
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-green-100">
                  <Download className="h-3 w-3 text-green-700" />
                </div>
                <span className="text-xs font-semibold text-green-700">
                  {downloadCount} downloads
                </span>
              </div>
            )}
          </div>
        </div>
      </CardFooter> */}
    </Card>
  );
};

export default StudentTutorMaterialCard;
