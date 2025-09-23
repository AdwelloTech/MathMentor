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
  student_id: { type: String, ref: 'users', required: true },
  enrollment_status: { type: String, enum: ['enrolled','attended','no_show','cancelled'], default: 'enrolled' },
  payment_status: { type: String, enum: ['pending','paid','refunded'], default: 'pending' }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'class_enrollments'
      }
    );
    export default mongoose.models.ClassEnrollments || mongoose.model('ClassEnrollments', schema);
