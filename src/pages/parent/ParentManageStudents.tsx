import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { parentService, ParentStudentLink } from '@/lib/parentService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlusIcon,
  AcademicCapIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ParentContextType {
  selectedStudent: ParentStudentLink | undefined;
  linkedStudents: ParentStudentLink[];
  refreshStudents: () => Promise<void>;
}

const ParentManageStudents: React.FC = () => {
  const { linkedStudents, refreshStudents } = useOutletContext<ParentContextType>();
  const [showLinkForm, setShowLinkForm] = useState(linkedStudents.length === 0);
  const [studentCode, setStudentCode] = useState('');
  const [selectedRelationshipType, setSelectedRelationshipType] = useState('');
  const [customRelationship, setCustomRelationship] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');

    if (!studentCode) {
      setLinkError('Please enter a student code');
      return;
    }

    if (selectedRelationshipType === 'other' && !customRelationship.trim()) {
      setLinkError('Please specify the custom relationship');
      return;
    }

    let relationshipValue: string | undefined;
    if (selectedRelationshipType) {
      if (selectedRelationshipType === 'other') {
        relationshipValue = customRelationship.trim();
      } else {
        relationshipValue = selectedRelationshipType;
      }
    }

    try {
      setIsLinking(true);
      await parentService.linkStudent({
        studentCode: studentCode.trim().toUpperCase(),
        relationship: relationshipValue,
        isPrimaryContact: linkedStudents.length === 0,
      });

      setLinkSuccess('Student linked successfully!');
      setStudentCode('');
      setSelectedRelationshipType('');
      setCustomRelationship('');
      setShowLinkForm(false);

      await refreshStudents();
    } catch (error: any) {
      console.error('Error linking student:', error);
      setLinkError(error.message || 'Failed to link student. Please check the code and try again.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to unlink ${studentName}?`)) {
      return;
    }

    try {
      await parentService.unlinkStudent(studentId);
      await refreshStudents();
    } catch (error: any) {
      console.error('Error unlinking student:', error);
      alert('Failed to unlink student. Please try again.');
    }
  };

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 1, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Card */}
      <motion.div variants={itemVariants}>
        <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl lg:text-3xl font-bold text-yellow-300">
              Student Management
            </CardTitle>
            <CardDescription className="text-white/80 text-base">
              {linkedStudents.length === 0
                ? 'Link your first student to get started'
                : `You are monitoring ${linkedStudents.length} ${linkedStudents.length === 1 ? 'student' : 'students'}`}
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Success/Error Messages */}
      {linkSuccess && (
        <motion.div variants={itemVariants}>
          <Alert className="bg-green-900/40 border-green-400/30 text-white">
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
            <AlertDescription>{linkSuccess}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {linkError && (
        <motion.div variants={itemVariants}>
          <Alert className="bg-red-900/40 border-red-400/30 text-white">
            <AlertDescription>{linkError}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Link Student Form */}
      {showLinkForm && (
        <motion.div variants={itemVariants}>
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-yellow-300 flex items-center gap-2">
                <PlusIcon className="h-6 w-6" />
                Link a Student
              </CardTitle>
              <CardDescription className="text-white/80">
                Enter the student code provided by your child
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLinkStudent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentCode" className="text-white">
                    Student Code
                  </Label>
                  <Input
                    id="studentCode"
                    placeholder="ABC-123-XYZ"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                    className="bg-white/10 border-yellow-400/30 text-white placeholder:text-white/50"
                    maxLength={11}
                    required
                  />
                  <p className="text-xs text-white/60">
                    Format: 3 letters - 3 digits - 3 alphanumeric characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship" className="text-white">
                    Relationship (Optional)
                  </Label>
                  <Select
                    value={selectedRelationshipType}
                    onValueChange={(value) => {
                      setSelectedRelationshipType(value);
                      if (value !== 'other') {
                        setCustomRelationship('');
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white/10 border-yellow-400/30 text-white">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent className="bg-green-950 border-yellow-400/30">
                      <SelectItem value="mother" className="text-white hover:bg-yellow-400/20">Mother</SelectItem>
                      <SelectItem value="father" className="text-white hover:bg-yellow-400/20">Father</SelectItem>
                      <SelectItem value="guardian" className="text-white hover:bg-yellow-400/20">Guardian</SelectItem>
                      <SelectItem value="other" className="text-white hover:bg-yellow-400/20">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedRelationshipType === 'other' && (
                    <Input
                      placeholder="Specify relationship"
                      value={customRelationship}
                      onChange={(e) => setCustomRelationship(e.target.value)}
                      className="bg-white/10 border-yellow-400/30 text-white placeholder:text-white/50 mt-2"
                    />
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isLinking}
                    className="bg-yellow-400 text-green-900 hover:bg-yellow-500"
                  >
                    {isLinking ? 'Linking...' : 'Link Student'}
                  </Button>
                  {linkedStudents.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowLinkForm(false);
                        setLinkError('');
                        setStudentCode('');
                        setSelectedRelationshipType('');
                        setCustomRelationship('');
                      }}
                      className="border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/10"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Linked Students */}
      {linkedStudents.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-yellow-300 flex items-center gap-2">
                  <AcademicCapIcon className="h-6 w-6" />
                  Linked Students
                </CardTitle>
                {!showLinkForm && (
                  <Button
                    onClick={() => setShowLinkForm(true)}
                    className="bg-yellow-400 text-green-900 hover:bg-yellow-500"
                    size="sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Link Another Student</span>
                    <span className="sm:hidden">Link</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {linkedStudents.map((student) => (
                  <Card
                    key={student.id}
                    className="bg-green-900/40 border border-yellow-400/20 hover:border-yellow-400/40 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-yellow-300 mb-1">
                            {student.studentName}
                          </h3>
                          <p className="text-sm text-white/60 mb-2">
                            {student.studentEmail}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30">
                              {student.studentPackage}
                            </Badge>
                            {student.relationship && (
                              <Badge className="bg-blue-400/20 text-blue-300 border-blue-400/30">
                                {student.relationship}
                              </Badge>
                            )}
                            {student.isPrimaryContact && (
                              <Badge className="bg-green-400/20 text-green-300 border-green-400/30">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-white/50">
                            Code: {student.studentCode}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlinkStudent(
                              student.studentId,
                              student.studentName
                            );
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Getting Started Guide */}
      {linkedStudents.length === 0 && !showLinkForm && (
        <motion.div variants={itemVariants}>
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-yellow-300">Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-white/80">
                  To get started, you need to link your child's student account:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-white/80">
                  <li>Ask your child to log into their student account</li>
                  <li>Have them navigate to their dashboard</li>
                  <li>They will find a unique student code (format: ABC-123-XYZ)</li>
                  <li>Enter that code above to link their account</li>
                </ol>
              </div>
              <Button
                onClick={() => setShowLinkForm(true)}
                className="bg-yellow-400 text-green-900 hover:bg-yellow-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Link Student Now
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ParentManageStudents;

