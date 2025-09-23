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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
            phone: profileData.phone || "",
            address: profileData.address || "",
            gender: profileData.gender ?? undefined,
            emergencyContact: profileData.emergency_contact || "",
            age: profileData.age || undefined,
            gradeLevelId: profileData.grade_level_id || undefined,
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
    } else if (type === "number") {
      const numValue = value === "" ? undefined : Number(value);
      setFormData((prev) => ({ ...prev, [name]: numValue as any }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile image change
  const handleProfileImageChange = async (imageUrl: string | null) => {
    setCurrentProfileImageUrl(imageUrl);

    // Update the AuthContext profile data with the new image URL
    if (updateProfile && profile) {
      try {
        // Build raw updates object (may contain undefined values)
        const rawUpdates = {
          // Keep null to explicitly clear the image in AuthContext as well
          profile_image_url: imageUrl,
        };

        // Remove undefined keys so Dexie.update leaves them untouched
        const updates = Object.fromEntries(
          Object.entries(rawUpdates).filter(([, v]) => v !== undefined)
        );

        if (Object.keys(updates).length > 0) {
          await updateProfile(updates);
          console.log("AuthContext updated with new profile image URL");
        }
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
        // Build raw updates object (may contain undefined values)
        const rawUpdates = {
          first_name: updateData.first_name,
          last_name: updateData.last_name,
          full_name: updateData.full_name,
          phone: updateData.phone, // allow null
          address: updateData.address, // allow null
          gender: updateData.gender, // allow null
          emergency_contact: updateData.emergency_contact, // allow null
          age: updateData.age, // allow null
          grade_level_id: updateData.grade_level_id, // allow null
          has_learning_disabilities: updateData.has_learning_disabilities,
          learning_needs_description: updateData.learning_needs_description, // allow null
          // Keep AuthContext in sync for the rest as well
          current_grade: updateData.current_grade,
          academic_set: updateData.academic_set,
          parent_name: updateData.parent_name,
          parent_phone: updateData.parent_phone,
          parent_email: updateData.parent_email,
          city: updateData.city,
          postcode: updateData.postcode,
          school_name: updateData.school_name,
        };

        // Remove undefined keys so Dexie.update leaves them untouched
        const updates = Object.fromEntries(
          Object.entries(rawUpdates).filter(([, v]) => v !== undefined)
        );

        if (Object.keys(updates).length > 0) {
          await updateProfile(updates);
        }
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
    return (gradeLevels ?? []).reduce((acc, gradeLevel) => {
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
    <div className="relative max-w-7xl mx-auto p-6 space-y-6">
      {/* Forest-themed background for the profile section */}
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-100" />
        {/* Subtle canopy glows */}
        <div className="absolute -top-16 -right-10 h-64 w-64 bg-emerald-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-8 h-72 w-72 bg-teal-300/25 rounded-full blur-3xl" />
        <div className="absolute top-20 left-1/3 h-40 w-40 bg-lime-300/20 rounded-full blur-2xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-xl bg-white/70 backdrop-blur-md rounded-2xl overflow-hidden border border-emerald-900/10 ring-1 ring-black/5">
          <CardHeader className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white pb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-400 rounded-xl">
                <UserIcon className="h-6 w-6 text-emerald-900" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-white">
                  Student Profile
                </CardTitle>
                <CardDescription className="text-emerald-100 mt-1">
                  View and update your personal information and learning
                  preferences.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Profile Image Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div className="flex items-center mb-6">
                <div className="p-2 bg-yellow-400/10 rounded-xl mr-3">
                  <PhotoIcon className="h-5 w-5 text-emerald-900" />
                </div>
                <h3 className="text-xl font-medium text-slate-900">
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

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-emerald-900/10 rounded-xl mr-3">
                    <UserIcon className="h-5 w-5 text-emerald-900" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-900">
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-base font-medium text-slate-700"
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      required
                      maxLength={50}
                      showCharCount
                      className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-base font-medium text-slate-700"
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      required
                      maxLength={50}
                      showCharCount
                      className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-base font-medium text-slate-700"
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
                      className="h-12 rounded-2xl bg-slate-50 cursor-not-allowed border-slate-200"
                    />
                    <p className="text-xs text-slate-500">
                      Email address cannot be changed here. Contact support if
                      needed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="age"
                      className="text-base font-medium text-slate-700"
                    >
                      Age
                    </Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age || ""}
                      onChange={handleInputChange}
                      placeholder="Enter your age"
                      min="5"
                      max="100"
                      className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="gradeLevelId"
                      className="text-base font-medium text-slate-700"
                    >
                      Current Grade
                    </Label>
                    {gradeLevelsLoading ? (
                      <div className="h-12 rounded-2xl border border-slate-200 flex items-center px-4">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-slate-500">
                          Loading grade levels...
                        </span>
                      </div>
                    ) : gradeLevelsError ? (
                      <div className="h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center px-4 text-red-600">
                        Error loading grade levels
                      </div>
                    ) : (
                      <Select
                        value={formData.gradeLevelId || ""}
                        onValueChange={(value) =>
                          handleSelectChange("gradeLevelId", value)
                        }
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900">
                          <SelectValue placeholder="Select your current grade" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {Object.entries(groupedGradeLevels).map(
                            ([category, levels]) => (
                              <div key={category}>
                                <div className="px-2 py-1.5 text-sm font-medium text-slate-500">
                                  {
                                    categoryLabels[
                                      category as keyof typeof categoryLabels
                                    ]
                                  }
                                </div>
                                {levels.map((gradeLevel) => (
                                  <SelectItem
                                    key={gradeLevel.id}
                                    value={gradeLevel.id}
                                  >
                                    {gradeLevel.display_name}
                                  </SelectItem>
                                ))}
                              </div>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="academicSet"
                      className="text-base font-medium text-slate-700"
                    >
                      Academic Set
                    </Label>
                    <Select
                      value={formData.academicSet || ""}
                      onValueChange={(value) =>
                        handleSelectChange("academicSet", value)
                      }
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900">
                        <SelectValue placeholder="Select your academic set" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="Set 1">Set 1</SelectItem>
                        <SelectItem value="Set 2">Set 2</SelectItem>
                        <SelectItem value="Set 3">Set 3</SelectItem>
                        <SelectItem value="Set 4 (Foundation)">
                          Set 4 (Foundation)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="schoolName"
                      className="text-base font-medium text-slate-700"
                    >
                      School Name{" "}
                      <Badge variant="secondary" className="ml-2 bg-slate-100">
                        Optional
                      </Badge>
                    </Label>
                    <Input
                      id="schoolName"
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleInputChange}
                      placeholder="Enter your school name"
                      maxLength={100}
                      showCharCount
                      className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-emerald-900/10 rounded-xl mr-3">
                    <EnvelopeIcon className="h-5 w-5 text-emerald-900" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-900">
                    Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-base font-medium text-slate-700"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      maxLength={20}
                      showCharCount
                      className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContact"
                      className="text-base font-medium text-slate-700"
                    >
                      Emergency Contact
                    </Label>
                    <Input
                      id="emergencyContact"
                      name="emergencyContact"
                      type="tel"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      placeholder="Emergency contact number"
                      maxLength={20}
                      showCharCount
                      className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="city"
                      className="text-base font-medium text-slate-700"
                    >
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter your city"
                      maxLength={50}
                      showCharCount
                      className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="postcode"
                      className="text-base font-medium text-slate-700"
                    >
                      Postcode
                    </Label>
                    <Input
                      id="postcode"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleInputChange}
                      placeholder="Enter your postcode"
                      maxLength={20}
                      showCharCount
                      className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="address"
                      className="text-base font-medium text-slate-700"
                    >
                      Full Address{" "}
                      <Badge variant="secondary" className="ml-2 bg-slate-100">
                        Optional
                      </Badge>
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your full address (optional)"
                      maxLength={200}
                      showCharCount
                      className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="gender"
                      className="text-base font-medium text-slate-700"
                    >
                      Gender
                    </Label>
                    <Select
                      value={formData.gender || ""}
                      onValueChange={(value) =>
                        handleSelectChange("gender", value)
                      }
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Parent Contact Information */}
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-emerald-900/10 rounded-xl mr-3">
                    <UserIcon className="h-5 w-5 text-emerald-900" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-900">
                    Parent/Guardian Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="parentName"
                      className="text-base font-medium text-slate-700"
                    >
                      Parent/Guardian Name
                    </Label>
                    <Input
                      id="parentName"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleInputChange}
                      placeholder="Enter parent/guardian name"
                      maxLength={100}
                      showCharCount
                      className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="parentPhone"
                      className="text-base font-medium text-slate-700"
                    >
                      Parent/Guardian Phone
                    </Label>
                    <Input
                      id="parentPhone"
                      name="parentPhone"
                      type="tel"
                      value={formData.parentPhone}
                      onChange={handleInputChange}
                      placeholder="Enter parent/guardian phone number"
                      maxLength={20}
                      showCharCount
                      className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="parentEmail"
                      className="text-base font-medium text-slate-700"
                    >
                      Parent/Guardian Email
                    </Label>
                    <Input
                      id="parentEmail"
                      name="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={handleInputChange}
                      placeholder="Enter parent/guardian email address"
                      maxLength={100}
                      showCharCount
                      className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Learning Needs */}
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-red-50 rounded-xl mr-3">
                    <HeartIcon className="h-5 w-5 text-red-500" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-900">
                    Learning Preferences & Special Needs
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl">
                    <Checkbox
                      id="hasLearningDisabilities"
                      checked={formData.hasLearningDisabilities}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => ({
                          ...prev,
                          hasLearningDisabilities: checked as boolean,
                          ...(!(checked as boolean)
                            ? { learningNeedsDescription: "" }
                            : {}),
                        }));
                      }}
                      className="mt-1 data-[state=checked]:bg-emerald-900 data-[state=checked]:border-emerald-900"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="hasLearningDisabilities"
                        className="text-base font-medium text-slate-900 cursor-pointer"
                      >
                        I have learning disabilities or special needs
                      </Label>
                      <p className="text-sm text-slate-500 mt-1">
                        Check this box if you have any learning challenges that
                        we should be aware of
                      </p>
                    </div>
                  </div>

                  {formData.hasLearningDisabilities && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2"
                    >
                      <Label
                        htmlFor="learningNeedsDescription"
                        className="text-base font-medium text-slate-700"
                      >
                        Describe Your Learning Needs
                      </Label>
                      <Textarea
                        id="learningNeedsDescription"
                        name="learningNeedsDescription"
                        value={formData.learningNeedsDescription}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Please describe your specific learning challenges, accommodations needed, or any other information that would help us provide better support..."
                        maxLength={500}
                        showCharCount
                        className="resize-none rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                      />
                      <p className="text-sm text-slate-500">
                        This information will help us provide personalized
                        learning support and accommodations.
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Save Status Messages */}
              {saveStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Alert className="border-emerald-200 bg-emerald-50 rounded-2xl">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                    <AlertDescription className="text-emerald-700">
                      Profile updated successfully!
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {saveStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Alert className="border-red-200 bg-red-50 rounded-2xl">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  disabled={isSaving || gradeLevelsLoading}
                  className="min-w-[140px] h-12 bg-emerald-900 hover:bg-emerald-800 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Saving...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default StudentProfile;
