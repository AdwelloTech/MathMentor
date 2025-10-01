import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'message'
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'class_reminder'
  | 'grade_posted'
  | 'assignment_due'
  | 'system_announcement'
  | 'friend_request'
  | 'quiz_result'
  | 'achievement_unlocked';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId; // Who triggered the notification
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>; // Additional context data
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: Date;
  isActionRequired: boolean;
  actionUrl?: string; // URL to redirect for action
  actionText?: string; // Text for action button
  expiresAt?: Date; // When notification expires
  channels: ('in_app' | 'email' | 'push')[]; // Delivery channels
  deliveredAt?: {
    in_app?: Date;
    email?: Date;
    push?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Notification schema
const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      required: true,
      enum: [
        'message',
        'booking_request',
        'booking_confirmed',
        'booking_cancelled',
        'class_reminder',
        'grade_posted',
        'assignment_due',
        'system_announcement',
        'friend_request',
        'quiz_result',
        'achievement_unlocked'
      ]
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    data: {
      type: Schema.Types.Mixed
    },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    isActionRequired: {
      type: Boolean,
      default: false
    },
    actionUrl: {
      type: String,
      trim: true
    },
    actionText: {
      type: String,
      trim: true,
      maxlength: 50
    },
    expiresAt: {
      type: Date
    },
    channels: [{
      type: String,
      enum: ['in_app', 'email', 'push'],
      default: ['in_app']
    }],
    deliveredAt: {
      in_app: Date,
      email: Date,
      push: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ senderId: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-expiry
notificationSchema.index({ createdAt: -1 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now.getTime() - this.createdAt.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
});

// Pre-save middleware to set delivered timestamp
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function(): Promise<boolean> {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
    return true;
  }
  return false;
};

// Instance method to mark as delivered via channel
notificationSchema.methods.markDelivered = async function(channel: 'in_app' | 'email' | 'push'): Promise<void> {
  if (!this.deliveredAt) {
    this.deliveredAt = {};
  }
  this.deliveredAt[channel] = new Date();
  await this.save();
};

// Instance method to check if delivered via channel
notificationSchema.methods.isDelivered = function(channel: 'in_app' | 'email' | 'push'): boolean {
  return !!(this.deliveredAt && this.deliveredAt[channel]);
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data: {
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  isActionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: Date;
  channels?: ('in_app' | 'email' | 'push')[];
}): Promise<INotification> {
  const notification = new this({
    ...data,
    priority: data.priority || 'medium',
    isActionRequired: data.isActionRequired || false,
    channels: data.channels || ['in_app']
  });

  // Mark as delivered to in_app immediately
  notification.deliveredAt = { in_app: new Date() };

  return await notification.save();
};

// Static method to get user's notifications
notificationSchema.statics.getUserNotifications = function(
  userId: mongoose.Types.ObjectId,
  filters: {
    isRead?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
    limit?: number;
    skip?: number;
  } = {}
) {
  const query: any = { recipientId: userId };

  if (filters.isRead !== undefined) {
    query.isRead = filters.isRead;
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  // Don't return expired notifications
  query.$or = [
    { expiresAt: { $exists: false } },
    { expiresAt: { $gt: new Date() } }
  ];

  const limit = filters.limit || 50;
  const skip = filters.skip || 0;

  return this.find(query)
    .populate('senderId', 'firstName lastName fullName avatarUrl')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId: mongoose.Types.ObjectId): Promise<number> {
  return this.countDocuments({
    recipientId: userId,
    isRead: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function(userId: mongoose.Types.ObjectId): Promise<number> {
  const result = await this.updateMany(
    {
      recipientId: userId,
      isRead: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );

  return result.modifiedCount;
};

// Static method to bulk create notifications
notificationSchema.statics.bulkCreate = async function(
  notifications: Array<{
    recipientId: mongoose.Types.ObjectId;
    senderId?: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: NotificationPriority;
    isActionRequired?: boolean;
    actionUrl?: string;
    actionText?: string;
    expiresAt?: Date;
    channels?: ('in_app' | 'email' | 'push')[];
  }>
): Promise<INotification[]> {
  const notificationDocs = notifications.map(data => ({
    ...data,
    priority: data.priority || 'medium',
    isActionRequired: data.isActionRequired || false,
    channels: data.channels || ['in_app'],
    deliveredAt: { in_app: new Date() },
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  return await this.insertMany(notificationDocs);
};

// Static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = async function(): Promise<number> {
  const result = await this.deleteMany({
    expiresAt: { $lte: new Date() }
  });

  return result.deletedCount;
};

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
