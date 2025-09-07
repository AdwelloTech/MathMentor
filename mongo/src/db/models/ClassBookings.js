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
  class_id: { type: String, ref: 'TutorClasses', required: true },
  student_id: { type: String, ref: 'Profiles', required: true },
  booking_status: { type: String, enum: ['pending','confirmed','cancelled','completed','no_show'], default: 'pending' },
  payment_status: { type: String, enum: ['pending','paid','refunded','failed'], default: 'pending' },
  payment_amount: { type: Number, default: 0 },
  stripe_payment_intent_id: { type: String },
  notes: { type: String }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'class_bookings'
      }
    );
    export default mongoose.models.ClassBookings || mongoose.model('ClassBookings', schema);
