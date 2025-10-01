import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import toast from "react-hot-toast";
import type { TutorApplicationFormData } from "@/types/auth";
import { useCVUpload } from "@/hooks/useCVUpload";
import PersonalInfoSection from "@/components/tutor/application/form/PersonalInfoSection";
import TeachingInfoSection from "@/components/tutor/application/form/TeachingInfoSection";
import CVUploadSection from "@/components/tutor/application/form/CVUploadSection";

interface TutorApplicationFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

type TutorApplicationFormErrors = Partial<
  Record<keyof TutorApplicationFormData | "cv_file", string>
>;

const TutorApplicationForm: React.FC<TutorApplicationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const cvUpload = useCVUpload();

  const [formData, setFormData] = useState<TutorApplicationFormData>({
    full_name: "",
    phone_number: "",
    subjects: [],
    specializes_learning_disabilities: false,
    additional_notes: "",
    postcode: "",
    based_in_country: "",
    past_experience: "",
    weekly_availability: "",
    employment_status: "",
    education_level: "",
    average_weekly_hours: undefined,
    expected_hourly_rate: undefined,
  });

  const [errors, setErrors] = useState<TutorApplicationFormErrors>({});

  const handleInputChange = (
    field: keyof TutorApplicationFormData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));

    if (errors.subjects) {
      setErrors((prev) => ({
        ...prev,
        subjects: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: TutorApplicationFormErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else {
      const cleanPhone = formData.phone_number.replace(/[\s\-\(\)]/g, "");
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

    if (!cvUpload.uploadedFile) {
      newErrors.cv_file = "Please upload your CV";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

      if (cvUpload.uploadedFile) {
        setIsUploading(true);
        const uploadResult = await db.storage.uploadTutorCV(
          user.id,
          cvUpload.uploadedFile
        );
        cvUrl = uploadResult.url;
        cvFileName = cvUpload.uploadedFile.name;
        cvFileSize = uploadResult.size;
        setIsUploading(false);
      }

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
        postcode: formData.postcode.trim(),
        based_in_country: formData.based_in_country.trim(),
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
      className="max-w-4xl mx-auto bg-card rounded-lg shadow-lg overflow-hidden border border-border"
    >
      <div className="bg-gradient-to-r from-primary via-primary to-primary/90 px-8 py-6">
        <div className="flex items-center">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg mr-4">
            <AcademicCapIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading text-white">Complete Your Tutor Application</h1>
            <p className="text-white/95 mt-1">
              Please provide your details and qualifications to start tutoring with us
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-card">
        <PersonalInfoSection
          formData={{
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            postcode: formData.postcode,
            based_in_country: formData.based_in_country,
          }}
          errors={errors}
          onChange={handleInputChange as any}
        />

        <TeachingInfoSection
          formData={{
            subjects: formData.subjects,
            specializes_learning_disabilities:
              formData.specializes_learning_disabilities,
            past_experience: formData.past_experience,
            weekly_availability: formData.weekly_availability,
            employment_status: formData.employment_status,
            education_level: formData.education_level,
            average_weekly_hours: formData.average_weekly_hours,
            expected_hourly_rate: formData.expected_hourly_rate,
          }}
          errors={errors}
          onChange={handleInputChange as any}
          onSubjectToggle={handleSubjectToggle}
        />

        <CVUploadSection
          uploadedFile={cvUpload.uploadedFile}
          uploadError={cvUpload.uploadError}
          isDragOver={cvUpload.isDragOver}
          errors={errors}
          fileInputRef={cvUpload.fileInputRef}
          onFileChange={cvUpload.handleCVUpload}
          onDragOver={cvUpload.handleDragOver}
          onDragLeave={cvUpload.handleDragLeave}
          onDrop={cvUpload.handleDrop}
          onRemoveFile={cvUpload.removeUploadedFile}
        />

        <div className="space-y-4">
          <label
            htmlFor="additional_notes"
            className="block text-sm font-medium text-secondary-foreground"
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
            className="w-full"
            placeholder="Tell us anything else you'd like us to know about your teaching experience, achievements, or why you want to join our team..."
            maxLength={1000}
            showCharCount
          />
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
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

