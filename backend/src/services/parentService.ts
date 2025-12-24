import { User, ParentStudent } from '../models';
import { QuizAttempt, Quiz, StudentAnswer } from '../models/Quiz';
import { Question } from '../models/Question';
import { Booking } from '../models/Booking';
import { SessionRating } from '../models/SessionRating';
import { Subject } from '../models/Subject';
import { Types } from 'mongoose';
import { validateStudentCodeFormat } from '../utils/studentCode';

export interface LinkStudentData {
  studentCode: string;
  relationship?: string;
  isPrimaryContact?: boolean;
}

export interface ParentStudentLink {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentCode: string;
  studentPackage: string;
  relationship?: string;
  isPrimaryContact: boolean;
  linkedAt: Date;
  canViewGrades: boolean;
  canViewAttendance: boolean;
  canViewReports: boolean;
  canBookSessions: boolean;
}

export class ParentService {
  /**
   * Link a student to a parent using student code
   */
  static async linkStudent(
    parentId: string,
    linkData: LinkStudentData
  ): Promise<ParentStudentLink> {
    const { studentCode, relationship, isPrimaryContact } = linkData;

    // Validate student code format
    if (!validateStudentCodeFormat(studentCode)) {
      throw new Error('Invalid student code format. Expected format: ABC-123-XYZ');
    }

    // Validate and normalize relationship
    let normalizedRelationship: string | undefined;
    if (relationship && relationship.trim()) {
      // Normalize to lowercase for database consistency
      normalizedRelationship = relationship.toLowerCase().trim();
    }

    // Find parent
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      throw new Error('Parent not found');
    }

    // Find student by code
    const student = await User.findOne({ studentCode, role: 'student' });
    if (!student) {
      throw new Error('Student not found with this code');
    }

    // Check if link already exists
    const existingLink = await ParentStudent.findOne({
      parentId: new Types.ObjectId(parentId),
      studentId: student._id
    });

    if (existingLink) {
      throw new Error('Student is already linked to this parent');
    }

    // Create parent-student link
    const parentStudentLink = new ParentStudent({
      parentId: new Types.ObjectId(parentId),
      studentId: student._id,
      relationship: normalizedRelationship,
      isPrimaryContact: isPrimaryContact || false,
      canViewGrades: true,
      canViewAttendance: true,
      canViewReports: true,
      canBookSessions: false,
      isActive: true
    });

    await parentStudentLink.save();

    // Update parent's childrenIds array
    if (!parent.childrenIds) {
      parent.childrenIds = [];
    }
    if (!parent.childrenIds.some(id => id.equals(student._id))) {
      parent.childrenIds.push(student._id);
      await parent.save();
    }

