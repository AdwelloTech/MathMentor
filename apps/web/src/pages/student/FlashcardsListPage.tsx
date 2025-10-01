import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, User, GraduationCap, Star, Sparkles, Filter, Search, X } from "lucide-react";
import StudentPageWrapper from "@/components/ui/StudentPageWrapper";
import { flashcards } from "@/lib/flashcards";
import type { FlashcardSet } from "@/types/flashcards";

import { useNavigate } from "react-router-dom";
import { subjectsService } from "@/lib/subjects";
import type { Subject } from "@/types/subject";

const FlashcardsListPage: React.FC = () => {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      // ✅ Pass correct params object (was a raw string earlier)
      const data = await flashcards.student.listAvailable({
        subjectFilter: subject || undefined,
      });
      setSets(data || []);
    } catch (err) {
      console.error("Error loading flashcard sets:", err);
      // setError("Failed to load flashcard sets. Please try again.");
      setSets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  useEffect(() => {
    (async () => {
      try {
        const subjectsList = await subjectsService.listActive();
        setSubjects(subjectsList || []);
      } catch (err) {
        console.error("Error loading subjects:", err);
        setSubjects([]);
      }
    })();
  }, []);

  if (loading) {
    return (
      <StudentPageWrapper backgroundClass="bg-[#0f172a]">
        <div
          className="min-h-screen relative overflow-hidden"
          style={{
            background:
              "radial-gradient(1000px 600px at 50% -100px, rgba(255,255,255,0.08), transparent)",
          }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4" />
              <p className="text-white/80 text-lg">Loading flashcard sets...</p>
            </div>
          </div>
        </div>
      </StudentPageWrapper>
    );
  }

  return (
    <StudentPageWrapper backgroundClass="bg-[#0f172a]">
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          background:
            "radial-gradient(1000px 600px at 50% -100px, rgba(255,255,255,0.08), transparent)",
        }}
      >
        <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
          {/* Error Display */}
          {error && (
            <Card className="border-2 border-red-400/20 bg-red-950/40 text-white backdrop-blur-sm rounded-2xl shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-red-300">
                  <span className="text-sm font-medium">{error}</span>
                  <Button
                    onClick={load}
                    variant="outline"
                    size="sm"
                    className="ml-auto border-red-400/30 text-red-300 hover:bg-red-400/10"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-900/90 rounded-lg shadow-sm shadow-black/30">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold text-yellow-300 drop-shadow-md tracking-tight">
                    Flashcard Library
                  </h1>
                  <Badge
                    variant="outline"
                    className="border-yellow-300/40 text-yellow-300 mt-2 bg-green-900/60"
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    Study Hub
                  </Badge>
                </div>
              </div>
              <p className="text-lg text-white/90 max-w-2xl drop-shadow">
                Master your subjects with interactive study cards created by expert tutors.
                Build your knowledge one card at a time.
              </p>
            </div>

            {/* Subject Filter and Refresh */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <Select
                value={subject || "all"}
                onValueChange={(value) =>
                  setSubject(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-64 bg-white/90 backdrop-blur">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((subj) => (
                    <SelectItem key={subj.id || subj.name} value={subj.name}>
                      {subj.display_name || subj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={load}
                className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Flashcard Sets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sets.map((set) => {
              // ✅ Use stable unique key & navigation param
              const setId = (set as any)._id || set.id;
              return (
                <Card
                  key={setId}
                  className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl h-full flex flex-col hover:shadow-2xl hover:shadow-green-900/20 transition-all duration-300"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-yellow-300 text-xl font-bold leading-tight drop-shadow">
                          {set.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          {set.subject && (
                            <Badge
                              variant="secondary"
                              className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30 rounded-md px-3 py-1"
                            >
                              {set.subject}
                            </Badge>
                          )}
                          {(set as any).topic && (
                            <Badge
                              variant="outline"
                              className="border-yellow-400/30 text-yellow-300 rounded-xl px-3 py-1"
                            >
                              {(set as any).topic}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-green-900/80 rounded-lg shadow-inner">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4 flex-1">
                    <div className="flex items-center space-x-3 p-3 bg-[#D5FFC5] rounded-[10px] shadow-sm">
                      <div className="bg-[#16803D] w-8 h-8 rounded-lg flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-black truncate">
                          {(set as any).tutor?.full_name || "Unknown Tutor"}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        setId && navigate(`/student/flashcards/${setId}`)
                      }
                      className="w-full bg-yellow-400 text-green-900 hover:bg-yellow-500 font-semibold shadow-md hover:shadow-lg transition-all duration-200 mt-auto"
                      disabled={!setId}
                      title={!setId ? "Invalid set id" : "Start Studying"}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Start Studying
                      <GraduationCap className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {sets.length === 0 && !loading && (
            <Card className="bg-green-950/30 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative mx-auto w-24 h-24">
                  <BookOpen className="h-24 w-24 text-muted-foreground/50 mx-auto" />
                  <div className="absolute -top-2 -right-2 p-2 bg-yellow-400 rounded-full">
                    <Search className="h-4 w-4 text-green-900" />
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-bold text-yellow-300">
                    No flashcard sets found
                  </h3>
                  <p className="text-white/80 text-lg max-w-md mx-auto">
                    {subject
                      ? `No flashcards available for ${
                          subjects.find((sj) => sj.name === subject)
                            ?.display_name || subject
                        }`
                      : "No flashcard sets are currently available. Book a session with a tutor to access their study materials!"}
                  </p>
                  {subject && (
                    <Button
                      onClick={() => setSubject("")}
                      className="mt-4 bg-yellow-400 text-green-900 hover:bg-yellow-500 font-semibold"
                    >
                      <X className="w-4 h-4 mr-2" />
                      View All Subjects
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </StudentPageWrapper>
  );
};

export default FlashcardsListPage;
