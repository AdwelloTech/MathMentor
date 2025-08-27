import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  UserIcon,
  PhoneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import toast from "react-hot-toast";
import type { TutorApplicationFormData } from "@/types/auth";

interface TutorApplicationFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

// Available subjects for tutoring
const AVAILABLE_SUBJECTS = [
  "Mathematics",
  "Algebra",
  "Geometry",
  "Trigonometry",
  "Calculus",
  "Statistics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Literature",
  "Writing",
  "Grammar",
  "History",
  "Geography",
  "Computer Science",
  "Economics",
  "Psychology",
  "Spanish",
  "French",
  "German",
  "Arabic",
  "GCSE Mathematics",
  "A-Level Mathematics",
  "Numeracy Tests",
  "SAT Mathematics",
  "ACT Mathematics",
];

const TutorApplicationForm: React.FC<TutorApplicationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Form state
  const [formData, setFormData] = useState<TutorApplicationFormData>({
    full_name: "",
    phone_number: "",
    subjects: [],
    specializes_learning_disabilities: false,
    additional_notes: "",

    // New required fields
    postcode: "",
    based_in_country: "",

    // New optional fields
    past_experience: "",
    weekly_availability: "",
    employment_status: "",
    education_level: "",
    average_weekly_hours: undefined,
    expected_hourly_rate: undefined,
  });

  type TutorApplicationFormErrors = Partial<
    Record<keyof TutorApplicationFormData, string>
  >;

  const [errors, setErrors] = useState<TutorApplicationFormErrors>({});

  // Handle form field changes
  const handleInputChange = (
    field: keyof TutorApplicationFormData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handle subject selection
  const handleSubjectToggle = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));

    // Clear subjects error
    if (errors.subjects) {
      setErrors((prev) => ({
        ...prev,
        subjects: undefined,
      }));
    }
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      return "Please upload a PDF or Word document (.pdf, .doc, .docx)";
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return "File size must be less than 5MB";
    }

    return null;
  };

  // Handle CV file upload
  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError(null);
    setUploadedFile(file);
    toast.success("CV file selected successfully!");
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError(null);
    setUploadedFile(file);
    toast.success("CV file uploaded successfully!");
  };

  // Remove uploaded file
  const removeUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: TutorApplicationFormErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else {
      // Clean phone number (remove spaces, dashes, parentheses)
      const cleanPhone = formData.phone_number.replace(/[\s\-\(\)]/g, "");
      // Allow numbers starting with + or digits, minimum 7 digits, maximum 15 digits
      if (!/^[\+]?[\d]{7,15}$/.test(cleanPhone)) {
        newErrors.phone_number =
          "Please enter a valid phone number (7-15 digits)";
      }
    }

    if (!formData.postcode.trim()) {
      newErrors.postcode =
        "Postcode is required for local availability assessment";
    }

    if (!formData.based_in_country.trim()) {
      newErrors.based_in_country =
        "Please specify which country you are based in";
    }

    if (formData.subjects.length === 0) {
      newErrors.subjects = "Please select at least one subject";
    }

    if (!uploadedFile) {
      newErrors.cv_file = "Please upload your CV";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to submit an application");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      let cvUrl = "";
      let cvFileName = "";
      let cvFileSize = 0;

      // Upload CV file if provided
      if (uploadedFile) {
        setIsUploading(true);
        const uploadResult = await db.storage.uploadTutorCV(
          user.id,
          uploadedFile
        );
        cvUrl = uploadResult.url;
        cvFileName = uploadedFile.name;
        cvFileSize = uploadResult.size;
        setIsUploading(false);
      }

      // Submit application
      const applicationData = {
        user_id: user.id,
        applicant_email: user.email,
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        subjects: formData.subjects,
        specializes_learning_disabilities:
          formData.specializes_learning_disabilities,
        cv_file_name: cvFileName,
        cv_url: cvUrl,
        cv_file_size: cvFileSize,
        additional_notes: formData.additional_notes?.trim() || undefined,

        // New required fields
        postcode: formData.postcode.trim(),
        based_in_country: formData.based_in_country.trim(),

        // New optional fields
        past_experience: formData.past_experience?.trim() || undefined,
        weekly_availability: formData.weekly_availability?.trim() || undefined,
        employment_status: formData.employment_status?.trim() || undefined,
        education_level: formData.education_level?.trim() || undefined,
        average_weekly_hours: formData.average_weekly_hours || undefined,
        expected_hourly_rate: formData.expected_hourly_rate || undefined,
      };

      await db.tutorApplications.create(applicationData);

      toast.success("Application submitted successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Application submission error:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
        <div className="flex items-center">
          <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
            <AcademicCapIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Become a Tutor</h1>
            <p className="text-blue-100 mt-1">
              Join our team of expert educators and help students achieve their
              academic goals
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Personal Information */}
        <div className="space-y-6">
          <div className="flex items-center mb-4">
            <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Personal Information
            </h2>
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Full Name *
            </label>
            <input
              type="text"
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              className={`input w-full ${
                errors.full_name ? "border-red-500" : ""
              }`}
              placeholder="Enter your full name"
              required
            />
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phone_number"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Phone Number *
            </label>
            <div className="relative">
              <PhoneIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="tel"
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) =>
                  handleInputChange("phone_number", e.target.value)
                }
                className={`input w-full pl-10 ${
                  errors.phone_number ? "border-red-500" : ""
                }`}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
            {errors.phone_number && (
              <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>
            )}
          </div>

          {/* Postcode */}
          <div>
            <label
              htmlFor="postcode"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Postcode *
            </label>
            <Input
              type="text"
              id="postcode"
              value={formData.postcode}
              onChange={(e) => handleInputChange("postcode", e.target.value)}
              className={`input w-full ${
                errors.postcode ? "border-red-500" : ""
              }`}
              placeholder="Enter your postcode"
              required
              maxLength={20}
              showCharCount
            />
            {errors.postcode && (
              <p className="text-red-500 text-sm mt-1">{errors.postcode}</p>
            )}
          </div>

          {/* Based in Country */}
          <div>
            <label
              htmlFor="based_in_country"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Based in which country? *
            </label>
            <Input
              type="text"
              id="based_in_country"
              value={formData.based_in_country}
              onChange={(e) =>
                handleInputChange("based_in_country", e.target.value)
              }
              className={`input w-full ${
                errors.based_in_country ? "border-red-500" : ""
              }`}
              placeholder="e.g., United Kingdom, United States, etc."
              required
              maxLength={50}
              showCharCount
            />
            {errors.based_in_country && (
              <p className="text-red-500 text-sm mt-1">
                {errors.based_in_country}
              </p>
            )}
          </div>
        </div>

        {/* Teaching Information */}
        <div className="space-y-6">
          <div className="flex items-center mb-4">
            <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Teaching Information
            </h2>
          </div>

          {/* Subjects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subjects You Teach *
            </label>
            <div
              className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4 ${
                errors.subjects ? "border-red-500" : "border-gray-300"
              }`}
            >
              {AVAILABLE_SUBJECTS.map((subject) => (
                <label
                  key={subject}
                  className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                    className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{subject}</span>
                </label>
              ))}
            </div>
            {errors.subjects && (
              <p className="text-red-500 text-sm mt-1">{errors.subjects}</p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              Selected:{" "}
              {formData.subjects.length > 0
                ? formData.subjects.join(", ")
                : "None"}
            </p>
          </div>

          {/* Learning Disabilities Specialization */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start text-sm">
              <input
                type="checkbox"
                checked={formData.specializes_learning_disabilities}
                onChange={(e) =>
                  handleInputChange(
                    "specializes_learning_disabilities",
                    e.target.checked
                  )
                }
                className="mr-3 mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">
                  Specialization in Learning Disabilities
                </span>
                <p className="text-gray-600 mt-1">
                  Check if you have experience or training in teaching students
                  with learning disabilities such as dyslexia, ADHD, or other
                  special educational needs.
                </p>
              </div>
            </label>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Additional Information
            </h3>

            {/* Past Experience */}
            <div>
              <label
                htmlFor="past_experience"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Past Teaching/Tutoring Experience
              </label>
              <Textarea
                id="past_experience"
                value={formData.past_experience}
                onChange={(e) =>
                  handleInputChange("past_experience", e.target.value)
                }
                rows={3}
                className="input w-full"
                placeholder="Describe your previous teaching or tutoring experience..."
                maxLength={500}
                showCharCount
              />
            </div>

            {/* Weekly Availability */}
            <div>
              <label
                htmlFor="weekly_availability"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Weekly Availability
              </label>
              <Textarea
                id="weekly_availability"
                value={formData.weekly_availability}
                onChange={(e) =>
                  handleInputChange("weekly_availability", e.target.value)
                }
                rows={3}
                className="input w-full"
                placeholder="Describe your weekly availability for tutoring sessions..."
                maxLength={300}
                showCharCount
              />
            </div>

            {/* Employment Status */}
            <div>
              <label
                htmlFor="employment_status"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Current Employment Status
              </label>
              <Input
                type="text"
                id="employment_status"
                value={formData.employment_status}
                onChange={(e) =>
                  handleInputChange("employment_status", e.target.value)
                }
                className="input w-full"
                placeholder="e.g., Full-time teacher, Part-time tutor, Freelance, etc."
                maxLength={100}
                showCharCount
              />
            </div>

            {/* Education Level */}
            <div>
              <label
                htmlFor="education_level"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Highest Level of Education
              </label>
              <Input
                type="text"
                id="education_level"
                value={formData.education_level}
                onChange={(e) =>
                  handleInputChange("education_level", e.target.value)
                }
                className="input w-full"
                placeholder="e.g., Bachelor's degree, Master's degree, PhD, etc."
                maxLength={100}
                showCharCount
              />
            </div>

            {/* Average Weekly Hours */}
            <div>
              <label
                htmlFor="average_weekly_hours"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Average Weekly Hours Available for Tutoring
              </label>
              <input
                type="number"
                id="average_weekly_hours"
                value={formData.average_weekly_hours || ""}
                onChange={(e) =>
                  handleInputChange(
                    "average_weekly_hours",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                className="input w-full"
                placeholder="e.g., 10, 20, 30"
                min="1"
                max="168"
              />
            </div>

            {/* Expected Hourly Rate */}
            <div>
              <label
                htmlFor="expected_hourly_rate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Expected Hourly Rate (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  £
                </span>
                <input
                  type="number"
                  id="expected_hourly_rate"
                  value={formData.expected_hourly_rate || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "expected_hourly_rate",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="input w-full pl-8"
                  placeholder="e.g., 25.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CV Upload */}
        <div className="space-y-6">
          <div className="flex items-center mb-4">
            <DocumentArrowUpIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Your CV *
            </h2>
          </div>

          {uploadedFile ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <h4 className="text-lg font-medium text-green-800">
                      CV Uploaded Successfully
                    </h4>
                    <p className="text-green-700 mt-1">
                      File: {uploadedFile.name} (
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeUploadedFile}
                  className="text-green-600 hover:text-green-800 p-2"
                  title="Remove file"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? "border-blue-500 bg-blue-50"
                  : errors.cv_file
                  ? "border-red-500"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <DocumentArrowUpIcon
                className={`h-12 w-12 mx-auto mb-4 transition-colors ${
                  isDragOver ? "text-blue-500" : "text-gray-400"
                }`}
              />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {isDragOver
                  ? "Drop your CV here"
                  : "Upload Your Curriculum Vitae"}
              </h4>
              <p className="text-gray-600 mb-6">
                {isDragOver
                  ? "Release to upload your CV file"
                  : "Drag and drop your resume/CV here, or click to browse"}
              </p>

              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}

              <label className="btn btn-primary cursor-pointer">
                <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                Choose File
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCVUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-3">
                PDF or Word documents only, max 5MB
              </p>
            </div>
          )}
          {errors.cv_file && (
            <p className="text-red-500 text-sm">{errors.cv_file}</p>
          )}
        </div>

        {/* Additional Notes */}
        <div className="space-y-4">
          <label
            htmlFor="additional_notes"
            className="block text-sm font-medium text-gray-700"
          >
            Additional Notes (Optional)
          </label>
          <Textarea
            id="additional_notes"
            value={formData.additional_notes}
            onChange={(e) =>
              handleInputChange("additional_notes", e.target.value)
            }
            rows={4}
            className="input w-full"
            placeholder="Tell us anything else you'd like us to know about your teaching experience, achievements, or why you want to join our team..."
            maxLength={1000}
            showCharCount
          />
        </div>

        {/* Submit Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Your application will be reviewed by our team within 2-3 business
              days.
            </p>
            <div className="flex space-x-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || isUploading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    {isUploading
                      ? "Uploading CV..."
                      : "Submitting Application..."}
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default TutorApplicationForm;
