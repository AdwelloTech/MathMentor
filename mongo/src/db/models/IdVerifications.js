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
  user_id: { type: String, ref: 'Profiles', required: true },
  id_type: { type: String, enum: ['national_id','passport','drivers_license','student_id','other'], required: true },
  id_number: { type: String, required: true },
  full_name: { type: String, required: true },
  date_of_birth: { type: Date },
  expiry_date: { type: Date },
  issuing_country: { type: String },
  issuing_authority: { type: String },
  front_image_url: { type: String },
  back_image_url: { type: String },
  selfie_with_id_url: { type: String },
  verification_status: { type: String, enum: ['pending','approved','rejected','expired'], default: 'pending' },
  admin_notes: { type: String },
  rejection_reason: { type: String },
  verified_at: { type: Date },
  verified_by: { type: String, ref: 'Profiles' },
  submitted_at: { type: Date, default: Date.now }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'id_verifications'
      }
    );
    export default mongoose.models.IdVerifications || mongoose.model('IdVerifications', schema);
