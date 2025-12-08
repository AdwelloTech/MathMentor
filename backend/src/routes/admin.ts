import express from 'express';
import { authenticate } from '../middleware/auth';
import { TutorService } from '../services/tutorService';
import { ClassService } from '../services/classService';
import { FlashcardService } from '../services/flashcardService';
import { UserService } from '../services/userService';

const router = express.Router();

// Admin routes - require authentication and admin role
const adminGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};

// Get tutor statistics
router.get('/tutors/stats', authenticate, adminGuard, async (req, res) => {
  try {
    console.log('GET /api/admin/tutors/stats - Fetching tutor statistics');
    const stats = await TutorService.getTutorStats();
    console.log('GET /api/admin/tutors/stats - Statistics retrieved successfully', stats);
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting tutor stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tutor stats'
    });
  }
});

// Get all tutors with their applications
router.get('/tutors', authenticate, adminGuard, async (req, res) => {
  try {
    console.log('GET /api/admin/tutors - Fetching all tutors for admin');
    const tutors = await TutorService.getAllTutorsForAdmin();
    console.log(`GET /api/admin/tutors - Found ${tutors.length} tutors`);
    return res.json({
      success: true,
      data: tutors
    });
  } catch (error: any) {
    console.error('Error getting all tutors for admin:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tutors'
    });
  }
});

// Get classes for a specific tutor
router.get('/tutors/:tutorId/classes', authenticate, adminGuard, async (req, res) => {
  try {
    const { tutorId } = req.params;
    // Use the regular ClassService to get classes by teacher ID
    const classes = await ClassService.getClassesByTeacher(tutorId);

    // Transform IClass data to TutorClass format for frontend compatibility
    const transformedClasses = classes.map(classItem => ({
      id: classItem._id.toString(),
      tutor_id: classItem.teacherId.toString(),
      class_type_id: '1', // Default class type ID
      title: classItem.title,
      description: classItem.description || null,
      date: classItem.startDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      start_time: classItem.schedule.startTime,
      end_time: classItem.schedule.endTime,
      max_students: classItem.capacity,
      current_students: classItem.enrolledCount,
      price_per_session: classItem.price || 0,
      is_recurring: false,
      recurring_pattern: null,
      recurring_end_date: null,
      status: classItem.status || (classItem.isActive ? "scheduled" : "cancelled"),
      created_at: classItem.createdAt.toISOString(),
      updated_at: classItem.updatedAt.toISOString(),
      class_type: {
        id: '1',
        name: 'Group Session', // Default class type
        duration_minutes: classItem.schedule.duration,
        description: null
      },
      jitsi_meeting: classItem.jitsiRoomName ? {
        id: classItem._id.toString(),
        room_name: classItem.jitsiRoomName,
        meeting_url: classItem.meetingLink || `https://meet.jit.si/${classItem.jitsiRoomName}`,
        start_url: classItem.meetingLink || `https://meet.jit.si/${classItem.jitsiRoomName}`
      } : null
    }));

    res.json({
      success: true,
      data: transformedClasses
    });
  } catch (error: any) {
    console.error('Error getting tutor classes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tutor classes'
    });
  }
});

// Update tutor status (activate/deactivate)
router.put('/tutors/:tutorId/status', authenticate, adminGuard, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isActive must be a boolean value'
      });
    }

    await TutorService.updateTutorStatus(tutorId, isActive);
    res.json({
      success: true,
      data: { id: tutorId, isActive }
    });
  } catch (error: any) {
    console.error('Error updating tutor status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tutor status'
    });
  }
});

// Delete a tutor
router.delete('/tutors/:tutorId', authenticate, adminGuard, async (req, res) => {
  try {
    const { tutorId } = req.params;
    await TutorService.deleteTutor(tutorId);
    res.json({
      success: true,
      data: { id: tutorId }
    });
  } catch (error: any) {
    console.error('Error deleting tutor:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete tutor'
    });
  }
});

// Get a specific tutor by ID
router.get('/tutors/:tutorId', authenticate, adminGuard, async (req, res) => {
  try {
    const { tutorId } = req.params;
    console.log('GET /api/admin/tutors/:tutorId - tutorId:', tutorId);

    // Skip if it's a special route like "stats"
    if (tutorId === 'stats') {
      return res.status(404).json({
        success: false,
        error: 'Not found'
      });
    }

    const tutor = await TutorService.getTutorById(tutorId);
    console.log('GET /api/admin/tutors/:tutorId - Found tutor:', tutor ? tutor._id : 'null');

    if (!tutor) {
      return res.status(404).json({
        success: false,
        error: 'Tutor not found'
      });
    }

    return res.json({
      success: true,
      data: tutor
    });
  } catch (error: any) {
    console.error('Error getting tutor details:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tutor details'
    });
  }
});

