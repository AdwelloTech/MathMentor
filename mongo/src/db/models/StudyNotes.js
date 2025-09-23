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
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String, required: true },
  subject_id: { type: String, ref: 'NoteSubjects' },
  grade_level_id: { type: String, ref: 'GradeLevels' },
  created_by: { type: String, ref: 'users' },
  is_public: { type: Boolean, default: true },
  tags: [{ type: String }],
  view_count: { type: Number, default: 0, min: 0 }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'study_notes'
      }
    );
    export default mongoose.models.StudyNotes || mongoose.model('StudyNotes', schema);
