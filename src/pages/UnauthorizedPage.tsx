import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldExclamationIcon, HomeIcon } from '@heroicons/react/24/outline';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <ShieldExclamationIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-6xl font-bold text-gray-900 mb-4">403</h2>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Access Denied
          </h3>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <Link
            to="/"
            className="btn btn-primary hover-lift"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default UnauthorizedPage; 