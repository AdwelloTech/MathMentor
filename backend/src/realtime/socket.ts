import http from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { InstantSession } from '../models/InstantSession';
import { Conversation } from '../models/Conversation';
import { MessagingService } from '../services/messagingService';

interface SocketUser {
  id: string;
  email?: string;
  role: string;
}

let io: Server | null = null;

const getAllowedOrigins = () => {
  const origins = [
    'https://mathmentor.co.uk',
    'https://www.mathmentor.co.uk',
    'https://app.mathmentor.co.uk',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];
  return origins.length > 0 ? origins : ['*'];
};

const extractToken = (socket: Socket): string | null => {
  const authToken = socket.handshake.auth?.token as string | undefined;
  if (authToken) return authToken;

  const header = socket.handshake.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.substring(7);
  }

  const queryToken = socket.handshake.query?.token;
  if (typeof queryToken === 'string' && queryToken.length > 0) {
    return queryToken;
  }

  return null;
};

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const decoded = verifyAccessToken(token);
      const user: SocketUser = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      socket.data.user = user;
      socket.join(`user:${user.id}`);
      if (user.role === 'tutor') {
        socket.join('tutors');
      }

      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('conversation:join', async ({ conversationId }: { conversationId: string }) => {
      if (!conversationId || !socket.data?.user?.id) return;
      try {
        const conversation = await Conversation.findById(conversationId).select('participants');
        if (!conversation) return;

        const isParticipant = conversation.participants.some((id: any) =>
          id.toString() === socket.data.user.id
        );
        if (!isParticipant) return;

        socket.join(`conversation:${conversationId}`);
      } catch (err) {
        // no-op
      }
    });

    socket.on('message:typing', ({ conversationId }: { conversationId: string }) => {
      if (!conversationId || !socket.data?.user?.id) return;
      socket.to(`conversation:${conversationId}`).emit('message:typing', {
        conversationId,
        userId: socket.data.user.id,
      });
    });

    socket.on('message:send', async (payload: {
      conversationId?: string;
      recipientId?: string;
      content: string;
      attachments?: string[];
    }) => {
      if (!socket.data?.user?.id) return;
      try {
        const message = await MessagingService.sendMessage({
          ...payload,
          senderId: socket.data.user.id,
        });

        // Emit ack to sender and broadcast new message
        socket.emit('message:sent', message);
        socket.to(`conversation:${message.conversationId}`).emit('message:new', message);
        socket.to(`user:${payload.recipientId || ''}`).emit('message:new', message);
        socket.emit('message:new', message);
      } catch (err: any) {
        socket.emit('message:error', { error: err?.message || 'Failed to send message' });
      }
    });

    socket.on('message:read', async ({ conversationId, messageIds }: { conversationId: string; messageIds?: string[] }) => {
      if (!conversationId || !socket.data?.user?.id) return;
      try {
        await MessagingService.markMessagesAsRead(conversationId, socket.data.user.id, messageIds);
        socket.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          userId: socket.data.user.id,
          messageIds,
        });
      } catch (err) {
        // swallow
      }
    });

    socket.on('instant:join', async ({ sessionId }: { sessionId: string }) => {
      if (!sessionId || !socket.data?.user?.id) return;

      try {
        const session = await InstantSession.findById(sessionId).select('studentId tutorId status');
        if (!session) return;

        const userId = socket.data.user.id;
        const isParticipant =
          session.studentId?.toString() === userId ||
          session.tutorId?.toString() === userId;

        if (!isParticipant) return;

        socket.join(`instant:${sessionId}`);
      } catch (err) {
        // Swallow errors to avoid killing the connection
      }
    });

    // Handle booking cancellations from students
    socket.on('booking:cancelled', async (data: {
      bookingId: string;
      classId: string;
      studentId: string;
      studentName: string;
    }) => {
      try {
        // Import dynamically to avoid circular dependencies
        const { Class } = await import('../models/Class');
        const { Booking } = await import('../models/Booking');

        // Get the class to find tutor and check type
        const classData = await Class.findById(data.classId).select('teacherId capacity classTypeId');
        if (!classData) {
          console.error('Class not found:', data.classId);
          return;
        }

        // Get remaining active bookings for this class
        const activeBookings = await Booking.find({
          classId: data.classId,
          bookingStatus: { $in: ['confirmed', 'pending'] }
        }).countDocuments();

        const remainingStudents = activeBookings;

        // If no students left, update class status back to 'scheduled'
        if (remainingStudents === 0) {
          await Class.findByIdAndUpdate(data.classId, { status: 'scheduled' });
        }

        // Emit to tutor
        const teacherId = classData.teacherId?.toString();
        if (teacherId) {
          io?.to(`user:${teacherId}`).emit('session:student-cancelled', {
            classId: data.classId,
            studentName: data.studentName,
            remainingStudents,
            isLastStudent: remainingStudents === 0,
            maxStudents: classData.capacity || 1
          });
        }
      } catch (error) {
        console.error('Error handling booking cancellation:', error);
      }
    });

    socket.on('disconnect', () => {
      // No-op for now
    });
  });

  return io;
};

export const getIO = () => io;

export const emitToTutors = (event: string, payload: any) => {
  if (!io) return;
  io.to('tutors').emit(event, payload);
};

export const emitToUser = (userId: string, event: string, payload: any) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

export const emitToInstantSession = (sessionId: string, event: string, payload: any) => {
  if (!io) return;
  io.to(`instant:${sessionId}`).emit(event, payload);
};





