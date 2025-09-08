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
  note_id: { type: String, ref: 'TutorNotes', required: true },
  user_id: { type: String, ref: 'users', required: true },
  viewed_at: { type: Date, default: Date.now }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'tutor_note_views'
      }
    );
    export default mongoose.models.TutorNoteViews || mongoose.model('TutorNoteViews', schema);
