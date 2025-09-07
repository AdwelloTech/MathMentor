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
  quiz_id: { type: String, ref: 'Quizzes', required: true },
  student_id: { type: String, ref: 'Profiles', required: true },
  started_at: { type: Date, default: Date.now },
  completed_at: { type: Date },
  score: { type: Number, min: 0 },
  max_score: { type: Number, min: 0 },
  status: { type: String, default: 'in_progress' },
  created_at: { type: Date, default: Date.now },
  correct_answers: { type: Number, default: 0, min: 0 },
  total_questions: { type: Number, default: 0, min: 0 },
  tutor_feedback: { type: String }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'quiz_attempts'
      }
    );
    export default mongoose.models.QuizAttempts || mongoose.model('QuizAttempts', schema);
