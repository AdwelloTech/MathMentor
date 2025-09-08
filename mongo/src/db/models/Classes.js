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
  name: { type: String, required: true },
  description: { type: String },
  teacher_id: { type: String, ref: 'Profiles' },
  capacity: { type: Number, default: 30, min: 1 },
  schedule: { type: String },
  is_active: { type: Boolean, default: true }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'classes'
      }
    );
    export default mongoose.models.Classes || mongoose.model('Classes', schema);
