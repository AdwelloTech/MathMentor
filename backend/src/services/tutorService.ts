import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { User } from '../models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';
const DB_NAME = process.env.DB_NAME || 'mathmentor';

export interface TutorApplication {
  _id?: ObjectId;
  user_id: string;
  applicant_email: string;
  full_name: string;
  phone_number: string;
  subjects: string[];
  specializes_learning_disabilities: boolean;
  cv_file_name?: string;
  cv_url?: string;
  cv_file_size?: number;
  additional_notes?: string;
  application_status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  rejection_reason?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  // New fields
  postcode?: string;
  past_experience?: string;
  weekly_availability?: string;
  employment_status?: string;
  education_level?: string;
  average_weekly_hours?: number;
  expected_hourly_rate?: number;
  based_in_country?: string;
}

export interface IDVerification {
  _id?: ObjectId;
  user_id: string;
  id_type: 'national_id' | 'passport' | 'drivers_license' | 'student_id' | 'other';
  id_number: string;
  full_name: string;
  date_of_birth?: string;
  expiry_date?: string;
  issuing_country?: string;
  issuing_authority?: string;
  front_image_url?: string;
  back_image_url?: string;
  selfie_with_id_url?: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'expired';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  admin_notes?: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TutorClass {
  _id?: ObjectId;
  tutor_id: string;
  class_type_id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  max_students: number;
  current_students: number;
  price_per_session: number;
  is_recurring: boolean;
  recurring_pattern?: string;
  recurring_end_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
  class_type?: {
    id: string;
    name: string;
    duration_minutes: number;
    description?: string;
  };
  jitsi_meeting?: {
    id: string;
    room_name: string;
    meeting_url: string;
    start_url: string;
  };
}

export interface TutorStats {
  total: number;
  online: number;
  inactive: number;
  approved: number;
  pending: number;
  rejected: number;
  recentRegistrations: number;
}

export interface TutorProfile {
  _id?: ObjectId;
  user_id: string;
  email?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  avatar_url?: string;
  profile_image_url?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  qualification?: string;
  experience_years?: number;
  hourly_rate?: number;
  availability?: string;
  bio?: string;
  subjects?: string[];
  specializations?: string[];
  languages?: string[];
  certifications?: string[];
  profile_completed?: boolean;
  // Additional application information
  application_status?: string;
  submitted_at?: string;
  reviewed_at?: string;
}

export class TutorService {

  static async getTutorApplications(userId: string): Promise<TutorApplication[]> {
    console.log(`🔍 BACKEND: Fetching tutor applications for user: ${userId} (Length: ${userId?.length})`);
    console.log('🔍 BACKEND: UserId type:', typeof userId);

    const db = mongoose.connection.db!;

    console.log('🔍 BACKEND: About to query database with:', { user_id: userId });

    const applications = await db.collection('tutor_applications')
      .find({ user_id: userId })
      .sort({ submitted_at: -1 })
      .toArray();

    console.log(`📄 BACKEND: Found ${applications.length} applications for user ${userId}`);
    if (applications.length === 0) {
      console.log('📄 BACKEND: No applications found - checking what exists in DB...');
      const allApps = await db.collection('tutor_applications').find({}).limit(5).toArray();
      console.log('📄 BACKEND: Sample applications in DB:', allApps.map((app: any) => ({
        id: app._id.toString(),
        user_id: app.user_id,
        status: app.application_status
      })));
    }

    return applications.map((app: any) => ({
      ...app,
      _id: app._id.toString()
    })) as unknown as TutorApplication[];
  }

  static async createTutorApplication(applicationData: Omit<TutorApplication, '_id' | 'created_at' | 'updated_at'>): Promise<TutorApplication> {
    const db = mongoose.connection.db!;

    const now = new Date().toISOString();
    const application: TutorApplication = {
      ...applicationData,
      application_status: 'pending',
      submitted_at: now,
      created_at: now,
      updated_at: now,
    };

    const result = await db.collection('tutor_applications').insertOne(application);

    return {
      ...application,
      _id: result.insertedId,
    };
  }

