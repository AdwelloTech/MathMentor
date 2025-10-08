import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  UserIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import MultiSelect from "@/components/ui/multi-select";
import { validateDocumentFile } from "@/constants/form";
import { subjectsService } from "@/lib/subjects";
import type { Subject } from "@/types/subject";
import apiClient from "@/lib/apiClient";

interface TutorProfileFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other" | undefined;
  emergencyContact: string;
  qualification: string;
  experienceYears: number | undefined;
  specializations: string[];
  hourlyRate: number | undefined;
  availability: string;
  bio: string;
  certifications: string[];
  languages: string[];
  cvFileName: string;
  cvStoragePath?: string; // Now stores the URL instead of storage path
}

const TutorProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [cvUploadError, setCvUploadError] = useState<string | null>(null);
  const [currentProfileImageUrl, setCurrentProfileImageUrl] = useState<
    string | null
  >(null);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  const [formData, setFormData] = useState<TutorProfileFormData>({
    email: user?.email || "",
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    dateOfBirth: profile?.date_of_birth || "",
    gender: profile?.gender || undefined,
    emergencyContact: profile?.emergency_contact || "",
    qualification: profile?.qualification || "",
    experienceYears: profile?.experience_years || undefined,
    specializations: profile?.specializations || [],
    hourlyRate: profile?.hourly_rate || undefined,
    availability: profile?.availability || "",
    bio: profile?.bio || "",
    certifications: profile?.certifications || [],
    languages: profile?.languages || [],
    cvFileName: profile?.cv_file_name || "",
    cvStoragePath: profile?.cv_url || "", // cv_url instead of cv_storage_path
  });

  // Load profile data from auth context
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id || !profile) return;

      try {
        setIsLoading(true);

        // Load available subjects
        try {
          const subjects = await subjectsService.listActive();
          setAvailableSubjects(subjects);
        } catch (error) {
          console.warn('Failed to load subjects, using empty list:', error);
          setAvailableSubjects([]); // Use empty array as fallback
        }

        // Profile data comes from auth context which uses the new backend
        setFormData({
          email: user.email || "",
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          phone: profile.phone || "",
          address: profile.address || "",
          dateOfBirth: profile.date_of_birth || "",
          gender: profile.gender || undefined,
          emergencyContact: profile.emergency_contact || "",
          qualification: profile.qualification || "",
          experienceYears: profile.experience_years || undefined,
          specializations: profile.specializations || [],
          hourlyRate: profile.hourly_rate || undefined,
          availability: profile.availability || "",
          bio: profile.bio || "",
          certifications: profile.certifications || [],
          languages: profile.languages || [],
          cvFileName: profile.cv_file_name || "",
          cvStoragePath: profile.cv_url || "", // cv_url instead of cv_storage_path
        });

        // Set profile image URL from profile data
        setCurrentProfileImageUrl(profile.profile_image_url || null);
      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id, profile]);

  // -----------------------------
  // Helpers
  // -----------------------------
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = <K extends keyof TutorProfileFormData>(
    name: K,
    value: TutorProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (
    name: keyof TutorProfileFormData,
    value: string[]
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayInputChange = (
    name: keyof TutorProfileFormData,
    csv: string
  ) => {
    const arr = csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    handleArrayChange(name, arr);
  };

  const handleNumberChange = (
    name: keyof TutorProfileFormData,
    value: number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = async (imageUrl: string | null) => {
    setCurrentProfileImageUrl(imageUrl);
    // The profile image URL will be updated when the auth context refreshes
    // No need to manually call updateProfile as the ProfileImageUpload component
    // handles the backend update and the auth context should reflect this
  };

  // -----------------------------
  // CV upload using new backend API
  // -----------------------------
  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateDocumentFile(file)) {
      setCvUploadError("Please upload a PDF (.pdf) or Word (.doc, .docx) file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCvUploadError("File size must be less than 5MB");
      return;
    }

    if (!user?.id) {
      setCvUploadError("User not authenticated");
      return;
    }

    setIsUploadingCV(true);
    setCvUploadError(null);

    try {
      // Create FormData for multipart upload
      const formDataUpload = new FormData();
      formDataUpload.append('document', file);
      formDataUpload.append('userId', user.id);
      formDataUpload.append('entityType', 'user_profile');
      formDataUpload.append('entityId', user.id);
      formDataUpload.append('isPublic', 'false');

      // Upload document via backend API
      const documentData = await apiClient.post<{ id: string; url: string; fileName: string }>('/api/files/documents/upload', formDataUpload);

      // Update user profile with CV information
      await apiClient.put('/api/auth/profile', {
        cvFileName: file.name,
        cvUrl: documentData.url,
      });

      // Update local form data
      setFormData((prev) => ({
        ...prev,
        cvFileName: file.name,
        cvStoragePath: documentData.url, // Store the URL instead of storage path
      }));

      // Clean up old CV document if it exists (best effort)
      if (formData.cvStoragePath && formData.cvFileName) {
        try {
          // Find and delete the old document (we'd need the document ID for this)
          // For now, we'll just update the profile and let the old document remain
          // In a production system, you might want to track document IDs
        } catch (cleanupErr) {
          console.warn("Cleanup of previous CV failed:", cleanupErr);
        }
      }

    } catch (err: any) {
      console.error("CV upload error:", err);
      setCvUploadError(
        err?.message || "Failed to upload CV. Please try again."
      );
    } finally {
      setIsUploadingCV(false);
      // clear the input value so user can re-select same file
      (event.target as HTMLInputElement).value = "";
    }
  };

  const handleCVView = async () => {
    if (!formData.cvStoragePath) return;
    // Since cvStoragePath now contains the URL directly, we can open it directly
    window.open(formData.cvStoragePath, "_blank", "noopener,noreferrer");
  };

  const handleCVRemove = async () => {
    if (!user?.id) return;
    try {
      // Update user profile to clear CV information
      await apiClient.put('/api/auth/profile', {
        cvFileName: null,
        cvUrl: null,
      });

      // Clear local form data
      setFormData((prev) => ({ ...prev, cvFileName: "", cvStoragePath: "" }));

    } catch (err) {
      console.error("Failed to remove CV:", err);
      setCvUploadError("Failed to remove CV. Please try again.");
    }
  };

  // -----------------------------
  // Submit
  // -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      if (!user?.id) throw new Error("User not authenticated");

      // Include all profile fields
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        dateOfBirth: formData.dateOfBirth?.trim() || null,
        gender: formData.gender || null,
        emergencyContact: formData.emergencyContact?.trim() || null,
        qualification: formData.qualification?.trim() || null,
        experienceYears: formData.experienceYears ?? null,
        specializations: formData.specializations?.filter(s => s.trim()) || [],
        hourlyRate: formData.hourlyRate ?? null,
        availability: formData.availability?.trim() || null,
        bio: formData.bio?.trim() || null,
        certifications: formData.certifications?.filter(c => c.trim()) || [],
        languages: formData.languages?.filter(l => l.trim()) || [],
        cvFileName: formData.cvFileName?.trim() || null,
        cvUrl: formData.cvStoragePath?.trim() || null, // cvStoragePath now contains the URL
      };

      // Update profile via backend API with retry logic
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          await apiClient.put('/api/auth/profile', updateData);
          break; // Success, exit retry loop
        } catch (error: any) {
          attempts++;
          console.warn(`Profile update attempt ${attempts} failed:`, error.message);

          if (attempts >= maxAttempts) {
            throw new Error(`Failed to update profile after ${maxAttempts} attempts: ${error.message}`);
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      // If we get here, the update was successful (apiClient throws on error)

      setSaveStatus("success");
      setErrorMessage("");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setSaveStatus("error");
      setErrorMessage(err?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-slate-700 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white pb-8 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Tutor Profile
              </h2>
              <p className="text-green-100 mt-1">
                View and update your professional information and
                qualifications.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Profile Image */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center"
          >
            <div className="flex items-center mb-6">
              <div className="p-2 bg-green-500/20 rounded-xl mr-3">
                <PhotoIcon className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-xl font-medium text-slate-200">
                Profile Photo
              </h3>
            </div>

            <div className="flex justify-center">
              {user?.id && profile?.id && (
                <ProfileImageUpload
                  userId={user.id}
                  profileId={profile.id}
                  currentImageUrl={currentProfileImageUrl || undefined}
                  onImageChange={handleProfileImageChange}
                />
              )}
            </div>

            <Separator className="mt-8" />
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-green-500/20 rounded-xl mr-3">
                  <UserIcon className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-xl font-medium text-slate-200">
                  Basic Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-base font-medium text-slate-200"
                  >
                    First Name
                  </Label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    required
                    maxLength={50}
                    showCharCount
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-base font-medium text-slate-200"
                  >
                    Last Name
                  </Label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    required
                    maxLength={50}
                    showCharCount
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-base font-medium text-slate-200"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    readOnly
                    className="h-12 rounded-2xl bg-slate-600/50 cursor-not-allowed border-slate-600 text-slate-400"
                  />
                  <p className="text-xs text-slate-400">
                    Email address cannot be changed here. Contact support if
                    needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-base font-medium text-slate-200"
                  >
                    Phone Number
                  </Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    maxLength={20}
                    showCharCount
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="gender"
                    className="text-base font-medium text-slate-200"
                  >
                    Gender
                  </Label>
                  <Select
                    value={formData.gender || ""}
                    onValueChange={(value) =>
                      handleSelectChange(
                        "gender",
                        (value as "male" | "female" | "other") || undefined
                      )
                    }
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-slate-600 bg-slate-600/50 text-slate-200 focus:border-green-500 focus:ring-green-500">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="address"
                    className="text-base font-medium text-slate-200"
                  >
                    Address
                  </Label>
                  <Input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    maxLength={200}
                    showCharCount
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="emergencyContact"
                    className="text-base font-medium text-slate-200"
                  >
                    <span className="inline-flex items-center">
                      <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-1" />
                      Emergency Contact
                    </span>
                  </Label>
                  <Input
                    type="tel"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Emergency contact number"
                    maxLength={20}
                    showCharCount
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Professional Information */}
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-green-500/20 rounded-xl mr-3">
                  <AcademicCapIcon className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-xl font-medium text-slate-200">
                  Professional Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="qualification"
                    className="text-base font-medium text-slate-200"
                  >
                    Qualification
                  </Label>
                  <Input
                    type="text"
                    id="qualification"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    placeholder="e.g., Bachelor's in Mathematics, Teaching Certificate"
                    maxLength={200}
                    showCharCount
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="experienceYears"
                    className="text-base font-medium text-slate-200"
                  >
                    Years of Experience
                  </Label>
                  <Input
                    id="experienceYears"
                    name="experienceYears"
                    type="number"
                    value={formData.experienceYears ?? ""}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      handleNumberChange(
                        "experienceYears",
                        Number.isNaN(v) ? undefined : v
                      );
                    }}
                    placeholder="Enter years of experience"
                    min={0}
                    max={50}
                    className="h-12 rounded-2xl border-slate-600 bg-slate-600/50 text-slate-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="hourlyRate"
                    className="text-base font-medium text-slate-200"
                  >
                    Hourly Rate ($)
                  </Label>
                  <Input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    value={formData.hourlyRate ?? ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      handleNumberChange(
                        "hourlyRate",
                        Number.isNaN(v) ? undefined : v
                      );
                    }}
                    placeholder="Enter your hourly rate"
                    min={0}
                    step="0.01"
                    className="h-12 rounded-2xl border-slate-600 bg-slate-600/50 text-slate-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="availability"
                    className="text-base font-medium text-slate-200"
                  >
                    Availability
                  </Label>
                  <Input
                    type="text"
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleInputChange}
                    placeholder="e.g., Weekdays 3–8 PM, Weekends 9 AM–5 PM"
                    maxLength={200}
                    showCharCount
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="specializations"
                    className="text-base font-medium text-slate-200"
                  >
                    <span className="inline-flex items-center">
                      <AcademicCapIcon className="h-4 w-4 text-gray-500 mr-1" />
                      Specializations
                    </span>
                  </Label>
                  <MultiSelect
                    options={availableSubjects.map(subject => ({
                      value: subject.name,
                      label: subject.display_name,
                      color: subject.color || undefined
                    }))}
                    value={formData.specializations}
                    onChange={(value) => setFormData(prev => ({ ...prev, specializations: value }))}
                    placeholder="Select subjects you specialize in..."
                    className="h-12 rounded-2xl border-slate-600 bg-slate-600/50 text-slate-200 focus:border-green-500 focus:ring-green-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Choose the subjects you are qualified to tutor in
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="certifications"
                    className="text-base font-medium text-slate-200"
                  >
                    <span className="inline-flex items-center">
                      <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-1" />
                      Certifications
                    </span>
                  </Label>
                  <Input
                    type="text"
                    id="certifications"
                    name="certifications"
                    value={formData.certifications.join(", ")}
                    onChange={(e) =>
                      handleArrayInputChange("certifications", e.target.value)
                    }
                    placeholder="e.g., Teaching License, Math Specialist, ESL Certificate"
                    maxLength={300}
                    showCharCount
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Separate multiple certifications with commas
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="languages"
                    className="text-base font-medium text-slate-200"
                  >
                    <span className="inline-flex items-center">
                      <GlobeAltIcon className="h-4 w-4 text-gray-500 mr-1" />
                      Languages Spoken
                    </span>
                  </Label>
                  <Input
                    type="text"
                    id="languages"
                    name="languages"
                    value={formData.languages.join(", ")}
                    onChange={(e) =>
                      handleArrayInputChange("languages", e.target.value)
                    }
                    placeholder="e.g., English, Spanish, French"
                    maxLength={200}
                    showCharCount
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Separate multiple languages with commas
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="bio"
                    className="text-base font-medium text-slate-200"
                  >
                    <span className="inline-flex items-center">
                      <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-1" />
                      Bio
                    </span>
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="input resize-none"
                    placeholder="Tell us about your teaching philosophy, experience, and what makes you a great tutor..."
                    maxLength={1000}
                    showCharCount
                  />
                </div>
              </div>
            </div>

            {/* CV Upload */}
            <div className="border-t border-slate-600 pt-6 space-y-4">
              <h3 className="text-lg font-medium text-slate-200">
                <DocumentTextIcon className="h-5 w-5 text-green-400 inline mr-2" />
                CV Upload
              </h3>

              {formData.cvFileName && formData.cvStoragePath ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-green-300">
                          CV Uploaded Successfully
                        </h4>
                        <p className="text-sm text-green-400 mt-1">
                          File: {formData.cvFileName}
                        </p>
                        <button
                          type="button"
                          onClick={handleCVView}
                          className="text-sm text-green-400 hover:text-green-300 underline mt-1 inline-block"
                        >
                          View CV
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCVRemove}
                      className="text-red-400 hover:text-red-300"
                      title="Remove CV"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="p-6 bg-slate-700/30 rounded-xl border-2 border-dashed border-slate-600 text-center">
                  <DocumentArrowUpIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 mb-4">
                    Upload your CV/Resume (PDF/DOC/DOCX format, max 5MB)
                  </p>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleCVUpload}
                    className="hidden"
                    id="cv-upload"
                    disabled={isUploadingCV}
                  />
                  <Label
                    htmlFor="cv-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white rounded-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {isUploadingCV ? "Uploading..." : "Choose File"}
                  </Label>
                </div>
              )}

              {cvUploadError && (
                <Alert variant="destructive">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>{cvUploadError}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Save status */}
            {saveStatus === "success" && (
              <Alert className="border-green-500/30 bg-green-500/20 text-green-300">
                <CheckCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  Profile updated successfully!
                </AlertDescription>
              </Alert>
            )}

            {saveStatus === "error" && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Submit */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-gradient-to-r from-[#199421] to-[#94DF4A] text-white rounded-2xl font-semibold hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default TutorProfile;
