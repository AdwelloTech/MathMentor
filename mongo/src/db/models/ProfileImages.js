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
  user_id: { type: String, ref: 'users', required: true },
  profile_id: { type: String, ref: 'Profiles', required: true },
  file_name: { type: String, required: true },
  original_name: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number, required: true, min: 0 },
  mime_type: { type: String, required: true },
  width: { type: Number, min: 0 },
  height: { type: Number, min: 0 },
  is_active: { type: Boolean, default: true },
  uploaded_at: { type: Date, default: Date.now }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'profile_images'
      }
    );
    export default mongoose.models.ProfileImages || mongoose.model('ProfileImages', schema);
