import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserIcon,
  AcademicCapIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";

interface TutorProfileEditProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

// Available subjects for tutoring
const AVAILABLE_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Geography",
  "Computer Science",
  "Economics",
  "Psychology",
  "Statistics",
  "Calculus",
  "Algebra",
  "Geometry",
  "Trigonometry",
  "Literature",
  "Writing",
  "Grammar",
  "Spanish",
  "French",
  "German",
  "Arabic",
];

const TutorProfileEdit: React.FC<TutorProfileEditProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { profile, updateProfile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    bio: "",
    subjects: [] as string[],
    specializes_learning_disabilities: false,
    qualification: "",
    experience_years: "",
    hourly_rate: "",
    availability: "",
    languages: [] as string[],
    certifications: [] as string[],
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile && isOpen) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.id
          ? `${profile.first_name?.toLowerCase() || ""}${
              profile.last_name?.toLowerCase() || ""
            }@example.com`
          : "",
        bio: profile.bio || "",
        subjects: profile.subjects || [],
        specializes_learning_disabilities:
          profile.specializations?.includes("Learning Disabilities") || false,
        qualification: profile.qualification || "",
        experience_years: profile.experience_years?.toString() || "",
        hourly_rate: profile.hourly_rate?.toString() || "",
        availability: profile.availability || "",
        languages: profile.languages || [],
        certifications: profile.certifications || [],
      });
    }
  }, [profile, isOpen]);

  // Handle form field changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle subject selection
  const handleSubjectToggle = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  // Handle CV file upload
  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes("pdf") && !file.type.includes("document")) {
      setUploadError("Please upload a PDF or Word document");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // For now, we'll simulate the upload
      // In a real implementation, you'd upload to storage and get a URL
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update profile with CV info
      await updateProfile({
        cv_file_name: file.name,
        cv_url: `uploads/cv/${profile?.id}/${file.name}`, // Simulated URL
      });

      toast.success("CV uploaded successfully!");
    } catch (error) {
      console.error("CV upload error:", error);
      setUploadError("Failed to upload CV. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    setLoading(true);

    try {
      // Parse the full name into first_name and last_name
      const nameParts = formData.full_name.trim().split(" ");
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || "";

      // Prepare specializations array
      const specializations = [];
      if (formData.specializes_learning_disabilities) {
        specializations.push("Learning Disabilities");
      }

      // Prepare updates object
      const updates = {
        first_name,
        last_name,
        full_name: formData.full_name,
        bio: formData.bio,
        subjects: formData.subjects,
        specializations,
        qualification: formData.qualification,
        experience_years: formData.experience_years
          ? parseInt(formData.experience_years)
          : null,
        hourly_rate: formData.hourly_rate
          ? parseFloat(formData.hourly_rate)
          : null,
        availability: formData.availability,
        languages: formData.languages,
        certifications: formData.certifications,
        profile_completed: true, // Mark profile as completed
        updated_at: new Date().toISOString(),
      };

      await updateProfile(updates);
      toast.success("Profile updated successfully!");
      onSave();
      onClose();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Tutor Profile
              </h2>
              <p className="text-sm text-gray-600">
                Update your professional information and teaching details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-lg"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Personal Information
              </h3>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    handleInputChange("full_name", e.target.value)
                  }
                  className="input w-full"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || "Loading..."}
                  className="input w-full bg-gray-100 text-gray-600"
                  disabled
                  title="Email cannot be changed here"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed from this form
                </p>
              </div>

              {/* Bio/Introduction */}
              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Bio/Introduction *
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  rows={4}
                  className="input w-full"
                  placeholder="Write a short description about yourself, your teaching style, and experience..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Students will see this when choosing a tutor
                </p>
              </div>
            </div>

            {/* Teaching Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-600" />
                Teaching Information
              </h3>

              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjects You Teach *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {AVAILABLE_SUBJECTS.map((subject) => (
                    <label key={subject} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectToggle(subject)}
                        className="mr-2 rounded"
                      />
                      {subject}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selected:{" "}
                  {formData.subjects.length > 0
                    ? formData.subjects.join(", ")
                    : "None"}
                </p>
              </div>

              {/* Specialization */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.specializes_learning_disabilities}
                    onChange={(e) =>
                      handleInputChange(
                        "specializes_learning_disabilities",
                        e.target.checked
                      )
                    }
                    className="mr-2 rounded"
                  />
                  Specialization in Learning Disabilities
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Check if you offer specialized support for learning
                  disabilities
                </p>
              </div>

              {/* Qualification */}
              <div>
                <label
                  htmlFor="qualification"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Qualification *
                </label>
                <input
                  type="text"
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) =>
                    handleInputChange("qualification", e.target.value)
                  }
                  className="input w-full"
                  placeholder="e.g., Bachelor's in Mathematics, Master's in Education"
                  required
                />
              </div>

              {/* Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="experience_years"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    id="experience_years"
                    value={formData.experience_years}
                    onChange={(e) =>
                      handleInputChange("experience_years", e.target.value)
                    }
                    className="input w-full"
                    placeholder="e.g., 5"
                    min="0"
                    max="50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="hourly_rate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Hourly Rate (USD)
                  </label>
                  <input
                    type="number"
                    id="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={(e) =>
                      handleInputChange("hourly_rate", e.target.value)
                    }
                    className="input w-full"
                    placeholder="e.g., 25"
                    min="10"
                    max="200"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Availability */}
              <div>
                <label
                  htmlFor="availability"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Availability
                </label>
                <textarea
                  id="availability"
                  value={formData.availability}
                  onChange={(e) =>
                    handleInputChange("availability", e.target.value)
                  }
                  rows={2}
                  className="input w-full"
                  placeholder="e.g., Monday-Friday 6PM-9PM, Weekends 9AM-5PM"
                />
              </div>
            </div>

            {/* CV Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <DocumentArrowUpIcon className="h-5 w-5 mr-2 text-blue-600" />
                Curriculum Vitae
              </h3>

              {profile?.cv_url ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-800">
                        CV Uploaded Successfully
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        File: {profile.cv_file_name}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="btn btn-secondary btn-sm cursor-pointer">
                      <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                      Update CV
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCVUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <DocumentArrowUpIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Upload Your CV
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Upload your curriculum vitae to complete your tutor profile
                  </p>

                  {uploadError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-red-600">{uploadError}</p>
                    </div>
                  )}

                  <label className="btn btn-primary cursor-pointer">
                    {isUploading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                        Choose File
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCVUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PDF or Word documents only, max 5MB
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  loading ||
                  formData.subjects.length === 0 ||
                  !formData.full_name ||
                  !formData.bio ||
                  !formData.qualification
                }
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving Changes...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default TutorProfileEdit;
