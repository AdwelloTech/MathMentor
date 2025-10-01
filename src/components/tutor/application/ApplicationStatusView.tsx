import React from "react";
import { motion } from "framer-motion";
import {
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Card } from "@/components/ui/card";
import type { TutorApplication, TutorApplicationStatus } from "@/types/auth";

interface ApplicationStatusViewProps {
  application: TutorApplication;
  onGoToDashboard?: () => void;
}

const ApplicationStatusView: React.FC<ApplicationStatusViewProps> = ({
  application,
  onGoToDashboard,
}) => {
  const status = application.application_status as TutorApplicationStatus;

  if (status === "pending") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 pb-16 relative z-10"
        >
          <div className="space-y-8">
            <div className="text-center py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
              >
                <Card className="shadow-lg border-border p-8">
                  <ClockIcon className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Application Under Review
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    Thank you for submitting your tutor application. Our team is
                    currently reviewing your qualifications and experience.
                  </p>

                  <div className="bg-card border border-border rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-medium text-card-foreground mb-2">
                      Application Details:
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium text-card-foreground">Submitted:</span>{" "}
                        {new Date(application.submitted_at).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium text-card-foreground">Subjects:</span>{" "}
                        {application.subjects.join(", ")}
                      </p>
                      <p>
                        <span className="font-medium text-card-foreground">CV:</span>{" "}
                        {application.cv_file_name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground mb-6">
                    <p>Review typically takes 2-3 business days.</p>
                    <p>
                      We'll notify you via email once your application has been
                      reviewed.
                    </p>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === "under_review") {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning/10 border border-warning/20 rounded-lg p-8"
        >
          <ExclamationTriangleIcon className="h-16 w-16 text-warning mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Application Under Additional Review
          </h1>
          <p className="text-muted-foreground mb-6">
            Your application is being reviewed in detail by our team. We may
            contact you for additional information.
          </p>

          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex items-center text-sm text-muted-foreground">
              <ClockIcon className="h-5 w-5 mr-2" />
              <span>Extended review in progress - please check back soon</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-8"
        >
          <XCircleIcon className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Application Not Approved
          </h1>
          <p className="text-muted-foreground mb-4">
            Unfortunately, your tutor application was not approved at this time.
          </p>

          {application.rejection_reason && (
            <div className="bg-card border border-border rounded-lg p-4 mb-4 text-left">
              <h3 className="font-medium text-card-foreground mb-2">Reason:</h3>
              <p className="text-muted-foreground text-sm">
                {application.rejection_reason}
              </p>
            </div>
          )}

          {application.admin_notes && (
            <div className="bg-card border border-border rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-card-foreground mb-2">
                Additional Notes:
              </h3>
              <p className="text-muted-foreground text-sm">{application.admin_notes}</p>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-6">
            You're welcome to improve your qualifications and apply again in the
            future.
          </p>
          {onGoToDashboard && (
            <button onClick={onGoToDashboard} className="btn btn-secondary">
              Return to Dashboard
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return null;
};

export default ApplicationStatusView;
