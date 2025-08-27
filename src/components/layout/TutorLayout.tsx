import React from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { getRoleContainerClass } from "@/utils/roleStyles";

const TutorLayout: React.FC = () => {
  return (
    <div className={getRoleContainerClass("tutor")}>
      {/* Main content */}
      <main className="py-10">
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
    </div>
  );
};

export default TutorLayout;
