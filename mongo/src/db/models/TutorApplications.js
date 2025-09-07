// Auto-generated from Supabase schema → MongoDB (Mongoose)
// Notes:
// - UUIDs stored as String. Use `uuid` if you want runtime defaults.
// - JSONB → Schema.Types.Mixed
// - ARRAY → arrays of basic types (mostly [String])
// - External refs to `auth.users` use ref: 'users' (adjust to your actual collection)
// - Time-only fields are stored as "HH:mm:ss" strings for simplicity.
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
const { Schema } = mongoose;

    const schema = new Schema(
      {
  _id: { type: String, default: () => uuidv4() },
  user_id: { type: String, ref: 'users' },
  applicant_email: { type: String, required: true, lowercase: true, trim: true },
  full_name: { type: String, required: true },
  phone_number: { type: String, required: true },
  subjects: [{ type: String }],
  specializes_learning_disabilities: { type: Boolean, default: false },
  cv_file_name: { type: String, required: true },
  cv_url: { type: String, required: true },
  cv_file_size: { type: Number, min: 0 },
  additional_notes: { type: String },
  application_status: { type: String, enum: ['pending','approved','rejected','under_review'], default: 'pending' },
  admin_notes: { type: String },
  rejection_reason: { type: String },
  submitted_at: { type: Date, default: Date.now },
  reviewed_at: { type: Date },
  reviewed_by: { type: String, ref: 'users' },
  approved_by: { type: String, ref: 'users' },
  postcode: { type: String, required: true },
  past_experience: { type: String },
  weekly_availability: { type: String },
  employment_status: { type: String },
  education_level: { type: String },
  average_weekly_hours: { type: Number, min: 0 },
  expected_hourly_rate: { type: Number, min: 0 },
  based_in_country: { type: String, required: true },
  id_verification_status: { type: String, enum: ['not_submitted','pending','approved','rejected'], default: 'not_submitted' },
  id_verification_required: { type: Boolean, default: true }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'tutor_applications'
      }
    );
    export default mongoose.models.TutorApplications || mongoose.model('TutorApplications', schema);
