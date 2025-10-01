import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  AcademicCapIcon,
  BookOpenIcon,
  StarIcon,
  SparklesIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";

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
        getStudentTutorMaterials(),
        getNoteSubjects(),
        checkStudentPremiumAccess(),
      ]);

      setAllMaterials(materialsData);
      setMaterials(materialsData);
      setSubjects(subjectsData);
      setHasPremiumAccess(premiumAccess);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load tutor materials");
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
      <StudentPageWrapper backgroundClass="bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
          {/* Header Skeleton */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-80" />
              <Skeleton className="h-6 w-full max-w-2xl" />
              <Skeleton className="h-6 w-3/4 max-w-xl" />
            </div>
            <Skeleton className="h-12 w-56 rounded-lg lg:shrink-0" />
          </div>

          {/* Filter Card Skeleton */}
          <Card className="shadow-lg border-border bg-card">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="shadow-lg border-border bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Materials List Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </StudentPageWrapper>
    );
  }

  return (
    <StudentPageWrapper backgroundClass="bg-background" className="text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg shadow-sm">
                  <AcademicCapIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground tracking-tight">
                    Study Materials
                  </h1>
                  <Badge
                    variant="outline"
                    className="border-primary/20 text-primary mt-2 font-semibold"
                  >
                    <BookOpenIcon className="w-3 h-3 mr-1.5" />
                    Learning Hub
                  </Badge>
                </div>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl">
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
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <StarIcon className="h-5 w-5 mr-2" />
                  Upgrade to Premium
                  <SparklesIcon className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8 border-border shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <FunnelIcon className="w-5 h-5" />
              Search & Filter
            </CardTitle>
            <CardDescription>
              Find the perfect study materials for your learning needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium text-card-foreground">
                  Search Materials
                </Label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by title, description, subject, or tutor..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
                  />
                </div>
              </div>

              {/* Subject Filter */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium text-card-foreground">
                  Filter by Subject
                </Label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger className="bg-input border-border text-foreground focus:ring-primary">
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
              <Alert className="border-border bg-secondary text-secondary-foreground">
                <FunnelIcon className="h-4 w-4 text-current" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="font-medium">
                    Showing filtered results
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="ml-4 text-muted-foreground hover:bg-muted"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    Clear filters
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border shadow-lg bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Materials
                  </p>
                  <p className="text-3xl font-bold text-card-foreground">
                    {materials.length}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Premium Materials
                  </p>
                  <p className="text-3xl font-bold text-card-foreground">
                    {materials.filter((material) => material.is_premium).length}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <StarIcon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Views
                  </p>
                  <p className="text-3xl font-bold text-card-foreground">
                    {materials.reduce(
                      (sum, material) => sum + material.view_count,
                      0
                    )}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <EyeIcon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-lg bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Downloads
                  </p>
                  <p className="text-3xl font-bold text-card-foreground">
                    {materials.reduce(
                      (sum, material) => sum + material.download_count,
                      0
                    )}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ArrowDownTrayIcon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Materials List */}
        <div>
          {materials.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="p-16 text-center">
                <div className="space-y-6">
                  <div className="relative mx-auto w-24 h-24">
                    <BookOpenIcon className="h-24 w-24 text-muted-foreground/30 mx-auto" />
                    <div className="absolute -top-2 -right-2 p-2 bg-primary/20 rounded-full">
                      <MagnifyingGlassIcon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-card-foreground">
                      No materials found
                    </h3>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto">
                      {allMaterials.length === 0
                        ? "Start your learning journey by booking a session with one of our expert tutors!"
                        : "No materials match your search criteria. Try adjusting your filters or search terms."}
                    </p>
                  </div>
                  {allMaterials.length === 0 && (
                    <Button
                      onClick={() => navigate("/student/book-session")}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    >
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Book Your First Session
                      <ChartBarIcon className="h-4 w-4 ml-2" />
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
    </StudentPageWrapper>
  );
};

export default TutorMaterialsPage;
