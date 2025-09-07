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
  student_id: { type: String, ref: 'Profiles' },
  pdf_id: { type: String, ref: 'QuizPdfs' },
  quiz_id: { type: String, ref: 'Quizzes' },
  generated_at: { type: Date, default: Date.now },
  status: { type: String, enum: ['generated','completed','abandoned'], default: 'generated' },
  metadata: { type: Schema.Types.Mixed, default: {} }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'student_quiz_generations'
      }
    );
    export default mongoose.models.StudentQuizGenerations || mongoose.model('StudentQuizGenerations', schema);
