import React from "react";
import { motion } from "framer-motion";
import {
  VideoCameraIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TutorDashboardStats as TutorDashboardStatsType } from "@/lib/dashboardService";

interface TutorDashboardStatsProps {
  stats: TutorDashboardStatsType | null;
}

const TutorDashboardStats: React.FC<TutorDashboardStatsProps> = ({ stats }) => {
  const statsData = [
    {
      name: "Total Classes",
      value: stats?.total_sessions || 0,
      icon: VideoCameraIcon,
      description: "All time sessions",
    },
    {
      name: "Students Taught",
      value: stats?.total_students || 0,
      icon: UserGroupIcon,
      description: "Unique students",
    },
    {
      name: "This Month",
      value: stats?.upcoming_sessions || 0,
      icon: CalendarDaysIcon,
      description: "Upcoming sessions",
    },
    {
      name: "Earnings",
      value: `$${stats?.monthly_earnings || 0}`,
      icon: CurrencyDollarIcon,
      description: "Monthly earnings",
    },
  ];

  return (
    <motion.div
      id="tutor-stats"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {statsData.map((stat) => (
        <motion.div
          key={stat.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border-border">
            <CardHeader className="pb-2">
              <div className="flex items-start space-x-3">
                <div className="bg-primary w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <stat.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {stat.name}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-baseline space-x-2">
                <div className="text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TutorDashboardStats;
