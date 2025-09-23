// apps/web/src/components/layout/DashboardLayout.tsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { canSeeTutorMenus } from "@/lib/roles";

const LinkItem: React.FC<{ to: string; children: React.ReactNode; disabled?: boolean }> = ({ to, children, disabled }) => {
  const base = "block py-2 px-3 rounded";
  const cls = disabled ? base + " opacity-40 cursor-not-allowed" : base + " hover:bg-gray-100";
  return disabled ? <span className={cls}>{children}</span> : <NavLink className={cls} to={to}>{children}</NavLink>;
};

const DashboardLayout: React.FC = () => {
  const { user, profile } = useAuth();
  const showTutor = canSeeTutorMenus({ user, profile });

  return (
    <div className="min-h-screen grid grid-cols-12">
      {/* Sidebar */}
      <aside className="col-span-12 md:col-span-3 lg:col-span-2 border-r bg-white">
        <nav className="p-4 space-y-2">
          {/* Common menus */}
          <NavLink className="block py-2 px-3 rounded hover:bg-gray-100" to="/dashboard">Dashboard</NavLink>
          <NavLink className="block py-2 px-3 rounded hover:bg-gray-100" to="/study">Study</NavLink>

          {/* Tutor menus */}
          <div className="mt-4">
            <div className="text-xs uppercase text-gray-500 px-3 mb-1">Tutor</div>
            <LinkItem to="/tutor/quizzes" disabled={!showTutor}>My Quizzes</LinkItem>
            <LinkItem to="/tutor/materials" disabled={!showTutor}>Tutor Materials</LinkItem>
            <LinkItem to="/tutor/sessions" disabled={!showTutor}>Instant Sessions</LinkItem>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="col-span-12 md:col-span-9 lg:col-span-10 p-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;
