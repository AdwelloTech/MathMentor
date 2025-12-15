import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import TutorDashboard from "@/pages/dashboards/TutorDashboard";
import { useAuth } from "@/contexts/AuthContext";

const TutorLayout: React.FC = () => {
  const location = useLocation();
  // Access auth to ensure hooks stay in sync; not directly used here
  useAuth();
  console.log('🏗️ TUTOR LAYOUT: Rendering for path:', location.pathname);

  // For nested routes, show the specific page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page content */}
      {location.pathname === "/tutor" || location.pathname === "/tutor/" ? (
        <TutorDashboard />
      ) : (
        <Outlet />
      )}
    </div>
  );
};

export default TutorLayout;
