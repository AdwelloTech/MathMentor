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
  user_id: { type: String, ref: 'users' },
  profile_id: { type: String, ref: 'Profiles' },
  stripe_customer_id: { type: String, required: true },
  stripe_subscription_id: { type: String, required: true, unique: true },
  stripe_payment_intent_id: { type: String },
  package_type: { type: String, enum: ['free','silver','gold'], required: true },
  status: { type: String, enum: ['active','cancelled','expired','pending'], default: 'active' },
  current_period_start: { type: Date, required: true },
  current_period_end: { type: Date, required: true },
  cancel_at_period_end: { type: Boolean, default: false },
  amount_paid: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'usd' },
  trial_start: { type: Date },
  trial_end: { type: Date }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'subscriptions'
      }
    );
    export default mongoose.models.Subscriptions || mongoose.model('Subscriptions', schema);
