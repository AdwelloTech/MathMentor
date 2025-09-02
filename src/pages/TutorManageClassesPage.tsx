import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { classSchedulingService } from "../lib/classSchedulingService";
import { TutorClass, ClassType } from "../types/classScheduling";
import { subjectsService } from "@/lib/subjects";
import type { Subject } from "@/types/subject";
import {
  CalendarDays,
  Clock,
  Users,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

const TutorManageClassesPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<TutorClass | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingClass, setEditingClass] = useState<TutorClass | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Check if tutor is active
  const isActiveTutor = profile?.is_active !== false; // Default to true if not set

  useEffect(() => {
    if (user) {
      loadClasses();
      loadClassTypes();
      subjectsService
        .listActive()
        .then(setSubjects)
        .catch(() => {});
    }
  }, [user]);

  // If tutor is inactive, show error message
  if (!isActiveTutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Account Temporarily Inactive
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Your tutor account has been temporarily deactivated by the admin.
            You cannot manage classes at this time. Please contact support for
            more information.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await classSchedulingService.classes.getByTutorId(user!.id);
      setClasses(data || []);
    } catch (err) {
      setError("Failed to load classes");
      console.error("Error loading classes:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadClassTypes = async () => {
    try {
      const data = await classSchedulingService.classTypes.getAll();
      setClassTypes(data || []);
    } catch (err) {
      console.error("Error loading class types:", err);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      setError(null);
      await classSchedulingService.classes.delete(classId);
      setClasses((prev) => prev.filter((c) => c.id !== classId));
      setSelectedClass(null);
      setShowDetails(false);
      setError(null); // Clear error on success
    } catch (err) {
      setError("Failed to delete class");
      console.error("Error deleting class:", err);
    }
  };

  const handleUpdateClass = async (updatedClass: Partial<TutorClass>) => {
    if (!editingClass) return;
    try {
      setError(null);
      console.log("Updating class with data:", updatedClass);

      const updatedData = await classSchedulingService.classes.update(
        editingClass.id,
        updatedClass
      );

      console.log("Class updated successfully:", updatedData);

      setClasses((prev) =>
        prev.map((c) => (c.id === editingClass.id ? updatedData : c))
      );
      setEditingClass(null);
      setSelectedClass(null);
      setShowDetails(false);
      setError(null); // Clear error on success

      toast.success("Class updated successfully!");
    } catch (err) {
      console.error("Error updating class:", err);
      setError("Failed to update class");

      // Show more detailed error message
      let errorMessage = "An unexpected error occurred";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object") {
        if ("message" in err) {
          errorMessage = String(err.message);
        } else if ("details" in err) {
          errorMessage = String(err.details);
        } else if ("hint" in err) {
          errorMessage = String(err.hint);
        }
      }

      toast.error(`Failed to update class: ${errorMessage}`);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getClassTypeName = (classTypeId: string) => {
    const classType = classTypes.find((ct) => ct.id === classTypeId);
    return classType?.name || "Unknown";
  };

  const filteredClasses = classes.filter((classItem) => {
    const matchesType =
      filterType === "all" || classItem.class_type_id === filterType;
    const matchesDate = !filterDate || classItem.date === filterDate;
    const matchesSearch =
      !searchTerm ||
      classItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (classItem.description &&
        classItem.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesDate && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#D5FFC5] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_50%)]"></div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-green-400/10 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-green-300/5 to-yellow-300/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Manage Classes
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            View, edit, and manage your scheduled classes
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-[0_4px_4px_0_#16803D] border-0 p-8 mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-[#16803D] w-10 h-10 rounded-xl flex items-center justify-center">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Filters & Search
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="class-type"
                className="text-sm font-bold text-gray-700"
              >
                Class Type
              </Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full h-12 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20">
                  <SelectValue placeholder="All Class Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Class Types</SelectItem>
                  {classTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="date-filter"
                className="text-sm font-bold text-gray-700"
              >
                Date
              </Label>
              <Input
                id="date-filter"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-12 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="search"
                className="text-sm font-bold text-gray-700"
              >
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-10 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20"
                />
              </div>
            </div>

            <div className="flex items-end">
              {(filterType !== "all" || filterDate || searchTerm) && (
                <Button
                  onClick={() => {
                    setFilterType("all");
                    setFilterDate("");
                    setSearchTerm("");
                  }}
                  variant="secondary"
                  className="w-full h-12 bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 focus:ring-2 focus:ring-gray-500 font-medium transition-all duration-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 shadow-sm"
          >
            <p className="text-red-800 font-medium">{error}</p>
          </motion.div>
        )}

        {filteredClasses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-[0_4px_4px_0_#16803D] border-0 p-12 text-center"
          >
            <div className="bg-[#16803D] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarDays className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No classes found
            </h3>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              {classes.length === 0
                ? "You haven't scheduled any classes yet."
                : "No classes match your current filters."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredClasses.map((classItem, index) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group cursor-pointer transition-all duration-300"
              >
                <div className="bg-white rounded-xl shadow-[0_4px_4px_0_#16803D] border-0 overflow-hidden hover:shadow-xl h-full min-h-[280px]">
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-4 flex-grow">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {classItem.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <div className="bg-[#16803D] w-6 h-6 rounded-lg flex items-center justify-center">
                            <CalendarDays className="w-3 h-3 text-white" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">
                            {getClassTypeName(classItem.class_type_id)}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-gray-700">
                          <span className="font-medium">Subject:</span> {classItem.subject?.display_name || classItem.subject?.name || "No subject"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                          classItem.status
                        )}`}
                      >
                        {classItem.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center mr-3">
                          <CalendarDays className="w-3 h-3 text-gray-600" />
                        </div>
                        <span className="font-medium">
                          {formatDate(classItem.date)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center mr-3">
                          <Clock className="w-3 h-3 text-gray-600" />
                        </div>
                        <span className="font-medium">
                          {formatTime(classItem.start_time)} -{" "}
                          {formatTime(classItem.end_time)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-3 h-3 text-gray-600" />
                        </div>
                        <span className="font-medium">
                          {classItem.current_students}/{classItem.max_students}{" "}
                          students
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700">
                        <div className="bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center mr-3">
                          <DollarSign className="w-3 h-3 text-gray-600" />
                        </div>
                        <span className="font-bold text-[#16803D]">
                          ${classItem.price_per_session}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-auto">
                      <Button
                        onClick={() => {
                          setSelectedClass(classItem);
                          setShowDetails(true);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 group-hover:scale-105 transition-all duration-200"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => setEditingClass(classItem)}
                        variant="ghost"
                        size="sm"
                        className="h-9 text-green-600 hover:text-green-700 hover:bg-green-50 group-hover:scale-105 transition-all duration-200"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteClass(classItem.id)}
                        variant="ghost"
                        size="sm"
                        className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50 group-hover:scale-105 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Class Details Modal */}
        {showDetails && selectedClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#16803D] w-12 h-12 rounded-xl flex items-center justify-center">
                      <CalendarDays className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedClass.title}
                      </h2>
                      <p className="text-gray-600">
                        {selectedClass.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowDetails(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Class Type
                      </h3>
                      <p className="text-gray-900">
                        {getClassTypeName(selectedClass.class_type_id)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Subject
                      </h3>
                      <p className="text-gray-900">
                        {selectedClass.subject?.display_name || selectedClass.subject?.name || "No subject"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Date
                      </h3>
                      <p className="text-gray-900">
                        {formatDate(selectedClass.date)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Time
                      </h3>
                      <p className="text-gray-900">
                        {formatTime(selectedClass.start_time)} -{" "}
                        {formatTime(selectedClass.end_time)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Duration
                      </h3>
                      <p className="text-gray-900">
                        {selectedClass.duration_minutes} minutes
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Price
                      </h3>
                      <p className="text-gray-900">
                        ${selectedClass.price_per_session}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Capacity
                      </h3>
                      <p className="text-gray-900">
                        {selectedClass.current_students}/
                        {selectedClass.max_students} students
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Status
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          selectedClass.status
                        )}`}
                      >
                        {selectedClass.status}
                      </span>
                    </div>
                    {selectedClass.jitsi_meeting_url && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Jitsi Meeting Link
                        </h3>
                        <a
                          href={selectedClass.jitsi_meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm break-all"
                        >
                          {selectedClass.jitsi_meeting_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                  <Button
                    onClick={() => {
                      setEditingClass(selectedClass);
                      setShowDetails(false);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-[#16803D] to-green-600 text-white hover:from-[#0F5A2A] hover:to-green-700 focus:ring-2 focus:ring-[#16803D] font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Edit Class
                  </Button>
                  <Button
                    onClick={() => setShowDetails(false)}
                    variant="secondary"
                    className="px-6 py-3 font-bold"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Class Modal */}
        {editingClass && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <EditClassForm
                classItem={editingClass}
                classTypes={classTypes}
                onSave={handleUpdateClass}
                onCancel={() => setEditingClass(null)}
              />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

interface EditClassFormProps {
  classItem: TutorClass;
  classTypes: ClassType[];
  onSave: (updatedClass: Partial<TutorClass>) => void;
  onCancel: () => void;
}

const EditClassForm: React.FC<EditClassFormProps> = ({
  classItem,
  classTypes,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: classItem.title,
    description: classItem.description || "",
    class_type_id: classItem.class_type_id,
    subject_id: classItem.subject_id || "none",
    date: classItem.date,
    start_time: classItem.start_time,
    end_time: classItem.end_time,
    max_students: classItem.max_students,
    price_per_session: classItem.price_per_session,
    status: classItem.status as
      | "scheduled"
      | "in_progress"
      | "completed"
      | "cancelled",
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    subjectsService
      .listActive()
      .then(setSubjects)
      .catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.class_type_id) {
      toast.error("Class type is required");
      return;
    }

    if (!formData.date) {
      toast.error("Date is required");
      return;
    }

    if (!formData.start_time) {
      toast.error("Start time is required");
      return;
    }

    // Calculate end time if start time changed
    let updatedFormData = { ...formData };

    if (formData.start_time && formData.class_type_id) {
      const classType = classTypes.find(
        (ct) => ct.id === formData.class_type_id
      );
      if (classType) {
        const startTime = new Date(`2000-01-01T${formData.start_time}`);
        const endTime = new Date(
          startTime.getTime() + classType.duration_minutes * 60000
        );
        const endTimeString = endTime.toTimeString().slice(0, 5);
        updatedFormData.end_time = endTimeString;
      }
    }

    // Ensure numeric fields are properly typed
    if (typeof updatedFormData.max_students === "string") {
      updatedFormData.max_students = parseInt(updatedFormData.max_students, 10);
    }
    if (typeof updatedFormData.price_per_session === "string") {
      updatedFormData.price_per_session = parseFloat(
        updatedFormData.price_per_session
      );
    }

    // Convert form data to the expected format
    const submitData: Partial<TutorClass> = {
      ...updatedFormData,
      subject_id:
        updatedFormData.subject_id === "none"
          ? undefined
          : updatedFormData.subject_id,
      description: updatedFormData.description || undefined,
    };

    console.log("Submitting form data:", submitData);
    onSave(submitData);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <div className="bg-[#16803D] w-10 h-10 rounded-xl flex items-center justify-center">
            <Edit className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Class</h2>
        </div>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-bold text-gray-900">
              Title
            </Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="h-12 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="class-type"
              className="text-sm font-bold text-gray-900"
            >
              Class Type
            </Label>
            <Select
              value={formData.class_type_id}
              onValueChange={(value) =>
                setFormData({ ...formData, class_type_id: value })
              }
            >
              <SelectTrigger className="h-12 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20">
                <SelectValue placeholder="Select class type" />
              </SelectTrigger>
              <SelectContent>
                {classTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="subject"
              className="text-sm font-bold text-gray-900"
            >
              Subject
            </Label>
            <Select
              value={formData.subject_id || "none"}
              onValueChange={(value) =>
                setFormData({ ...formData, subject_id: value })
              }
            >
              <SelectTrigger className="h-12 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20">
                <SelectValue placeholder="Select subject (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No subject</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-bold text-gray-900">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="h-12 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="start-time"
              className="text-sm font-bold text-gray-900"
            >
              Start Time
            </Label>
            <Input
              id="start-time"
              type="time"
              step="1"
              value={formData.start_time}
              onChange={(e) =>
                setFormData({ ...formData, start_time: e.target.value })
              }
              className="h-12 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="end-time"
              className="text-sm font-bold text-gray-900"
            >
              End Time
            </Label>
            <Input
              id="end-time"
              type="time"
              step="1"
              value={formData.end_time}
              onChange={(e) =>
                setFormData({ ...formData, end_time: e.target.value })
              }
              className="h-12 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="max-students"
              className="text-sm font-bold text-gray-900"
            >
              Max Students
            </Label>
            <Input
              id="max-students"
              type="number"
              value={formData.max_students || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setFormData({
                    ...formData,
                    max_students: formData.max_students || 1,
                  });
                } else {
                  const parsed = parseInt(value, 10);
                  setFormData({
                    ...formData,
                    max_students: Number.isNaN(parsed)
                      ? formData.max_students
                      : parsed,
                  });
                }
              }}
              className="h-12 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20 transition-all"
              required
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-bold text-gray-900">
              Price per Session
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price_per_session || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setFormData({
                    ...formData,
                    price_per_session: formData.price_per_session || 0,
                  });
                } else {
                  const parsed = parseFloat(value);
                  setFormData({
                    ...formData,
                    price_per_session: Number.isNaN(parsed)
                      ? formData.price_per_session
                      : parsed,
                  });
                }
              }}
              className="h-12 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20 transition-all"
              required
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-bold text-gray-900">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as
                    | "scheduled"
                    | "in_progress"
                    | "completed"
                    | "cancelled",
                })
              }
            >
              <SelectTrigger className="h-12 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-sm font-bold text-gray-900"
          >
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="h-24 border-2 border-gray-200 rounded-lg focus:border-[#16803D] focus:ring-2 focus:ring-[#16803D] focus:ring-opacity-20 transition-all resize-none"
            /* required */
          />
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            className="px-6 py-3 font-bold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-[#16803D] to-green-600 text-white hover:from-[#0F5A2A] hover:to-green-700 focus:ring-2 focus:ring-[#16803D] font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TutorManageClassesPage;
