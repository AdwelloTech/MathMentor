import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AcademicCapIcon,
  UserIcon,
  DocumentIcon,
  IdentificationIcon,
  UserGroupIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";
import { cn } from "@/lib/utils";

const AdminLayout: React.FC = () => {
  const location = useLocation();

  // Admin navigation items for mobile
  const adminNavigation = [
    { name: "Dashboard", href: "/dashboard/admin", icon: AcademicCapIcon },
    { name: "Tutors", href: "/dashboard/admin/tutors", icon: UserIcon },
    { name: "Apps", href: "/dashboard/admin/tutor-applications", icon: DocumentIcon },
    { name: "ID Verify", href: "/dashboard/admin/id-verifications", icon: IdentificationIcon },
    { name: "Students", href: "/dashboard/admin/students", icon: UserGroupIcon },
    { name: "Quiz PDFs", href: "/dashboard/admin/quiz-pdfs", icon: DocumentIcon },
    { name: "Flashcards", href: "/dashboard/admin/flashcards", icon: BookOpenIcon },
    { name: "Settings", href: "/dashboard/admin/settings", icon: Cog6ToothIcon },
    { name: "Reports", href: "/dashboard/admin/reports", icon: ChartBarIcon },
    { name: "Profile", href: "/dashboard/profile", icon: UserCircleIcon },
  ];

  const isActive = (href: string) => location.pathname === href;

  // If we're on the main admin route, show the dashboard
  if (location.pathname === "/dashboard/admin" || location.pathname === "/dashboard/admin/") {
    return (
      <div className="relative">
        <AdminDashboard />
        {/* Mobile Bottom Navigation */}
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl"
        >
          <div className="safe-area-inset-bottom">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex items-center px-2 py-2 min-w-max">
                {adminNavigation.map((item, index) => {
                  const active = isActive(item.href);

                  return (
                    <motion.div
                      key={item.name}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      className="flex-shrink-0 w-16 mx-1"
                    >
                      <Link
                        to={item.href}
                        className={cn(
                          "flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl transition-all duration-300 min-h-[56px] active:scale-95 relative",
                          active
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 mb-1 transition-transform duration-300",
                          active && "scale-110"
                        )} />
                        <span className={cn(
                          "text-[10px] font-medium text-center leading-tight",
                          active && "font-semibold"
                        )}>
                          {item.name}
                        </span>
                        {active && (
                          <motion.div
                            layoutId="admin-mobile-nav-indicator"
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary-foreground rounded-t-full"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.nav>
      </div>
    );
  }

  // For nested routes, show the specific page
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)] pointer-events-none"></div>

      {/* Floating decorative elements - using the color palette from ADMIN_DASHBOARD_PLAN.md */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-600/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-green-600/10 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* Page content with bottom padding for mobile nav */}
      <main className="py-10 pb-24 lg:pb-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl"
      >
        <div className="safe-area-inset-bottom">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center px-2 py-2 min-w-max">
              {adminNavigation.map((item, index) => {
                const active = isActive(item.href);

                return (
                  <motion.div
                    key={item.name}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    className="flex-shrink-0 w-16 mx-1"
                  >
                    <Link
                      to={item.href}
                      className={cn(
                        "flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl transition-all duration-300 min-h-[56px] active:scale-95 relative",
                        active
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 mb-1 transition-transform duration-300",
                        active && "scale-110"
                      )} />
                      <span className={cn(
                        "text-[10px] font-medium text-center leading-tight",
                        active && "font-semibold"
                      )}>
                        {item.name}
                      </span>
                      {active && (
                        <motion.div
                          layoutId="admin-mobile-nav-indicator"
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary-foreground rounded-t-full"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.nav>
    </div>
  );
};

export default AdminLayout;
