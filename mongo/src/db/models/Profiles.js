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
  user_id: { type: String, unique: true, ref: 'users' },
  email: { type: String, required: true, lowercase: true, trim: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  full_name: { type: String, required: true },
  role: { type: String, default: 'student' },
  avatar_url: { type: String },
  phone: { type: String },
  address: { type: String },
  date_of_birth: { type: Date },
  gender: { type: String },
  emergency_contact: { type: String },
  student_id: { type: String },
  package: { type: String, default: 'free' },
  class_id: { type: String },
  employee_id: { type: String },
  department: { type: String },
  subjects: [{ type: String }],
  qualification: { type: String },
  experience_years: { type: Number, min: 0 },
  children_ids: [{ type: String }],
  relationship: { type: String },
  hire_date: { type: Date },
  salary: { type: Number, min: 0 },
  position: { type: String },
  is_active: { type: Boolean, default: true },
  last_login: { type: Date },
  subscription_status: { type: String, default: 'free' },
  subscription_start_date: { type: Date },
  subscription_end_date: { type: Date },
  stripe_customer_id: { type: String },
  stripe_subscription_id: { type: String },
  cv_url: { type: String },
  cv_file_name: { type: String },
  specializations: [{ type: String }],
  hourly_rate: { type: Number, min: 0 },
  availability: { type: String },
  bio: { type: String },
  certifications: [{ type: String }],
  languages: [{ type: String }],
  profile_completed: { type: Boolean, default: false },
  age: { type: Number, min: 0, max: 150 },
  current_grade: { 
    type: String, 
    enum: ['kindergarten','grade-1','grade-2','grade-3','grade-4','grade-5','grade-6','grade-7','grade-8','grade-9','grade-10','grade-11','grade-12','college-freshman','college-sophomore','college-junior','college-senior','graduate','postgraduate'],
    required: false
  },
  has_learning_disabilities: { type: Boolean, default: false },
  learning_needs_description: { type: String },
  grade_level_id: { type: String, ref: 'GradeLevels' },
  profile_image_id: { type: String, ref: 'ProfileImages' },
  profile_image_url: { type: String },
  admin_permissions: [{ type: String }],
  admin_role: { type: String, default: 'admin' },
  admin_department: { type: String },
  admin_access_level: { type: Number, default: 1 },
  admin_last_activity: { type: Date },
  parent_name: { type: String },
  parent_phone: { type: String },
  parent_email: { type: String },
  city: { type: String },
  postcode: { type: String },
  school_name: { type: String },
  academic_set: { type: String, enum: ['Set 1','Set 2','Set 3','Set 4 (Foundation)'] },
  is_online: { type: Boolean, default: false },
  tutorial_completed: { type: Boolean, default: false },
  tutorial_dismissed_count: { type: Number, default: 0, min: 0 },
  tutorial_last_shown: { type: Date }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'profiles'
      }
    );
    export default mongoose.models.Profiles || mongoose.model('Profiles', schema);
