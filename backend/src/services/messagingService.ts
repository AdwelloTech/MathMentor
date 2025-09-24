import mongoose from 'mongoose';
import { Message, IMessage } from '../models/Message';
import { Conversation, IConversation } from '../models/Conversation';
import { Notification, INotification } from '../models/Notification';
import { User } from '../models/User';

export interface SendMessageData {
  senderId: string;
  recipientId?: string;
  conversationId?: string;
  content: string;
  messageType?: 'direct' | 'group' | 'announcement' | 'system';
  attachments?: string[];
  replyTo?: string;
  metadata?: Record<string, any>;
}

export interface CreateConversationData {
  participants: string[];
  title?: string;
  description?: string;
  type: 'direct' | 'group' | 'announcement';
  createdBy: string;
}

export interface CreateNotificationData {
  recipientId: string;
  senderId?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  isActionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: Date;
  channels?: ('in_app' | 'email' | 'push')[];
}

export class MessagingService {
  // Send a message
  static async sendMessage(data: SendMessageData): Promise<IMessage> {
    const {
      senderId,
      recipientId,
      conversationId: providedConversationId,
      content,
      messageType = 'direct',
      attachments,
      replyTo,
      metadata
    } = data;

    let conversation: IConversation;

    // Find or create conversation
    if (providedConversationId) {
      const foundConversation = await Conversation.findById(providedConversationId);
      if (!foundConversation) {
        throw new Error('Conversation not found');
      }
      conversation = foundConversation;
    } else if (recipientId) {
      // Find or create direct conversation
      conversation = await (Conversation as any).findOrCreateDirect(
        new mongoose.Types.ObjectId(senderId),
        new mongoose.Types.ObjectId(recipientId)
      );
    } else {
      throw new Error('Either conversationId or recipientId must be provided');
    }

    // Verify sender is participant
    if (!conversation.participants.some(id => id.equals(senderId))) {
      throw new Error('Sender is not a participant in this conversation');
    }

    // Create message
    const message = new Message({
      senderId: new mongoose.Types.ObjectId(senderId),
      recipientId: recipientId ? new mongoose.Types.ObjectId(recipientId) : undefined,
      conversationId: conversation._id,
      messageType,
      content,
      attachments,
      replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : undefined,
      metadata,
      readBy: [new mongoose.Types.ObjectId(senderId)], // Sender automatically reads their own message
    });

    const savedMessage = await message.save();

    // Update conversation's last message
    await (conversation as any).updateLastMessage(
      savedMessage._id,
      content,
      new mongoose.Types.ObjectId(senderId)
    );

    // Create notifications for other participants (except sender)
    const otherParticipants = conversation.participants.filter(
      id => !id.equals(senderId)
    );

    if (otherParticipants.length > 0) {
      const notifications = otherParticipants.map(participantId => ({
        recipientId: participantId,
        senderId: new mongoose.Types.ObjectId(senderId),
        type: 'message' as const,
        title: 'New Message',
        message: content.length > 100 ? content.substring(0, 100) + '...' : content,
        data: {
          conversationId: conversation._id,
          messageId: savedMessage._id,
          conversationType: conversation.type
        },
        priority: 'medium' as const,
        channels: ['in_app'] as ('in_app' | 'email' | 'push')[]
      }));

      await (Notification as any).bulkCreate(notifications);
    }

    return savedMessage;
  }

  // Create a new conversation
  static async createConversation(data: CreateConversationData): Promise<IConversation> {
    const { participants, title, description, type, createdBy } = data;

    if (type === 'direct' && participants.length !== 2) {
      throw new Error('Direct conversations must have exactly 2 participants');
    }

    if (type === 'direct') {
      // Check if direct conversation already exists
      const existing = await (Conversation as any).findOrCreateDirect(
        new mongoose.Types.ObjectId(participants[0]),
        new mongoose.Types.ObjectId(participants[1])
      );
      return existing;
    }

    // Create group conversation
    const participantIds = participants.map(id => new mongoose.Types.ObjectId(id));
    const conversation = await (Conversation as any).createGroup(
      title || 'Group Chat',
      participantIds,
      new mongoose.Types.ObjectId(createdBy),
      description
    );

    // Create system message for group creation
    await this.sendMessage({
      senderId: createdBy,
      conversationId: conversation._id.toString(),
      content: `Group "${conversation.title}" was created`,
      messageType: 'system'
    });

    return conversation;
  }

  // Get user's conversations
  static async getUserConversations(userId: string): Promise<IConversation[]> {
    return await (Conversation as any).getUserConversations(new mongoose.Types.ObjectId(userId));
  }

