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
  session_id: { type: String, ref: 'TutorClasses', required: true },
  student_id: { type: String, ref: 'Profiles', required: true },
  tutor_id: { type: String, ref: 'Profiles', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review_text: { type: String },
  is_anonymous: { type: Boolean, default: false }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'session_ratings'
      }
    );
    export default mongoose.models.SessionRatings || mongoose.model('SessionRatings', schema);
