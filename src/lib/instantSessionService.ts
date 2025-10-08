// Instant Session Service - Real Implementation
import apiClient from './apiClient';

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
    console.log('[Instant] Creating instant session request');

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
    console.log('[Instant] Fetching pending requests');

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
    console.log('[Instant] Cancelling request:', requestId);

    const response = await apiClient.post<InstantRequest>(`/api/instant-sessions/${requestId}/cancel`, {});

    return {
      ...response,
      id: response._id
    };
  },

  // Tutor rejects a pending request (local dismissal - just cancel)
  rejectRequest: async (requestId: string, _tutorProfileId: string): Promise<InstantRequest> => {
    console.log('[Instant] Tutor rejecting request:', requestId);

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
    console.log('[Instant] Tutor accepting request:', requestId);

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

  // Polling-based subscription for tutors (fallback for real-time)
  subscribeToPending: (
    callback: (payload: {
      new: InstantRequest;
      old: InstantRequest | null;
      eventType: string;
    }) => void,
    subjectId?: string,
    isOnline: boolean = false
  ) => {
    console.log('[Instant] Setting up polling subscription for pending requests');

    if (!isOnline) {
      console.log('[Instant] Tutor is offline, skipping subscription');
      return () => {};
    }

    let lastRequestIds = new Set<string>();
    
    // Poll every 5 seconds for new requests
    const pollInterval = setInterval(async () => {
      try {
        const requests = await instantSessionService.getPendingRequests(subjectId);
        
        // Check for new requests
        const currentRequestIds = new Set(requests.map(r => r.id || r._id));
        
        requests.forEach(req => {
          const reqId = req.id || req._id;
          if (!lastRequestIds.has(reqId)) {
            // New request found
            console.log('[Instant] New request detected:', reqId);
            callback({
              new: req,
              old: null,
              eventType: 'INSERT'
            });
          }
        });
        
        // Check for removed requests (accepted, cancelled, or expired)
        lastRequestIds.forEach(oldId => {
          if (!currentRequestIds.has(oldId)) {
            // Request was removed (likely accepted or cancelled)
            console.log('[Instant] Request removed from pending:', oldId);
            callback({
              new: { id: oldId, status: 'accepted' } as InstantRequest,
              old: null,
              eventType: 'UPDATE'
            });
          }
        });
        
        lastRequestIds = currentRequestIds;
      } catch (error) {
        console.error('[Instant] Error polling for pending requests:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Return cleanup function
    return () => {
      console.log('[Instant] Cleaning up polling subscription');
      clearInterval(pollInterval);
    };
  },
};
