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
  TrophyIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  CalendarIcon,
  TagIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

interface ParentContextType {
  selectedStudent: ParentStudentLink | undefined;
  linkedStudents: ParentStudentLink[];
  refreshStudents: () => Promise<void>;
}

interface QuizAttempt {
  id: string;
  quizTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: Date;
  tutorName?: string;
  tutorFeedback?: string;
  difficulty: string;
}

interface QuizProgressData {
  attempts: QuizAttempt[];
  stats: {
    totalQuizzes: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    subjectBreakdown: { subject: string; averageScore: number; count: number }[];
  };
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  answers?: Array<{
    id: string;
    answer_text: string;
    is_correct: boolean;
  }>;
}

interface StudentAnswer {
  question_id: string;
  selected_answer_id?: string;
  answer_text?: string;
  points_earned?: number;
  is_correct?: boolean;
}

interface QuizAttemptDetails {
  attempt: {
    id: string;
    quiz_id: string;
    student_id: string;
    status: string;
    score?: number;
    max_score?: number;
    correct_answers?: number;
    total_questions?: number;
    started_at?: string;
    completed_at?: string;
    tutor_feedback?: string;
    created_at?: string;
    quiz?: {
      id: string;
      tutor_id: string;
      title: string;
      description: string;
      subject: string;
      time_limit_minutes: number;
      total_questions: number;
      total_points: number;
      created_at: string;
      updated_at: string;
      tutor?: any;
    };
    quizTitle?: string;
    subject?: string;
    difficulty?: string;
  };
  studentAnswers: StudentAnswer[];
  questions: Question[];
}

