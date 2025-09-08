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
  admin_id: { type: String, ref: 'Profiles' },
  notification_type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  action_url: { type: String },
  metadata: { type: Schema.Types.Mixed },
  read_at: { type: Date }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'admin_notifications'
      }
    );
    export default mongoose.models.AdminNotifications || mongoose.model('AdminNotifications', schema);
