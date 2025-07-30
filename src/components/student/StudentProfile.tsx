import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  UserIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  HeartIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useGradeLevels, findGradeLevelById } from "@/lib/gradeLevels";
import { getActiveProfileImage } from "@/lib/profileImages";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { StudentProfileFormData, GradeLevel } from "@/types/auth";

const StudentProfile: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const {
    gradeLevels,
    loading: gradeLevelsLoading,
    error: gradeLevelsError,
  } = useGradeLevels();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [currentProfileImageUrl, setCurrentProfileImageUrl] = useState<
    string | null
  >(null);

  const [formData, setFormData] = useState<StudentProfileFormData>({
    email: user?.email || "",
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",

    gender: profile?.gender || undefined,
    emergencyContact: profile?.emergency_contact || "",
    age: profile?.age || undefined,
    gradeLevelId: profile?.grade_level_id || undefined,
    currentGrade: profile?.current_grade || "",
    academicSet: profile?.academic_set || undefined,
    hasLearningDisabilities: profile?.has_learning_disabilities || false,
    learningNeedsDescription: profile?.learning_needs_description || "",

    // Parent contact information
    parentName: profile?.parent_name || "",
    parentPhone: profile?.parent_phone || "",
    parentEmail: profile?.parent_email || "",

    // Location information
    city: profile?.city || "",
    postcode: profile?.postcode || "",
    schoolName: profile?.school_name || "",
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
            phone: profileData.phone ?? undefined,
            address: profileData.address ?? undefined,

            gender: profileData.gender ?? undefined,
            emergencyContact: profileData.emergency_contact ?? undefined,
            age: profileData.age ?? undefined,
            gradeLevelId: profileData.grade_level_id ?? undefined,
            currentGrade: profileData.current_grade || "",
            academicSet: profileData.academic_set || undefined,
            hasLearningDisabilities:
              profileData.has_learning_disabilities || false,
            learningNeedsDescription:
              profileData.learning_needs_description ?? "",
            // Parent contact information
            parentName: profileData.parent_name || "",
            parentPhone: profileData.parent_phone || "",
            parentEmail: profileData.parent_email || "",
            // Location information
            city: profileData.city || "",
            postcode: profileData.postcode || "",
            schoolName: profileData.school_name || "",
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

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        // Clear learning needs description if checkbox is unchecked
        ...(name === "hasLearningDisabilities" && !checked
          ? { learningNeedsDescription: "" }
          : {}),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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

        gender: formData.gender || null,
        emergency_contact: formData.emergencyContact || null,
        age: formData.age || null,
        grade_level_id: formData.gradeLevelId || null,
        current_grade: formData.currentGrade || null,
        academic_set: formData.academicSet || null,
        has_learning_disabilities: formData.hasLearningDisabilities,
        learning_needs_description: formData.hasLearningDisabilities
          ? formData.learningNeedsDescription || null
          : null,

        // Parent contact information
        parent_name: formData.parentName || null,
        parent_phone: formData.parentPhone || null,
        parent_email: formData.parentEmail || null,

        // Location information
        city: formData.city || null,
        postcode: formData.postcode || null,
        school_name: formData.schoolName || null,

        updated_at: new Date().toISOString(),
      };

      console.log("Updating profile with data:", updateData);

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

      console.log("Profile updated successfully:", data);

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
          age: updateData.age || undefined,
          grade_level_id: updateData.grade_level_id || undefined,
          has_learning_disabilities: updateData.has_learning_disabilities,
          learning_needs_description:
            updateData.learning_needs_description || undefined,
        });
      }

      setSaveStatus("success");

      // Reset success status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      setSaveStatus("error");
      setErrorMessage(
        error.message || "Failed to save profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Group grade levels by category for better UX
  const groupedGradeLevels = React.useMemo(() => {
    return gradeLevels.reduce((acc, gradeLevel) => {
      const category = gradeLevel.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(gradeLevel);
      return acc;
    }, {} as Record<string, GradeLevel[]>);
  }, [gradeLevels]);

  const categoryLabels = {
    preschool: "Preschool",
    elementary: "Elementary School",
    middle: "Middle School",
    high: "High School",
    college: "College",
    graduate: "Graduate School",
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
          <UserIcon className="h-6 w-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            Student Profile
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          View and update your personal information and learning preferences.
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

            {/* Age (Calculated/Manual) */}
            <div className="form-group">
              <label htmlFor="age" className="form-label">
                <UserIcon className="h-4 w-4 text-gray-500 mr-1" />
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age || ""}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter your age"
                min="5"
                max="100"
              />
            </div>

            {/* Current Grade - Database Driven */}
            <div className="form-group">
              <label htmlFor="gradeLevelId" className="form-label">
                <AcademicCapIcon className="h-4 w-4 text-gray-500 mr-1" />
                Current Grade
              </label>
              {gradeLevelsLoading ? (
                <div className="input flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-gray-500">
                    Loading grade levels...
                  </span>
                </div>
              ) : gradeLevelsError ? (
                <div className="input bg-red-50 text-red-600">
                  Error loading grade levels
                </div>
              ) : (
                <select
                  id="gradeLevelId"
                  name="gradeLevelId"
                  value={formData.gradeLevelId || ""}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Select your current grade</option>
                  {Object.entries(groupedGradeLevels).map(
                    ([category, levels]) => (
                      <optgroup
                        key={category}
                        label={
                          categoryLabels[
                            category as keyof typeof categoryLabels
                          ]
                        }
                      >
                        {levels.map((gradeLevel) => (
                          <option key={gradeLevel.id} value={gradeLevel.id}>
                            {gradeLevel.display_name}
                          </option>
                        ))}
                      </optgroup>
                    )
                  )}
                </select>
              )}
            </div>

            {/* Academic Set */}
            <div className="form-group">
              <label htmlFor="academicSet" className="form-label">
                <AcademicCapIcon className="h-4 w-4 text-gray-500 mr-1" />
                Academic Set
              </label>
              <select
                id="academicSet"
                name="academicSet"
                value={formData.academicSet || ""}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">Select your academic set</option>
                <option value="Set 1">Set 1</option>
                <option value="Set 2">Set 2</option>
                <option value="Set 3">Set 3</option>
                <option value="Set 4 (Foundation)">Set 4 (Foundation)</option>
              </select>
            </div>

            {/* School Name */}
            <div className="form-group">
              <label htmlFor="schoolName" className="form-label">
                <AcademicCapIcon className="h-4 w-4 text-gray-500 mr-1" />
                School Name (Optional)
              </label>
              <input
                type="text"
                id="schoolName"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter your school name"
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

              <div className="form-group">
                <label htmlFor="city" className="form-label">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your city"
                />
              </div>

              <div className="form-group">
                <label htmlFor="postcode" className="form-label">
                  Postcode
                </label>
                <input
                  type="text"
                  id="postcode"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your postcode"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label htmlFor="address" className="form-label">
                  Full Address (Optional)
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your full address (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender" className="form-label">
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

          {/* Parent Contact Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Parent/Guardian Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="parentName" className="form-label">
                  <UserIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Parent/Guardian Name
                </label>
                <input
                  type="text"
                  id="parentName"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter parent/guardian name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="parentPhone" className="form-label">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Parent/Guardian Phone
                </label>
                <input
                  type="tel"
                  id="parentPhone"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter parent/guardian phone number"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label htmlFor="parentEmail" className="form-label">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-1" />
                  Parent/Guardian Email
                </label>
                <input
                  type="email"
                  id="parentEmail"
                  name="parentEmail"
                  value={formData.parentEmail}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter parent/guardian email address"
                />
              </div>
            </div>
          </div>

          {/* Learning Needs */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <HeartIcon className="h-5 w-5 text-red-500 inline mr-2" />
              Learning Preferences & Special Needs
            </h3>

            {/* Learning Disabilities Checkbox */}
            <div className="form-group">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="hasLearningDisabilities"
                  name="hasLearningDisabilities"
                  checked={formData.hasLearningDisabilities}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                />
                <div className="ml-3">
                  <label
                    htmlFor="hasLearningDisabilities"
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    I have learning disabilities or special needs
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Check this box if you have any learning challenges that we
                    should be aware of
                  </p>
                </div>
              </div>
            </div>

            {/* Learning Needs Description - Conditional */}
            {formData.hasLearningDisabilities && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="form-group mt-4"
              >
                <label
                  htmlFor="learningNeedsDescription"
                  className="form-label"
                >
                  Describe Your Learning Needs
                </label>
                <textarea
                  id="learningNeedsDescription"
                  name="learningNeedsDescription"
                  value={formData.learningNeedsDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className="input resize-none"
                  placeholder="Please describe your specific learning challenges, accommodations needed, or any other information that would help us provide better support..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  This information will help us provide personalized learning
                  support and accommodations.
                </p>
              </motion.div>
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
              disabled={isSaving || gradeLevelsLoading}
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

export default StudentProfile;
