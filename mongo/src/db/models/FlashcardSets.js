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
  subject: { type: String, required: true },
  topic: { type: String },
  is_active: { type: Boolean, default: true },
  grade_level: { type: String, required: true }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'flashcard_sets'
      }
    );
    export default mongoose.models.FlashcardSets || mongoose.model('FlashcardSets', schema);
