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
  admin_id: { type: String, ref: 'AdminCredentials' },
  session_token: { type: String, required: true, unique: true },
  ip_address: { type: String },
  user_agent: { type: String },
  expires_at: { type: Date, required: true },
  admin_email: { type: String, lowercase: true, trim: true }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'admin_sessions'
      }
    );
    export default mongoose.models.AdminSessions || mongoose.model('AdminSessions', schema);
