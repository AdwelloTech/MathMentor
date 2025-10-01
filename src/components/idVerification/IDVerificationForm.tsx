import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import {
  IdentificationIcon,
  CameraIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import {
  idVerificationService,
  IDVerificationFormData,
} from "@/lib/idVerificationService";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface IDVerificationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const IDVerificationForm: React.FC<IDVerificationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<Partial<IDVerificationFormData>>({
    id_type: "national_id",
    id_number: "",
    full_name: "",
    date_of_birth: "",
    expiry_date: "",
    issuing_country: "",
    issuing_authority: "",
  });

  const [files, setFiles] = useState<{
    front_image: File | null;
    back_image: File | null;
    selfie_with_id: File | null;
  }>({
    front_image: null,
    back_image: null,
    selfie_with_id: null,
  });

  const [previews, setPreviews] = useState<{
    front_image: string | null;
    back_image: string | null;
    selfie_with_id: string | null;
  }>({
    front_image: null,
    back_image: null,
    selfie_with_id: null,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRefs = {
    front_image: useRef<HTMLInputElement>(null),
    back_image: useRef<HTMLInputElement>(null),
    selfie_with_id: useRef<HTMLInputElement>(null),
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (field: keyof typeof files, file: File | null) => {
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [field]: "Please upload a valid image file (JPEG, PNG, or WebP)",
        }));
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [field]: "File size must be less than 5MB",
        }));
        return;
      }

      setFiles((prev) => ({ ...prev, [field]: file }));
      setErrors((prev) => ({ ...prev, [field]: "" }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => ({
          ...prev,
          [field]: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.id_number?.trim()) {
      newErrors.id_number = "ID number is required";
    }
    if (!formData.full_name?.trim()) {
      newErrors.full_name = "Full name is required";
    }

    // Required files
    if (!files.front_image) {
      newErrors.front_image = "Front image is required";
    }
    if (!files.back_image) {
      newErrors.back_image = "Back image is required";
    }
    if (!files.selfie_with_id) {
      newErrors.selfie_with_id = "Selfie with ID is required";
    }

    // Date validation
    if (formData.expiry_date && new Date(formData.expiry_date) < new Date()) {
      newErrors.expiry_date = "Expiry date cannot be in the past";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    if (!files.front_image || !files.back_image || !files.selfie_with_id) {
      toast.error("Please upload all required images");
      return;
    }

    setLoading(true);
    try {
      const submissionData: IDVerificationFormData = {
        ...(formData as IDVerificationFormData),
        front_image: files.front_image,
        back_image: files.back_image,
        selfie_with_id: files.selfie_with_id,
      };

      await idVerificationService.submitVerification(submissionData);

      toast.success("ID verification submitted successfully!");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting ID verification:", error);
      toast.error("Failed to submit ID verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (field: keyof typeof files) => {
    setFiles((prev) => ({ ...prev, [field]: null }));
    setPreviews((prev) => ({ ...prev, [field]: null }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-4xl mx-auto ${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-white'} rounded-2xl shadow-2xl border-0 transition-colors duration-200`}
    >
      <div className={`p-8 border-b-2 ${theme === 'dark' ? 'border-[#334155]' : 'border-gray-100'} transition-colors duration-200`}>
        <div className="flex items-center space-x-4">
          <div className={`p-3 ${theme === 'dark' ? 'bg-[#10B981]' : 'bg-green-900'} rounded-2xl shadow-lg transition-colors duration-200`}>
            <IdentificationIcon className={`h-8 w-8 ${theme === 'dark' ? 'text-[#D1FAE5]' : 'text-yellow-400'} transition-colors duration-200`} />
          </div>
          <div>
            <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-[#F1F5F9]' : 'text-green-900'} transition-colors duration-200`}>
              ID Verification
            </h2>
            <p className={`text-base ${theme === 'dark' ? 'text-[#CBD5E1]' : 'text-slate-600'} mt-2 transition-colors duration-200`}>
              Please provide your identification documents for verification
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`p-8 space-y-8 ${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-white'} transition-colors duration-200`}>
        {/* ID Type and Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-base font-semibold ${theme === 'dark' ? 'text-[#CBD5E1]' : 'text-gray-700'} mb-3 transition-colors duration-200`}>
              ID Type *
            </label>
            <select
              value={formData.id_type || ""}
              onChange={(e) => handleInputChange("id_type", e.target.value)}
              className={`w-full px-4 py-3 border-2 ${theme === 'dark' ? 'border-[#334155] bg-[#1E293B] text-[#F1F5F9]' : 'border-gray-200 bg-white text-gray-900'} rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors duration-200`}
            >
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's License</option>
              <option value="student_id">Student ID</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className={`block text-base font-semibold ${theme === 'dark' ? 'text-[#CBD5E1]' : 'text-gray-700'} mb-3 transition-colors duration-200`}>
              ID Number *
            </label>
            <input
              type="text"
              value={formData.id_number || ""}
              onChange={(e) => handleInputChange("id_number", e.target.value)}
              className={`w-full px-4 py-3 border-2 ${theme === 'dark' ? 'border-[#334155] bg-[#1E293B] text-[#F1F5F9] placeholder-[#94A3B8]' : 'border-gray-200 bg-white text-gray-900 placeholder-[#6B7280]'} rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors duration-200 ${
                errors.id_number ? "border-red-500" : ""
              }`}
              placeholder="Enter your ID number"
            />
            {errors.id_number && (
              <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} font-medium transition-colors duration-200`}>
                {errors.id_number}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-base font-semibold ${theme === 'dark' ? 'text-[#CBD5E1]' : 'text-gray-700'} mb-3 transition-colors duration-200`}>
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name || ""}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              className={`w-full px-4 py-3 border-2 ${theme === 'dark' ? 'border-[#334155] bg-[#1E293B] text-[#F1F5F9] placeholder-[#94A3B8]' : 'border-gray-200 bg-white text-gray-900 placeholder-[#6B7280]'} rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors duration-200 ${
                errors.full_name ? "border-red-500" : ""
              }`}
              placeholder="Enter your full name"
            />
            {errors.full_name && (
              <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} font-medium transition-colors duration-200`}>
                {errors.full_name}
              </p>
            )}
          </div>

          <div>
            <label className={`block text-base font-semibold ${theme === 'dark' ? 'text-[#CBD5E1]' : 'text-gray-700'} mb-3 transition-colors duration-200`}>
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.date_of_birth || ""}
              onChange={(e) =>
                handleInputChange("date_of_birth", e.target.value)
              }
              className={`w-full px-4 py-3 border-2 ${theme === 'dark' ? 'border-[#334155] bg-[#1E293B] text-[#F1F5F9]' : 'border-gray-200 bg-white text-gray-900'} rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors duration-200`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-base font-semibold ${theme === 'dark' ? 'text-[#CBD5E1]' : 'text-gray-700'} mb-3 transition-colors duration-200`}>
              Expiry Date
            </label>
            <input
              type="date"
              value={formData.expiry_date || ""}
              onChange={(e) => handleInputChange("expiry_date", e.target.value)}
              className={`w-full px-4 py-3 border-2 ${theme === 'dark' ? 'border-[#334155] bg-[#1E293B] text-[#F1F5F9]' : 'border-gray-200 bg-white text-gray-900'} rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors duration-200 ${
                errors.expiry_date ? "border-red-500" : ""
              }`}
            />
            {errors.expiry_date && (
              <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} font-medium transition-colors duration-200`}>
                {errors.expiry_date}
              </p>
            )}
          </div>

          <div>
            <label className={`block text-base font-semibold ${theme === 'dark' ? 'text-[#CBD5E1]' : 'text-gray-700'} mb-3 transition-colors duration-200`}>
              Issuing Country
            </label>
            <input
              type="text"
              value={formData.issuing_country || ""}
              onChange={(e) =>
                handleInputChange("issuing_country", e.target.value)
              }
              className={`w-full px-4 py-3 border-2 ${theme === 'dark' ? 'border-[#334155] bg-[#1E293B] text-[#F1F5F9] placeholder-[#94A3B8]' : 'border-gray-200 bg-white text-gray-900 placeholder-[#6B7280]'} rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors duration-200`}
              placeholder="e.g., Sri Lanka"
            />
          </div>
        </div>

        <div>
          <label className={`block text-base font-semibold ${theme === 'dark' ? 'text-[#CBD5E1]' : 'text-gray-700'} mb-3 transition-colors duration-200`}>
            Issuing Authority
          </label>
          <input
            type="text"
            value={formData.issuing_authority || ""}
            onChange={(e) =>
              handleInputChange("issuing_authority", e.target.value)
            }
            className={`w-full px-4 py-3 border-2 ${theme === 'dark' ? 'border-[#334155] bg-[#1E293B] text-[#F1F5F9] placeholder-[#94A3B8]' : 'border-gray-200 bg-white text-gray-900 placeholder-[#6B7280]'} rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors duration-200`}
            placeholder="e.g., Department of Registration of Persons"
          />
        </div>

        {/* Image Upload Section */}
        <div className="space-y-8">
          <div className={`border-t-2 ${theme === 'dark' ? 'border-[#334155]' : 'border-gray-100'} pt-8 transition-colors duration-200`}>
            <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-[#F1F5F9]' : 'text-green-900'} mb-6 transition-colors duration-200`}>
              Upload Documents
            </h3>
            <div className={`${theme === 'dark' ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.2)]' : 'bg-blue-50 border-blue-200'} border-2 rounded-2xl p-6 mb-8 shadow-lg transition-colors duration-200`}>
              <div className="flex items-start space-x-4">
                <div className={`p-2 ${theme === 'dark' ? 'bg-[#10B981]' : 'bg-blue-600'} rounded-2xl shadow-lg transition-colors duration-200`}>
                  <ExclamationTriangleIcon className={`h-6 w-6 ${theme === 'dark' ? 'text-[#D1FAE5]' : 'text-white'} mt-0.5 transition-colors duration-200`} />
                </div>
                <div className={`text-base ${theme === 'dark' ? 'text-[#CBD5E1]' : 'text-blue-800'} transition-colors duration-200`}>
                  <p className="font-bold mb-3">Important:</p>
                  <ul className="space-y-2">
                    <li>• All images must be clear and legible</li>
                    <li>• Maximum file size: 5MB per image</li>
                    <li>• Supported formats: JPEG, PNG, WebP</li>
                    <li>
                      • Selfie must show your face clearly with the ID visible
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Front Image */}
            <div>
              <label className={`block text-base font-semibold ${theme === 'dark' ? 'text-[#CBD5E1]' : 'text-gray-700'} mb-3 transition-colors duration-200`}>
                Front Image *
              </label>
              <div className="space-y-4">
                {previews.front_image ? (
                  <div className="relative">
                    <img
                      src={previews.front_image}
                      alt="Front ID"
                      className="w-full h-48 object-cover rounded-2xl border-2 border-gray-200 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile("front_image")}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors duration-200"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRefs.front_image.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all duration-200 shadow-sm"
                  >
                    <CameraIcon className="h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-base text-gray-600 font-medium">
                      Click to upload front image
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRefs.front_image}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange("front_image", e.target.files?.[0] || null)
                  }
                  className="hidden"
                />
                {errors.front_image && (
                  <p className="text-sm text-red-600 font-medium">
                    {errors.front_image}
                  </p>
                )}
              </div>
            </div>

            {/* Back Image */}
            <div>
              <label className={`block text-base font-semibold ${theme === 'dark' ? 'text-[#CBD5E1]' : 'text-gray-700'} mb-3 transition-colors duration-200`}>
                Back Image *
              </label>
              <div className="space-y-4">
                {previews.back_image ? (
                  <div className="relative">
                    <img
                      src={previews.back_image}
                      alt="Back ID"
                      className="w-full h-48 object-cover rounded-2xl border-2 border-gray-200 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile("back_image")}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors duration-200"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRefs.back_image.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all duration-200 shadow-sm"
                  >
                    <CameraIcon className="h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-base text-gray-600 font-medium">
                      Click to upload back image
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRefs.back_image}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange("back_image", e.target.files?.[0] || null)
                  }
                  className="hidden"
                />
                {errors.back_image && (
                  <p className="text-sm text-red-600 font-medium">
                    {errors.back_image}
                  </p>
                )}
              </div>
            </div>

            {/* Selfie with ID */}
            <div>
              <label className={`block text-base font-semibold ${theme === 'dark' ? 'text-[#CBD5E1]' : 'text-gray-700'} mb-3 transition-colors duration-200`}>
                Selfie with ID *
              </label>
              <div className="space-y-4">
                {previews.selfie_with_id ? (
                  <div className="relative">
                    <img
                      src={previews.selfie_with_id}
                      alt="Selfie with ID"
                      className="w-full h-48 object-cover rounded-2xl border-2 border-gray-200 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile("selfie_with_id")}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors duration-200"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() =>
                      fileInputRefs.selfie_with_id.current?.click()
                    }
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all duration-200 shadow-sm"
                  >
                    <CameraIcon className="h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-base text-gray-600 font-medium">
                      Click to upload selfie
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRefs.selfie_with_id}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(
                      "selfie_with_id",
                      e.target.files?.[0] || null
                    )
                  }
                  className="hidden"
                />
                {errors.selfie_with_id && (
                  <p className="text-sm text-red-600 font-medium">
                    {errors.selfie_with_id}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className={`flex items-center justify-end space-x-6 pt-8 border-t-2 ${theme === 'dark' ? 'border-[#334155]' : 'border-gray-100'} transition-colors duration-200`}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`px-8 py-3 border-2 ${theme === 'dark' ? 'border-[#475569] bg-[#1E293B] text-[#F1F5F9] hover:bg-[#334155]' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-lg hover:shadow-xl transition-all duration-200 font-medium`}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-3 ${theme === 'dark' ? 'bg-[#10B981] hover:bg-[#059669]' : 'bg-green-900 hover:bg-green-800'} text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-200 font-medium`}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className={theme === 'dark' ? 'text-[#D1FAE5]' : ''} />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="h-6 w-6" />
                <span>Submit Verification</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default IDVerificationForm;
