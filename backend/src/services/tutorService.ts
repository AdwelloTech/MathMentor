import { MongoClient, ObjectId } from 'mongodb';

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
}
