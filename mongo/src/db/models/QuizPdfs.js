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
  file_name: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number, required: true, min: 0 },
  grade_level_id: { type: String, ref: 'GradeLevels' },
  subject_id: { type: String, ref: 'Subjects' },
  uploaded_by: { type: String, ref: 'Profiles' },
  is_active: { type: Boolean, default: true }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'quiz_pdfs'
      }
    );
    export default mongoose.models.QuizPdfs || mongoose.model('QuizPdfs', schema);
