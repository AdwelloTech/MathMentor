import { MongoClient, ObjectId } from 'mongodb';
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
  active: number;
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
  private static getClient(): MongoClient {
    return new MongoClient(MONGODB_URI);
  }

  static async getTutorApplications(userId: string): Promise<TutorApplication[]> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      const applications = await db.collection('tutor_applications')
        .find({ user_id: userId })
        .sort({ submitted_at: -1 })
        .toArray();

      return applications.map(app => ({
        ...app,
        _id: app._id.toString()
      })) as unknown as TutorApplication[];
    } finally {
      await client.close();
    }
  }

  static async createTutorApplication(applicationData: Omit<TutorApplication, '_id' | 'created_at' | 'updated_at'>): Promise<TutorApplication> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

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
    } finally {
      await client.close();
    }
  }

  static async updateTutorApplication(userId: string, updates: Partial<TutorApplication>): Promise<TutorApplication> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

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
      await client.close();
    }
  }

  static async getIDVerification(userId: string): Promise<IDVerification | null> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      const verification = await db.collection('id_verifications')
        .find({ user_id: userId })
        .sort({ submitted_at: -1 })
        .limit(1)
        .toArray()
        .then(results => results[0]);

      if (!verification) {
        return null;
      }

      return {
        ...verification,
        _id: verification._id.toString()
      } as unknown as IDVerification;
    } finally {
      await client.close();
    }
  }

  static async submitIDVerification(verificationData: Omit<IDVerification, '_id' | 'created_at' | 'updated_at'>): Promise<IDVerification> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

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
      await client.close();
    }
  }

  static async acceptAllPendingApplications(): Promise<{ acceptedCount: number; totalProcessed: number }> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

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

      let roleUpdates = 0;
      for (const app of approvedApplications) {
        try {
          await db.collection('profiles').updateOne(
            { user_id: app.user_id },
            {
              $set: {
                role: 'tutor',
                updated_at: now
              }
            }
          );
          roleUpdates++;
        } catch (error) {
          console.error(`Error updating role for user ${app.user_id}:`, error);
        }
      }

      return {
        acceptedCount: result.modifiedCount,
        totalProcessed: result.modifiedCount
      };
    } finally {
      await client.close();
    }
  }

  static async acceptAllPendingIDVerifications(): Promise<{ acceptedCount: number; totalProcessed: number }> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

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

      return {
        acceptedCount: result.modifiedCount,
        totalProcessed: result.modifiedCount
      };
    } finally {
      await client.close();
    }
  }

  static async updateIDVerificationStatus(userId: string, status: IDVerification['verification_status'], adminId?: string): Promise<IDVerification> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

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
      await client.close();
    }
  }
  
  static async getAllTutorsForAdmin(): Promise<TutorProfile[]> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      // Get all tutor profiles
      const tutors = await db.collection('profiles')
        .find({ role: 'tutor' })
        .sort({ created_at: -1 })
        .toArray();

      // Get all tutor applications
      const applications = await db.collection('tutor_applications')
        .find({})
        .sort({ submitted_at: -1 })
        .toArray();

      // Create a map of user_id to application for quick lookup
      const applicationMap = new Map();
      applications.forEach(app => {
        if (!applicationMap.has(app.user_id)) {
          applicationMap.set(app.user_id, app);
        }
      });

      // Transform the data to include application information
      const transformedTutors = tutors.map(tutor => {
        const application = applicationMap.get(tutor.user_id);
        return {
          ...tutor,
          _id: tutor._id.toString(),
          application_status: application?.application_status || null,
          submitted_at: application?.submitted_at || null,
          reviewed_at: application?.reviewed_at || null,
        };
      });

      return transformedTutors as unknown as TutorProfile[];
    } finally {
      await client.close();
    }
  }
  
  static async getTutorById(tutorId: string): Promise<TutorProfile | null> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

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
        .then(results => results[0] || null);

      // Transform the data
      return {
        ...tutor,
        _id: tutor._id.toString(),
        application_status: application?.application_status || null,
        submitted_at: application?.submitted_at || null,
        reviewed_at: application?.reviewed_at || null,
      } as unknown as TutorProfile;
    } finally {
      await client.close();
    }
  }

  static async getTutorStats(): Promise<TutorStats> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      // Get total tutors count
      const total = await db.collection('profiles')
        .countDocuments({ role: 'tutor' });

      // Get active tutors count
      const active = await db.collection('profiles')
        .countDocuments({ role: 'tutor', is_active: true });

      // Get inactive tutors count
      const inactive = await db.collection('profiles')
        .countDocuments({ role: 'tutor', is_active: false });

      // Get application status counts
      const applications = await db.collection('tutor_applications')
        .find({})
        .toArray();

      const approved = applications.filter(app => app.application_status === 'approved').length;
      const pending = applications.filter(app => app.application_status === 'pending').length;
      const rejected = applications.filter(app => app.application_status === 'rejected').length;

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
        active,
        inactive,
        approved,
        pending,
        rejected,
        recentRegistrations
      };
    } finally {
      await client.close();
    }
  }

  static async getTutorClasses(tutorId: string): Promise<TutorClass[]> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

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
      const classTypeIds = Array.from(new Set(classes.map(c => c.class_type_id)));
      const classTypes = await db.collection('class_types')
        .find({ _id: { $in: classTypeIds.map(id => new ObjectId(id.toString())) } })
        .toArray();

      // Create a map of class type IDs to class type objects
      const classTypeMap = new Map();
      classTypes.forEach(type => {
        classTypeMap.set(type._id.toString(), {
          id: type._id.toString(),
          name: type.name,
          duration_minutes: type.duration_minutes,
          description: type.description
        });
      });

      // Get jitsi meetings for all classes
      const classIds = classes.map(c => c._id.toString());
      const jitsiMeetings = await db.collection('jitsi_meetings')
        .find({ class_id: { $in: classIds } })
        .toArray();

      // Create a map of class IDs to jitsi meeting objects
      const jitsiMap = new Map();
      jitsiMeetings.forEach(jitsi => {
        jitsiMap.set(jitsi.class_id, {
          id: jitsi._id.toString(),
          room_name: jitsi.room_name,
          meeting_url: jitsi.meeting_url,
          start_url: jitsi.start_url
        });
      });

      // Combine the data
      return classes.map(classItem => ({
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
      await client.close();
    }
  }

  static async updateTutorStatus(tutorId: string, isActive: boolean): Promise<void> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      const result = await db.collection('profiles').updateOne(
        { _id: new ObjectId(tutorId) },
        { $set: { is_active: isActive, updated_at: new Date().toISOString() } }
      );

      if (result.matchedCount === 0) {
        throw new Error('Tutor not found');
      }
    } finally {
      await client.close();
    }
  }

  static async deleteTutor(tutorId: string): Promise<void> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

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
      await client.close();
    }
  }
  
  static async updateTutorApplicationStatus(
    userId: string,
    status: 'pending' | 'approved' | 'rejected',
    adminId: string,
    rejectionReason?: string,
    adminNotes?: string
  ): Promise<TutorApplication> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

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

      return {
        ...result,
        _id: result._id.toString()
      } as unknown as TutorApplication;
    } finally {
      await client.close();
    }
  }

  // Get all tutor applications for admin
  static async getAllTutorApplications(): Promise<TutorApplication[]> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      const applications = await db.collection('tutor_applications')
        .find({})
        .sort({ submitted_at: -1 })
        .toArray();

      return applications.map(app => ({
        ...app,
        _id: app._id.toString()
      })) as unknown as TutorApplication[];
    } finally {
      await client.close();
    }
  }

  // Get tutor application statistics for admin
  static async getTutorApplicationStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    recentApplications: number;
  }> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      const applications = await db.collection('tutor_applications')
        .find({})
        .project({ application_status: 1, created_at: 1 })
        .toArray();

      const total = applications.length;
      const pending = applications.filter(app => app.application_status === 'pending').length;
      const approved = applications.filter(app => app.application_status === 'approved').length;
      const rejected = applications.filter(app => app.application_status === 'rejected').length;

      // Recent applications (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentApplications = applications.filter(app => new Date(app.created_at) >= oneWeekAgo).length;

      return {
        total,
        pending,
        approved,
        rejected,
        recentApplications,
      };
    } finally {
      await client.close();
    }
  }

  static async getAllIDVerifications(): Promise<IDVerification[]> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      // Get all ID verifications
      const verifications = await db.collection('id_verifications')
        .find({})
        .sort({ submitted_at: -1 })
        .toArray();

      // Get all user profiles from Mongoose User model
      const userIds = verifications.map(v => v.user_id);
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
      const transformedVerifications = verifications.map(verification => {
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
      await client.close();
    }
  }

  static async getIDVerificationStats(): Promise<{
    total_verifications: number;
    pending_verifications: number;
    approved_verifications: number;
    rejected_verifications: number;
    expired_verifications: number;
  }> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      const verifications = await db.collection('id_verifications')
        .find({})
        .project({ verification_status: 1 })
        .toArray();

      const total = verifications.length;
      const pending = verifications.filter(v => v.verification_status === 'pending').length;
      const approved = verifications.filter(v => v.verification_status === 'approved').length;
      const rejected = verifications.filter(v => v.verification_status === 'rejected').length;
      const expired = verifications.filter(v => v.verification_status === 'expired').length;

      return {
        total_verifications: total,
        pending_verifications: pending,
        approved_verifications: approved,
        rejected_verifications: rejected,
        expired_verifications: expired,
      };
    } finally {
      await client.close();
    }
  }

  static async updateIDVerificationById(
    verificationId: string,
    status: IDVerification['verification_status'],
    adminId: string,
    adminNotes?: string,
    rejectionReason?: string
  ): Promise<IDVerification> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

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
      await client.close();
    }
  }

  static async deleteIDVerification(verificationId: string): Promise<void> {
    const client = this.getClient();

    try {
      await client.connect();
      const db = client.db(DB_NAME);

      const result = await db.collection('id_verifications').deleteOne({
        _id: new ObjectId(verificationId)
      });

      if (result.deletedCount === 0) {
        throw new Error('ID verification not found');
      }
    } finally {
      await client.close();
    }
  }
}
