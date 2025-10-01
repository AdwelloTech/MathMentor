import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import TutorDashboard from "@/pages/dashboards/TutorDashboard";

const TutorLayout: React.FC = () => {
  const location = useLocation();

  // If we're on the main tutor route, show the dashboard
  if (location.pathname === "/tutor" || location.pathname === "/tutor/") {
    return <TutorDashboard />;
  }

  // For nested routes, show the specific page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page content */}
      <Outlet />
    </div>
  );
};

export default TutorLayout;
