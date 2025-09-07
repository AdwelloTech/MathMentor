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
  name: { type: String, required: true, unique: true },
  description: { type: String },
  duration_minutes: { type: Number, required: true, min: 1 },
  max_students: { type: Number, min: 1 },
  is_active: { type: Boolean, default: true },
  price_per_session: { type: Number, required: true, min: 0 }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'class_types'
      }
    );
    export default mongoose.models.ClassTypes || mongoose.model('ClassTypes', schema);
