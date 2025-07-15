import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpenIcon, 
  CalendarDaysIcon, 
  ChartBarIcon, 
  VideoCameraIcon,
  LockClosedIcon,
  StarIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { getPackageDisplayName, getPackageFeatures } from '@/utils/permissions';

const StudentDashboard: React.FC = () => {
  const { profile, canAccess } = useAuth();

  const stats = [
    {
      name: 'Courses Enrolled',
      value: '6',
      icon: BookOpenIcon,
    },
    {
      name: 'Classes This Week',
      value: '12',
      icon: CalendarDaysIcon,
    },
    {
      name: 'Completion Rate',
      value: '78%',
      icon: ChartBarIcon,
    },
    {
      name: 'Total Hours',
      value: '156',
      icon: ClockIcon,
    },
  ];

  const features = [
    {
      name: 'Learning Resources',
      description: 'Access to PDFs, videos, and learning materials',
      icon: BookOpenIcon,
      enabled: canAccess('accessLearningResources'),
      href: '/student/resources',
      color: 'bg-blue-500',
    },
    {
      name: 'One-to-One Sessions',
      description: 'Book private tutoring sessions',
      icon: VideoCameraIcon,
      enabled: canAccess('bookOneToOne'),
      href: '/student/one-to-one',
      color: 'bg-green-500',
    },
    {
      name: 'Consultation Booking',
      description: 'Schedule consultation with teachers',
      icon: CalendarDaysIcon,
      enabled: canAccess('bookConsultation'),
      href: '/student/consultation',
      color: 'bg-purple-500',
    },
    {
      name: 'Group Classes',
      description: 'Join group learning sessions',
      icon: UserGroupIcon,
      enabled: canAccess('joinGroupClasses'),
      href: '/student/group-classes',
      color: 'bg-orange-500',
    },
  ];

  const upcomingClasses = [
    {
      name: 'Mathematics',
      time: '10:00 AM',
      teacher: 'Dr. Smith',
      type: 'Group Class',
    },
    {
      name: 'Physics',
      time: '2:00 PM',
      teacher: 'Prof. Johnson',
      type: 'One-to-One',
    },
    {
      name: 'Chemistry',
      time: '4:00 PM',
      teacher: 'Dr. Brown',
      type: 'Group Class',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile?.full_name}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Continue your learning journey with us.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="badge badge-primary">
              {profile?.package && getPackageDisplayName(profile.package)}
            </div>
            {profile?.package !== 'gold' && (
              <button className="btn btn-sm btn-outline">
                Upgrade Package
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="card hover-glow"
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
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Features */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Available Features</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className={`card hover-glow ${feature.enabled ? 'hover-lift cursor-pointer' : 'opacity-75'} relative`}
            >
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className={`${feature.color} rounded-lg p-3 ${!feature.enabled ? 'opacity-50' : ''}`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  {!feature.enabled && (
                    <div className="absolute top-4 right-4">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <h3 className={`text-lg font-medium mb-2 ${
                  feature.enabled ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {feature.name}
                </h3>
                <p className={`text-sm ${
                  feature.enabled ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {feature.description}
                </p>
                {!feature.enabled && (
                  <div className="mt-3">
                    <span className="text-xs text-primary-600 font-medium">
                      Upgrade to unlock
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Package Information */}
      {profile?.package && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Your Package Benefits</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getPackageFeatures(profile.package).map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <StarIcon className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Upcoming Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Today's Classes</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {upcomingClasses.map((cls, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                    <p className="text-xs text-gray-500">{cls.teacher}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{cls.time}</p>
                    <p className="text-xs text-gray-500">{cls.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Achievements</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <StarIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Completed Mathematics Module
                  </p>
                  <p className="text-xs text-gray-500">Grade: A+</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <StarIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Perfect Attendance This Week
                  </p>
                  <p className="text-xs text-gray-500">Keep it up!</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <StarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Top Performer in Physics
                  </p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard; 