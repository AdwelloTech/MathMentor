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
  verification_status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  admin_notes?: string;
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
      })) as TutorApplication[];
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
        .findOne(
          { user_id: userId },
          { sort: { submitted_at: -1 } }
        );

      if (!verification) {
        return null;
      }

      return {
        ...verification,
        _id: verification._id.toString()
      } as IDVerification;
    } finally {
      await client.close();
    }
  }
}
