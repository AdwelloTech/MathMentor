import apiClient from "./apiClient";

// Types for messaging
export interface Conversation {
  id: string;
  title?: string;
  type: 'direct' | 'group' | 'announcement';
  participants: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType?: 'direct' | 'group' | 'announcement' | 'system';
  attachments?: string[];
  replyTo?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId?: string;
  type: 'message' | 'booking_request' | 'booking_confirmed' | 'booking_cancelled' | 'class_reminder' | 'grade_posted' | 'assignment_due' | 'system_announcement' | 'friend_request' | 'quiz_result' | 'achievement_unlocked';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  isActionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: string;
  channels?: ('in_app' | 'email' | 'push')[];
  isRead: boolean;
  createdAt: string;
}

export interface CreateConversationData {
  participants: string[];
  title?: string;
  description?: string;
  type: 'direct' | 'group' | 'announcement';
}

export interface SendMessageData {
  recipientId?: string;
  conversationId?: string;
  content: string;
  messageType?: 'direct' | 'group' | 'announcement' | 'system';
  attachments?: string[];
  replyTo?: string;
  metadata?: Record<string, any>;
}

export interface CreateNotificationData {
  recipientId: string;
  senderId?: string;
  type: 'message' | 'booking_request' | 'booking_confirmed' | 'booking_cancelled' | 'class_reminder' | 'grade_posted' | 'assignment_due' | 'system_announcement' | 'friend_request' | 'quiz_result' | 'achievement_unlocked';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  isActionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: string;
  channels?: ('in_app' | 'email' | 'push')[];
}

export const messagingService = {
  // Conversation operations
  conversations: {
    async getAll(): Promise<Conversation[]> {
      const conversations = await apiClient.get<Conversation[]>('/api/messaging/conversations');
      return conversations;
    },

    async create(data: CreateConversationData): Promise<Conversation> {
      const conversation = await apiClient.post<Conversation>('/api/messaging/conversations', data);
      return conversation;
    },

    async getById(conversationId: string): Promise<any> {
      const stats = await apiClient.get(`/api/messaging/conversations/${conversationId}`);
      return stats;
    },

    async addParticipant(conversationId: string, participantId: string): Promise<Conversation> {
      const conversation = await apiClient.post<Conversation>(
        `/api/messaging/conversations/${conversationId}/participants`,
        { participantId }
      );
      return conversation;
    },

    async removeParticipant(conversationId: string, participantId: string): Promise<Conversation> {
      const conversation = await apiClient.delete<Conversation>(
        `/api/messaging/conversations/${conversationId}/participants/${participantId}`
      );
      return conversation;
    },
  },

  // Message operations
  messages: {
    async getByConversationId(
      conversationId: string,
      limit: number = 50,
      beforeDate?: string
    ): Promise<{ messages: Message[]; hasMore: boolean }> {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(beforeDate && { before: beforeDate })
      });

      const result = await apiClient.get<{
        messages: Message[];
        pagination: { hasMore: boolean }
      }>(`/api/messaging/conversations/${conversationId}/messages?${params}`);

      return {
        messages: result.messages,
        hasMore: result.pagination.hasMore
      };
    },

    async send(data: SendMessageData): Promise<Message> {
      const message = await apiClient.post<Message>('/api/messaging/messages', data);
      return message;
    },

    async edit(messageId: string, content: string): Promise<Message> {
      const message = await apiClient.put<Message>(`/api/messaging/messages/${messageId}`, { content });
      return message;
    },

    async delete(messageId: string): Promise<void> {
      await apiClient.delete(`/api/messaging/messages/${messageId}`);
    },

    async markAsRead(conversationId: string, messageIds?: string[]): Promise<{ modifiedCount: number }> {
      const result = await apiClient.post<{ modifiedCount: number }>(
        `/api/messaging/conversations/${conversationId}/read`,
        { messageIds }
      );
      return result;
    },

    async search(conversationId: string, searchTerm: string, limit: number = 20): Promise<Message[]> {
      const params = new URLSearchParams({
        q: searchTerm,
        limit: limit.toString()
      });

      const messages = await apiClient.get<Message[]>(
        `/api/messaging/conversations/${conversationId}/search?${params}`
      );
      return messages;
    },
  },

  // Notification operations
  notifications: {
    async getAll(options?: {
      isRead?: boolean;
      type?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      limit?: number;
      skip?: number;
    }): Promise<{ notifications: Notification[]; meta: { unreadCount: number } }> {
      const params = new URLSearchParams();
      if (options?.isRead !== undefined) params.append('isRead', options.isRead.toString());
      if (options?.type) params.append('type', options.type);
      if (options?.priority) params.append('priority', options.priority);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.skip) params.append('skip', options.skip.toString());

      const result = await apiClient.get<{
        notifications: Notification[];
        meta: { unreadCount: number };
      }>(`/api/messaging/notifications${params.toString() ? `?${params}` : ''}`);

      return result;
    },

    async create(data: CreateNotificationData): Promise<Notification> {
      const notification = await apiClient.post<Notification>('/api/messaging/notifications', data);
      return notification;
    },

    async markAsRead(notificationId: string): Promise<{ success: boolean }> {
      const result = await apiClient.post<{ success: boolean }>(
        `/api/messaging/notifications/${notificationId}/read`
      );
      return result;
    },

    async markAllAsRead(): Promise<{ modifiedCount: number }> {
      const result = await apiClient.post<{ modifiedCount: number }>(
        '/api/messaging/notifications/mark-all-read'
      );
      return result;
    },
  },

  // Utility operations
  async getUnreadCounts(): Promise<{
    messages: number;
    notifications: number;
    total: number;
  }> {
    const counts = await apiClient.get<{
      messages: number;
      notifications: number;
      total: number;
    }>('/api/messaging/unread-counts');

    return counts;
  },
};
