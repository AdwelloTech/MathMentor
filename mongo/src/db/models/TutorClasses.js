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
  class_type_id: { type: String, ref: 'ClassTypes', required: true },
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  start_time: { type: String, required: true }, // "HH:mm:ss"
  end_time: { type: String, required: true },   // "HH:mm:ss"
  max_students: { type: Number, min: 1 },
  status: { type: String, enum: ['scheduled','in_progress','completed','cancelled'], default: 'scheduled' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  duration_minutes: { type: Number, required: true, min: 1 },
  price_per_session: { type: Number, required: true, min: 0 },
  current_students: { type: Number, default: 0, min: 0 },
  is_recurring: { type: Boolean, default: false },
  recurring_pattern: { type: String, enum: ['weekly','biweekly','monthly'] },
  recurring_end_date: { type: Date },
  jitsi_room_name: { type: String },
  jitsi_meeting_url: { type: String },
  jitsi_password: { type: String },
  subject_id: { type: String, ref: 'Subjects' }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'tutor_classes'
      }
    );
    export default mongoose.models.TutorClasses || mongoose.model('TutorClasses', schema);
