import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParentStudentLink, parentService } from '@/lib/parentService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ParentContextType {
  selectedStudent: ParentStudentLink | undefined;
  linkedStudents: ParentStudentLink[];
  refreshStudents: () => Promise<void>;
}

interface DashboardData {
  quizStats: {
    totalQuizzes: number;
    completedQuizzes: number;
    averageScore: number;
    recentQuizzes: any[];
  };
  sessionStats: {
    totalSessions: number;
    upcomingSessions: number;
    completedSessions: number;
    recentSessions: any[];
  };
  performanceOverview: {
    strengths: string[];
    areasForImprovement: string[];
  };
}

const ParentDashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const { selectedStudent } = useOutletContext<ParentContextType>();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedStudent) {
      loadDashboardData();
    } else {
      navigate('/parent/manage');
    }
  }, [selectedStudent]);

  const loadDashboardData = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(true);
      setError('');
      const data = await parentService.getStudentDashboard(selectedStudent.studentId);
      setDashboardData(data);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!selectedStudent) {
    return (
      <Alert className="bg-yellow-900/40 border-yellow-400/30 text-white">
        <AlertDescription>
          Please select a student from the dropdown above or link a student to get started.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full bg-green-950/40" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full bg-green-950/40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-900/40 border-red-400/30 text-white">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quiz Stats */}
        <motion.div variants={itemVariants}>
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl h-full hover:border-yellow-400/40 transition-colors cursor-pointer" onClick={() => navigate('/parent/quiz-progress')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-yellow-300 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                  Quiz Performance
                </CardTitle>
                <ArrowRightIcon className="h-5 w-5 text-white/60" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Total Quizzes</span>
                  <span className="text-2xl font-bold text-yellow-300">
                    {dashboardData?.quizStats.totalQuizzes || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Completed</span>
                  <span className="text-xl font-semibold text-green-300">
                    {dashboardData?.quizStats.completedQuizzes || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Average Score</span>
                  <span className="text-xl font-semibold text-blue-300">
                    {dashboardData?.quizStats.averageScore?.toFixed(1) || '0.0'}%
                  </span>
                </div>
              </div>
              <Button 
                className="w-full bg-yellow-400 text-green-900 hover:bg-yellow-500"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/parent/quiz-progress');
                }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Session Stats */}
        <motion.div variants={itemVariants}>
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl h-full hover:border-yellow-400/40 transition-colors cursor-pointer" onClick={() => navigate('/parent/session-progress')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-yellow-300 flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5" />
                  Sessions
                </CardTitle>
                <ArrowRightIcon className="h-5 w-5 text-white/60" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Total Sessions</span>
                  <span className="text-2xl font-bold text-yellow-300">
                    {dashboardData?.sessionStats.totalSessions || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Upcoming</span>
                  <span className="text-xl font-semibold text-blue-300">
                    {dashboardData?.sessionStats.upcomingSessions || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80 text-sm">Completed</span>
                  <span className="text-xl font-semibold text-green-300">
                    {dashboardData?.sessionStats.completedSessions || 0}
                  </span>
                </div>
              </div>
              <Button 
                className="w-full bg-yellow-400 text-green-900 hover:bg-yellow-500"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/parent/session-progress');
                }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Overview */}
        <motion.div variants={itemVariants}>
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl h-full">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-300 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-green-300">Strengths</h4>
                {dashboardData?.performanceOverview.strengths && dashboardData.performanceOverview.strengths.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {dashboardData.performanceOverview.strengths.map((strength, index) => (
                      <Badge key={index} className="bg-green-400/20 text-green-300 border-green-400/30">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">No data yet</p>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-orange-300">Areas for Improvement</h4>
                {dashboardData?.performanceOverview.areasForImprovement && dashboardData.performanceOverview.areasForImprovement.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {dashboardData.performanceOverview.areasForImprovement.map((area, index) => (
                      <Badge key={index} className="bg-orange-400/20 text-orange-300 border-orange-400/30">
                        {area}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">No data yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-yellow-300">Recent Activity</CardTitle>
            <CardDescription className="text-white/80">
              Latest quizzes and sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Quizzes */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white/90 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-4 w-4 text-yellow-300" />
                  Recent Quizzes
                </h4>
                {dashboardData?.quizStats.recentQuizzes && dashboardData.quizStats.recentQuizzes.length > 0 ? (
                  <div className="space-y-2">
                    {dashboardData.quizStats.recentQuizzes.slice(0, 3).map((quiz: any, index: number) => (
                      <div key={index} className="p-3 bg-green-900/40 rounded-lg border border-yellow-400/10">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-white">{quiz.title}</span>
                          <Badge className="bg-blue-400/20 text-blue-300 border-blue-400/30 text-xs">
                            {quiz.score}%
                          </Badge>
                        </div>
                        <p className="text-xs text-white/60">
                          {new Date(quiz.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">No quizzes completed yet</p>
                )}
              </div>

              {/* Recent Sessions */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white/90 flex items-center gap-2">
                  <CalendarDaysIcon className="h-4 w-4 text-yellow-300" />
                  Recent Sessions
                </h4>
                {dashboardData?.sessionStats.recentSessions && dashboardData.sessionStats.recentSessions.length > 0 ? (
                  <div className="space-y-2">
                    {dashboardData.sessionStats.recentSessions.slice(0, 3).map((session: any, index: number) => (
                      <div key={index} className="p-3 bg-green-900/40 rounded-lg border border-yellow-400/10">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-white">{session.subject}</span>
                          <Badge className={`text-xs ${
                            session.status === 'completed' 
                              ? 'bg-green-400/20 text-green-300 border-green-400/30'
                              : 'bg-blue-400/20 text-blue-300 border-blue-400/30'
                          }`}>
                            {session.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-white/60">
                          {session.tutorName} - {new Date(session.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">No sessions scheduled yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ParentDashboardOverview;

