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
  tutor_id: { type: String, ref: 'Profiles', required: true },
  date: { type: Date, required: true },
  start_time: { type: String, required: true }, // "HH:mm:ss"
  end_time: { type: String, required: true },   // "HH:mm:ss"
  is_available: { type: Boolean, default: true },
  reason: { type: String }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'tutor_availability'
      }
    );
    export default mongoose.models.TutorAvailability || mongoose.model('TutorAvailability', schema);
