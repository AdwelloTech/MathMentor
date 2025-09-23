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
  question_text: { type: String, required: true },
  question_type: { type: String, default: 'multiple_choice' },
  points: { type: Number, default: 10, min: 0 },
  question_order: { type: Number, required: true, min: 0 },
  created_at: { type: Date, default: Date.now },
  is_ai_generated: { type: Boolean, default: false },
  ai_status: { type: String, enum: ['pending','approved','discarded'] },
  ai_metadata: { type: Schema.Types.Mixed }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'quiz_questions'
      }
    );
    export default mongoose.models.QuizQuestions || mongoose.model('QuizQuestions', schema);
