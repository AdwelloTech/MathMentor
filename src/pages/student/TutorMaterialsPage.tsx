import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  StarIcon,
  DocumentTextIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  LockClosedIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StudentTutorMaterialCard from "@/components/student/StudentTutorMaterialCard";
import StudentTutorMaterialViewer from "@/components/student/StudentTutorMaterialViewer";
import {
  getStudentTutorMaterials,
  transformStudentTutorMaterialForCard,
  checkStudentPremiumAccess,
  type StudentTutorMaterial,
  type StudentTutorMaterialsSearchParams,
} from "@/lib/studentTutorMaterials";
import { getNoteSubjects } from "@/lib/notes";
import toast from "react-hot-toast";

const TutorMaterialsPage: React.FC = () => {
  const { user, profile } = useAuth();
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
  const [selectedSubject, setSelectedSubject] = useState<string>("");
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
            material.subjectDisplayName?.toLowerCase().includes(term) ||
            material.tutorName?.toLowerCase().includes(term)
        );
      }

      // Filter by subject
      if (selectedSubject) {
        filtered = filtered.filter(
          (material) => material.subjectId === selectedSubject
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
    setSelectedSubject("");
  };

  const hasActiveFilters = searchTerm.trim() || selectedSubject;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tutor Materials
              </h1>
              <p className="text-gray-600">
                Access study materials from your booked tutors
              </p>
            </div>
            {!hasPremiumAccess && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/student/packages")}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium rounded-lg shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200"
              >
                <StarIcon className="h-5 w-5 mr-2" />
                Upgrade to Premium
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Showing filtered results
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Materials
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {materials.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <StarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Premium Materials
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {materials.filter((material) => material.is_premium).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <EyeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {materials.reduce(
                    (sum, material) => sum + material.view_count,
                    0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArrowDownTrayIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Downloads
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {materials.reduce(
                    (sum, material) => sum + material.download_count,
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Materials List */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {materials.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No materials found
              </h3>
              <p className="text-gray-600 mb-6">
                {materials.length === 0
                  ? "You haven't booked any classes with tutors yet. Book a session to access their study materials!"
                  : "No materials match your search criteria. Try adjusting your filters."}
              </p>
              {materials.length === 0 && (
                <button
                  onClick={() => navigate("/student/book-session")}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Book Your First Session
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material, index) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StudentTutorMaterialCard
                    {...transformStudentTutorMaterialForCard(
                      material,
                      material.is_premium ? hasPremiumAccess : true
                    )}
                    onView={() => handleViewMaterial(material)}
                    onViewCountUpdate={handleViewCountUpdate}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Material Viewer Modal */}
      <AnimatePresence>
        {isViewerOpen && selectedMaterial && (
          <StudentTutorMaterialViewer
            isOpen={isViewerOpen}
            onClose={handleCloseViewer}
            material={selectedMaterial}
            hasPremiumAccess={hasPremiumAccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TutorMaterialsPage;
