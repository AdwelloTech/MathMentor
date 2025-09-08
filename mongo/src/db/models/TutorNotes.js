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
  content: { type: String },
  file_url: { type: String },
  file_name: { type: String },
  file_size: { type: Number, min: 0 },
  subject_id: { type: String, ref: 'NoteSubjects' },
  grade_level_id: { type: String, ref: 'GradeLevels' },
  created_by: { type: String, ref: 'Profiles' },
  is_premium: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  view_count: { type: Number, default: 0, min: 0 },
  download_count: { type: Number, default: 0, min: 0 },
  tags: [{ type: String }]
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'tutor_notes'
      }
    );
    export default mongoose.models.TutorNotes || mongoose.model('TutorNotes', schema);
