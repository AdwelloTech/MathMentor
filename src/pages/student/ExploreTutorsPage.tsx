import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { tutorService, PublicTutor } from "@/lib/tutorService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import StudentPageWrapper from "@/components/ui/StudentPageWrapper";
import { Loader2, GraduationCap, Languages, BookOpen, Star, Users, Presentation, Calendar } from "lucide-react";
import { subjectsService } from "@/lib/subjects";
import type { Subject } from "@/types/subject";

const ExploreTutorsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tutors, setTutors] = useState<PublicTutor[]>([]);
  const [filtered, setFiltered] = useState<PublicTutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // subjects dropdown (public list)
        subjectsService.listActivePublic().then(setSubjects).catch(() => setSubjects([]));
        const data = await tutorService.getPublicTutors();
        setTutors(data);
        setFiltered(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load tutors", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      load();
    }
  }, [user]);

  useEffect(() => {
    const s = search.toLowerCase().trim();
    const subj = subject.toLowerCase().trim();
    const next = tutors.filter((t) => {
      const matchesSearch =
        !s ||
        t.full_name.toLowerCase().includes(s) ||
        (t.bio && t.bio.toLowerCase().includes(s)) ||
        (t.specializations || []).some((sp) => sp.toLowerCase().includes(s));
      const subjectsPool = (t.subjects && t.subjects.length > 0 ? t.subjects : t.specializations || []).map((x) =>
        x.toLowerCase()
      );
      const matchesSubject = subj === "all" || subjectsPool.includes(subj);
      const matchesOnline = !showOnlineOnly || !!t.is_online;
      return matchesSearch && matchesSubject && matchesOnline;
    });
    setFiltered(next);
  }, [search, subject, tutors, showOnlineOnly]);

  if (loading) {
    return (
      <StudentPageWrapper backgroundClass="bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading tutors...</p>
          </div>
        </div>
      </StudentPageWrapper>
    );
  }

  return (
    <StudentPageWrapper backgroundClass="bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Explore Tutors</h1>
          <p className="text-muted-foreground">
            Search and filter tutors to match your subject and schedule.
          </p>
        </div>

          <div className="grid gap-3 md:grid-cols-3 items-end">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Search</label>
            <Input
              placeholder="Name, bio, specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((subj) => (
                    <SelectItem
                      key={subj.id}
                      value={(subj.name || subj.display_name || subj.id || "").toLowerCase()}
                    >
                      {subj.display_name || subj.name || "Untitled"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showOnlineOnly ? "bg-green-500" : "bg-muted"
                }`}
                onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                aria-pressed={showOnlineOnly}
                aria-label="Toggle online only"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    showOnlineOnly ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-muted-foreground">Online</span>
            </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              No tutors found. Try adjusting your search or filters.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tutor, idx) => (
              <motion.div
                key={tutor.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="cursor-pointer"
                onClick={() => navigate(`/student/tutors/${tutor.id}`)}
              >
                <Card className="h-full flex flex-col transition-all duration-150 hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="flex-row items-center gap-3 pb-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={tutor.avatar_url || tutor.profile_image_url} />
                      <AvatarFallback>
                        {tutor.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{tutor.full_name}</CardTitle>
                      <div className="flex items-center gap-1 text-xs">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            tutor.is_online ? "bg-green-500" : "bg-muted-foreground/50"
                          }`}
                        />
                        <span className={tutor.is_online ? "text-green-600" : "text-muted-foreground"}>
                          {tutor.is_online ? "Online" : "Offline"}
                        </span>
                      </div>
                      {tutor.qualification && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          <span>{tutor.qualification}</span>
                        </div>
                      )}
                      {tutor.languages && tutor.languages.length > 0 && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Languages className="h-4 w-4" />
                          <span>{tutor.languages.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3 pt-0">
                    <div className="flex flex-wrap gap-2">
                      {(
                        (tutor.subjects && tutor.subjects.length > 0
                          ? tutor.subjects
                          : tutor.specializations || [])
                      )
                        .slice(0, 4)
                        .map((item) => (
                          <Badge key={item} variant="secondary">
                            {item}
                          </Badge>
                        ))}
                      {tutor.subjects && tutor.subjects.length > 4 && (
                        <Badge variant="outline">+{tutor.subjects.length - 4} more</Badge>
                      )}
                      {!tutor.subjects?.length && tutor.specializations && tutor.specializations.length > 4 && (
                        <Badge variant="outline">+{tutor.specializations.length - 4} more</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>
                        {tutor.experience_years ? `${tutor.experience_years} yrs exp` : "Experience not provided"}
                      </span>
                    </div>
                    <div className="text-sm text-foreground">
                      {tutor.hourly_rate ? `£${tutor.hourly_rate}/hr` : "Rate not set"}
                    </div>
                    {tutor.availability && (
                      <div className="text-xs text-muted-foreground">
                        Availability: {tutor.availability}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <div className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <span>
                          {tutor.rating_count && tutor.rating_count > 0
                            ? `${(tutor.average_rating ?? 0).toFixed(1)} (${tutor.rating_count})`
                            : "No ratings yet"}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1">
                        <Presentation className="h-3.5 w-3.5" />
                        <span>{tutor.sessions_count ?? 0} classes</span>
                      </div>
                      <div className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{tutor.students_count ?? 0} students</span>
                      </div>
                    {typeof tutor.open_upcoming_sessions_count === "number" && (
                      <div className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{tutor.open_upcoming_sessions_count} upcoming with open slots</span>
                      </div>
                    )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </StudentPageWrapper>
  );
};

export default ExploreTutorsPage;




