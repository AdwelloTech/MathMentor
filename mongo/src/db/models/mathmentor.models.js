import { v4 as uuidv4 } from 'uuid';

// mathmentor.models.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const { Decimal128, Mixed } = Schema.Types;
const uuid = { type: String };
const money = { type: Decimal128 };
const jsonb = Mixed;
const GradeLevelSchema = new Schema({
  _id: uuid,
  code: { type: String, required: true, unique: true, index: true },
  display_name: { type: String, required: true },
  sort_order: { type: Number, required: true },
  category: { type: String, enum: ['preschool','elementary','middle','high','college','graduate'], default: 'school' },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'grade_levels' });
const ProfileSchema = new Schema({
  _id: uuid,
  user_id: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, index: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  full_name: { type: String, required: true },
  role: { type: String, default: 'student' },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'profiles' });


    const schema = new Schema(
      {
  _id: { type: String, default: () => uuidv4() },
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String, required: true },
  subject_id: { type: String, ref: 'NoteSubjects' },
  grade_level_id: { type: String, ref: 'GradeLevels' },
  created_by: { type: String, ref: 'users' },
  is_public: { type: Boolean, default: true },
  tags: [{ type: String }],
  view_count: { type: Number, default: 0, min: 0 }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'study_notes'
      }
    );





















export const GradeLevel = model('GradeLevel', GradeLevelSchema);
export const Profile = model('Profile', ProfileSchema);
export const StudyNote = model('StudyNote', schema);