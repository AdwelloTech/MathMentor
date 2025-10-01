import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TutorQuickActionsProps {
  isActiveTutor: boolean;
}

const TutorQuickActions: React.FC<TutorQuickActionsProps> = ({ isActiveTutor }) => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Schedule Class",
      description: "Create a new tutoring session",
      icon: PlusIcon,
      action: () => navigate("/schedule-class"),
      disabled: !isActiveTutor,
    },
    {
      title: "Manage Classes",
      description: "View and edit your classes",
      icon: CalendarDaysIcon,
      action: () => navigate("/manage-classes"),
      disabled: !isActiveTutor,
    },
    {
      title: "Create Quiz",
      description: "Build assessments for students",
      icon: DocumentTextIcon,
      action: () => navigate("/create-quiz"),
      disabled: !isActiveTutor,
    },
    {
      title: "Ratings",
      description: "View student feedback",
      icon: Star,
      action: () => navigate("/tutor/ratings"),
      disabled: !isActiveTutor,
    },
  ];

  return (
    <motion.div
      id="tutor-quick-actions"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-16"
    >
      <Card className="shadow-lg border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
              <LightBulbIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action) => (
              <motion.div
                key={action.title}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group shadow-lg border-border ${
                    action.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  onClick={action.disabled ? undefined : action.action}
                >
                  <CardContent className="p-6 text-center">
                    <div
                      className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg"
                    >
                      <action.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm text-secondary-foreground mb-4">
                      {action.description}
                    </p>
                    <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:bg-secondary/80 transition-all duration-200 shadow-md hover:shadow-lg">
                      {action.disabled ? "Unavailable" : "Get Started"}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TutorQuickActions;
