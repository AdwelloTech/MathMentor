import { supabase } from "./supabase";
import type { InstantRequest } from "../types/instantSession";

// Shared broadcast channel (singleton) to minimize latency when sending events
let __instantSharedChannel: any | null = null;
let __instantSharedReady: Promise<void> | null = null;

function getInstantSharedChannel() {
  const channelId = `instant_requests:shared:${Date.now()}`;
  if (!__instantSharedChannel) {
    __instantSharedChannel = (supabase as any).channel(channelId);
    __instantSharedReady = new Promise<void>((resolve) => {
      try {
        __instantSharedChannel.subscribe((status: any) => {
          console.log("[Instant] Shared channel status:", status);
          if (status === "SUBSCRIBED") {
            console.log("[Instant] Shared channel subscribed successfully");
            resolve();
          } else if (status === "CHANNEL_ERROR") {
            console.error("[Instant] Shared channel error");
            resolve(); // Resolve anyway to prevent hanging
          } else if (status === "TIMED_OUT") {
            console.error("[Instant] Shared channel timed out");
            resolve(); // Resolve anyway to prevent hanging
          }
        });
      } catch (_) {
        // Best-effort; if subscribe throws, we'll still try to send later
        console.warn("[Instant] Shared channel setup error, resolving anyway");
        resolve();
      }
    });
  }
  return { channel: __instantSharedChannel, ready: __instantSharedReady! };
}

// Cleanup function for shared channel
export const cleanupSharedChannel = () => {
  if (__instantSharedChannel) {
    try {
      (supabase as any).removeChannel(__instantSharedChannel);
      __instantSharedChannel = null;
      __instantSharedReady = null;
      console.log("[Instant] Shared channel cleaned up");
    } catch (error) {
      console.error("[Instant] Error cleaning up shared channel:", error);
    }
  }
};

// Test function to verify subscription is working
export const testSubscription = async () => {
  console.log("[Instant] Testing subscription...");
  
  return new Promise<void>((resolve, reject) => {
    const testChannel = (supabase as any).channel(`test:${Date.now()}`);
    
    testChannel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "instant_requests",
        } as any,
        (payload: any) => {
          console.log("[Instant] Test subscription received INSERT:", payload);
          resolve();
        }
      )
      .subscribe((status: any) => {
        console.log("[Instant] Test channel status:", status);
        if (status === "SUBSCRIBED") {
          console.log("[Instant] Test subscription successful");
          // Clean up test channel after 5 seconds
          setTimeout(() => {
            try {
              (supabase as any).removeChannel(testChannel);
            } catch (e) {
              console.warn("[Instant] Error cleaning up test channel:", e);
            }
          }, 5000);
        } else if (status === "CHANNEL_ERROR") {
          console.error("[Instant] Test subscription failed");
          reject(new Error("Test subscription failed"));
        }
      });
  });
};

// Comprehensive test function to verify real-time functionality
export const testRealTimeComprehensive = async () => {
  console.log("[Instant] Starting comprehensive real-time test...");
  
  try {
    // Test 1: Basic channel creation
    console.log("[Instant] Test 1: Creating test channel...");
    const testChannel = (supabase as any).channel(`comprehensive-test:${Date.now()}`);
    
    // Test 2: Subscription setup
    console.log("[Instant] Test 2: Setting up subscription...");
    const subscriptionPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Subscription test timeout"));
      }, 10000);
      
      testChannel.subscribe((status: any) => {
        clearTimeout(timeout);
        console.log("[Instant] Test channel status:", status);
        if (status === "SUBSCRIBED") {
          console.log("[Instant] Test subscription successful");
          resolve();
        } else if (status === "CHANNEL_ERROR") {
          reject(new Error("Real-time subscription failed"));
        } else if (status === "TIMED_OUT") {
          reject(new Error("Real-time subscription timed out"));
        }
      });
    });
    
    await subscriptionPromise;
    
    // Test 3: Cleanup
    console.log("[Instant] Test 3: Cleaning up test channel...");
    try {
      (supabase as any).removeChannel(testChannel);
    } catch (e) {
      console.warn("[Instant] Error cleaning up test channel:", e);
    }
    
    console.log("[Instant] Comprehensive real-time test passed!");
    return true;
    
  } catch (error) {
    console.error("[Instant] Comprehensive real-time test failed:", error);
    throw error;
  }
};

