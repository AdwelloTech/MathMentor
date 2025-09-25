// src/lib/instantSessionService.ts (custom API via axios — no Supabase)

/* -------------------- axios client -------------------- */
import axios from "axios";

const API_BASE = "http://localhost:8080"; // force 8080 only
const api = axios.create({ baseURL: API_BASE });

/* -------------------- types -------------------- */
export type InstantRequest = {
  id: string;
  student_id: string;
  subject_id: string;
  duration_minutes: number;
  status: "pending" | "accepted" | "cancelled";
  accepted_by_tutor_id: string | null;
  jitsi_meeting_url: string | null;
  created_at: string;
  updated_at: string;
};

/* -------------------- utilities -------------------- */
function makeId() {
  return (
    (globalThis.crypto?.randomUUID && globalThis.crypto.randomUUID()) ||
    Math.random().toString(36).slice(2) + Date.now().toString(36)
  );
}
function jitsiUrlFor(id: string) {
  return `https://meet.jit.si/instant-${id}`;
}

/* -------------------- realtime (SSE or polling) -------------------- */
type Unsubscribe = () => void;

/** Server-Sent Events stream of pending requests (if your backend provides it). */
function subscribeViaSSE(
  onEvent: (payload: {
    new: InstantRequest;
    old: InstantRequest | null;
    eventType: string;
  }) => void
): Unsubscribe {
  const url = `${API_BASE}/api/instant_requests/stream`; // endpoint you expose on the server
  let es: EventSource | null = null;

  try {
    es = new EventSource(url, { withCredentials: false });

    es.addEventListener("open", () => {
      console.log("[Instant] SSE connected");
    });

    es.addEventListener("insert", (e: any) => {
      const data = JSON.parse(e.data);
      onEvent({ new: data as InstantRequest, old: null, eventType: "INSERT" });
    });

    es.addEventListener("update", (e: any) => {
      const data = JSON.parse(e.data);
      onEvent({ new: data as InstantRequest, old: null, eventType: "UPDATE" });
    });

    es.addEventListener("accepted", (e: any) => {
      const data = JSON.parse(e.data);
      onEvent({
        new: { ...(data as InstantRequest), status: "accepted" },
        old: null,
        eventType: "BROADCAST_ACCEPTED",
      });
    });

    es.addEventListener("error", (e) => {
      console.warn("[Instant] SSE error", e);
    });
  } catch (e) {
    console.warn("[Instant] SSE init failed", e);
  }

  return () => {
    try {
      es?.close();
      console.log("[Instant] SSE closed");
    } catch {}
  };
}

/** Polling fallback for pending requests. */
function subscribeViaPolling(
  callback: (payload: {
    new: InstantRequest;
    old: InstantRequest | null;
    eventType: string;
  }) => void
): Unsubscribe {
  console.log("[Instant] Using polling fallback");
  let stopped = false;
  let lastIds = new Set<string>();

  const tick = async () => {
    if (stopped) return;
    try {
      const res = await api.get("/api/instant_requests", {
        params: {
          status: "pending",
          limit: 50,
          sort: JSON.stringify({ created_at: -1 }),
        },
        withCredentials: false,
      });
      const items: InstantRequest[] = Array.isArray(res.data?.items)
        ? res.data.items
        : Array.isArray(res.data?.data)
        ? res.data.data
        : (res.data as InstantRequest[]) || [];

      // detect new inserts
      for (const it of items) {
        if (!lastIds.has(it.id)) {
          callback({ new: it, old: null, eventType: "INSERT" });
        }
      }
      lastIds = new Set(items.map((x) => x.id));
    } catch {
      // non-fatal
    } finally {
      setTimeout(tick, 3000);
    }
  };

  tick();
  return () => {
    stopped = true;
  };
}

/* -------------------- service -------------------- */
export const instantSessionService = {
  /** Student creates a new instant request (default 15 minutes) */
  async createRequest(studentProfileId: string, subjectId: string) {
    console.log("[Instant] createRequest", { studentProfileId, subjectId });

    const id = makeId();
    const jitsi_meeting_url = jitsiUrlFor(id);

    // POST /api/instant_requests -> creates and returns the row
    const res = await api.post(
      "/api/instant_requests",
      {
        id,
        student_id: studentProfileId,
        subject_id: subjectId,
        duration_minutes: 15,
        status: "pending",
        jitsi_meeting_url,
      },
      { withCredentials: false }
    );

    const data =
      (res.data?.data as InstantRequest) ||
      (res.data as InstantRequest);
    console.log("[Instant] createRequest ->", data?.id);
    return data;
  },

  /**
   * Tutors listen for new/updated requests.
   * Uses SSE at /api/instant_requests/stream, falls back to polling GET /api/instant_requests?status=pending
   */
  subscribeToPending(
    callback: (payload: {
      new: InstantRequest;
      old: InstantRequest | null;
      eventType: string;
    }) => void,
    _subjectId?: string,
    isOnline: boolean = false
  ): Unsubscribe {
    if (!isOnline) {
      console.log("[Instant] Tutor is offline, not subscribing to requests");
      return () => {};
    }

    // Try SSE first
    const sseUnsub = subscribeViaSSE(callback);

    // Watchdog: if SSE doesn't connect quickly, start polling too (harmless if both run briefly)
    const pollTimer = setTimeout(() => {
      subscribeViaPolling(callback);
    }, 1000);

    return () => {
      sseUnsub?.();
      clearTimeout(pollTimer);
    };
  },

  /** Student cancels their pending request */
  async cancelRequest(requestId: string, studentProfileId: string) {
    console.log("[Instant] cancelRequest", { requestId });

    // PUT /api/instant_requests/:id/cancel
    const res = await api.put(
      `/api/instant_requests/${encodeURIComponent(requestId)}/cancel`,
      { student_id: studentProfileId },
      { withCredentials: false }
    );

    return (
      (res.data?.data as InstantRequest) ||
      (res.data as InstantRequest)
    );
  },

  /** Tutor rejects a pending request (local-only right now) */
  async rejectRequest(requestId: string, _tutorProfileId: string) {
    console.log("[Instant] rejectRequest", { requestId });
    return { id: requestId } as InstantRequest;
  },

  /** Tutor accepts a pending request (atomic on the server) */
  async acceptRequest(requestId: string, tutorProfileId: string) {
    console.log("[Instant] acceptRequest", { requestId, tutorProfileId });

    // PUT /api/instant_requests/:id/accept
    const res = await api.put(
      `/api/instant_requests/${encodeURIComponent(requestId)}/accept`,
      { tutor_id: tutorProfileId },
      { withCredentials: false }
    );

    // Server should return the updated record with a canonical Jitsi URL.
    const accepted: InstantRequest =
      (res.data?.data as InstantRequest) ||
      (res.data as InstantRequest);

    const jitsi_meeting_url =
      accepted.jitsi_meeting_url || jitsiUrlFor(accepted.id);

    // Best-effort audit booking (optional): POST /api/bookings
    try {
      const startIso = new Date().toISOString();
      const endIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await api.post(
        "/api/bookings",
        {
          student_id: accepted.student_id,
          teacher_id: tutorProfileId,
          class_id: null,
          booking_type: "consultation",
          start_time: startIso,
          end_time: endIso,
          status: "confirmed",
          jitsi_meeting_url,
        },
        { withCredentials: false }
      );
    } catch (e) {
      console.warn("[Instant] booking create failed (non-fatal)", e);
    }

    return { ...accepted, jitsi_meeting_url } as InstantRequest;
  },
};

export type { InstantRequest };
