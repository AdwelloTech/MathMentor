import React, { useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  StarIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  LockClosedIcon,
  UserIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import {
  formatStudentTutorMaterialDate,
  type StudentTutorMaterialCardProps,
} from "@/lib/studentTutorMaterials";
import {
  incrementTutorNoteViewCountUnique,
} from "@/lib/tutorNotes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
  tutorName,
  isPremium,
  fileUrl,
  fileName,
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
        await incrementTutorNoteViewCountUnique(id, user.id);

        // Update the local view count after successful tracking
        if (onViewCountUpdate) {
          onViewCountUpdate(id, 1);
        }

        // Mark that we've tracked this view
        hasTrackedView.current = true;
      } catch (error) {
        console.debug("View tracking failed:", error);
        // Don't throw error - view tracking failure shouldn't break the component
      }
    }

    onView();
  };


  return (
    <Card
      className={`group transition-all duration-300 hover:shadow-xl border-border bg-card hover:-translate-y-1 rounded-2xl overflow-hidden flex flex-col h-full ${
        !hasAccess ? "opacity-75" : ""
      } ${
        isPremium ? "ring-2 ring-primary/30" : ""
      } cursor-pointer`}
      onClick={handleView}
    >
      {/* Premium Indicator */}
      {isPremium && (
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-primary z-10">
          <StarIcon className="absolute -top-8 -right-7 h-4 w-4 text-primary-foreground transform rotate-45" />
        </div>
      )}

      <CardHeader className="pb-3 relative">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-3 rounded-xl bg-primary/10 shadow-sm shrink-0">
            {hasFile ? (
              <ArrowUpTrayIcon className="h-5 w-5 text-primary" />
            ) : (
              <DocumentTextIcon className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-card-foreground line-clamp-2 leading-tight mb-1">
              {title || "Untitled Material"}
            </h3>
            {isPremium && (
              <Badge variant="secondary" className="font-semibold">
                PREMIUM
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-end space-y-4">
        {/* Tutor Name */}
        {tutorName && (
          <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
            <div className="p-2 rounded-lg bg-background shadow-sm">
              <UserIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Instructor</p>
              <p className="text-sm text-card-foreground font-semibold">
                {tutorName}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-lg"
              >
                <LockClosedIcon className="h-3 w-3 mr-1" />
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
                  variant="outline"
                  className="font-semibold text-xs"
                >
                  View
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentTutorMaterialCard;