export const instantSessionService = {
  // Student creates a new instant request (fixed 15 minutes)
  createRequest: async (studentProfileId: string, subjectId: string) => {
    console.log("[Instant] createRequest", { studentProfileId, subjectId });
    const id =
      (globalThis.crypto?.randomUUID && globalThis.crypto.randomUUID()) ||
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    const jitsiUrl = `https://meet.jit.si/instant-${id}`;

    const { data, error } = await (supabase as any)
      .from("instant_requests")
      .insert([
        {
          id,
          student_id: studentProfileId,
          subject_id: subjectId,
          duration_minutes: 15,
          status: "pending",
          jitsi_meeting_url: jitsiUrl,
        },
      ])
      .select("*")
      .single();

    if (error) throw error;
    console.log("[Instant] createRequest ->", data?.id);
    return data as InstantRequest;
  },

  // Tutors listen for new pending requests (optionally filter by subject)
  subscribeToPending: (
    callback: (payload: {
      new: InstantRequest;
      old: InstantRequest | null;
      eventType: string;
    }) => void,
    _subjectId?: string
  ) => {
    const channelId = `instant_requests:pending:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const channel = (supabase as any).channel(channelId);
    console.log("[Instant] subscribeToPending start", channelId);

    // Listen for acceptance broadcasts to avoid RLS-related UPDATE filtering
    channel.on("broadcast", { event: "accepted" } as any, (payload: any) => {
      try {
        const requestId = payload?.payload?.id;
        if (!requestId) return;
        console.log("[Instant] BROADCAST accepted", requestId);
        // Synthesize a minimal payload to unify handling upstream
        const minimal = {
          id: requestId,
          status: "accepted",
        } as unknown as InstantRequest;
        callback({
          new: minimal,
          old: null,
          eventType: "BROADCAST_ACCEPTED",
        });
      } catch (e) {
        console.warn("[Instant] broadcast accepted handler error", e);
      }
    });

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "instant_requests",
      } as any,
      (payload: any) => {
        console.log("[Instant] INSERT payload received:", {
          id: payload?.new?.id,
          status: payload?.new?.status,
          student_id: payload?.new?.student_id,
          timestamp: new Date().toISOString()
        });
        callback({
          new: payload.new,
          old: payload.old,
          eventType: payload.eventType,
        });
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "instant_requests",
      } as any,
      (payload: any) => {
        console.log("[Instant] UPDATE payload received:", {
          id: payload?.new?.id,
          status: payload?.new?.status,
          old_status: payload?.old?.status,
          student_id: payload?.new?.student_id,
          timestamp: new Date().toISOString()
        });
        callback({
          new: payload.new,
          old: payload.old,
          eventType: payload.eventType,
        });
      }
    );

    // Subscribe with better error handling and retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptSubscribe = () => {
      console.log("[Instant] Attempting subscription, attempt:", retryCount + 1);

    channel.subscribe((status: any) => {
        console.log("[Instant] channel status", status, channelId, "retry:", retryCount);
      if (status === "SUBSCRIBED") {
        console.log(
          "[Instant] Successfully subscribed to instant_requests changes"
        );
          retryCount = 0; // Reset retry count on success
      } else if (status === "CHANNEL_ERROR") {
        console.error("[Instant] Channel subscription error");
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`[Instant] Retrying subscription (${retryCount}/${maxRetries})...`);
            setTimeout(attemptSubscribe, 1000 * retryCount); // Exponential backoff
          } else {
            console.error("[Instant] Max retries reached, subscription failed");
          }
      } else if (status === "TIMED_OUT") {
        console.error("[Instant] Channel subscription timed out");
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`[Instant] Retrying subscription after timeout (${retryCount}/${maxRetries})...`);
            setTimeout(attemptSubscribe, 1000 * retryCount); // Exponential backoff
          } else {
            console.error("[Instant] Max retries reached after timeout, subscription failed");
          }
        } else if (status === "CLOSED") {
          console.log("[Instant] Channel closed");
        }
      });
    };
    
    attemptSubscribe();

    return () => {
      console.log("[Instant] unsubscribe channel", channelId);
      try {
        (supabase as any).removeChannel(channel);
      } catch (error) {
        console.error("[Instant] Error removing channel:", error);
      }
    };
  },

  // Student cancels their pending request
  cancelRequest: async (requestId: string, studentProfileId: string) => {
    console.log("[Instant] cancelRequest", { requestId });
    const { data, error } = await (supabase as any)
      .from("instant_requests")
      .update({ status: "cancelled" })
      .eq("id", requestId)
      .eq("student_id", studentProfileId)
      .select("*")
      .single();

    if (error) throw error;
    return data as InstantRequest;
  },

  // Tutor rejects a pending request (local dismissal)
  rejectRequest: async (requestId: string, tutorProfileId: string) => {
    console.log("[Instant] rejectRequest", { requestId, tutorProfileId });
    // For now, just return success - the rejection is handled locally
    // In the future, we could track rejections in the database
    return { id: requestId } as InstantRequest;
  },

  // Atomic accept: only succeeds if still pending. Use existing meeting URL (single source of truth)
  acceptRequest: async (requestId: string, tutorProfileId: string) => {
    console.log("[Instant] acceptRequest", { requestId, tutorProfileId });
    const { data: accepted, error: acceptError } = await (supabase as any)
      .from("instant_requests")
      .update({ status: "accepted", accepted_by_tutor_id: tutorProfileId })
      .eq("id", requestId)
      .eq("status", "pending")
      .select("*")
      .single();

    if (acceptError) throw acceptError;
    if (!accepted) throw new Error("Request was already accepted or cancelled");

    console.log("[Instant] Request accepted, original data:", accepted);

    // Proactively broadcast acceptance so other tutors immediately remove the card
    try {
      const { channel, ready } = getInstantSharedChannel();
      // Ensure channel is ready (SUBSCRIBED) before sending; this is a one-time await after first use
      await ready;
      await channel.send({
        type: "broadcast",
        event: "accepted",
        payload: { id: requestId },
      });
    } catch (e) {
      console.warn("[Instant] acceptance broadcast failed (non-fatal)", e);
    }

    // Ensure a meeting URL exists (fallback to deterministic)
    let jitsiMeetingUrl = accepted.jitsi_meeting_url;
    
    if (!jitsiMeetingUrl) {
      jitsiMeetingUrl = `https://meet.jit.si/instant-${accepted.id}`;
      console.log("[Instant] Generated fallback Jitsi URL:", jitsiMeetingUrl);

    // If URL was missing for some reason, persist it once
      const { error: setUrlError } = await (supabase as any)
        .from("instant_requests")
        .update({ jitsi_meeting_url: jitsiMeetingUrl })
        .eq("id", accepted.id);
      if (setUrlError) {
        console.warn("[Instant] failed to set meeting url", setUrlError);
      } else {
        console.log("[Instant] Successfully updated Jitsi URL in database");
      }
    } else {
      console.log("[Instant] Using existing Jitsi URL:", jitsiMeetingUrl);
    }

    // Create audit booking (best-effort)
    const startIso = new Date().toISOString();
    const endIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error: bookingError } = await (supabase as any)
      .from("bookings")
      .insert([
        {
          student_id: accepted.student_id,
          teacher_id: tutorProfileId,
          class_id: null,
          booking_type: "consultation",
          start_time: startIso,
          end_time: endIso,
          status: "confirmed",
          jitsi_meeting_url: jitsiMeetingUrl,
        },
      ]);
    if (bookingError) {
      console.warn(
        "Booking insert failed (will not block acceptance)",
        bookingError
      );
    } else {
      console.log("[Instant] Successfully created audit booking");
    }

    const finalResult = {
      ...(accepted as any),
      jitsi_meeting_url: jitsiMeetingUrl,
    };
    
    console.log("[Instant] Returning final result:", finalResult);
    return finalResult as InstantRequest;
  },
};

export type { InstantRequest };