  static async updateTutorApplication(userId: string, updates: Partial<TutorApplication>): Promise<TutorApplication> {
    const db = mongoose.connection.db!;

    try {

      const now = new Date().toISOString();
      const updateData = {
        ...updates,
        updated_at: now,
      };

      const result = await db.collection('tutor_applications').findOneAndUpdate(
        { user_id: userId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('Tutor application not found');
      }

      return {
        ...result,
        _id: result._id.toString()
      } as unknown as TutorApplication;
    } finally {
    }
  }

  static async getIDVerification(userId: string): Promise<IDVerification | null> {
    const db = mongoose.connection.db!;

    try {

      const verification = await db.collection('id_verifications')
        .find({ user_id: userId })
        .sort({ submitted_at: -1 })
        .limit(1)
        .toArray()
        .then((results: any) => results[0]);

      if (!verification) {
        return null;
      }

      return {
        ...verification,
        _id: verification._id.toString()
      } as unknown as IDVerification;
    } finally {
    }
  }

  static async submitIDVerification(verificationData: Omit<IDVerification, '_id' | 'created_at' | 'updated_at'>): Promise<IDVerification> {
    const db = mongoose.connection.db!;

    try {

      const now = new Date().toISOString();
      const verification: IDVerification = {
        ...verificationData,
        verification_status: 'pending',
        submitted_at: now,
        created_at: now,
        updated_at: now,
      };

      const result = await db.collection('id_verifications').insertOne(verification);

      return {
        ...verification,
        _id: result.insertedId,
      };
    } finally {
    }
  }

  static async acceptAllPendingApplications(): Promise<{ acceptedCount: number; totalProcessed: number }> {
    const db = mongoose.connection.db!;

    try {

      const now = new Date().toISOString();

      // Update all applications with status 'pending' or no status to 'approved'
      const result = await db.collection('tutor_applications').updateMany(
        {
          $or: [
            { application_status: 'pending' },
            { application_status: { $exists: false } },
            { application_status: null }
          ]
        },
        {
          $set: {
            application_status: 'approved',
            approved_by: 'system',
            reviewed_at: now,
            updated_at: now
          }
        }
      );

      // Also update user roles to tutor for approved applications
      const approvedApplications = await db.collection('tutor_applications')
        .find({ application_status: 'approved' })
        .toArray();

      // Create profile records for approved tutors
      let profileCreations = 0;
      for (const app of approvedApplications) {
        try {
          // Get user data to populate profile
          const user = await db.collection('users').findOne({ _id: new ObjectId(app.user_id) });
          if (user) {
            const profileData = {
              user_id: app.user_id,
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName,
              full_name: user.fullName,
              role: 'tutor',
              avatar_url: user.avatarUrl,
              profile_image_url: user.profileImageUrl,
              phone: user.phone,
              address: user.address,
              date_of_birth: user.dateOfBirth,
              gender: user.gender,
              is_active: user.isActive,
              last_login: user.lastLogin,
              created_at: user.createdAt,
              updated_at: now,
              qualification: user.qualification,
              experience_years: user.experienceYears,
              hourly_rate: user.hourlyRate,
              availability: user.availability,
              bio: user.bio,
              subjects: user.subjects || app.subjects,
              specializations: user.specializations,
              languages: user.languages,
              certifications: user.certifications,
              profile_completed: user.profileCompleted || false
            };

            await db.collection('profiles').updateOne(
              { user_id: app.user_id },
              { $set: profileData },
              { upsert: true }
            );
            profileCreations++;
          }
        } catch (error) {
          console.error(`Error creating profile for user ${app.user_id}:`, error);
        }
      }

      return {
        acceptedCount: result.modifiedCount,
        totalProcessed: result.modifiedCount
      };
    } finally {
    }
  }

  static async acceptAllPendingIDVerifications(): Promise<{ acceptedCount: number; totalProcessed: number }> {
    const db = mongoose.connection.db!;

    try {

      const now = new Date().toISOString();

      // Update all ID verifications with status 'pending' or no status to 'approved'
      const result = await db.collection('id_verifications').updateMany(
        {
          $or: [
            { verification_status: 'pending' },
            { verification_status: { $exists: false } },
            { verification_status: null }
          ]
        },
        {
          $set: {
            verification_status: 'approved',
            verified_at: now,
            verified_by: 'system',
            reviewed_at: now,
            reviewed_by: 'system',
            updated_at: now
          }
        }
      );

      // Note: Users are already active by default upon registration

      return {
        acceptedCount: result.modifiedCount,
        totalProcessed: result.modifiedCount
      };
    } finally {
    }
  }

  static async updateIDVerificationStatus(userId: string, status: IDVerification['verification_status'], adminId?: string): Promise<IDVerification> {
    const db = mongoose.connection.db!;

    try {

      const now = new Date().toISOString();
      const updateData: Partial<IDVerification> = {
        verification_status: status,
        updated_at: now,
      };

      // Add verification metadata if approving
      if (status === 'approved') {
        updateData.verified_at = now;
        updateData.verified_by = adminId;
        updateData.reviewed_at = now;
        updateData.reviewed_by = adminId;

        // Note: User account is already active by default upon registration

        // Create or update profile record for the verified user
        try {
          const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
          if (user) {
            const profileData = {
              user_id: userId,
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName,
              full_name: user.fullName,
              role: user.role,
              avatar_url: user.avatarUrl,
              profile_image_url: user.profileImageUrl,
              phone: user.phone,
              address: user.address,
              date_of_birth: user.dateOfBirth,
              gender: user.gender,
              is_active: true, // Set to active since ID is verified
              last_login: user.lastLogin,
              created_at: user.createdAt,
              updated_at: now,
              qualification: user.qualification,
              experience_years: user.experienceYears,
              hourly_rate: user.hourlyRate,
              availability: user.availability,
              bio: user.bio,
              subjects: user.subjects,
              specializations: user.specializations,
              languages: user.languages,
              certifications: user.certifications,
              profile_completed: user.profileCompleted || false
            };

            await db.collection('profiles').updateOne(
              { user_id: userId },
              { $set: profileData },
              { upsert: true }
            );
            console.log(`Profile created/updated for verified user ${userId}`);
          }
        } catch (profileError) {
          console.error(`Error creating profile for verified user ${userId}:`, profileError);
          // Don't throw - ID verification succeeded even if profile creation failed
        }
      }

      const result = await db.collection('id_verifications').findOneAndUpdate(
        { user_id: userId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('ID verification not found');
      }

      return {
        ...result,
        _id: result._id.toString()
      } as unknown as IDVerification;
    } finally {
    }
  }
  
  static async getAllTutorsForAdmin(): Promise<TutorProfile[]> {
    const db = mongoose.connection.db!;

    try {
      // Get all tutor users from users collection
      const tutorUsers = await db.collection('users')
        .find({ role: 'tutor' })
        .sort({ createdAt: -1 })
        .toArray();

      // Get all profiles (if they exist)
      const profiles = await db.collection('profiles')
        .find({ role: 'tutor' })
        .toArray();

      // Create a map of user_id to profile for quick lookup
      const profileMap = new Map();
      profiles.forEach((profile: any) => {
        profileMap.set(profile.user_id, profile);
      });

      // Get all tutor applications
      const applications = await db.collection('tutor_applications')
        .find({})
        .sort({ submitted_at: -1 })
        .toArray();

      // Create a map of user_id to application for quick lookup
      const applicationMap = new Map();
      applications.forEach((app: any) => {
        if (!applicationMap.has(app.user_id)) {
          applicationMap.set(app.user_id, app);
        }
      });

      // Transform the data to include profile and application information
      const transformedTutors = tutorUsers.map((user: any) => {
        const profile = profileMap.get(user._id.toString());
        const application = applicationMap.get(user._id.toString());

        // Use profile data if available, otherwise fall back to user data
        return {
          _id: user._id,
          user_id: user._id.toString(),
          email: user.email,
          first_name: user.firstName || profile?.first_name,
          last_name: user.lastName || profile?.last_name,
          full_name: user.fullName || profile?.full_name || `${user.firstName || profile?.first_name || ''} ${user.lastName || profile?.last_name || ''}`,
          role: user.role,
          avatar_url: user.avatarUrl || profile?.avatar_url,
          profile_image_url: user.profileImageUrl || profile?.profile_image_url,
          phone: user.phone || profile?.phone,
          address: user.address || profile?.address,
          date_of_birth: user.dateOfBirth || profile?.date_of_birth,
          gender: user.gender || profile?.gender,
          is_active: user.isActive || profile?.is_active || false,
          last_login: user.lastLogin || profile?.last_login,
          created_at: user.createdAt || profile?.created_at,
          updated_at: user.updatedAt || profile?.updated_at,
          qualification: user.qualification || profile?.qualification,
          experience_years: user.experienceYears || profile?.experience_years,
          hourly_rate: user.hourlyRate || profile?.hourly_rate,
          availability: user.availability || profile?.availability,
          bio: user.bio || profile?.bio,
          subjects: user.subjects || profile?.subjects || [],
          specializations: user.specializations || profile?.specializations || [],
          languages: user.languages || profile?.languages || [],
          certifications: user.certifications || profile?.certifications || [],
          profile_completed: user.profileCompleted || profile?.profile_completed || false,
          // Application information
          application_status: application?.application_status || null,
          submitted_at: application?.submitted_at || null,
          reviewed_at: application?.reviewed_at || null,
        };
      });

      return transformedTutors as unknown as TutorProfile[];
    } finally {
    }
  }
  
  static async getTutorById(tutorId: string): Promise<TutorProfile | null> {
    const db = mongoose.connection.db!;

    try {

      // Try to find by MongoDB _id first, then by user_id if that fails
      let tutor;

      // Check if tutorId is a valid ObjectId
      if (ObjectId.isValid(tutorId)) {
        tutor = await db.collection('profiles')
          .findOne({ _id: new ObjectId(tutorId), role: 'tutor' });
      }

      // If not found by _id, try finding by user_id
      if (!tutor) {
        tutor = await db.collection('profiles')
          .findOne({ user_id: tutorId, role: 'tutor' });
      }

      if (!tutor) {
        return null;
      }

      // Get tutor application
      const application = await db.collection('tutor_applications')
        .find({ user_id: tutor.user_id })
        .sort({ submitted_at: -1 })
        .limit(1)
        .toArray()
        .then((results: any) => results[0] || null);

      // Transform the data
      return {
        ...tutor,
        _id: tutor._id.toString(),
        application_status: application?.application_status || null,
        submitted_at: application?.submitted_at || null,
        reviewed_at: application?.reviewed_at || null,
      } as unknown as TutorProfile;
    } finally {
    }
  }

  static async getTutorStats(): Promise<TutorStats> {
    const db = mongoose.connection.db!;

    try {

      // Get total tutors count (from User collection)
      const total = await db.collection('users')
        .countDocuments({ role: 'tutor' });

      // Get online users count (from User collection)
      const online = await db.collection('users')
        .countDocuments({ isOnline: true });

      // Get inactive tutors count (from User collection)
      const inactive = await db.collection('users')
        .countDocuments({ role: 'tutor', isActive: false });

      // Get application status counts
      const applications = await db.collection('tutor_applications')
        .find({})
        .toArray();

      const approved = applications.filter((app: any) => app.application_status === 'approved').length;
      const pending = applications.filter((app: any) => app.application_status === 'pending').length;
      const rejected = applications.filter((app: any) => app.application_status === 'rejected').length;

      // Get recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentRegistrations = await db.collection('profiles')
        .countDocuments({
          role: 'tutor',
          created_at: { $gte: thirtyDaysAgo.toISOString() }
        });

      return {
        total,
        online,
        inactive,
        approved,
        pending,
        rejected,
        recentRegistrations
      };
    } finally {
    }
  }

  static async getTutorClasses(tutorId: string): Promise<TutorClass[]> {
    const db = mongoose.connection.db!;

    try {

      // First, get the tutor to find the correct user_id if tutorId is not the MongoDB _id
      let tutor;

      // Check if tutorId is a valid ObjectId
      if (ObjectId.isValid(tutorId)) {
        tutor = await db.collection('profiles')
          .findOne({ _id: new ObjectId(tutorId), role: 'tutor' });
      }

      // If not found by _id, try finding by user_id
      if (!tutor) {
        tutor = await db.collection('profiles')
          .findOne({ user_id: tutorId, role: 'tutor' });
      }

      if (!tutor) {
        return [];
      }

      // Use the tutor's user_id to find classes
      const classes = await db.collection('tutor_classes')
        .find({ tutor_id: tutor.user_id })
        .sort({ date: -1 })
        .toArray();

      if (!classes.length) {
        return [];
      }

      // Get class types
      const classTypeIds = Array.from(new Set(classes.map((c: any) => c.class_type_id)));
      const classTypes = await db.collection('class_types')
        .find({ _id: { $in: classTypeIds.map((id: any) => new ObjectId(id.toString())) } })
        .toArray();

      // Create a map of class type IDs to class type objects
      const classTypeMap = new Map();
      classTypes.forEach((type: any) => {
        classTypeMap.set(type._id.toString(), {
          id: type._id.toString(),
          name: type.name,
          duration_minutes: type.duration_minutes,
          description: type.description
        });
      });

      // Get jitsi meetings for all classes
      const classIds = classes.map((c: any) => c._id.toString());
      const jitsiMeetings = await db.collection('jitsi_meetings')
        .find({ class_id: { $in: classIds } })
        .toArray();

      // Create a map of class IDs to jitsi meeting objects
      const jitsiMap = new Map();
      jitsiMeetings.forEach((jitsi: any) => {
        jitsiMap.set(jitsi.class_id, {
          id: jitsi._id.toString(),
          room_name: jitsi.room_name,
          meeting_url: jitsi.meeting_url,
          start_url: jitsi.start_url
        });
      });

      // Combine the data
      return classes.map((classItem: any) => ({
        ...classItem,
        _id: classItem._id.toString(),
        class_type: classTypeMap.get(classItem.class_type_id) || {
          id: classItem.class_type_id,
          name: 'Unknown',
          duration_minutes: 0
        },
        jitsi_meeting: jitsiMap.get(classItem._id.toString()) || null,
      })) as unknown as TutorClass[];
    } finally {
    }
  }

  static async updateTutorStatus(tutorId: string, isActive: boolean): Promise<void> {
    const db = mongoose.connection.db!;

    try {
      // Update the User collection instead of profiles
      const result = await db.collection('users').updateOne(
        { _id: new ObjectId(tutorId) },
        { $set: { isActive: isActive, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        throw new Error('Tutor not found');
      }
    } finally {
    }
  }

  static async deleteTutor(tutorId: string): Promise<void> {
    const db = mongoose.connection.db!;

    try {

      // Get the tutor profile to get the user_id
      const tutor = await db.collection('profiles').findOne({ _id: new ObjectId(tutorId) });

      if (!tutor) {
        throw new Error('Tutor not found');
      }

      // Delete tutor-related records in all collections
      const userId = tutor.user_id;
      
      // Delete tutor applications
      await db.collection('tutor_applications').deleteMany({ user_id: userId });
      
      // Delete ID verifications
      await db.collection('id_verifications').deleteMany({ user_id: userId });
      
      // Delete classes (should handle cascading deletes of related records)
      await db.collection('tutor_classes').deleteMany({ tutor_id: tutorId });
      
      // Finally delete the profile
      await db.collection('profiles').deleteOne({ _id: new ObjectId(tutorId) });
      
    } finally {
    }
  }
  
  static async updateTutorApplicationStatus(
    userId: string,
    status: 'pending' | 'approved' | 'rejected',
    adminId: string,
    rejectionReason?: string,
    adminNotes?: string
  ): Promise<TutorApplication> {
    console.log(`🔄 BACKEND: Updating tutor application status - User ID: ${userId}, Status: ${status}, Admin ID: ${adminId}`);
    const db = mongoose.connection.db!;

    const now = new Date().toISOString();
    const updateData: Partial<TutorApplication> = {
      application_status: status,
      updated_at: now,
      reviewed_at: now,
      reviewed_by: adminId
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    if (status === 'approved') {
      updateData.approved_by = adminId;

      // Update the user's role to tutor if application is approved
      await db.collection('profiles').updateOne(
        { user_id: userId },
        {
          $set: {
            role: 'tutor',
            updated_at: now
          }
        }
      );
    }

    const result = await db.collection('tutor_applications').findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('Tutor application not found');
    }

    console.log(`✅ BACKEND: Tutor application status updated successfully - User ID: ${userId}, New Status: ${status}`);
    return {
      ...result,
      _id: result._id.toString()
    } as unknown as TutorApplication;
  }

  // Get all tutor applications for admin
  static async getAllTutorApplications(): Promise<TutorApplication[]> {
    const db = mongoose.connection.db!;

    const applications = await db.collection('tutor_applications')
      .find({})
      .sort({ submitted_at: -1 })
      .toArray();

    return applications.map((app: any) => ({
      ...app,
      _id: app._id.toString()
    })) as unknown as TutorApplication[];
  }

  // Get tutor application statistics for admin
  static async getTutorApplicationStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    recentApplications: number;
  }> {
    const db = mongoose.connection.db!;

    const applications = await db.collection('tutor_applications')
      .find({})
      .project({ application_status: 1, created_at: 1 })
      .toArray();

    const total = applications.length;
    const pending = applications.filter((app: any) => app.application_status === 'pending').length;
    const approved = applications.filter((app: any) => app.application_status === 'approved').length;
    const rejected = applications.filter((app: any) => app.application_status === 'rejected').length;

    // Recent applications (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentApplications = applications.filter((app: any) => new Date(app.created_at) >= oneWeekAgo).length;

    return {
      total,
      pending,
      approved,
      rejected,
      recentApplications,
    };
  }

  static async getAllIDVerifications(): Promise<IDVerification[]> {
    const db = mongoose.connection.db!;

    try {

      // Get all ID verifications
      const verifications = await db.collection('id_verifications')
        .find({})
        .sort({ submitted_at: -1 })
        .toArray();

      // Get all user profiles from Mongoose User model
      const userIds = verifications.map((v: any) => v.user_id);
      const users = await User.find({ _id: { $in: userIds } }).select('firstName lastName fullName email phone');

      // Create a map of user_id to user for quick lookup
      const userMap = new Map();
      users.forEach(user => {
        userMap.set(user._id.toString(), {
          full_name: user.fullName,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName
        });
      });

      // Transform the data to include user information
      const transformedVerifications = verifications.map((verification: any) => {
        const user = userMap.get(verification.user_id);
        return {
          ...verification,
          _id: verification._id.toString(),
          id: verification._id.toString(),
          profiles: user || null
        };
      });

      return transformedVerifications as unknown as IDVerification[];
    } finally {
    }
  }

  static async getIDVerificationStats(): Promise<{
    total_verifications: number;
    pending_verifications: number;
    approved_verifications: number;
    rejected_verifications: number;
    expired_verifications: number;
  }> {
    const db = mongoose.connection.db!;

    try {

      const verifications = await db.collection('id_verifications')
        .find({})
        .project({ verification_status: 1 })
        .toArray();

      const total = verifications.length;
      const pending = verifications.filter((v: any) => v.verification_status === 'pending').length;
      const approved = verifications.filter((v: any) => v.verification_status === 'approved').length;
      const rejected = verifications.filter((v: any) => v.verification_status === 'rejected').length;
      const expired = verifications.filter((v: any) => v.verification_status === 'expired').length;

      return {
        total_verifications: total,
        pending_verifications: pending,
        approved_verifications: approved,
        rejected_verifications: rejected,
        expired_verifications: expired,
      };
    } finally {
    }
  }

  static async updateIDVerificationById(
    verificationId: string,
    status: IDVerification['verification_status'],
    adminId: string,
    adminNotes?: string,
    rejectionReason?: string
  ): Promise<IDVerification> {
    const db = mongoose.connection.db!;

    try {

      const now = new Date().toISOString();
      const updateData: Partial<IDVerification> = {
        verification_status: status,
        updated_at: now,
        verified_by: adminId,
      };

      // Add verification metadata based on status
      if (status === 'approved') {
        updateData.verified_at = now;
        updateData.reviewed_at = now;
        updateData.reviewed_by = adminId;
      }

      // Add admin notes and rejection reason
      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }
      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const result = await db.collection('id_verifications').findOneAndUpdate(
        { _id: new ObjectId(verificationId) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('ID verification not found');
      }

      return {
        ...result,
        _id: result._id.toString()
      } as unknown as IDVerification;
    } finally {
    }
  }

  static async deleteIDVerification(verificationId: string): Promise<void> {
    const db = mongoose.connection.db!;

    try {

      const result = await db.collection('id_verifications').deleteOne({
        _id: new ObjectId(verificationId)
      });

      if (result.deletedCount === 0) {
        throw new Error('ID verification not found');
      }
    } finally {
    }
  }

  static async getRecentTutorApplications(limit: number = 5): Promise<TutorApplication[]> {
    const db = mongoose.connection.db!;

    try {

      const applications = await db.collection('tutor_applications')
        .find({})
        .sort({ submitted_at: -1 })
        .limit(limit)
        .toArray();

      return applications.map((app: any) => ({
        ...app,
        _id: app._id.toString()
      })) as unknown as TutorApplication[];
    } finally {
    }
  }

  static async getRecentIDVerifications(limit: number = 5): Promise<IDVerification[]> {
    const db = mongoose.connection.db!;

    try {

      const verifications = await db.collection('id_verifications')
        .find({})
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray();

      return verifications.map((verification: any) => ({
        ...verification,
        _id: verification._id.toString()
      })) as unknown as IDVerification[];
    } finally {
    }
  }
}