// Get all tutor applications
router.get('/tutor-applications', authenticate, adminGuard, async (req, res) => {
  try {
    console.log('GET /api/admin/tutor-applications - Fetching all tutor applications');
    const applications = await TutorService.getAllTutorApplications();
    console.log(`GET /api/admin/tutor-applications - Found ${applications.length} applications`);
    return res.json({
      success: true,
      data: applications
    });
  } catch (error: any) {
    console.error('Error getting all tutor applications:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tutor applications'
    });
  }
});

// Get tutor application statistics
router.get('/tutor-applications/stats', authenticate, adminGuard, async (req, res) => {
  try {
    console.log('GET /api/admin/tutor-applications/stats - Fetching application statistics');
    const stats = await TutorService.getTutorApplicationStats();
    console.log('GET /api/admin/tutor-applications/stats - Statistics retrieved successfully', stats);
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting tutor application stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tutor application stats'
    });
  }
});

// Update tutor application status
router.put('/tutor-applications/:userId', authenticate, adminGuard, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, rejection_reason, admin_notes } = req.body;
    console.log(`🔄 API: Admin updating tutor application - User ID: ${userId}, Status: ${status}, Admin ID: ${req.user!.id}`);

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: pending, approved, rejected'
      });
    }

    const application = await TutorService.updateTutorApplicationStatus(
      userId,
      status,
      req.user!.id,
      rejection_reason,
      admin_notes
    );

    res.json({
      success: true,
      data: application
    });
  } catch (error: any) {
    console.error('Error updating tutor application status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tutor application status'
    });
  }
});

// Get all ID verifications
router.get('/id-verifications', authenticate, adminGuard, async (req, res) => {
  try {
    console.log('GET /api/admin/id-verifications - Fetching all ID verifications');
    const verifications = await TutorService.getAllIDVerifications();
    console.log(`GET /api/admin/id-verifications - Found ${verifications.length} verifications`);
    return res.json({
      success: true,
      data: verifications
    });
  } catch (error: any) {
    console.error('Error getting all ID verifications:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get ID verifications'
    });
  }
});

// Get ID verification statistics
router.get('/id-verifications/stats', authenticate, adminGuard, async (req, res) => {
  try {
    console.log('GET /api/admin/id-verifications/stats - Fetching ID verification statistics');
    const stats = await TutorService.getIDVerificationStats();
    console.log('GET /api/admin/id-verifications/stats - Statistics retrieved successfully', stats);
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting ID verification stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get ID verification stats'
    });
  }
});

// Update an ID verification status
router.put('/id-verifications/:verificationId', authenticate, adminGuard, async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { status, admin_notes, rejection_reason } = req.body;

    if (!status || !['pending', 'approved', 'rejected', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: pending, approved, rejected, expired'
      });
    }

    console.log('PUT /api/admin/id-verifications/:verificationId - verificationId:', verificationId, 'status:', status);

    const verification = await TutorService.updateIDVerificationById(
      verificationId,
      status,
      req.user!.id,
      admin_notes,
      rejection_reason
    );

    res.json({
      success: true,
      data: verification
    });
  } catch (error: any) {
    console.error('Error updating ID verification by ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update ID verification'
    });
  }
});

// Delete an ID verification
router.delete('/id-verifications/:verificationId', authenticate, adminGuard, async (req, res) => {
  try {
    const { verificationId } = req.params;
    console.log('DELETE /api/admin/id-verifications/:verificationId - verificationId:', verificationId);

    await TutorService.deleteIDVerification(verificationId);
    res.json({
      success: true,
      data: { id: verificationId }
    });
  } catch (error: any) {
    console.error('Error deleting ID verification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete ID verification'
    });
  }
});

// Admin Student Routes

// Get all students
router.get('/students', authenticate, adminGuard, async (req, res) => {
  try {
    console.log('GET /api/admin/students - Fetching all students for admin');
    const students = await UserService.getAllStudents();
    console.log(`GET /api/admin/students - Found ${students.length} students`);
    return res.json({
      success: true,
      data: students
    });
  } catch (error: any) {
    console.error('Error getting all students for admin:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get students'
    });
  }
});

