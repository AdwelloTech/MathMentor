import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StudentPageWrapper from "@/components/ui/StudentPageWrapper";
import { tutorService, TutorDetail } from "@/lib/tutorService";
import SessionList from "@/components/SessionList";
import type { ClassSearchResult } from "@/types/classScheduling";
import {
  Loader2,
  GraduationCap,
  BookOpen,
  Star,
  Users,
  Presentation,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { messagingService } from "@/lib/messagingService";
import { useAuth } from "@/contexts/AuthContext";

const TutorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tutor, setTutor] = useState<TutorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ClassSearchResult[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const detail = await tutorService.getTutorDetail(id);
        setTutor(detail);
        // load sessions after detail
        setSessionsLoading(true);
        const upcoming = await tutorService.getTutorUpcomingSessions(id, 12);
        const mapped: ClassSearchResult[] = upcoming.map((s) => ({
          class: {
            id: s.class.id,
            title: s.class.title,
            description: s.class.description,
            date: s.class.date,
            start_time: s.class.start_time,
            end_time: s.class.end_time,
            duration_minutes: s.class.duration_minutes,
            max_students: s.class.max_students,
            current_students: s.class.current_students ?? (s.class.max_students - s.available_slots),
            price_per_session: s.class.price_per_session,
            status: s.class.status,
            class_type: { name: "Session" },
            subject: s.class.subject
          } as any,
          tutor: {
            id: s.tutor.id,
            full_name: s.tutor.full_name,
            rating: s.tutor.rating,
            total_reviews: s.tutor.total_reviews,
            subjects: [],
          },
          available_slots: s.available_slots,
          is_bookable: s.is_bookable,
          max_students: s.max_students,
        }));
        setSessions(mapped);
      } catch (err: any) {
        console.error("Failed to load tutor detail", err);
        setError(err?.message || "Failed to load tutor");
      } finally {
        setLoading(false);
        setSessionsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBookSession = (classId: string, price: number) => {
    navigate(`/student/book-session?classId=${classId}&price=${price}`);
  };

  const handleMessageTutor = async () => {
    if (!tutor || !user) return;
    try {
      const convo = await messagingService.conversations.create({
        participants: [user.id, tutor.id],
        type: "direct",
      });
      const conversationId = (convo as any)._id || (convo as any).id || "";
      navigate(`/messages${conversationId ? `?conversationId=${conversationId}` : ""}`);
    } catch (err) {
      console.error("Failed to start conversation", err);
    }
  };

  if (loading) {
    return (
      <StudentPageWrapper backgroundClass="bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading tutor...</p>
          </div>
        </div>
      </StudentPageWrapper>
    );
  }

  if (error || !tutor) {
    return (
      <StudentPageWrapper backgroundClass="bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <p className="text-sm text-destructive">{error || "Tutor not found"}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </StudentPageWrapper>
    );
  }

  return (
    <StudentPageWrapper backgroundClass="bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={tutor.avatar_url || tutor.profile_image_url} />
            <AvatarFallback>
              {tutor.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{tutor.full_name}</h1>
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  tutor.is_online ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${tutor.is_online ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                {tutor.is_online ? "Online" : "Offline"}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {tutor.qualification && (
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {tutor.qualification}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {tutor.experience_years ? `${tutor.experience_years} yrs exp` : "Experience not provided"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {tutor.languages?.length ? tutor.languages.join(", ") : "Languages not provided"}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                {tutor.rating_count && tutor.rating_count > 0
                  ? `${(tutor.average_rating ?? 0).toFixed(1)} (${tutor.rating_count})`
                  : "No ratings yet"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Presentation className="h-4 w-4" />
                {tutor.sessions_count ?? 0} classes
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                {tutor.students_count ?? 0} students
              </span>
              <span className="inline-flex items-center gap-1">
                {tutor.hourly_rate ? `£${tutor.hourly_rate}/hr` : "Rate not set"}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleMessageTutor}>Message Tutor</Button>
              <Button variant="outline" onClick={() => navigate("/student/manage-sessions")}>
                View My Sessions
              </Button>
            </div>
            {tutor.availability && (
              <p className="text-sm text-muted-foreground">Availability: {tutor.availability}</p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Subjects & Specializations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(
                (tutor.subjects && tutor.subjects.length > 0 ? tutor.subjects : tutor.specializations || [])
              ).map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {tutor.bio && (
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap">{tutor.bio}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tutor.reviews && tutor.reviews.length > 0 ? (
              tutor.reviews.map((review, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-foreground">{review.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {review.is_anonymous
                      ? "Anonymous"
                      : review.student_name || "Student"}
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-foreground">{review.review_text}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <SessionList
              sessions={sessions}
              loading={sessionsLoading}
              onBookSession={handleBookSession}
            />
          </CardContent>
        </Card>
      </div>
    </StudentPageWrapper>
  );
};

export default TutorDetailPage;

