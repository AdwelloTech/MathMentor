import { supabase } from "@/lib/supabase";

type InstantRequest = {
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
    const channel = (supabase as any).channel("instant_requests:pending");
    console.log("[Instant] subscribeToPending start");

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "instant_requests",
      } as any,
      (payload: any) => {
        console.log("[Instant] INSERT payload", payload?.new?.id);
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
        console.log(
          "[Instant] UPDATE payload",
          payload?.new?.id,
          payload?.new?.status
        );
        callback({
          new: payload.new,
          old: payload.old,
          eventType: payload.eventType,
        });
      }
    );

    channel.subscribe((status: any) => {
      console.log("[Instant] channel status", status);
    });
    return () => {
      console.log("[Instant] unsubscribe channel");
      (supabase as any).removeChannel(channel);
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

    // Ensure a meeting URL exists (fallback to deterministic)
    const jitsiMeetingUrl =
      accepted.jitsi_meeting_url ||
      `https://meet.jit.si/instant-${accepted.id}`;

    // If URL was missing for some reason, persist it once
    if (!accepted.jitsi_meeting_url) {
      const { error: setUrlError } = await (supabase as any)
        .from("instant_requests")
        .update({ jitsi_meeting_url: jitsiMeetingUrl })
        .eq("id", accepted.id);
      if (setUrlError)
        console.warn("[Instant] failed to set meeting url", setUrlError);
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
    }

    return {
      ...(accepted as any),
      jitsi_meeting_url: jitsiMeetingUrl,
    } as InstantRequest;
  },
};

export type { InstantRequest };
