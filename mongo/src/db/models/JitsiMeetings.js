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
  class_id: { type: String, ref: 'TutorClasses' },
  room_name: { type: String, required: true, unique: true },
  meeting_url: { type: String, required: true },
  password: { type: String },
  topic: { type: String },
  start_time: { type: Date },
  duration_minutes: { type: Number, min: 1 },
  settings: { type: Schema.Types.Mixed, default: {} }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'jitsi_meetings'
      }
    );
    export default mongoose.models.JitsiMeetings || mongoose.model('JitsiMeetings', schema);
