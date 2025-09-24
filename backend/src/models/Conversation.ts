import mongoose, { Document, Schema } from 'mongoose';

export type ConversationType = 'direct' | 'group' | 'announcement';

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  title?: string; // For group chats
  description?: string; // For group chats
  type: ConversationType;
  participants: mongoose.Types.ObjectId[]; // User IDs
  admins?: mongoose.Types.ObjectId[]; // For group chats
  createdBy: mongoose.Types.ObjectId;
  lastMessage?: {
    messageId: mongoose.Types.ObjectId;
    content: string;
    senderId: mongoose.Types.ObjectId;
    sentAt: Date;
  };
  unreadCounts: Map<string, number>; // userId -> unread count
  isActive: boolean;
  settings: {
    allowInvites: boolean;
    allowFileSharing: boolean;
    allowVoiceMessages: boolean;
    muteNotifications?: mongoose.Types.ObjectId[]; // Users who muted this conversation
  };
  createdAt: Date;
  updatedAt: Date;
}

// Conversation schema
const conversationSchema = new Schema<IConversation>(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300
    },
    type: {
      type: String,
      required: true,
      enum: ['direct', 'group', 'announcement'],
      default: 'direct'
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    admins: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastMessage: {
      messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
      content: { type: String },
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      sentAt: { type: Date }
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: new Map()
    },
    isActive: {
      type: Boolean,
      default: true
    },
    settings: {
      allowInvites: {
        type: Boolean,
        default: true
      },
      allowFileSharing: {
        type: Boolean,
        default: true
      },
      allowVoiceMessages: {
        type: Boolean,
        default: true
      },
      muteNotifications: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }]
    }
  },
  {
    timestamps: true
  }
);

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ type: 1, isActive: 1 });
conversationSchema.index({ createdBy: 1 });
conversationSchema.index({ 'lastMessage.sentAt': -1 });
conversationSchema.index({ createdAt: -1 });

// Compound index for direct message conversations
conversationSchema.index({
  participants: 1,
  type: 1
}, {
  unique: false, // Allow multiple conversations but we'll prevent duplicates in logic
  partialFilterExpression: { type: 'direct' }
});

// Virtual for participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual for checking if user is participant
conversationSchema.virtual('isParticipant').get(function(userId: mongoose.Types.ObjectId) {
  return this.participants.some(id => id.equals(userId));
});

// Instance method to add participant
conversationSchema.methods.addParticipant = async function(
  userId: mongoose.Types.ObjectId,
  addedBy: mongoose.Types.ObjectId
): Promise<boolean> {
  if (!this.participants.some((id: mongoose.Types.ObjectId) => id.equals(userId))) {
    this.participants.push(userId);
    this.unreadCounts.set(userId.toString(), 0);
    await this.save();
    return true;
  }
  return false;
};

// Instance method to remove participant
conversationSchema.methods.removeParticipant = async function(
  userId: mongoose.Types.ObjectId,
  removedBy: mongoose.Types.ObjectId
): Promise<boolean> {
  const index = this.participants.findIndex((id: mongoose.Types.ObjectId) => id.equals(userId));
  if (index !== -1) {
    this.participants.splice(index, 1);
    this.unreadCounts.delete(userId.toString());

    // If no participants left, deactivate conversation
    if (this.participants.length === 0) {
      this.isActive = false;
    }

    await this.save();
    return true;
  }
  return false;
};

// Instance method to update last message
conversationSchema.methods.updateLastMessage = async function(
  messageId: mongoose.Types.ObjectId,
  content: string,
  senderId: mongoose.Types.ObjectId
): Promise<void> {
  this.lastMessage = {
    messageId,
    content: content.substring(0, 100), // Truncate for preview
    senderId,
    sentAt: new Date()
  };

  // Increment unread count for all participants except sender
  this.participants.forEach((participantId: mongoose.Types.ObjectId) => {
    if (!participantId.equals(senderId)) {
      const currentCount = this.unreadCounts.get(participantId.toString()) || 0;
      this.unreadCounts.set(participantId.toString(), currentCount + 1);
    }
  });

  await this.save();
};

// Instance method to mark as read for user
conversationSchema.methods.markAsReadForUser = async function(userId: mongoose.Types.ObjectId): Promise<boolean> {
  if (this.unreadCounts.has(userId.toString())) {
    this.unreadCounts.set(userId.toString(), 0);
    await this.save();
    return true;
  }
  return false;
};

// Instance method to get unread count for user
conversationSchema.methods.getUnreadCountForUser = function(userId: mongoose.Types.ObjectId): number {
  return this.unreadCounts.get(userId.toString()) || 0;
};

// Static method to find or create direct conversation
conversationSchema.statics.findOrCreateDirect = async function(
  userId1: mongoose.Types.ObjectId,
  userId2: mongoose.Types.ObjectId
): Promise<IConversation> {
  // Sort IDs to ensure consistent ordering
  const [user1, user2] = [userId1, userId2].sort((a, b) => a.toString().localeCompare(b.toString()));

  let conversation = await this.findOne({
    type: 'direct',
    participants: { $all: [user1, user2], $size: 2 }
  });

  if (!conversation) {
    conversation = new this({
      type: 'direct',
      participants: [user1, user2],
      createdBy: user1,
      unreadCounts: new Map([
        [user1.toString(), 0],
        [user2.toString(), 0]
      ])
    });
    await conversation.save();
  }

  return conversation;
};

// Static method to get user's conversations
conversationSchema.statics.getUserConversations = function(
  userId: mongoose.Types.ObjectId,
  includeInactive: boolean = false
) {
  const query: any = {
    participants: userId
  };

  if (!includeInactive) {
    query.isActive = true;
  }

  return this.find(query)
    .populate('participants', 'firstName lastName fullName avatarUrl')
    .populate('lastMessage.senderId', 'firstName lastName')
    .sort({ 'lastMessage.sentAt': -1, updatedAt: -1 });
};

// Static method to create group conversation
conversationSchema.statics.createGroup = async function(
  title: string,
  participants: mongoose.Types.ObjectId[],
  createdBy: mongoose.Types.ObjectId,
  description?: string
): Promise<IConversation> {
  const conversation = new this({
    title,
    description,
    type: 'group',
    participants,
    admins: [createdBy],
    createdBy,
    unreadCounts: new Map(
      participants.map(id => [id.toString(), 0])
    )
  });

  return await conversation.save();
};

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
export default Conversation;
