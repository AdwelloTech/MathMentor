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
  report_type: { type: String, required: true },
  report_name: { type: String, required: true },
  generated_by: { type: String, ref: 'Profiles' },
  report_data: { type: Schema.Types.Mixed, required: true },
  report_format: { type: String, enum: ['json', 'csv', 'pdf'], default: 'json' },
  file_url: { type: String },
  expires_at: { type: Date }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'admin_reports'
      }
    );
    export default mongoose.models.AdminReports || mongoose.model('AdminReports', schema);
