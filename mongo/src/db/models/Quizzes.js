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
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  grade_level: { type: String },
  time_limit_minutes: { type: Number, default: 60, min: 1 },
  total_questions: { type: Number, default: 4, min: 0 },
  total_points: { type: Number, default: 40, min: 0 },
  is_active: { type: Boolean, default: true }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'quizzes'
      }
    );
    export default mongoose.models.Quizzes || mongoose.model('Quizzes', schema);
