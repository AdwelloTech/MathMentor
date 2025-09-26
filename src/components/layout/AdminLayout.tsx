import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";

const AdminLayout: React.FC = () => {
  const location = useLocation();

  // If we're on the main admin route, show the dashboard
  if (location.pathname === "/admin" || location.pathname === "/admin/") {
    return <AdminDashboard />;
  }

  // For nested routes, show the specific page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page content */}
      <Outlet />
    </div>
  );
};

export default AdminLayout;
