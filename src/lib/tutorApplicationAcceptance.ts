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
import type { TutorApplication } from '@/types/auth';

interface AcceptanceResult {
  success: boolean;
  message: string;
  data?: TutorApplication;
  error?: string;
}

interface AccessCheckResult {
  hasAccess: boolean;
  applicationStatus: string;
  message: string;
}

/**
 * Accept a tutor application and grant tutor dashboard access
 * @param userId - The user ID of the tutor applicant
 * @returns Promise with acceptance result
 */
export async function acceptTutorApplication(userId: string): Promise<AcceptanceResult> {
  try {
    // First, get the user's current tutor application
    const response = await db.tutorApplications.getByUserId(userId) as any;
    
    console.log('Accept application - response:', response);
    console.log('Accept application - userId:', userId);

    if (!response.success || !response.data) {
      return {
        success: false,
        message: 'No tutor application found for this user'
      };
    }

    const application: TutorApplication = response.data;
    console.log('Accept application - application:', application);
    console.log('Accept application - status:', application.application_status);
    console.log('Accept application - application keys:', Object.keys(application));
    console.log('Accept application - has status field:', application.hasOwnProperty('application_status'));

    // Check if application is already approved
    if (application.application_status === 'approved') {
      return {
        success: true,
        message: 'Tutor application is already approved',
        data: application
      };
    }

    // Check if application is pending or under review (submitted but not reviewed)
    // Also handle cases where status might be undefined (legacy applications)
    if (application.application_status === 'pending' || application.application_status === 'under_review' || application.application_status === undefined) {
      // Automatically approve the application
      const now = new Date().toISOString();
      const updateData = {
        application_status: 'approved' as const,
        approved_by: 'system', // Auto-approved
        reviewed_at: now,
        updated_at: now
      };

      // Update the application in the database
      const updateResponse = await db.tutorApplications.update(userId, updateData) as any;

      if (!updateResponse.success) {
        throw new Error('Failed to update application status');
      }

      // Update user role to tutor
      await updateUserRoleToTutor(userId);

      const updatedApplication: TutorApplication = {
        ...application,
        ...updateData
      };

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
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update user role to tutor in the database
 * @param userId - The user ID to update
 * @returns Promise that resolves to true on success
 */
async function updateUserRoleToTutor(userId: string): Promise<boolean> {
  try {
    // Get current user profile
    const profile = await db.profiles.getByUserId(userId);

    if (!profile) {
      throw new Error('User profile not found');
    }

    // Update role to tutor
    const updateData = {
      role: 'tutor' as const,
      updated_at: new Date().toISOString()
    };

    const updateResponse = await db.profiles.update(userId, updateData) as any;

    if (!updateResponse.success) {
      throw new Error('Failed to update user profile');
    }

    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

/**
 * Check if a user can access tutor dashboard features
 * @param userId - The user ID to check
 * @returns Promise with access check result
 */
export async function checkTutorDashboardAccess(userId: string): Promise<AccessCheckResult> {
  try {
    // Check user role first
    const profile = await db.profiles.getByUserId(userId) as any;

    if (profile?.role === 'tutor') {
      return {
        hasAccess: true,
        applicationStatus: 'approved',
        message: 'User has tutor role and dashboard access'
      };
    }

    // Check for tutor application
    const response = await db.tutorApplications.getByUserId(userId) as any;

    if (!response.success || !response.data) {
      return {
        hasAccess: false,
        applicationStatus: 'none',
        message: 'No tutor application found'
      };
    }

    const application: TutorApplication = response.data;

    if (application.application_status === 'approved') {
      // If approved but role not updated, fix it
      await updateUserRoleToTutor(userId);
      return {
        hasAccess: true,
        applicationStatus: 'approved',
        message: 'Tutor application approved - dashboard access granted'
      };
    }

    if (application.application_status === 'pending' || application.application_status === 'under_review' || application.application_status === undefined) {
      // TEMPORARILY COMMENTED OUT: Auto-accept pending or under_review applications for immediate access
      // const result = await acceptTutorApplication(userId);
      // if (result.success) {
      //   return {
      //     hasAccess: true,
      //     applicationStatus: 'approved',
      //     message: 'Tutor application auto-approved - dashboard access granted'
      //   };
      // }

      // Return pending status without auto-approval
      return {
        hasAccess: false,
        applicationStatus: application.application_status || 'pending',
        message: `Tutor application status: ${application.application_status || 'pending'}`
      };
    }

    return {
      hasAccess: false,
      applicationStatus: application.application_status || 'unknown',
      message: `Tutor application status: ${application.application_status || 'unknown'}`
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
 * TEMPORARILY COMMENTED OUT: Grant immediate tutor dashboard access after application submission
 * This function can be called right after a successful application submission
 * @param userId - The user ID who just submitted an application
 * @returns Promise with grant result
 */
// export async function grantImmediateTutorAccess(userId: string): Promise<{success: boolean, message: string}> {
//   try {
//     // Wait a moment for the application to be saved
//     await new Promise(resolve => setTimeout(resolve, 1000));

//     // Check and grant access
//     const accessCheck = await checkTutorDashboardAccess(userId);

//     if (accessCheck.hasAccess) {
//       return {
//         success: true,
//         message: 'Tutor dashboard access granted successfully'
//       };
//     } else {
//       // Try to accept the application
//       const result = await acceptTutorApplication(userId);
//       return result;
//     }
//   } catch (error) {
//     console.error('Error granting immediate tutor access:', error);
//     return {
//       success: false,
//       message: 'Failed to grant tutor dashboard access'
//     };
//   }
// }

// Export default object with all functions
export default {
  acceptTutorApplication,
  checkTutorDashboardAccess,
  // grantImmediateTutorAccess, // Temporarily commented out
  updateUserRoleToTutor
};
