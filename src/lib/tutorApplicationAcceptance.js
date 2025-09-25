/**
 * Tutor Application Acceptance Utility
 *
 * This utility handles the acceptance of tutor applications and grants
 * dashboard access to tutors after successful application submission.
 *
 * Usage:
 * import { acceptTutorApplication } from '@/lib/tutorApplicationAcceptance';
 *
 * // Accept a tutor application and update user role
 * await acceptTutorApplication(userId);
 */

import { db } from './db';

/**
 * Accept a tutor application and grant tutor dashboard access
 * @param {string} userId - The user ID of the tutor applicant
 * @returns {Promise<{success: boolean, message: string, data?: any}>}
 */
export async function acceptTutorApplication(userId) {
  try {
    // First, get the user's current tutor application
    const application = await db.tutorApplications.getByUserId(userId);

    if (!application) {
      return {
        success: false,
        message: 'No tutor application found for this user'
      };
    }

    // Check if application is already approved
    if (application.application_status === 'approved') {
      return {
        success: true,
        message: 'Tutor application is already approved',
        data: application
      };
    }

    // Check if application is pending (submitted but not reviewed)
    if (application.application_status === 'pending') {
      // Automatically approve the application
      const now = new Date().toISOString();
      const updatedApplication = {
        ...application,
        application_status: 'approved',
        approved_by: 'system', // Auto-approved
        reviewed_at: now,
        updated_at: now
      };

      // Update the application in the database
      await db.tutorApplications.update(userId, updatedApplication);

      // Update user role to tutor
      await updateUserRoleToTutor(userId);

      return {
        success: true,
        message: 'Tutor application accepted successfully. User now has tutor dashboard access.',
        data: updatedApplication
      };
    }

    // Application is rejected or under review
    return {
      success: false,
      message: `Cannot accept application with status: ${application.application_status}`
    };

  } catch (error) {
    console.error('Error accepting tutor application:', error);
    return {
      success: false,
      message: 'Failed to accept tutor application. Please try again.',
      error: error.message
    };
  }
}

/**
 * Update user role to tutor in the database
 * @param {string} userId - The user ID to update
 * @returns {Promise<boolean>}
 */
async function updateUserRoleToTutor(userId) {
  try {
    // Get current user profile
    const profile = await db.profiles.getByUserId(userId);

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Update role to tutor
    const updatedProfile = {
      ...profile,
      role: 'tutor',
      updated_at: new Date().toISOString()
    };

    await db.profiles.update(userId, updatedProfile);

    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

/**
 * Check if a user can access tutor dashboard features
 * @param {string} userId - The user ID to check
 * @returns {Promise<{hasAccess: boolean, applicationStatus: string, message: string}>}
 */
export async function checkTutorDashboardAccess(userId) {
  try {
    // Check user role first
    const profile = await db.profiles.getByUserId(userId);

    if (profile?.role === 'tutor') {
      return {
        hasAccess: true,
        applicationStatus: 'approved',
        message: 'User has tutor role and dashboard access'
      };
    }

    // Check for tutor application
    const application = await db.tutorApplications.getByUserId(userId);

    if (!application) {
      return {
        hasAccess: false,
        applicationStatus: 'none',
        message: 'No tutor application found'
      };
    }

    if (application.application_status === 'approved') {
      // If approved but role not updated, fix it
      await updateUserRoleToTutor(userId);
      return {
        hasAccess: true,
        applicationStatus: 'approved',
        message: 'Tutor application approved - dashboard access granted'
      };
    }

    if (application.application_status === 'pending') {
      // Auto-accept pending applications for immediate access
      const result = await acceptTutorApplication(userId);
      if (result.success) {
        return {
          hasAccess: true,
          applicationStatus: 'approved',
          message: 'Tutor application auto-approved - dashboard access granted'
        };
      }
    }

    return {
      hasAccess: false,
      applicationStatus: application.application_status,
      message: `Tutor application status: ${application.application_status}`
    };

  } catch (error) {
    console.error('Error checking tutor dashboard access:', error);
    return {
      hasAccess: false,
      applicationStatus: 'error',
      message: 'Error checking dashboard access'
    };
  }
}

/**
 * Grant immediate tutor dashboard access after application submission
 * This function can be called right after a successful application submission
 * @param {string} userId - The user ID who just submitted an application
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function grantImmediateTutorAccess(userId) {
  try {
    // Wait a moment for the application to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check and grant access
    const accessCheck = await checkTutorDashboardAccess(userId);

    if (accessCheck.hasAccess) {
      return {
        success: true,
        message: 'Tutor dashboard access granted successfully'
      };
    } else {
      // Try to accept the application
      const result = await acceptTutorApplication(userId);
      return result;
    }
  } catch (error) {
    console.error('Error granting immediate tutor access:', error);
    return {
      success: false,
      message: 'Failed to grant tutor dashboard access',
      error: error.message
    };
  }
}

// Export default object with all functions
export default {
  acceptTutorApplication,
  checkTutorDashboardAccess,
  grantImmediateTutorAccess,
  updateUserRoleToTutor
};
