import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getActiveProfileImage } from "@/lib/profileImages";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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
  cvUrl: string;
  cvFileName: string;
}

// Enhanced PDF file validation with MIME type and content verification
const validatePDFFile = async (file: File): Promise<boolean> => {
  // First check: MIME type validation
  if (file.type === "application/pdf" || file.type.startsWith("application/pdf")) {
    return true;
  }

  // Second check: If MIME type is empty or ambiguous, check file content
  if (!file.type || file.type === "application/octet-stream") {
    try {
      const arrayBuffer = await file.slice(0, 8).arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const header = String.fromCharCode(...uint8Array.slice(0, 5));

      // PDF files start with "%PDF-"
      return header === "%PDF-";
    } catch (error) {
      console.error("Error reading file header:", error);
      return false;
    }
  }

  // If MIME type is present but not PDF, reject
  return false;
};

const TutorProfile: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
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
    cvUrl: profile?.cv_url || "",
    cvFileName: profile?.cv_file_name || "",
  });

  // Load fresh profile data and active profile image on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Fetch fresh profile data from database
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching fresh profile:", profileError);
          return;
        }

        // Update form data with fresh profile data
        if (profileData) {
          setFormData({
            email: user.email || "",
            firstName: profileData.first_name || "",
            lastName: profileData.last_name || "",
            phone: profileData.phone || "",
            address: profileData.address || "",
            dateOfBirth: profileData.date_of_birth || "",
            gender: profileData.gender || undefined,
            emergencyContact: profileData.emergency_contact || "",
            qualification: profileData.qualification || "",
            experienceYears: profileData.experience_years || undefined,
            specializations: profileData.specializations || [],
            hourlyRate: profileData.hourly_rate || undefined,
            availability: profileData.availability || "",
            bio: profileData.bio || "",
            certifications: profileData.certifications || [],
            languages: profileData.languages || [],
            cvUrl: profileData.cv_url || "",
            cvFileName: profileData.cv_file_name || "",
          });

          // Set profile image URL
          setCurrentProfileImageUrl(profileData.profile_image_url || null);
        }

        // Also try to get the active profile image from profile_images table
        const activeImage = await getActiveProfileImage(user.id);
        if (activeImage) {
          // Get the public URL for the active image
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("profile-images")
            .getPublicUrl(activeImage.file_path);

          if (publicUrl) {
            setCurrentProfileImageUrl(publicUrl);
          }
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id]);

  // Update profile image URL when profile changes
  useEffect(() => {
    if (profile?.profile_image_url && !currentProfileImageUrl) {
      setCurrentProfileImageUrl(profile.profile_image_url);
    }
  }, [profile?.profile_image_url, currentProfileImageUrl]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      const numValue = value === "" ? undefined : Number(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle CV file upload
  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type with enhanced security
    const isValidPDF = await validatePDFFile(file);
    if (!isValidPDF) {
      setCvUploadError("Please upload a valid PDF file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setCvUploadError("File size must be less than 5MB");
      return;
    }

    setIsUploadingCV(true);
    setCvUploadError(null);

    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Create a unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/cv/${Date.now()}.${fileExt}`;
      const filePath = `cv-uploads/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("cv-uploads")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("cv-uploads").getPublicUrl(filePath);

      // Update the profile with CV information
      const updateData = {
        cv_file_name: file.name,
        cv_url: publicUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Update form data
      setFormData((prev) => ({
        ...prev,
        cvFileName: file.name,
        cvUrl: publicUrl,
      }));

      // Update AuthContext
      if (updateProfile) {
        await updateProfile({
          cv_file_name: file.name,
          cv_url: publicUrl,
        });
      }

      console.log("CV uploaded successfully:", publicUrl);
    } catch (error: any) {
      console.error("CV upload error:", error);
      setCvUploadError(
        error.message || "Failed to upload CV. Please try again."
      );
    } finally {
      setIsUploadingCV(false);
    }
  };

  const handleArrayInputChange = (
    field: keyof TutorProfileFormData,
    value: string
  ) => {
    const array = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    setFormData((prev) => ({
      ...prev,
      [field]: array,
    }));
  };

  // Handle profile image change
  const handleProfileImageChange = async (imageUrl: string | null) => {
    setCurrentProfileImageUrl(imageUrl);

    // Update the AuthContext profile data with the new image URL
    if (updateProfile && profile) {
      try {
        await updateProfile({
          profile_image_url: imageUrl || undefined,
        });
        console.log("AuthContext updated with new profile image URL");
      } catch (error) {
        console.error("Failed to update AuthContext:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Prepare the update data mapping form fields to database fields
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone || null,
        address: formData.address || null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        emergency_contact: formData.emergencyContact || null,
        qualification: formData.qualification || null,
        experience_years: formData.experienceYears || null,
        specializations: formData.specializations || null,
        hourly_rate: formData.hourlyRate || null,
        availability: formData.availability || null,
        bio: formData.bio || null,
        certifications: formData.certifications || null,
        languages: formData.languages || null,
        cv_url: formData.cvUrl || null,
        cv_file_name: formData.cvFileName || null,
        updated_at: new Date().toISOString(),
      };

      console.log("Updating tutor profile with data:", updateData);

      // Update the profile in the database
      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }

      console.log("Tutor profile updated successfully:", data);

      // Update AuthContext with the new profile data
      if (updateProfile) {
        await updateProfile({
          first_name: updateData.first_name,
          last_name: updateData.last_name,
          full_name: updateData.full_name,
          phone: updateData.phone || undefined,
          address: updateData.address || undefined,
          date_of_birth: updateData.date_of_birth || undefined,
          gender: updateData.gender || undefined,
          emergency_contact: updateData.emergency_contact || undefined,
          qualification: updateData.qualification || undefined,
          experience_years: updateData.experience_years || undefined,
          specializations: updateData.specializations || undefined,
          hourly_rate: updateData.hourly_rate || undefined,
          availability: updateData.availability || undefined,
          bio: updateData.bio || undefined,
          certifications: updateData.certifications || undefined,
          languages: updateData.languages || undefined,
          cv_url: updateData.cv_url || undefined,
          cv_file_name: updateData.cv_file_name || undefined,
        });
      }

      setSaveStatus("success");

      // Reset success status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error: any) {
      console.error("Failed to save tutor profile:", error);
      setSaveStatus("error");
      setErrorMessage(
        error.message || "Failed to save profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card"
    >
      <div className="card-header">
        <div className="flex items-center">
          <AcademicCapIcon className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Tutor Profile</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          View and update your professional information and teaching
          preferences.
        </p>
      </div>

      <div className="card-body">
        {/* Profile Image Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 pb-6 border-b border-gray-200"
        >
          <div className="flex items-center mb-4">
            <PhotoIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
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
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                <UserIcon className="h-4 w-4 text-gray-500 mr-1" />
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter your first name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                <UserIcon className="h-4 w-4 text-gray-500 mr-1" />
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter your last name"
                required
              />
            </div>

            {/* Email (Read-only) */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-1" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                className="input bg-gray-50 cursor-not-allowed"
                disabled
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">
                Email address cannot be changed here. Contact support if needed.
              </p>
            </div>

            {/* Date of Birth */}
            <div className="form-group">
              <label htmlFor="dateOfBirth" className="form-label">
                <CalendarIcon className="h-4 w-4 text-gray-500 mr-1" />
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="input"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="emergencyContact" className="form-label">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Emergency Contact
                </label>
                <input
                  type="tel"
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Emergency contact number"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label htmlFor="address" className="form-label">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender" className="form-label">
                  <UserIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <BriefcaseIcon className="h-5 w-5 text-blue-500 inline mr-2" />
              Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="qualification" className="form-label">
                  <AcademicCapIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Qualification
                </label>
                <input
                  type="text"
                  id="qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., Bachelor's in Mathematics, Teaching Certificate"
                />
              </div>

              <div className="form-group">
                <label htmlFor="experienceYears" className="form-label">
                  <BriefcaseIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Years of Experience
                </label>
                <input
                  type="number"
                  id="experienceYears"
                  name="experienceYears"
                  value={formData.experienceYears || ""}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Number of years"
                  min="0"
                  max="50"
                />
              </div>

              <div className="form-group">
                <label htmlFor="hourlyRate" className="form-label">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate || ""}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Your hourly rate"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="availability" className="form-label">
                  <CalendarIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Availability
                </label>
                <input
                  type="text"
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., Weekdays 3-8 PM, Weekends 9 AM-5 PM"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label htmlFor="specializations" className="form-label">
                  <AcademicCapIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Specializations
                </label>
                <input
                  type="text"
                  id="specializations"
                  name="specializations"
                  value={formData.specializations.join(", ")}
                  onChange={(e) =>
                    handleArrayInputChange("specializations", e.target.value)
                  }
                  className="input"
                  placeholder="e.g., Algebra, Calculus, SAT Prep, Special Education"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate multiple specializations with commas
                </p>
              </div>

              <div className="form-group md:col-span-2">
                <label htmlFor="certifications" className="form-label">
                  <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Certifications
                </label>
                <input
                  type="text"
                  id="certifications"
                  name="certifications"
                  value={formData.certifications.join(", ")}
                  onChange={(e) =>
                    handleArrayInputChange("certifications", e.target.value)
                  }
                  className="input"
                  placeholder="e.g., Teaching License, Math Specialist, ESL Certificate"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate multiple certifications with commas
                </p>
              </div>

              <div className="form-group md:col-span-2">
                <label htmlFor="languages" className="form-label">
                  <GlobeAltIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Languages Spoken
                </label>
                <input
                  type="text"
                  id="languages"
                  name="languages"
                  value={formData.languages.join(", ")}
                  onChange={(e) =>
                    handleArrayInputChange("languages", e.target.value)
                  }
                  className="input"
                  placeholder="e.g., English, Spanish, French"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate multiple languages with commas
                </p>
              </div>

              <div className="form-group md:col-span-2">
                <label htmlFor="bio" className="form-label">
                  <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="input resize-none"
                  placeholder="Tell us about your teaching philosophy, experience, and what makes you a great tutor..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  This will be visible to potential students
                </p>
              </div>
            </div>
          </div>

          {/* CV Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <DocumentTextIcon className="h-5 w-5 text-green-500 inline mr-2" />
              CV Upload
            </h3>

            {/* Show existing CV if uploaded */}
            {formData.cvFileName && formData.cvUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800">
                        CV Uploaded Successfully
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        File: {formData.cvFileName}
                      </p>
                      {formData.cvUrl && (
                        <a
                          href={formData.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-800 underline mt-1 inline-block"
                        >
                          View CV
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                      setFormData((prev) => ({
                        ...prev,
                        cvFileName: "",
                        cvUrl: "",
                      }));
                      // Clear from database
                      if (updateProfile) {
                          await updateProfile({
                          cv_file_name: undefined,
                          cv_url: undefined,
                        });
                        }
                      } catch (error) {
                        console.error("Error removing CV:", error);
                        setCvUploadError("Failed to remove CV. Please try again.");
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                    title="Remove CV"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* CV Upload Section */}
            {!formData.cvFileName && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload Your CV
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Upload your curriculum vitae to showcase your qualifications
                    and experience
                  </p>

                  {cvUploadError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-red-600">{cvUploadError}</p>
                    </div>
                  )}

                  <label className="btn btn-primary cursor-pointer">
                    {isUploadingCV ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                        Choose File
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCVUpload}
                      className="hidden"
                      disabled={isUploadingCV}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Accepted formats: PDF, DOC, DOCX (Max 5MB)
                  </p>
                </div>
              </div>
            )}

            {/* Update CV Section */}
            {formData.cvFileName && (
              <div className="mt-4">
                <label className="btn btn-secondary cursor-pointer">
                  <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                  Update CV
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleCVUpload}
                    className="hidden"
                    disabled={isUploadingCV}
                  />
                </label>
                {isUploadingCV && (
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Uploading new CV...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save Status Messages */}
          {saveStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-sm text-green-600">
                Profile updated successfully!
              </p>
            </motion.div>
          )}

          {saveStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-600">{errorMessage}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default TutorProfile;
