import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
// Removed unused heroicons in favor of lucide-react icons matching the new theme
import {
  Loader2,
  GraduationCap,
  BookOpen,
  Star,
  Sparkles,
  Filter,
  Search,
  X,
  FileText,
  Eye,
  Download,
  TrendingUp,
} from "lucide-react";
// LoadingSpinner not needed on this page state anymore
import StudentTutorMaterialCard from "@/components/student/StudentTutorMaterialCard";
import StudentTutorMaterialViewer from "@/components/student/StudentTutorMaterialViewer";
import {
  getStudentTutorMaterials,
  transformStudentTutorMaterialForCard,
  checkStudentPremiumAccess,
  type StudentTutorMaterial,
} from "@/lib/studentTutorMaterials";
import { getNoteSubjects } from "@/lib/notes";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StudentPageWrapper from "@/components/ui/StudentPageWrapper";
// Themed assets (fantasy palette)
// Using absolute paths from repo root as provided
// Vite can bundle image modules via import
// Note: filenames include spaces, which are valid in import strings
// eslint-disable-next-line import/no-relative-packages
// Images were provided, but to avoid bundling issues when assets live outside
// the web app root, we'll apply a fantasy theme using gradients and textures
// without importing external files.

const TutorMaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<StudentTutorMaterial[]>([]);
  const [allMaterials, setAllMaterials] = useState<StudentTutorMaterial[]>([]);
  const [subjects, setSubjects] = useState<
    Array<{
      id: string;
      name: string;
      display_name: string;
      color: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedMaterial, setSelectedMaterial] =
    useState<StudentTutorMaterial | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialsData, subjectsData, premiumAccess] = await Promise.all([
        getStudentTutorMaterials(user!.id),
        getNoteSubjects(),
        checkStudentPremiumAccess(user!.id),
      ]);

      setAllMaterials(materialsData);
      setMaterials(materialsData);
      setSubjects(subjectsData);
      setHasPremiumAccess(premiumAccess);
    } catch (error) {
      console.error("Error loading data:", error);
      // toast.error("Failed to load tutor materials");
    } finally {
      setLoading(false);
    }
  };

  // Real-time filtering effect
  useEffect(() => {
    const filterMaterials = () => {
      let filtered = [...allMaterials];

      // Filter by search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(
            (material) =>
              material.title?.toLowerCase().includes(term) ||
              material.description?.toLowerCase().includes(term) ||
              material.subject_display_name?.toLowerCase().includes(term) ||
              material.tutor_name?.toLowerCase().includes(term)
        );
      }

      // Filter by subject
      if (selectedSubject && selectedSubject !== "all") {
        filtered = filtered.filter(
          (material) => material.subject_id === selectedSubject
        );
      }

      setMaterials(filtered);
    };

    filterMaterials();
  }, [searchTerm, selectedSubject, allMaterials]);

  const handleViewMaterial = (material: StudentTutorMaterial) => {
    // Check if material is premium and student doesn't have access
    if (material.is_premium && !hasPremiumAccess) {
      toast.error(
        "This material requires a premium package. Please upgrade to access premium content."
      );
      navigate("/student/packages");
      return;
    }

    setSelectedMaterial(material);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedMaterial(null);
  };

  const handleViewCountUpdate = (materialId: string, increment: number) => {
    setMaterials((prevMaterials) =>
      prevMaterials.map((material) =>
        material.id === materialId
          ? { ...material, view_count: material.view_count + increment }
          : material
      )
    );

    // Also update allMaterials to keep filtering working correctly
    setAllMaterials((prevAllMaterials) =>
      prevAllMaterials.map((material) =>
        material.id === materialId
          ? { ...material, view_count: material.view_count + increment }
          : material
      )
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSubject("all");
  };

  const hasActiveFilters =
    searchTerm.trim() || (selectedSubject && selectedSubject !== "all");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-green-900 mx-auto" />
          <div className="space-y-2">
            <p className="text-green-900 font-semibold text-lg">
              Loading materials...
            </p>
            <p className="text-muted-foreground text-sm">
              Please wait while we fetch your study resources
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StudentPageWrapper backgroundClass="bg-[#0f172a]">
      <div className="min-h-screen"
        style={{
          background:
            "radial-gradient(1000px 600px at 50% -100px, rgba(255,255,255,0.08), transparent)",
        }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-900/90 rounded-lg shadow-sm shadow-black/30">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold text-yellow-300 drop-shadow-md tracking-tight">
                    Study Materials
                  </h1>
                  <Badge
                    variant="outline"
                    className="border-yellow-300/40 text-yellow-300 mt-2 bg-green-900/60"
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    Learning Hub
                  </Badge>
                </div>
              </div>
              <p className="text-lg text-white/90 max-w-2xl drop-shadow">
                Access comprehensive study materials shared by your expert
                tutors. Enhance your learning with curated resources tailored to
                your academic journey.
              </p>
            </div>

            {!hasPremiumAccess && (
              <div className="lg:shrink-0">
                <Button
                  onClick={() => navigate("/student/packages")}
                  size="lg"
                  className="bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold shadow-lg"
                >
                  <Star className="h-5 w-5 mr-2" />
                  Upgrade to Premium
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter (Fantasy wood panel) */}
        <div
          className="mb-8 rounded-2xl shadow-2xl border border-yellow-400/30"
          style={{
            background:
              "linear-gradient(180deg, rgba(120,53,15,0.95), rgba(100,44,12,0.95)), repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 6px, rgba(0,0,0,0.08) 6px, rgba(0,0,0,0.08) 12px)",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div className="px-6 pt-8">
            <h2 className="text-2xl font-extrabold text-yellow-300 flex items-center gap-2 drop-shadow">
              <Filter className="w-5 h-5 text-yellow-300" />
              Search & Filter
            </h2>
            <p className="text-white/90 mt-1">
              Find the perfect study materials for your learning needs
            </p>
          </div>
          <div className="px-6 pb-8 pt-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium text-white">
                  Search Materials
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by title, description, subject, or tutor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/90 backdrop-blur placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Subject Filter */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium text-white">
                  Filter by Subject
                </Label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger className="bg-white/90 backdrop-blur">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Alert className="border-yellow-300/40 bg-yellow-200/20 text-white">
                <Filter className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-yellow-200 font-medium">
                    Showing filtered results
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="ml-4 bg-white/90"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear filters
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Total Materials
                  </p>
                  <p className="text-3xl font-extrabold text-yellow-300 drop-shadow">
                    {materials.length}
                  </p>
                </div>
                <div className="p-3 bg-green-900/80 rounded-lg shadow-inner">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Premium Materials
                  </p>
                  <p className="text-3xl font-extrabold text-yellow-300 drop-shadow">
                    {materials.filter((material) => material.is_premium).length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-400/90 rounded-lg shadow-inner">
                  <Star className="h-6 w-6 text-green-900" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Total Views
                  </p>
                  <p className="text-3xl font-extrabold text-yellow-300 drop-shadow">
                    {materials.reduce(
                      (sum, material) => sum + material.view_count,
                      0
                    )}
                  </p>
                </div>
                <div className="p-3 bg-green-900/80 rounded-lg shadow-inner">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-950/40 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Total Downloads
                  </p>
                  <p className="text-3xl font-extrabold text-yellow-300 drop-shadow">
                    {materials.reduce(
                      (sum, material) => sum + material.download_count,
                      0
                    )}
                  </p>
                </div>
                <div className="p-3 bg-green-900/80 rounded-lg shadow-inner">
                  <Download className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Materials List */}
        <div>
          {materials.length === 0 ? (
            <Card className="bg-green-950/30 border border-yellow-400/20 text-white backdrop-blur-sm rounded-2xl shadow-xl">
              <CardContent className="p-16 text-center">
                <div className="space-y-6">
                  <div className="relative mx-auto w-24 h-24">
                    <BookOpen className="h-24 w-24 text-muted-foreground/50 mx-auto" />
                    <div className="absolute -top-2 -right-2 p-2 bg-yellow-400 rounded-full">
                      <Search className="h-4 w-4 text-green-900" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-yellow-300">
                      No materials found
                    </h3>
                    <p className="text-white/80 text-lg max-w-md mx-auto">
                      {allMaterials.length === 0
                        ? "Start your learning journey by booking a session with one of our expert tutors!"
                        : "No materials match your search criteria. Try adjusting your filters or search terms."}
                    </p>
                  </div>
                  {allMaterials.length === 0 && (
                    <Button
                      onClick={() => navigate("/student/book-session")}
                      size="lg"
                      className="bg-green-900 hover:bg-green-800 text-white"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Book Your First Session
                      <TrendingUp className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {materials.map((material) => (
                <div key={material.id} className="h-full">
                  <StudentTutorMaterialCard
                    {...transformStudentTutorMaterialForCard(
                      material,
                      material.is_premium ? hasPremiumAccess : true
                    )}
                    onView={() => handleViewMaterial(material)}
                    onViewCountUpdate={handleViewCountUpdate}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Material Viewer Modal */}
      <AnimatePresence>
        {isViewerOpen && selectedMaterial && (
          <StudentTutorMaterialViewer
            isOpen={isViewerOpen}
            onClose={handleCloseViewer}
            material={selectedMaterial}
          />
        )}
      </AnimatePresence>
    </div>
    </StudentPageWrapper>
  );
};

export default TutorMaterialsPage;
