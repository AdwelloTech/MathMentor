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
  attempt_id: { type: String, ref: 'QuizAttempts', required: true },
  question_id: { type: String, ref: 'QuizQuestions', required: true },
  selected_answer_id: { type: String, ref: 'QuizAnswers' },
  answer_text: { type: String },
  is_correct: { type: Boolean },
  points_earned: { type: Number, default: 0, min: 0 }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'student_answers'
      }
    );
    export default mongoose.models.StudentAnswers || mongoose.model('StudentAnswers', schema);
