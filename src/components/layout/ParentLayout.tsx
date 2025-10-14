import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
} from '@heroicons/react/24/outline';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const ParentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [linkedStudents, setLinkedStudents] = useState<ParentStudentLink[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLinkedStudents();
  }, []);

  const loadLinkedStudents = async () => {
    try {
      setLoading(true);
      const students = await parentService.getLinkedStudents();
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
      setError('Failed to load linked students');
    } finally {
      setLoading(false);
    }
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
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-6">
        <div className="max-w-7xl mx-auto">
          <Outlet context={{ selectedStudent, linkedStudents, refreshStudents: loadLinkedStudents }} />
        </div>
      </div>
    </div>
  );
};

export default ParentLayout;

