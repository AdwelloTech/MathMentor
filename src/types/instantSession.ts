export interface InstantRequest {
  id: string;
  student_id: string;
  subject_id: string;
  duration_minutes: number;
  status: "pending" | "accepted" | "cancelled";
  accepted_by_tutor_id: string | null;
  jitsi_meeting_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstantSessionState {
  requestId: string | null;
  status: "idle" | "waiting" | "accepted" | "cancelled" | "expired";
  jitsiUrl: string | null;
  subjectId: string;
  acceptedAt: Date | null;
}
