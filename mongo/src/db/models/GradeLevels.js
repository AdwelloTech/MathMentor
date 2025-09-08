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
  code: { type: String, required: true, unique: true },
  display_name: { type: String, required: true },
  sort_order: { type: Number, required: true },
  category: { type: String, enum: ['school','preschool','elementary','middle','high','college','graduate'], default: 'school' },
  is_active: { type: Boolean, default: true }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'grade_levels'
      }
    );
    export default mongoose.models.GradeLevels || mongoose.model('GradeLevels', schema);
