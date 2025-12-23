import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { parentService, ParentStudentLink } from '@/lib/parentService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';


const ParentLayout: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [linkedStudents, setLinkedStudents] = useState<ParentStudentLink[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Parent navigation items for mobile
  const parentNavigation = [
    { name: "Dashboard", href: "/parent/dashboard", icon: AcademicCapIcon },
    { name: "Quiz Progress", href: "/parent/quiz-progress", icon: ClipboardDocumentListIcon },
    { name: "Sessions", href: "/parent/session-progress", icon: CalendarDaysIcon },
    { name: "Students", href: "/parent/manage", icon: UserGroupIcon },
    { name: "Profile", href: "/profile", icon: UserCircleIcon },
  ];

  const isActive = (href: string) => location.pathname === href;

  const loadLinkedStudents = useCallback(async () => {
    // Don't load if not authenticated - wait for auth to complete
    if (!user || !profile) {
      console.log('ParentLayout: Waiting for auth to complete...');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('ParentLayout: Loading linked students for user:', user.id);
      const students = await parentService.getLinkedStudents();
      console.log('ParentLayout: Loaded', students.length, 'students');
      setLinkedStudents(students);

      // Auto-select first student if available
      if (students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(students[0].studentId);
      }

      // Redirect to management if no students linked
      if (students.length === 0 && !location.pathname.includes('/parent/manage')) {
        navigate('/parent/manage');
      }
    } catch (error: any) {
      console.error('Error loading linked students:', error);
      setError('Failed to load linked students. Please try again.');

      // Auto-retry with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`ParentLayout: Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  }, [user, profile, selectedStudentId, location.pathname, navigate, retryCount]);

  // Load students when auth is ready or retry count changes
  useEffect(() => {
    if (user && profile) {
      loadLinkedStudents();
    } else {
      // Still loading auth
      setLoading(true);
    }
  }, [user, profile, retryCount, loadLinkedStudents]);

  // Manual retry function
  const handleRetry = () => {
    setRetryCount(0);
    setError('');
    loadLinkedStudents();
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  const selectedStudent = linkedStudents.find(s => s.studentId === selectedStudentId);

  if (loading) {
    return (
      <div className="px-6 py-16">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-32 w-full bg-slate-200" />
          <Skeleton className="h-96 w-full bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Student Selector - Sticky at top */}
      {linkedStudents.length > 0 && !location.pathname.includes('/parent/manage') && (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-green-900/95 to-green-800/95 backdrop-blur-sm border-b border-yellow-400/20 px-6 py-4 mb-6">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <label className="text-white/80 text-sm font-medium whitespace-nowrap">
              Viewing Student:
            </label>
            <Select value={selectedStudentId} onValueChange={handleStudentChange}>
              <SelectTrigger className="bg-green-900/60 border-yellow-400/30 text-white w-full max-w-md">
                <SelectValue>
                  {selectedStudent ? (
                    <span className="flex items-center gap-2">
                      <AcademicCapIcon className="h-4 w-4 text-yellow-300" />
                      <span className="font-medium">{selectedStudent.studentName}</span>
                      <span className="text-xs text-white/60 ml-2">({selectedStudent.studentEmail})</span>
                    </span>
                  ) : (
                    'Select a student'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-green-950 border-yellow-400/30">
                {linkedStudents.map((student) => (
                  <SelectItem
                    key={student.studentId}
                    value={student.studentId}
                    className="text-white hover:bg-yellow-400/20"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{student.studentName}</span>
                      <span className="text-xs text-white/60">{student.studentEmail}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="px-6 mb-6">
          <div className="max-w-7xl mx-auto">
            <Alert className="bg-red-900/40 border-red-400/30 text-white">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={handleRetry}
                  className="ml-4 px-3 py-1 bg-yellow-400 text-green-900 rounded-md text-sm font-medium hover:bg-yellow-500 transition-colors"
                >
                  Retry
                </button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Main Content with bottom padding for mobile nav */}
      <div className="px-6 pb-24 lg:pb-0">
        <div className="max-w-7xl mx-auto">
          <Outlet context={{ selectedStudent, linkedStudents, refreshStudents: loadLinkedStudents }} />
        </div>
      </div>

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
              {parentNavigation.map((item, index) => {
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
                          layoutId="parent-mobile-nav-indicator"
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

export default ParentLayout;

