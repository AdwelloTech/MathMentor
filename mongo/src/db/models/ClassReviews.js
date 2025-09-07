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
  class_id: { type: String, ref: 'TutorClasses', required: true },
  student_id: { type: String, ref: 'Profiles', required: true },
  tutor_id: { type: String, ref: 'Profiles', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review_text: { type: String },
  is_anonymous: { type: Boolean, default: false },
  is_verified: { type: Boolean, default: false }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'class_reviews'
      }
    );
    export default mongoose.models.ClassReviews || mongoose.model('ClassReviews', schema);
