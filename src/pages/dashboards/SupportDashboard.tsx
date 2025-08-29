import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const SupportDashboard: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile?.full_name}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Support Dashboard - Manage support tickets and customer service.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card"
      >
        <div className="card-body">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Support Dashboard
          </h2>
          <p className="text-gray-600">
            This is your support dashboard. You can manage support tickets, help users, and provide customer service.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SupportDashboard; 