import React from 'react';
import { motion } from 'framer-motion';
import { 
  UsersIcon, 
  AcademicCapIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();

  const stats = [
    {
      name: 'Total Students',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: UsersIcon,
    },
    {
      name: 'Active Teachers',
      value: '89',
      change: '+3%',
      changeType: 'positive',
      icon: AcademicCapIcon,
    },
    {
      name: 'Monthly Revenue',
      value: '$45,678',
      change: '+18%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Course Completion',
      value: '87%',
      change: '+5%',
      changeType: 'positive',
      icon: ChartBarIcon,
    },
  ];

  const quickActions = [
    {
      name: 'Manage Users',
      description: 'Add, edit, or remove users from the system',
      icon: UserGroupIcon,
      href: '/admin/users',
      color: 'bg-blue-500',
    },
    {
      name: 'Course Management',
      description: 'Create and manage courses and curriculum',
      icon: BookOpenIcon,
      href: '/admin/courses',
      color: 'bg-green-500',
    },
    {
      name: 'Financial Reports',
      description: 'View financial reports and analytics',
      icon: BanknotesIcon,
      href: '/admin/finance',
      color: 'bg-purple-500',
    },
    {
      name: 'Schedule Management',
      description: 'Manage class schedules and timetables',
      icon: CalendarDaysIcon,
      href: '/admin/schedules',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Here's an overview of your institute's performance and key metrics.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="card hover-glow hover-lift cursor-pointer"
          >
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="card hover-glow hover-lift cursor-pointer group"
            >
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className={`${action.color} rounded-lg p-3`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                  {action.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {action.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Registrations</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {item}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      John Doe {item}
                    </p>
                    <p className="text-xs text-gray-500">
                      Student • Registered 2 hours ago
                    </p>
                  </div>
                  <div className="badge badge-success">New</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">System Alerts</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-yellow-400 rounded-full mt-2"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Server maintenance scheduled
                  </p>
                  <p className="text-xs text-gray-500">
                    Scheduled for tonight at 2:00 AM
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-red-400 rounded-full mt-2"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Payment gateway issue
                  </p>
                  <p className="text-xs text-gray-500">
                    Some payments are failing
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Backup completed successfully
                  </p>
                  <p className="text-xs text-gray-500">
                    Daily backup finished at 3:00 AM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard; 