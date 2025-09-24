import mongoose, { Document, Schema } from 'mongoose';

export type MessageType = 'direct' | 'group' | 'announcement' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  recipientId?: mongoose.Types.ObjectId; // For direct messages
  conversationId: mongoose.Types.ObjectId; // References Conversation
  messageType: MessageType;
  content: string;
  attachments?: string[]; // File URLs or references
  status: MessageStatus;
  readBy: mongoose.Types.ObjectId[]; // Users who have read the message
  edited: boolean;
  editedAt?: Date;
  replyTo?: mongoose.Types.ObjectId; // Reference to message being replied to
  forwardedFrom?: mongoose.Types.ObjectId; // Reference to original message if forwarded
  metadata?: Record<string, any>; // Additional data like mentions, links, etc.
  createdAt: Date;
  updatedAt: Date;
}

// Message schema
const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    messageType: {
      type: String,
      required: true,
      enum: ['direct', 'group', 'announcement', 'system'],
      default: 'direct'
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000
    },
    attachments: [{ type: String }],
    status: {
      type: String,
      required: true,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    readBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    forwardedFrom: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, createdAt: -1 });
messageSchema.index({ messageType: 1, createdAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ 'readBy': 1 });

// Virtual for checking if message is read by a specific user
messageSchema.virtual('isReadBy').get(function(userId: mongoose.Types.ObjectId) {
  return this.readBy.some(id => id.equals(userId));
});

// Instance method to mark as read by a user
messageSchema.methods.markAsReadBy = async function(userId: mongoose.Types.ObjectId): Promise<boolean> {
  if (!this.readBy.some((id: mongoose.Types.ObjectId) => id.equals(userId))) {
    this.readBy.push(userId);
    this.status = 'read';
    await this.save();
    return true;
  }
  return false;
};

// Instance method to edit message
messageSchema.methods.edit = async function(newContent: string): Promise<boolean> {
  this.content = newContent;
  this.edited = true;
  this.editedAt = new Date();
  await this.save();
  return true;
};

// Static method to get conversation messages
messageSchema.statics.getConversationMessages = function(
  conversationId: mongoose.Types.ObjectId,
  limit: number = 50,
  skip: number = 0,
  beforeDate?: Date
) {
  const query: any = { conversationId };

  if (beforeDate) {
    query.createdAt = { $lt: beforeDate };
  }

  return this.find(query)
    .populate('senderId', 'firstName lastName fullName avatarUrl')
    .populate('recipientId', 'firstName lastName fullName avatarUrl')
    .populate('replyTo', 'content senderId createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get unread messages for a user
messageSchema.statics.getUnreadForUser = function(userId: mongoose.Types.ObjectId) {
  return this.find({
    $or: [
      { senderId: userId },
      { recipientId: userId },
      // For group messages, we'd need to check conversation participants
    ],
    readBy: { $ne: userId }
  })
  .populate('senderId', 'firstName lastName fullName avatarUrl')
  .populate('conversationId', 'title participants')
  .sort({ createdAt: -1 });
};

// Static method to mark messages as read in bulk
messageSchema.statics.markAsReadBulk = async function(
  messageIds: mongoose.Types.ObjectId[],
  userId: mongoose.Types.ObjectId
): Promise<number> {
  const result = await this.updateMany(
    {
      _id: { $in: messageIds },
      readBy: { $ne: userId }
    },
    {
      $push: { readBy: userId },
      $set: { status: 'read' }
    }
  );

  return result.modifiedCount;
};

export const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
