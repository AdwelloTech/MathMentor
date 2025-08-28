import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
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
