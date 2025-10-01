import express from 'express';
import Joi from 'joi';
import { MessagingService } from '../services/messagingService';
import { authenticate } from '../middleware/auth';
import { validateOrThrow } from '../utils/validation';

const router = express.Router();

// Validation schemas
const sendMessageSchema = Joi.object({
  recipientId: Joi.string().optional(),
  conversationId: Joi.string().optional(),
  content: Joi.string().min(1).max(2000).required(),
  messageType: Joi.string().valid('direct', 'group', 'announcement', 'system').optional(),
  attachments: Joi.array().items(Joi.string()).optional(),
  replyTo: Joi.string().optional(),
  metadata: Joi.object().optional(),
}).or('recipientId', 'conversationId'); // Must have either recipientId or conversationId

const createConversationSchema = Joi.object({
  participants: Joi.array().items(Joi.string()).min(2).required(),
  title: Joi.string().max(100).optional(),
  description: Joi.string().max(300).optional(),
  type: Joi.string().valid('direct', 'group', 'announcement').required(),
});

const editMessageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
});

const createNotificationSchema = Joi.object({
  recipientId: Joi.string().required(),
  senderId: Joi.string().optional(),
  type: Joi.string().valid(
    'message', 'booking_request', 'booking_confirmed', 'booking_cancelled',
    'class_reminder', 'grade_posted', 'assignment_due', 'system_announcement',
    'friend_request', 'quiz_result', 'achievement_unlocked'
  ).required(),
  title: Joi.string().max(200).required(),
  message: Joi.string().max(1000).required(),
  data: Joi.object().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  isActionRequired: Joi.boolean().optional(),
  actionUrl: Joi.string().optional(),
  actionText: Joi.string().max(50).optional(),
  expiresAt: Joi.date().optional(),
  channels: Joi.array().items(Joi.string().valid('in_app', 'email', 'push')).optional(),
});

// Conversations routes

// Get user's conversations
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const conversations = await MessagingService.getUserConversations(req.user!.id);

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Create conversation
router.post('/conversations', authenticate, async (req, res) => {
  try {
    const validatedData = validateOrThrow(createConversationSchema, {
      ...req.body,
      createdBy: req.user!.id
    });

    const conversation = await MessagingService.createConversation(validatedData);

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get conversation by ID
router.get('/conversations/:conversationId', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const stats = await MessagingService.getConversationStats(conversationId, req.user!.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 403;
    res.status(statusCode).json({
      success: false,
      error: error.message,
    });
  }
});

// Add participant to group conversation
router.post('/conversations/:conversationId/participants', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        error: 'participantId is required',
      });
    }

    const conversation = await MessagingService.addParticipantToConversation(
      conversationId,
      req.user!.id,
      participantId
    );

    res.json({
      success: true,
      message: 'Participant added successfully',
      data: conversation,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Remove participant from group conversation
router.delete('/conversations/:conversationId/participants/:participantId', authenticate, async (req, res) => {
  try {
    const { conversationId, participantId } = req.params;

    const conversation = await MessagingService.removeParticipantFromConversation(
      conversationId,
      req.user!.id,
      participantId
    );

    res.json({
      success: true,
      message: 'Participant removed successfully',
      data: conversation,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Messages routes

// Get messages for conversation
router.get('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const beforeDate = req.query.before ? new Date(req.query.before as string) : undefined;

    const result = await MessagingService.getConversationMessages(
      conversationId,
      req.user!.id,
      limit,
      beforeDate
    );

    res.json({
      success: true,
      data: result.messages,
      pagination: {
        hasMore: result.hasMore,
        limit,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Send message
router.post('/messages', authenticate, async (req, res) => {
  try {
    const validatedData = validateOrThrow(sendMessageSchema, req.body);

    const message = await MessagingService.sendMessage({
      ...validatedData,
      senderId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Edit message
router.put('/messages/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = validateOrThrow(editMessageSchema, req.body);

    const message = await MessagingService.editMessage(messageId, req.user!.id, content);

    res.json({
      success: true,
      message: 'Message edited successfully',
      data: message,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete message
router.delete('/messages/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;

    await MessagingService.deleteMessage(messageId, req.user!.id);

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Mark messages as read
router.post('/conversations/:conversationId/read', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageIds } = req.body; // Optional array of specific message IDs

    const modifiedCount = await MessagingService.markMessagesAsRead(
      conversationId,
      req.user!.id,
      messageIds
    );

    res.json({
      success: true,
      message: `${modifiedCount} messages marked as read`,
      data: { modifiedCount },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Search messages in conversation
router.get('/conversations/:conversationId/search', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { q: searchTerm } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    if (!searchTerm || typeof searchTerm !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search term (q) is required',
      });
    }

    const messages = await MessagingService.searchMessages(
      conversationId,
      req.user!.id,
      searchTerm,
      limit
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Notifications routes

// Get user's notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const filters = {
      isRead: req.query.isRead ? req.query.isRead === 'true' : undefined,
      type: req.query.type as string,
      priority: req.query.priority as 'low' | 'medium' | 'high' | 'urgent',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
    };

    const result = await MessagingService.getUserNotifications(req.user!.id, filters);

    res.json({
      success: true,
      data: result.notifications,
      meta: {
        unreadCount: result.unreadCount,
      },
      pagination: {
        limit: filters.limit,
        skip: filters.skip,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Create notification (admin/system use)
router.post('/notifications', authenticate, async (req, res) => {
  try {
    const validatedData = validateOrThrow(createNotificationSchema, req.body);

    const notification = await MessagingService.createNotification(validatedData);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Mark notification as read
router.post('/notifications/:notificationId/read', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const success = await MessagingService.markNotificationAsRead(notificationId, req.user!.id);

    res.json({
      success: true,
      message: success ? 'Notification marked as read' : 'Notification was already read',
      data: { success },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Mark all notifications as read
router.post('/notifications/mark-all-read', authenticate, async (req, res) => {
  try {
    const modifiedCount = await MessagingService.markAllNotificationsAsRead(req.user!.id);

    res.json({
      success: true,
      message: `${modifiedCount} notifications marked as read`,
      data: { modifiedCount },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get unread counts
router.get('/unread-counts', authenticate, async (req, res) => {
  try {
    const [messageCount, notificationCount] = await Promise.all([
      MessagingService.getUnreadMessageCount(req.user!.id),
      MessagingService.getUserNotifications(req.user!.id).then(result => result.unreadCount),
    ]);

    res.json({
      success: true,
      data: {
        messages: messageCount,
        notifications: notificationCount,
        total: messageCount + notificationCount,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
