// Instant Session Service - Real Implementation
import apiClient from './apiClient';
import { getSocket } from './socketClient';

export type InstantSessionStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

export type InstantRequest = {
  _id: string;
  id: string; // Alias for _id
  studentId: string | { _id: string; fullName: string; email: string };
  tutorId?: string | { _id: string; fullName: string; email: string };
  subjectId: string | { _id: string; name: string; displayName: string; color: string };
  status: InstantSessionStatus;
  durationMinutes: number;
  jitsiMeetingUrl?: string;
  tutorJoinedAt?: string;
  studentJoinedAt?: string;
  requestedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  expiredAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
};

export const instantSessionService = {
  // Student creates a new instant request (fixed 15 minutes)
  createRequest: async (_studentProfileId: string, subjectId: string): Promise<InstantRequest> => {
    const response = await apiClient.post<InstantRequest>('/api/instant-sessions/request', {
      subjectId
    });

    // Add id alias for backwards compatibility
    return {
      ...response,
      id: response._id
    };
  },

  // Get all pending requests (for tutors)
  getPendingRequests: async (subjectId?: string): Promise<InstantRequest[]> => {
    const params: any = {};
    if (subjectId) {
      params.subjectId = subjectId;
    }

    try {
      const response = await apiClient.get<InstantRequest[]>('/api/instant-sessions/pending', params);

      // Add id alias for backwards compatibility
      return response.map(req => ({
        ...req,
        id: req._id
      }));
    } catch (error: any) {
      console.warn('[Instant] Failed to fetch pending requests, returning empty array:', error.message);
      return []; // Return empty array on error to prevent breaking the UI
    }
  },

  // Student cancels their pending request
  cancelRequest: async (requestId: string, _studentProfileId: string): Promise<InstantRequest> => {

    const response = await apiClient.post<InstantRequest>(`/api/instant-sessions/${requestId}/cancel`, {});

    return {
      ...response,
      id: response._id
    };
  },

  // Tutor rejects a pending request (local dismissal - just cancel)
  rejectRequest: async (requestId: string, _tutorProfileId: string): Promise<InstantRequest> => {

    const response = await apiClient.post<InstantRequest>(`/api/instant-sessions/${requestId}/cancel`, {
      reason: 'Rejected by tutor'
    });

    return {
      ...response,
      id: response._id
    };
  },

  // Atomic accept: only succeeds if still pending
  acceptRequest: async (requestId: string, _tutorProfileId: string): Promise<InstantRequest> => {

    const response = await apiClient.post<InstantRequest>(`/api/instant-sessions/${requestId}/accept`, {});

    return {
      ...response,
      id: response._id
    };
  },

  // Get request status by ID
  getRequestStatus: async (requestId: string): Promise<InstantRequest | null> => {
    try {
      const response = await apiClient.get<InstantRequest>(`/api/instant-sessions/${requestId}`);
      
      if (!response) return null;

      return {
        ...response,
        id: response._id
      };
    } catch (error) {
      console.error('[Instant] Error fetching request status:', error);
      return null;
    }
  },

  // Get student's sessions
  getStudentSessions: async (limit: number = 10): Promise<InstantRequest[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await apiClient.get<InstantRequest[]>(`/api/instant-sessions/student/me?${params.toString()}`);

    return response.map(req => ({
      ...req,
      id: req._id
    }));
  },

  // Get tutor's sessions
  getTutorSessions: async (limit: number = 10): Promise<InstantRequest[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await apiClient.get<InstantRequest[]>(`/api/instant-sessions/tutor/me?${params.toString()}`);

    return response.map(req => ({
      ...req,
      id: req._id
    }));
  },

  // Mark tutor as joined
  markTutorJoined: async (requestId: string): Promise<InstantRequest> => {
    const response = await apiClient.post<InstantRequest>(`/api/instant-sessions/${requestId}/tutor-joined`, {});

    return {
      ...response,
      id: response._id
    };
  },

  // Mark student as joined
  markStudentJoined: async (requestId: string): Promise<InstantRequest> => {
    const response = await apiClient.post<InstantRequest>(`/api/instant-sessions/${requestId}/student-joined`, {});

    return {
      ...response,
      id: response._id
    };
  },

  // Start session
  startSession: async (requestId: string): Promise<InstantRequest> => {
    const response = await apiClient.post<InstantRequest>(`/api/instant-sessions/${requestId}/start`, {});

    return {
      ...response,
      id: response._id
    };
  },

  // Complete session
  completeSession: async (requestId: string): Promise<InstantRequest> => {
    const response = await apiClient.post<InstantRequest>(`/api/instant-sessions/${requestId}/complete`, {});

    return {
      ...response,
      id: response._id
    };
  },

  // WebSocket-based subscription for tutors (fallback to no-op if offline)
  subscribeToPending: (
    callback: (payload: {
      new: InstantRequest;
      old: InstantRequest | null;
      eventType: string;
    }) => void,
    subjectId?: string,
    isOnline: boolean = false
  ) => {
    if (!isOnline) return () => {};

    const socket = getSocket();
    if (!socket) return () => {};

    const normalize = (req: any): InstantRequest => ({
      ...req,
      id: req.id || req._id,
      _id: req.id || req._id,
    });

    const handleNew = (req: any) => {
      const normalized = normalize(req);
      if (subjectId && typeof normalized.subjectId === 'object' && normalized.subjectId) {
        const sid =
          (normalized.subjectId as any)._id?.toString?.() ||
          (normalized.subjectId as any).id ||
          (normalized.subjectId as any).toString?.();
        if (sid && sid !== subjectId) return;
      }
      callback({ new: normalized, old: null, eventType: 'INSERT' });
    };

    const handleRemove = (req: any) => {
      const normalized = normalize(req);
      callback({ new: normalized, old: null, eventType: 'REMOVE' });
    };

    socket.on('instant:pending:new', handleNew);
    socket.on('instant:pending:remove', handleRemove);

    return () => {
      socket.off('instant:pending:new', handleNew);
      socket.off('instant:pending:remove', handleRemove);
    };
  },

  // Subscribe to a specific instant session status updates
  subscribeToSession: (
    sessionId: string,
    handler: (payload: { event: string; session: InstantRequest }) => void
  ) => {
    const socket = getSocket();
    if (!socket) return () => {};

    const join = () => {
      socket.emit('instant:join', { sessionId });
    };

    if (socket.connected) {
      join();
    } else {
      socket.once('connect', join);
    }

    const wrappedHandler = (payload: any) => {
      if (!payload?.session) return;
      const normalized = {
        ...payload.session,
        id: payload.session.id || payload.session._id,
        _id: payload.session.id || payload.session._id,
      };
      handler({ event: payload.event, session: normalized });
    };

    socket.on('instant:status', wrappedHandler);

    return () => {
      socket.off('instant:status', wrappedHandler);
    };
  },
};