    return {
      id: parentStudentLink._id.toString(),
      studentId: student._id.toString(),
      studentName: student.fullName,
      studentEmail: student.email,
      studentCode: student.studentCode!,
      studentPackage: student.package || 'free',
      relationship: parentStudentLink.relationship,
      isPrimaryContact: parentStudentLink.isPrimaryContact,
      linkedAt: parentStudentLink.linkedAt,
      canViewGrades: parentStudentLink.canViewGrades,
      canViewAttendance: parentStudentLink.canViewAttendance,
      canViewReports: parentStudentLink.canViewReports,
      canBookSessions: parentStudentLink.canBookSessions
    };
  }

  /**
   * Get all students linked to a parent
   */
  static async getLinkedStudents(parentId: string): Promise<ParentStudentLink[]> {
    try {
      // First get the links
      const links = await ParentStudent.find({
        parentId: new Types.ObjectId(parentId),
        isActive: true
      });

      // Then get the student details separately to handle missing students
      const studentIds = links.map(link => link.studentId);
      const students = await User.find({ _id: { $in: studentIds } });

      // Create a map of student data
      const studentMap = new Map();
      students.forEach(student => {
        studentMap.set(student._id.toString(), student);
      });

      // Filter out links where student no longer exists and return valid ones
      const validLinks = links.filter(link => {
        const studentExists = studentMap.has(link.studentId.toString());
        if (!studentExists) {
          console.warn(`Parent ${parentId} has link to non-existent student ${link.studentId}, cleaning up...`);
          // Optionally clean up orphaned links
          // await ParentStudent.findByIdAndDelete(link._id);
        }
        return studentExists;
      });

      return validLinks.map(link => {
        const student = studentMap.get(link.studentId.toString());
        return {
          id: link._id.toString(),
          studentId: student._id.toString(),
          studentName: student.fullName || 'Unknown Student',
          studentEmail: student.email || '',
          studentCode: student.studentCode || '',
          studentPackage: student.package || 'free',
          relationship: link.relationship,
          isPrimaryContact: link.isPrimaryContact,
          linkedAt: link.linkedAt,
          canViewGrades: link.canViewGrades,
          canViewAttendance: link.canViewAttendance,
          canViewReports: link.canViewReports,
          canBookSessions: link.canBookSessions
        };
      });
    } catch (error) {
      console.error('Error in getLinkedStudents:', error);
      throw error;
    }
  }

  /**
   * Unlink a student from a parent
   */
  static async unlinkStudent(parentId: string, studentId: string): Promise<void> {
    const link = await ParentStudent.findOne({
      parentId: new Types.ObjectId(parentId),
      studentId: new Types.ObjectId(studentId)
    });

    if (!link) {
      throw new Error('Student link not found');
    }

    // Soft delete by setting isActive to false
    link.isActive = false;
    await link.save();

    // Remove from parent's childrenIds array
    const parent = await User.findById(parentId);
    if (parent && parent.childrenIds) {
      parent.childrenIds = parent.childrenIds.filter(
        id => !id.equals(new Types.ObjectId(studentId))
      );
      await parent.save();
    }
  }

  /**
   * Update permissions for a parent-student link
   */
  static async updatePermissions(
    parentId: string,
    studentId: string,
    permissions: {
      canViewGrades?: boolean;
      canViewAttendance?: boolean;
      canViewReports?: boolean;
      canBookSessions?: boolean;
    }
  ): Promise<ParentStudentLink> {
    const link = await ParentStudent.findOne({
      parentId: new Types.ObjectId(parentId),
      studentId: new Types.ObjectId(studentId),
      isActive: true
    }).populate('studentId');

    if (!link) {
      throw new Error('Student link not found');
    }

    // Update permissions
    if (permissions.canViewGrades !== undefined) {
      link.canViewGrades = permissions.canViewGrades;
    }
    if (permissions.canViewAttendance !== undefined) {
      link.canViewAttendance = permissions.canViewAttendance;
    }
    if (permissions.canViewReports !== undefined) {
      link.canViewReports = permissions.canViewReports;
    }
    if (permissions.canBookSessions !== undefined) {
      link.canBookSessions = permissions.canBookSessions;
    }

    await link.save();

    const student = link.studentId as any;
    return {
      id: link._id.toString(),
      studentId: student._id.toString(),
      studentName: student.fullName,
      studentEmail: student.email,
      studentCode: student.studentCode || '',
      studentPackage: student.package || 'free',
      relationship: link.relationship,
      isPrimaryContact: link.isPrimaryContact,
      linkedAt: link.linkedAt,
      canViewGrades: link.canViewGrades,
      canViewAttendance: link.canViewAttendance,
      canViewReports: link.canViewReports,
      canBookSessions: link.canBookSessions
    };
  }

  /**
   * Get parent dashboard data for a specific student
   */
  static async getStudentDashboardData(parentId: string, studentId: string) {
    // Verify parent has access to this student
    const link = await ParentStudent.findOne({
      parentId: new Types.ObjectId(parentId),
      studentId: new Types.ObjectId(studentId),
      isActive: true
    });

    if (!link) {
      throw new Error('Access denied: Student not linked to this parent');
    }

    // Get quiz stats
    // Get quiz stats - Fetch ALL completed attempts for accurate stats
    const allQuizAttempts = await QuizAttempt.find({
      student_id: new Types.ObjectId(studentId),
      status: 'completed'
    })
      .populate('quiz_id') // We need quiz_id for subject analysis
      .sort({ completed_at: -1 });

    const totalQuizzes = allQuizAttempts.length;

    // Helper function to calculate percentage from attempt
    const getAttemptPercentage = (attempt: any): number => {
      const correct = attempt.correct_answers || 0;
      const total = attempt.total_questions || 0;
      return total > 0 ? Math.round((correct / total) * 100) : 0;
    };

    // Calculate average score as percentage from ALL attempts
    const averageScore = totalQuizzes > 0
      ? allQuizAttempts.reduce((sum, a) => sum + getAttemptPercentage(a), 0) / totalQuizzes
      : 0;

    // Recent quizzes with calculated percentage (top 3)
    const recentQuizzes = allQuizAttempts.slice(0, 3).map((attempt: any) => ({
      title: attempt.quiz_id?.title || 'Unknown Quiz',
      score: getAttemptPercentage(attempt), // Use calculated percentage
      completedAt: attempt.completed_at
    }));

    // Get session stats - Fetch ALL sessions for accurate counts
    const allSessions = await Booking.find({
      studentId: new Types.ObjectId(studentId)
    }).select('status scheduledDate');

    const now = new Date();
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const completedSessions = allSessions.filter(s => s.status === 'completed').length;
    const upcomingSessions = allSessions.filter(s => {
      const isUpcomingStatus = s.status === 'confirmed' || s.status === 'pending';
      const sessionDate = new Date(s.scheduledDate);
      const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
      return isUpcomingStatus && sessionDateOnly >= todayDateOnly;
    }).length;

    // Get detailed recent sessions for the feed
    const recentSessionsQuery = await Booking.find({
      studentId: new Types.ObjectId(studentId)
    })
      .populate('teacherId')
      .populate('subjectId')
      .limit(3)
      .sort({ scheduledDate: -1 });

    const recentSessions = recentSessionsQuery.map((session: any) => ({
      subject: session.subjectId?.name || session.title,
      tutorName: session.teacherId?.fullName || 'Unknown',
      date: session.scheduledDate,
      status: session.status
    }));

    // Performance overview using percentages
    const subjectPerformance: any = {};
    allQuizAttempts.forEach((attempt: any) => {
      const subject = attempt.quiz_id?.subject || 'General';
      const percentage = getAttemptPercentage(attempt);
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = { total: 0, count: 0 };
      }
      subjectPerformance[subject].total += percentage;
      subjectPerformance[subject].count += 1;
    });

    const strengths: string[] = [];
    const areasForImprovement: string[] = [];

    Object.entries(subjectPerformance).forEach(([subject, data]: [string, any]) => {
      const avg = data.total / data.count;
      if (avg >= 80) {
        strengths.push(subject);
      } else if (avg < 60) {
        areasForImprovement.push(subject);
      }
    });

    return {
      quizStats: {
        totalQuizzes,
        completedQuizzes: totalQuizzes,
        averageScore,
        recentQuizzes
      },
      sessionStats: {
        totalSessions: allSessions.length,
        upcomingSessions,
        completedSessions,
        recentSessions
      },
      performanceOverview: {
        strengths,
        areasForImprovement
      }
    };
  }

  /**
   * Get quiz progress for a student
   */
  static async getStudentQuizProgress(parentId: string, studentId: string) {
    // Verify parent has access to this student
    const link = await ParentStudent.findOne({
      parentId: new Types.ObjectId(parentId),
      studentId: new Types.ObjectId(studentId),
      isActive: true
    });

    if (!link) {
      throw new Error('Access denied: Student not linked to this parent');
    }

    // Get all completed quiz attempts
    const attempts = await QuizAttempt.find({
      student_id: new Types.ObjectId(studentId),
      status: 'completed'
    })
      .populate('quiz_id')
      .sort({ completed_at: -1 });

    // Calculate statistics using percentages
    const totalQuizzes = attempts.length;

    // Calculate percentage for each attempt: (correct_answers / total_questions) * 100
    const percentages = attempts.map(a => {
      const correct = a.correct_answers || 0;
      const total = a.total_questions || 0;
      return total > 0 ? Math.round((correct / total) * 100) : 0;
    });

    const averageScore = totalQuizzes > 0
      ? percentages.reduce((sum, pct) => sum + pct, 0) / totalQuizzes
      : 0;
    const bestScore = totalQuizzes > 0 ? Math.max(...percentages) : 0;
    const worstScore = totalQuizzes > 0 ? Math.min(...percentages) : 0;

    // Subject breakdown using percentages
    const subjectMap = new Map<string, { total: number; count: number }>();
    attempts.forEach((attempt: any, index: number) => {
      const subject = attempt.quiz_id?.subject || 'General';
      const current = subjectMap.get(subject) || { total: 0, count: 0 };
      subjectMap.set(subject, {
        total: current.total + percentages[index],
        count: current.count + 1
      });
    });

    const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      averageScore: data.total / data.count,
      count: data.count
    }));

    // Format attempts for response
    const formattedAttempts = attempts.map((attempt: any) => {
      const correctAnswers = attempt.correct_answers || 0;
      const totalQuestions = attempt.total_questions || 0;
      // Calculate percentage based on correct answers / total questions
      const percentage = totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

      return {
        id: attempt._id.toString(),
        quizTitle: attempt.quiz_id?.title || 'Unknown Quiz',
        subject: attempt.quiz_id?.subject || 'General',
        score: attempt.score || 0,
        maxScore: attempt.max_score || 0,
        percentage, // Calculated percentage
        totalQuestions,
        correctAnswers,
        completedAt: attempt.completed_at,
        tutorFeedback: attempt.tutor_feedback,
        tutorName: attempt.quiz_id?.createdBy?.fullName,
        difficulty: attempt.quiz_id?.difficulty || 'medium'
      };
    });

    return {
      attempts: formattedAttempts,
      stats: {
        totalQuizzes,
        averageScore,
        bestScore,
        worstScore,
        subjectBreakdown
      }
    };
  }

  /**
   * Get session progress for a student
   */
  /**
   * Get specific quiz attempt details for a student
   */
  static async getStudentQuizAttemptDetails(parentId: string, studentId: string, attemptId: string) {
    // Verify parent has access to this student
    const link = await ParentStudent.findOne({
      parentId: new Types.ObjectId(parentId),
      studentId: new Types.ObjectId(studentId),
      isActive: true
    });

    if (!link) {
      throw new Error('Access denied: Student not linked to this parent');
    }

    // Get the attempt with all associated data
    const attempt = await QuizAttempt.findOne({
      _id: new Types.ObjectId(attemptId),
      student_id: new Types.ObjectId(studentId),
      status: 'completed'
    }).populate('quiz_id', 'title subject difficulty');

    if (!attempt) {
      throw new Error('Quiz attempt not found or access denied');
    }

    // Get student answers for this attempt using StudentAnswer model
    const studentAnswers = await StudentAnswer.find({
      attempt_id: new Types.ObjectId(attemptId)
    })
      .populate({
        path: 'question_id',
        select: 'questionText questionType points answers explanation hint difficulty tags order isActive'
      })
      .populate({
        path: 'selected_answer_id',
        select: 'answerText isCorrect explanation order'
      })
      .sort({ created_at: 1 })
      .lean();

    // Transform to match frontend format
    const transformedStudentAnswers = studentAnswers.map((answer: any) => ({
      id: answer._id?.toString(),
      attempt_id: answer.attempt_id?.toString(),
      question_id: answer.question_id?._id?.toString(),
      selected_answer_id: answer.selected_answer_id?._id?.toString(),
      answer_text: answer.answer_text,
      is_correct: answer.is_correct,
      points_earned: answer.points_earned,
      created_at: answer.created_at?.toISOString() || '',
      updated_at: answer.updated_at?.toISOString() || '',
    }));

    // Get quiz questions from the Question collection and format them
    const quizId = attempt.quiz_id._id;
    const questionDocs = await Question.find({
      quizId: new Types.ObjectId(quizId),
      isActive: true
    }).sort({ order: 1 });

    const questions = questionDocs.map((question, index) => ({
      id: question._id.toString(),
      quiz_id: quizId.toString(),
      question_text: question.questionText,
      question_type: question.questionType,
      points: question.points,
      answers: question.answers?.map((answer, answerIndex) => ({
        id: answer._id?.toString() || `answer_${index}_${answerIndex}`,
        question_id: question._id.toString(),
        answer_text: answer.answerText,
        is_correct: answer.isCorrect,
        explanation: answer.explanation,
        answer_order: answer.order,
        created_at: '',
        updated_at: '',
      })),
      question_order: question.order,
      created_at: '',
      is_ai_generated: false,
      ai_status: 'approved',
    }));

    return {
      attempt: {
        id: attempt._id.toString(),
        quiz_id: attempt.quiz_id._id.toString(),
        student_id: attempt.student_id?.toString(),
        status: attempt.status,
        score: attempt.score,
        max_score: attempt.max_score,
        correct_answers: attempt.correct_answers,
        total_questions: attempt.total_questions,
        started_at: attempt.started_at?.toISOString(),
        completed_at: attempt.completed_at?.toISOString(),
        tutor_feedback: attempt.tutor_feedback,
        created_at: attempt.created_at?.toISOString(),
        quiz: {
          id: attempt.quiz_id._id.toString(),
          tutor_id: '',
          title: (attempt.quiz_id as any).title,
          description: '',
          subject: (attempt.quiz_id as any).subject,
          time_limit_minutes: 0,
          total_questions: attempt.total_questions || 0,
          total_points: 0,
          created_at: '',
          updated_at: '',
          tutor: undefined,
        },
      },
      studentAnswers: transformedStudentAnswers,
      questions
    };
  }

  static async getStudentSessionProgress(
    parentId: string,
    studentId: string,
    options: {
      filter?: 'all' | 'upcoming' | 'completed' | 'cancelled';
      subject?: string; // NEW: Filter by subject name
      page?: number;
      limit?: number;
    } = {}
  ) {
    // Verify parent has access to this student
    const link = await ParentStudent.findOne({
      parentId: new Types.ObjectId(parentId),
      studentId: new Types.ObjectId(studentId),
      isActive: true
    });

    if (!link) {
      throw new Error('Access denied: Student not linked to this parent');
    }

    // Get all sessions
    let sessions = await Booking.find({
      studentId: new Types.ObjectId(studentId)
    })
      .populate('teacherId')
      .populate('subjectId')
      .sort({ scheduledDate: -1 });

    // Apply status filter if specified
    if (options.filter && options.filter !== 'all') {
      const now = new Date();
      // Get today's date without time for proper comparison
      const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (options.filter) {
        case 'completed':
          sessions = sessions.filter(s => s.status === 'completed');
          break;
        case 'upcoming':
          // Include both confirmed AND pending sessions that are today or in the future
          sessions = sessions.filter(s => {
            const isUpcomingStatus = s.status === 'confirmed' || s.status === 'pending';
            if (!isUpcomingStatus) return false;

            const sessionDate = new Date(s.scheduledDate);
            // Get session date without time
            const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

            // Session is upcoming if:
            // 1. Session date is in the future (tomorrow or later)
            // 2. OR session date is today (we show all today's pending/confirmed sessions)
            const isInFuture = sessionDateOnly >= todayDateOnly;

            return isInFuture;
          });
          break;
        case 'cancelled':
          sessions = sessions.filter(s => s.status === 'cancelled');
          break;
      }
    }

    // Apply subject filter if specified (NEW)
    if (options.subject) {
      sessions = sessions.filter((s: any) => {
        const sessionSubject = s.subjectId?.name || s.title || '';
        return sessionSubject.toLowerCase() === options.subject!.toLowerCase();
      });
    }

    // Get ratings for sessions
    const sessionIds = sessions.map(s => s._id);
    const ratings = await SessionRating.find({
      sessionId: { $in: sessionIds },
      studentId: new Types.ObjectId(studentId)
    });

    const ratingMap = new Map(ratings.map(r => [r.sessionId.toString(), r]));

    // Calculate statistics from ALL sessions (not just filtered)
    const allSessions = await Booking.find({
      studentId: new Types.ObjectId(studentId)
    });

    const now = new Date();
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const totalSessions = allSessions.length;
    const completedSessions = allSessions.filter(s => s.status === 'completed').length;
    const upcomingSessions = allSessions.filter(s => {
      const isUpcomingStatus = s.status === 'confirmed' || s.status === 'pending';
      const sessionDate = new Date(s.scheduledDate);
      const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
      return isUpcomingStatus && sessionDateOnly >= todayDateOnly;
    }).length;
    const cancelledSessions = allSessions.filter(s => s.status === 'cancelled').length;

    const allRatings = Array.from(ratingMap.values()).map(r => r.rating);
    const averageRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      : 0;

    // Tutor breakdown
    const tutorMap = new Map<string, { name: string; count: number; totalRating: number; ratingCount: number }>();
    sessions.forEach((session: any) => {
      const tutorId = session.teacherId?._id?.toString();
      const tutorName = session.teacherId?.fullName || 'Unknown';

      if (tutorId) {
        const current = tutorMap.get(tutorId) || { name: tutorName, count: 0, totalRating: 0, ratingCount: 0 };
        const rating = ratingMap.get(session._id.toString());

        tutorMap.set(tutorId, {
          name: tutorName,
          count: current.count + 1,
          totalRating: current.totalRating + (rating?.rating || 0),
          ratingCount: current.ratingCount + (rating ? 1 : 0)
        });
      }
    });

    const tutorBreakdown = Array.from(tutorMap.values()).map(data => ({
      tutorName: data.name,
      sessionCount: data.count,
      averageRating: data.ratingCount > 0 ? data.totalRating / data.ratingCount : 0
    }));

    // Subject breakdown
    const subjectMap = new Map<string, number>();
    sessions.forEach((session: any) => {
      const subject = session.subjectId?.name || session.title || 'General';
      subjectMap.set(subject, (subjectMap.get(subject) || 0) + 1);
    });

    const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, count]) => ({
      subject,
      sessionCount: count
    }));

    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 50; // Default to 50 sessions per page
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSessions = sessions.slice(startIndex, endIndex);

    // Format sessions for response
    const formattedSessions = paginatedSessions.map((session: any) => {
      const rating = ratingMap.get(session._id.toString());
      const sessionDate = new Date(session.scheduledDate);
      const status = session.status === 'confirmed' && sessionDate > now ? 'upcoming' : session.status;

      return {
        id: session._id.toString(),
        subject: session.subjectId?.name || session.title || 'General',
        tutorName: session.teacherId?.fullName || 'Unknown',
        tutorEmail: session.teacherId?.email || '',
        date: session.scheduledDate,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        status,
        sessionType: session.bookingType,
        studentFeedback: rating?.reviewText,
        studentRating: rating?.rating,
        tutorNotes: session.notes
      };
    });

    return {
      sessions: formattedSessions,
      stats: {
        totalSessions,
        completedSessions,
        upcomingSessions,
        cancelledSessions,
        averageRating,
        tutorBreakdown,
        subjectBreakdown
      },
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalSessions / limit),
        totalSessions,
        hasNextPage: endIndex < totalSessions,
        hasPrevPage: page > 1
      }
    };
  }
}

