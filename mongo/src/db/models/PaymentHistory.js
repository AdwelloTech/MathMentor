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
  subscription_id: { type: String, ref: 'Subscriptions' },
  stripe_payment_intent_id: { type: String, required: true },
  stripe_charge_id: { type: String },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'usd' },
  status: { type: String, enum: ['succeeded','pending','failed','cancelled'], required: true },
  payment_method_type: { type: String },
  description: { type: String },
  receipt_url: { type: String }
}
,
      {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'payment_history'
      }
    );
    export default mongoose.models.PaymentHistory || mongoose.model('PaymentHistory', schema);