// Get student statistics
router.get('/students/stats', authenticate, adminGuard, async (req, res) => {
  try {
    console.log('GET /api/admin/students/stats - Fetching student statistics');
    const stats = await UserService.getStudentStats();
    console.log('GET /api/admin/students/stats - Statistics retrieved successfully', stats);
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting student stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get student stats'
    });
  }
});

// Get a specific student by ID
router.get('/students/:studentId', authenticate, adminGuard, async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('GET /api/admin/students/:studentId - studentId:', studentId);

    const student = await UserService.getStudentById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    return res.json({
      success: true,
      data: student
    });
  } catch (error: any) {
    console.error('Error getting student details:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get student details'
    });
  }
});

// Update student
router.put('/students/:studentId', authenticate, adminGuard, async (req, res) => {
  try {
    const { studentId } = req.params;
    const updates = req.body;

    console.log('PUT /api/admin/students/:studentId - studentId:', studentId);

    const student = await UserService.updateStudent(studentId, updates);

    res.json({
      success: true,
      data: student
    });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update student'
    });
  }
});

// Delete student
// Delete any user with complete data cleanup
router.delete('/users/:userId', authenticate, adminGuard, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('DELETE /api/admin/users/:userId - userId:', userId);

    await UserService.deleteUser(userId);
    res.json({
      success: true,
      data: { id: userId }
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user'
    });
  }
});

// Delete student (legacy route, now uses comprehensive deletion)
router.delete('/students/:studentId', authenticate, adminGuard, async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('DELETE /api/admin/students/:studentId - studentId:', studentId);

    await UserService.deleteStudent(studentId);
    res.json({
      success: true,
      data: { id: studentId }
    });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete student'
    });
  }
});

// Admin Flashcard Routes

// Get all flashcard sets for admin (bypasses access control)
router.get('/flashcards/sets', authenticate, adminGuard, async (req, res) => {
  try {
    console.log('GET /api/admin/flashcards/sets - Fetching all flashcard sets for admin');

    // Get all sets without access control filtering
    const sets = await FlashcardService.getAllSetsForAdmin();

    console.log(`GET /api/admin/flashcards/sets - Found ${sets.length} flashcard sets`);
    return res.json({
      success: true,
      data: sets
    });
  } catch (error: any) {
    console.error('Error getting all flashcard sets for admin:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get flashcard sets'
    });
  }
});

// Get flashcard set details by ID for admin (bypasses access control)
router.get('/flashcards/sets/:setId', authenticate, adminGuard, async (req, res) => {
  try {
    const { setId } = req.params;
    console.log('GET /api/admin/flashcards/sets/:setId - setId:', setId);

    const set = await FlashcardService.getSetByIdForAdmin(setId);

    if (!set) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard set not found'
      });
    }

    return res.json({
      success: true,
      data: set
    });
  } catch (error: any) {
    console.error('Error getting flashcard set details for admin:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to get flashcard set details'
    });
  }
});

// Delete flashcard set for admin
router.delete('/flashcards/sets/:setId', authenticate, adminGuard, async (req, res) => {
  try {
    const { setId } = req.params;
    console.log('DELETE /api/admin/flashcards/sets/:setId - setId:', setId);

    await FlashcardService.deleteSetForAdmin(setId);
    res.json({
      success: true,
      message: 'Flashcard set deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting flashcard set for admin:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to delete flashcard set'
    });
  }
});

// Get recent tutor applications for dashboard
router.get('/dashboard/recent-applications', authenticate, adminGuard, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const applications = await TutorService.getRecentTutorApplications(limit);
    return res.json({
      success: true,
      data: applications
    });
  } catch (error: any) {
    console.error('Error getting recent applications:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recent applications'
    });
  }
});

// Get recent ID verifications for dashboard
router.get('/dashboard/recent-verifications', authenticate, adminGuard, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const verifications = await TutorService.getRecentIDVerifications(limit);
    return res.json({
      success: true,
      data: verifications
    });
  } catch (error: any) {
    console.error('Error getting recent verifications:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recent verifications'
    });
  }
});

// Get recent student signups for dashboard
router.get('/dashboard/recent-students', authenticate, adminGuard, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const students = await UserService.getRecentStudentSignups(limit);
    return res.json({
      success: true,
      data: students
    });
  } catch (error: any) {
    console.error('Error getting recent students:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recent students'
    });
  }
});

export default router;
