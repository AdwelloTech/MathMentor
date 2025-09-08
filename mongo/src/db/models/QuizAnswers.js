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
  question_id: { type: String, ref: 'QuizQuestions', required: true },
  answer_text: { type: String, required: true },
  is_correct: { type: Boolean, default: false },
  answer_order: { type: Number, required: true, min: 0 }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'quiz_answers'
      }
    );
    export default mongoose.models.QuizAnswers || mongoose.model('QuizAnswers', schema);