const ParentQuizProgress: React.FC = () => {
  const navigate = useNavigate();
  const { selectedStudent } = useOutletContext<ParentContextType>();
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<QuizProgressData | null>(null);
  const [error, setError] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttemptDetails | null>(null);
  const [loadingAttempt, setLoadingAttempt] = useState(false);

  useEffect(() => {
    if (selectedStudent) {
      loadQuizProgress();
    } else {
      navigate('/parent/manage');
    }
  }, [selectedStudent]);

  const loadQuizProgress = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(true);
      setError('');
      const data = await parentService.getStudentQuizProgress(selectedStudent.studentId);
      setQuizData(data);
    } catch (error: any) {
      console.error('Error loading quiz progress:', error);
      setError('Failed to load quiz progress');
    } finally {
      setLoading(false);
    }
  };
  
  const loadAttemptDetails = async (attemptId: string) => {
    if (!selectedStudent) return;
    
    try {
      setLoadingAttempt(true);
      const details = await parentService.getStudentQuizAttemptDetails(
        selectedStudent.studentId,
        attemptId
      );
      setSelectedAttempt(details);
    } catch (error: any) {
      console.error('Error loading attempt details:', error);
      toast.error('Failed to load quiz details');
      
      // Navigate back to list view
      setSelectedAttempt(null);
    } finally {
      setLoadingAttempt(false);
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-300';
    if (score >= 60) return 'text-yellow-300';
    return 'text-red-300';
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'bg-green-400/20 text-green-300 border-green-400/30';
    if (score >= 60) return 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30';
    return 'bg-red-400/20 text-red-300 border-red-400/30';
  };
  
  const formatDate = (dateInput?: string | Date | null) => {
    if (!dateInput) return "—";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (loading || loadingAttempt) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full bg-green-950/40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-green-950/40" />
          ))}
        </div>
        <Skeleton className="h-96 w-full bg-green-950/40" />
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
      {!selectedAttempt ? (
        // Quiz Progress Summary View
        <>
          {/* Header */}
          <motion.div variants={itemVariants}>
            <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-yellow-300" />
                  <div>
                    <CardTitle className="text-2xl text-yellow-300">Quiz Progress</CardTitle>
                    <CardDescription className="text-white/80">
                      {selectedStudent.studentName}'s quiz performance and feedback
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div variants={itemVariants}>
              <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Total Quizzes</p>
                      <p className="text-3xl font-bold text-yellow-300 mt-1">
                        {quizData?.stats.totalQuizzes || 0}
                      </p>
                    </div>
                    <ChartBarIcon className="h-10 w-10 text-yellow-300/40" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Average Score</p>
                      <p className={`text-3xl font-bold mt-1 ${getScoreColor(quizData?.stats.averageScore || 0)}`}>
                        {quizData?.stats.averageScore?.toFixed(1) || '0.0'}%
                      </p>
                    </div>
                    <ChartBarIcon className="h-10 w-10 text-blue-300/40" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Best Score</p>
                      <p className="text-3xl font-bold text-green-300 mt-1">
                        {quizData?.stats.bestScore?.toFixed(1) || '0.0'}%
                      </p>
                    </div>
                    <TrophyIcon className="h-10 w-10 text-green-300/40" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm">Needs Attention</p>
                      <p className="text-3xl font-bold text-orange-300 mt-1">
                        {quizData?.attempts.filter(a => a.score < 60).length || 0}
                      </p>
                    </div>
                    <ExclamationTriangleIcon className="h-10 w-10 text-orange-300/40" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Subject Breakdown */}
          <motion.div variants={itemVariants}>
            <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-yellow-300">Performance by Subject</CardTitle>
              </CardHeader>
              <CardContent>
                {quizData?.stats.subjectBreakdown && quizData.stats.subjectBreakdown.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quizData.stats.subjectBreakdown.map((subject, index) => (
                      <div key={index} className="p-4 bg-green-900/40 rounded-lg border border-yellow-400/10">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-white">{subject.subject}</h4>
                          <Badge className="bg-blue-400/20 text-blue-300 border-blue-400/30">
                            {subject.count} {subject.count === 1 ? 'quiz' : 'quizzes'}
                          </Badge>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-2xl font-bold ${getScoreColor(subject.averageScore)}`}>
                            {subject.averageScore.toFixed(1)}%
                          </span>
                          <span className="text-xs text-white/60">average</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-center py-8">No subject data available yet</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quiz Attempts List */}
          <motion.div variants={itemVariants}>
            <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-yellow-300">Recent Quiz Attempts</CardTitle>
                <CardDescription className="text-white/80">
                  Detailed results and tutor feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {quizData?.attempts && quizData.attempts.length > 0 ? (
                  <div className="space-y-4">
                    {quizData.attempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="p-4 bg-green-900/40 rounded-lg border border-yellow-400/10 hover:border-yellow-400/30 transition-colors cursor-pointer"
                        onClick={() => loadAttemptDetails(attempt.id)}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-2">
                              <ClipboardDocumentListIcon className="h-5 w-5 text-yellow-300 mt-1" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-white text-lg mb-1">
                                  {attempt.quizTitle}
                                </h4>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <Badge className="bg-blue-400/20 text-blue-300 border-blue-400/30">
                                    {attempt.subject}
                                  </Badge>
                                  <Badge className="bg-purple-400/20 text-purple-300 border-purple-400/30">
                                    {attempt.difficulty}
                                  </Badge>
                                  <Badge className={getScoreBadgeClass(attempt.score)}>
                                    {attempt.score.toFixed(1)}%
                                  </Badge>
                                </div>
                                <p className="text-sm text-white/60">
                                  {attempt.correctAnswers} / {attempt.totalQuestions} correct
                                  {' • '}
                                  {new Date(attempt.completedAt).toLocaleDateString()} at{' '}
                                  {new Date(attempt.completedAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>

                            {attempt.tutorFeedback && (
                              <div className="mt-3 p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/20">
                                <div className="flex items-start gap-2">
                                  <div className="flex-1">
                                    <p className="text-xs text-yellow-300 font-semibold mb-1">
                                      Tutor Feedback {attempt.tutorName && `by ${attempt.tutorName}`}
                                    </p>
                                    <p className="text-sm text-white/90">{attempt.tutorFeedback}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className={`text-3xl font-bold ${getScoreColor(attempt.score)}`}>
                              {attempt.score.toFixed(0)}%
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-blue-400/10 text-blue-300 border-blue-400/30 hover:bg-blue-400/20"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardDocumentListIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60 text-lg">No quiz attempts yet</p>
                    <p className="text-white/40 text-sm mt-2">
                      Quiz results will appear here once your student completes quizzes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        // Detailed Quiz Attempt View
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Back Button */}
          <Button
            onClick={() => setSelectedAttempt(null)}
            variant="ghost"
            size="sm"
            className="text-white hover:text-white/80"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Quiz Progress
          </Button>

          {/* Quiz Summary */}
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-yellow-300 mb-2">
                    {selectedAttempt.attempt.quiz?.title || selectedAttempt.attempt.quizTitle || 'Unknown Quiz'}
                  </h2>
                  <p className="text-white/60">
                    {selectedAttempt.attempt.quiz?.subject || selectedAttempt.attempt.subject || 'General'}
                  </p>
                </div>

                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(selectedAttempt.attempt.score || 0)}`}>
                    {selectedAttempt.attempt.correct_answers || 0} / {selectedAttempt.attempt.total_questions || 0}
                  </div>
                  <div className="text-sm text-white/60 mb-1">
                    Questions Correct
                  </div>
                  <div className={`text-xl ${getScoreColor(selectedAttempt.attempt.score || 0)}`}>
                    {selectedAttempt.attempt.score?.toFixed(1) || '0.0'}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/60">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>
                    Started: {formatDate(selectedAttempt.attempt.started_at)}
                  </span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>
                    Completed: {formatDate(selectedAttempt.attempt.completed_at)}
                  </span>
                </div>
                <div className="flex items-center">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  <span>{selectedAttempt.attempt.quiz?.subject || selectedAttempt.attempt.subject || 'General'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tutor Feedback */}
          {selectedAttempt.attempt.tutor_feedback && (
            <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-yellow-300 flex items-center gap-2">
                  <StarIcon className="h-5 w-5" />
                  Tutor Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 whitespace-pre-line">
                  {selectedAttempt.attempt.tutor_feedback}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Question-by-Question Review */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-yellow-300 flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              Question Review
            </h3>

            {selectedAttempt.questions.map((question, index) => {
              const studentAnswer = selectedAttempt.studentAnswers.find(
                (sa) => sa.question_id === question.id
              );
              const correctAnswer = question.answers?.find(
                (a) => a.is_correct
              );
              const isCorrect = studentAnswer?.is_correct;

              return (
                <Card 
                  key={question.id}
                  className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-lg font-medium text-yellow-300">
                        Question {index + 1}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-white/60">
                          {studentAnswer?.points_earned || 0}/{question.points} points
                        </span>
                        {isCorrect === true ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-300" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-300" />
                        )}
                      </div>
                    </div>

                    <p className="text-white mb-4">
                      {question.question_text}
                    </p>

                    {question.question_type === "multiple_choice" ||
                    question.question_type === "true_false" ? (
                      <div className="space-y-2">
                        {question.answers?.map((answer) => {
                          const isSelected =
                            studentAnswer?.selected_answer_id === answer.id;
                          const isCorrectAnswer = answer.is_correct;

                          let bgColor = "bg-green-900/20";
                          let borderColor = "border-yellow-400/10";

                          if (isCorrectAnswer) {
                            bgColor = "bg-green-400/10";
                            borderColor = "border-green-400/20";
                          }
                          if (isSelected && !isCorrectAnswer) {
                            bgColor = "bg-red-400/10";
                            borderColor = "border-red-400/20";
                          }

                          return (
                            <div
                              key={answer.id}
                              className={`p-3 rounded-lg border ${bgColor} ${borderColor} flex items-center justify-between`}
                            >
                              <div className="flex items-center">
                                {isCorrectAnswer && (
                                  <CheckCircleIcon className="h-4 w-4 text-green-300 mr-2" />
                                )}
                                {isSelected && !isCorrectAnswer && (
                                  <XCircleIcon className="h-4 w-4 text-red-300 mr-2" />
                                )}
                                <span className="text-white">
                                  {answer.answer_text}
                                </span>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {isSelected && (
                                  <span className="text-sm font-medium text-yellow-300">
                                    Student's answer
                                  </span>
                                )}
                                {isCorrectAnswer && (
                                  <span className="text-sm font-medium text-green-300">
                                    Correct answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Short Answer */
                      <div className="space-y-3">
                        <div className="p-3 bg-green-900/20 rounded-lg border border-yellow-400/10">
                          <div className="text-sm font-medium text-yellow-300 mb-1">
                            Student's answer:
                          </div>
                          <div className="text-white">
                            {studentAnswer?.answer_text || "No answer provided"}
                          </div>
                        </div>
                        <div className="p-3 bg-green-400/10 rounded-lg border border-green-400/20">
                          <div className="text-sm font-medium text-green-300 mb-1">
                            Correct answer:
                          </div>
                          <div className="text-green-300">
                            {correctAnswer?.answer_text || "Manual grading required"}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ParentQuizProgress;

