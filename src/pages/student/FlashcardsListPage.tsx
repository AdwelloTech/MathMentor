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
import { BookOpen, User, GraduationCap } from "lucide-react";
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
      const data = await flashcards.student.listAvailable(subject || undefined);
      console.log("Loaded flashcard sets:", data); // Debug log
      setSets(data || []);
    } catch (error) {
      console.error("Error loading flashcard sets:", error);
      setError("Failed to load flashcard sets. Please try again.");
      setSets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [subject]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      try {
        const s = await subjectsService.listActive();
        setSubjects(s);
      } catch (e) {
        console.error("Failed to load subjects:", e);
        // Keep UI usable with empty list on error
        setSubjects([]);
      }
    })();
  }, []);

  // Debug log for current state
  console.log("Current state:", { sets, subject, subjects, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-900 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading flashcard sets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Error Display */}
        {error && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-sm font-medium">{error}</span>
                <Button
                  onClick={load}
                  variant="outline"
                  size="sm"
                  className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
                >
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
              <div className="p-2 bg-green-900 rounded-2xl shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-green-900">Flash Cards</h1>
            </div>
            <p className="text-base text-slate-600">
              Master your subjects with interactive study cards
            </p>
          </div>

          {/* Subject Filter and Refresh */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-green-900" />
                  <Select
                    value={subject || "all"}
                    onValueChange={(val) =>
                      setSubject(val === "all" ? "" : val)
                    }
                  >
                    <SelectTrigger className="w-[200px] rounded-2xl border shadow-sm">
                      <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Flashcard Sets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sets.map((s) => (
            <Card
              key={s.id}
              className="group hover:shadow-2xl transition-all duration-300 border-2 border-green-900/60 backdrop-blur-sm hover:-translate-y-1 rounded-2xl overflow-hidden"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-xl font-bold text-green-900 leading-tight">
                      {s.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-green-900 text-white hover:bg-green-900 rounded-md px-3 py-1"
                      >
                        {s.subject}
                      </Badge>
                      {s.topic && (
                        <Badge
                          variant="outline"
                          className="border-yellow-400 text-white rounded-xl px-3 py-1"
                        >
                          {s.topic}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-green-900 to-green-800 rounded-xl shadow-lg text-white">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                <CardDescription className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-gray-900" />
                  <span className="text-gray-900">
                    By {s.tutor?.full_name || "Unknown Tutor"}
                  </span>
                </CardDescription>

                <Button
                  onClick={() => navigate(`/student/flashcards/${s.id}`)}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  Start Studying
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sets.length === 0 && !loading && (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="p-4 bg-slate-100 rounded-2xl">
                <BookOpen className="h-12 w-12 text-slate-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-slate-700">
                  No flashcard sets found
                </h3>
                <p className="text-base text-slate-500">
                  {subject
                    ? `No flashcards available for ${
                        subjects.find((s) => s.name === subject)
                          ?.display_name || subject
                      }`
                    : "No flashcard sets are currently available"}
                </p>
                {subject && (
                  <Button
                    onClick={() => setSubject("")}
                    variant="outline"
                    className="mt-4 border-2 border-slate-300 text-slate-700 hover:bg-slate-50"
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
  );
};

export default FlashcardsListPage;
