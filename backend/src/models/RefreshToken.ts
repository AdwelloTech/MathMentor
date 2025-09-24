import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  _id: mongoose.Types.ObjectId;
  token: string;
  userId: mongoose.Types.ObjectId;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Refresh token schema
const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: {
      type: String,
      required: true,
      unique: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index - MongoDB will auto-delete expired tokens
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ token: 1, isRevoked: 1 });

// Static method to revoke all tokens for a user
refreshTokenSchema.statics.revokeAllForUser = function(userId: mongoose.Types.ObjectId) {
  return this.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true, updatedAt: new Date() }
  );
};

// Static method to revoke specific token
refreshTokenSchema.statics.revokeToken = function(token: string) {
  return this.findOneAndUpdate(
    { token, isRevoked: false },
    { isRevoked: true, updatedAt: new Date() },
    { new: true }
  );
};

// Static method to clean up expired tokens (though TTL index handles this)
refreshTokenSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true }
    ]
  });
};

// Instance method to check if token is valid
refreshTokenSchema.methods.isValid = function(): boolean {
  return !this.isRevoked && this.expiresAt > new Date();
};

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
export default RefreshToken;