  // Get conversation messages
  static async getConversationMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    beforeDate?: Date
  ): Promise<{
    messages: IMessage[];
    hasMore: boolean;
  }> {
    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (!conversation.participants.some(id => id.equals(userId))) {
      throw new Error('User is not a participant in this conversation');
    }

    const messages = await (Message as any).getConversationMessages(
      new mongoose.Types.ObjectId(conversationId),
      limit + 1, // Get one extra to check if there are more
      0,
      beforeDate
    );

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: resultMessages,
      hasMore
    };
  }

  // Mark messages as read
  static async markMessagesAsRead(
    conversationId: string,
    userId: string,
    messageIds?: string[]
  ): Promise<number> {
    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (!conversation.participants.some(id => id.equals(userId))) {
      throw new Error('User is not a participant in this conversation');
    }

    let modifiedCount: number;

    if (messageIds && messageIds.length > 0) {
      // Mark specific messages as read
      modifiedCount = await (Message as any).markAsReadBulk(
        messageIds.map(id => new mongoose.Types.ObjectId(id)),
        new mongoose.Types.ObjectId(userId)
      );
    } else {
      // Mark all unread messages in conversation as read
      const unreadMessages = await Message.find({
        conversationId: new mongoose.Types.ObjectId(conversationId),
        readBy: { $ne: new mongoose.Types.ObjectId(userId) }
      });

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg._id);
        modifiedCount = await (Message as any).markAsReadBulk(
          messageIds,
          new mongoose.Types.ObjectId(userId)
        );
      } else {
        modifiedCount = 0;
      }
    }

    // Update conversation unread count
    await (conversation as any).markAsReadForUser(new mongoose.Types.ObjectId(userId));

    return modifiedCount;
  }

  // Edit a message
  static async editMessage(
    messageId: string,
    userId: string,
    newContent: string
  ): Promise<IMessage> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    if (!message.senderId.equals(userId)) {
      throw new Error('Only the sender can edit messages');
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      throw new Error('Messages can only be edited within 15 minutes of sending');
    }

    await (message as any).edit(newContent);
    return message;
  }

  // Delete a message (soft delete by clearing content)
  static async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    if (!message.senderId.equals(userId)) {
      throw new Error('Only the sender can delete messages');
    }

    // Instead of hard delete, mark as deleted
    await (message as any).edit('[This message was deleted]');
    return true;
  }

  // Add participant to group conversation
  static async addParticipantToConversation(
    conversationId: string,
    userId: string,
    newParticipantId: string
  ): Promise<IConversation> {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if user has permission to add participants
    if (conversation.type === 'group') {
      const isAdmin = conversation.admins?.some(id => id.equals(userId));
      const isCreator = conversation.createdBy.equals(userId);

      if (!isAdmin && !isCreator) {
        throw new Error('Only admins can add participants to group conversations');
      }
    } else {
      throw new Error('Cannot add participants to direct conversations');
    }

    await (conversation as any).addParticipant(
      new mongoose.Types.ObjectId(newParticipantId),
      new mongoose.Types.ObjectId(userId)
    );

    // Send system message
    const newUser = await User.findById(newParticipantId);
    await this.sendMessage({
      senderId: userId,
      conversationId: conversationId,
      content: `${newUser?.fullName || 'A user'} was added to the group`,
      messageType: 'system'
    });

    return conversation;
  }

  // Remove participant from group conversation
  static async removeParticipantFromConversation(
    conversationId: string,
    userId: string,
    participantId: string
  ): Promise<IConversation> {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check permissions
    const isAdmin = conversation.admins?.some(id => id.equals(userId));
    const isCreator = conversation.createdBy.equals(userId);
    const isSelfRemoval = userId === participantId;

    if (!isAdmin && !isCreator && !isSelfRemoval) {
      throw new Error('Insufficient permissions to remove participant');
    }

    await (conversation as any).removeParticipant(
      new mongoose.Types.ObjectId(participantId),
      new mongoose.Types.ObjectId(userId)
    );

    // Send system message
    const removedUser = await User.findById(participantId);
    await this.sendMessage({
      senderId: userId,
      conversationId: conversationId,
      content: `${removedUser?.fullName || 'A user'} left the group`,
      messageType: 'system'
    });

    return conversation;
  }

  // Create notification
  static async createNotification(data: CreateNotificationData): Promise<INotification> {
    return await (Notification as any).createNotification(data);
  }

  // Get user's notifications
  static async getUserNotifications(
    userId: string,
    filters: {
      isRead?: boolean;
      type?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{
    notifications: INotification[];
    unreadCount: number;
  }> {
    const notifications = await (Notification as any).getUserNotifications(
      new mongoose.Types.ObjectId(userId),
      filters
    );

    const unreadCount = await (Notification as any).getUnreadCount(new mongoose.Types.ObjectId(userId));

    return {
      notifications,
      unreadCount
    };
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: new mongoose.Types.ObjectId(userId)
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return await (notification as any).markAsRead();
  }

  // Mark all notifications as read
  static async markAllNotificationsAsRead(userId: string): Promise<number> {
    return await (Notification as any).markAllAsRead(new mongoose.Types.ObjectId(userId));
  }

  // Get unread message count for user
  static async getUnreadMessageCount(userId: string): Promise<number> {
    const conversations = await (Conversation as any).getUserConversations(new mongoose.Types.ObjectId(userId));

    let totalUnread = 0;
    for (const conversation of conversations) {
      totalUnread += (conversation as any).getUnreadCountForUser(new mongoose.Types.ObjectId(userId));
    }

    return totalUnread;
  }

  // Search messages in conversation
  static async searchMessages(
    conversationId: string,
    userId: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<IMessage[]> {
    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (!conversation.participants.some(id => id.equals(userId))) {
      throw new Error('User is not a participant in this conversation');
    }

    // Use MongoDB text search or regex search
    const messages = await Message.find({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      content: { $regex: searchTerm, $options: 'i' }
    })
    .populate('senderId', 'firstName lastName fullName avatarUrl')
    .sort({ createdAt: -1 })
    .limit(limit);

    return messages;
  }

  // Get conversation statistics
  static async getConversationStats(conversationId: string, userId: string): Promise<{
    conversation: IConversation;
    messageCount: number;
    participantCount: number;
    unreadCount: number;
    lastActivity: Date;
  }> {
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'firstName lastName fullName avatarUrl');

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (!conversation.participants.some(id => id.equals(userId))) {
      throw new Error('User is not a participant in this conversation');
    }

    const messageCount = await Message.countDocuments({
      conversationId: conversation._id
    });

    const unreadCount = (conversation as any).getUnreadCountForUser(new mongoose.Types.ObjectId(userId));

    return {
      conversation,
      messageCount,
      participantCount: conversation.participants.length,
      unreadCount,
      lastActivity: conversation.lastMessage?.sentAt || conversation.createdAt
    };
  }
}
