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
  student_id: { type: String, ref: 'Profiles', required: true },
  subject_id: { type: String, ref: 'Subjects', required: true },
  duration_minutes: { type: Number, default: 15, min: 1 },
  status: { type: String, enum: ['pending','accepted','cancelled'], default: 'pending' },
  accepted_by_tutor_id: { type: String, ref: 'Profiles' },
  jitsi_meeting_url: { type: String }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'instant_requests'
      }
    );
    export default mongoose.models.InstantRequests || mongoose.model('InstantRequests', schema);
