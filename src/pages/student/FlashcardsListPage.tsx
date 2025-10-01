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
import {
  BookOpenIcon,
  UserIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import StudentPageWrapper from "@/components/ui/StudentPageWrapper";
import { flashcards } from "@/lib/flashcards";
import type { FlashcardSet } from "@/types/flashcards";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { subjectsService } from "@/lib/subjects";
import type { Subject } from "@/types/subject";
import { Skeleton } from "@/components/ui/skeleton";

const FlashcardsListPage: React.FC = () => {
  const { profile } = useAuth();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    if (!profile?.user_id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await flashcards.student.listAvailable(profile.user_id, subject || undefined);
      setSets(data || []);
    } catch (err) {
      console.error("Error loading flashcard sets:", err);
      setError("Failed to load flashcard sets. Please try again.");
      setSets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.user_id) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, profile?.user_id]);

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
      <StudentPageWrapper backgroundClass="bg-background">
        <div className="min-h-screen p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-3">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-5 w-80" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            {/* Flashcard Sets Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-border bg-card shadow-lg">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </StudentPageWrapper>
    );
  }

  return (
    <StudentPageWrapper backgroundClass="bg-background" className="text-foreground">
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Error Display */}
          {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-destructive">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{error}</span>
                  <Button
                    onClick={load}
                    variant="destructive"
                    size="sm"
                    className="ml-auto"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shadow-sm">
                  <AcademicCapIcon className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                  Flashcard Sets
                </h1>
              </div>
              <p className="text-base text-muted-foreground">
                Master your subjects with interactive study cards
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
                <SelectTrigger className="w-64 bg-input border-border text-foreground focus:ring-primary">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((subj) => (
                    <SelectItem key={subj.id} value={subj.name}>
                      {subj.display_name || subj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={load} variant="outline" className="font-semibold">
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Flashcard Sets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sets.map((set) => (
              <Card
                key={set.id}
                className="group hover:shadow-xl transition-all duration-300 border-border bg-card hover:-translate-y-1 rounded-2xl overflow-hidden flex flex-col"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-xl font-bold text-card-foreground leading-tight">
                        {set.title}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="font-semibold"
                        >
                          {set.subject}
                        </Badge>
                        {set.topic && (
                          <Badge
                            variant="outline"
                            className="font-medium"
                          >
                            {set.topic}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-xl shadow-sm text-primary">
                      <BookOpenIcon className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-4 flex-1 flex flex-col justify-end">
                  <CardDescription className="flex items-center gap-2 text-base text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    <span className="font-medium">
                      By {set.tutor?.full_name || "Unknown Tutor"}
                    </span>
                  </CardDescription>

                  <Button
                    onClick={() => navigate(`/student/flashcards/${set.id}`)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Start Studying
                    <AcademicCapIcon className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {sets.length === 0 && !loading && (
            <Card className="border-border bg-card shadow-lg rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="p-4 bg-secondary rounded-2xl">
                  <BookOpenIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-card-foreground">
                    No flashcard sets found
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {subject
                      ? `No flashcards available for ${
                          subjects.find((sj) => sj.name === subject)
                            ?.display_name || subject
                        }`
                      : "No flashcard sets are currently available"}
                  </p>
                  {subject && (
                    <Button
                      onClick={() => setSubject("")}
                      variant="outline"
                      className="mt-4 font-semibold"
                    >
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
