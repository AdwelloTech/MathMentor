import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  otp: string;
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    otp: {
      type: String,
      required: true,
      select: false
    },
    type: {
      type: String,
      required: true,
      enum: ['email_verification', 'password_reset']
    },
    expiresAt: {
      type: Date,
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    },
    attempts: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

otpSchema.index({ email: 1, type: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);
export default OTP;

