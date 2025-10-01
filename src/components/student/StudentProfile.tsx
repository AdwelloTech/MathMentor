import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  UserIcon,
  EnvelopeIcon,
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
import { useGradeLevels } from "@/lib/gradeLevels";
import AuthService from "@/lib/authService";
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

        // Fetch fresh profile data from backend API
        const fullProfile = await AuthService.getCurrentUser();

        // Update form data with fresh profile data
        if (fullProfile) {
          setFormData({
            email: user.email || "",
            firstName: fullProfile.first_name || "",
            lastName: fullProfile.last_name || "",
            phone: fullProfile.phone || "",
            address: fullProfile.address || "",
            gender: fullProfile.gender as "male" | "female" | "other" | undefined,
            emergencyContact: fullProfile.emergency_contact || "",
            age: fullProfile.age || undefined,
            gradeLevelId: fullProfile.grade_level_id || undefined,
            currentGrade: fullProfile.current_grade || "",
            academicSet: fullProfile.academic_set as "Set 1" | "Set 2" | "Set 3" | "Set 4 (Foundation)" | undefined,
            hasLearningDisabilities:
              fullProfile.has_learning_disabilities || false,
            learningNeedsDescription:
              fullProfile.learning_needs_description ?? "",
            // Parent contact information
            parentName: fullProfile.parent_name || "",
            parentPhone: fullProfile.parent_phone || "",
            parentEmail: fullProfile.parent_email || "",
            // Location information
            city: fullProfile.city || "",
            postcode: fullProfile.postcode || "",
            schoolName: fullProfile.school_name || "",
          });

          // Set profile image URL
          setCurrentProfileImageUrl(fullProfile.avatar_url || null);
        }

        // Get the active profile image from backend API
        try {
          const activeImage = await getActiveProfileImage();
          if (activeImage) {
            setCurrentProfileImageUrl(activeImage.url);
          } else if (fullProfile.avatar_url) {
            // Fallback to avatar_url from profile data
            setCurrentProfileImageUrl(fullProfile.avatar_url);
          }
        } catch (error) {
          console.error("Error fetching active profile image:", error);
          // Fallback to avatar_url from profile data
          if (fullProfile.avatar_url) {
            setCurrentProfileImageUrl(fullProfile.avatar_url);
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
    if (profile?.profile_image_url !== undefined) {
      setCurrentProfileImageUrl(profile.profile_image_url);
    }
  }, [profile?.profile_image_url]);

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
  const handleProfileImageChange = async () => {
    // Reload the profile data to get the updated avatar URL
    try {
      const freshProfile = await AuthService.getCurrentUser();
      if (freshProfile?.avatar_url) {
        setCurrentProfileImageUrl(freshProfile.avatar_url);
        // Also update AuthContext
        if (updateProfile) {
          await updateProfile({ avatar_url: freshProfile.avatar_url });
        }
      } else {
        setCurrentProfileImageUrl(null);
      }
    } catch (error) {
      console.error("Failed to reload profile after image change:", error);
      setCurrentProfileImageUrl(null);
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

      // Prepare the update data mapping form fields to backend API fields (snake_case for UserProfile)
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || undefined,
        address: formData.address || undefined,

        gender: formData.gender || undefined,
        emergency_contact: formData.emergencyContact || undefined,
        age: formData.age || undefined,
        grade_level_id: formData.gradeLevelId || undefined,
        current_grade: formData.currentGrade || undefined,
        academic_set: formData.academicSet || undefined,
        has_learning_disabilities: formData.hasLearningDisabilities,
        learning_needs_description: formData.hasLearningDisabilities
          ? formData.learningNeedsDescription || undefined
          : undefined,

        // Parent contact information
        parent_name: formData.parentName || undefined,
        parent_phone: formData.parentPhone || undefined,
        parent_email: formData.parentEmail || undefined,

        // Location information
        city: formData.city || undefined,
        postcode: formData.postcode || undefined,
        school_name: formData.schoolName || undefined,
      };

      console.log("Updating profile with data:", updateData);

      // Update the profile via backend API
      const updatedProfile = await AuthService.updateProfile(updateData);

      console.log("Profile updated successfully:", updatedProfile);

      // Update AuthContext with the new profile data
      if (updateProfile) {
        // Build raw updates object (may contain undefined values)
        const rawUpdates = {
          first_name: updatedProfile.first_name,
          last_name: updatedProfile.last_name,
          full_name: updatedProfile.full_name,
          phone: updatedProfile.phone, // allow null
          address: updatedProfile.address, // allow null
          gender: updatedProfile.gender, // allow null
          emergency_contact: updatedProfile.emergency_contact, // allow null
          age: updatedProfile.age, // allow null
          grade_level_id: updatedProfile.grade_level_id, // allow null
          has_learning_disabilities: updatedProfile.has_learning_disabilities,
          learning_needs_description: updatedProfile.learning_needs_description, // allow null
          // Keep AuthContext in sync for the rest as well
          current_grade: updatedProfile.current_grade,
          academic_set: updatedProfile.academic_set,
          parent_name: updatedProfile.parent_name,
          parent_phone: updatedProfile.parent_phone,
          parent_email: updatedProfile.parent_email,
          city: updatedProfile.city,
          postcode: updatedProfile.postcode,
          school_name: updatedProfile.school_name,
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-lg border border-border bg-card rounded-2xl overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground pb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-secondary rounded-xl">
                  <UserIcon className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-primary-foreground">
                    Student Profile
                  </CardTitle>
                  <CardDescription className="text-primary-foreground/80 mt-1">
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
                <div className="p-2 bg-secondary/50 rounded-xl mr-3">
                  <PhotoIcon className="h-5 w-5 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-medium text-card-foreground">
                  Profile Photo
                </h3>
              </div>
              <div className="flex justify-center">
                {user?.id && profile?.id && (
                  <ProfileImageUpload
                    key={currentProfileImageUrl || 'no-image'}
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
                  <div className="p-2 bg-primary/10 rounded-xl mr-3">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium text-card-foreground">
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-base font-medium text-card-foreground"
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
                      className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-base font-medium text-card-foreground"
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
                      className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-base font-medium text-card-foreground"
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
                      className="h-12 rounded-2xl bg-muted cursor-not-allowed border-border text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email address cannot be changed here. Contact support if
                      needed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="age"
                      className="text-base font-medium text-card-foreground"
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
                      className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="gradeLevelId"
                      className="text-base font-medium text-card-foreground"
                    >
                      Current Grade
                    </Label>
                    {gradeLevelsLoading ? (
                      <div className="h-12 rounded-2xl border border-border flex items-center px-4 bg-muted">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-muted-foreground">
                          Loading grade levels...
                        </span>
                      </div>
                    ) : gradeLevelsError ? (
                      <div className="h-12 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center px-4 text-destructive">
                        Error loading grade levels
                      </div>
                    ) : (
                      <Select
                        value={formData.gradeLevelId || ""}
                        onValueChange={(value) =>
                          handleSelectChange("gradeLevelId", value)
                        }
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground">
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
                      className="text-base font-medium text-card-foreground"
                    >
                      Academic Set
                    </Label>
                    <Select
                      value={formData.academicSet || ""}
                      onValueChange={(value) =>
                        handleSelectChange("academicSet", value)
                      }
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground">
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
                      className="text-base font-medium text-card-foreground"
                    >
                      School Name{" "}
                      <Badge variant="secondary" className="ml-2 bg-muted">
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
                      className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-primary/10 rounded-xl mr-3">
                    <EnvelopeIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium text-card-foreground">
                    Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-base font-medium text-card-foreground"
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
                      className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContact"
                      className="text-base font-medium text-card-foreground"
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
                      className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="city"
                      className="text-base font-medium text-card-foreground"
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
                      className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="postcode"
                      className="text-base font-medium text-card-foreground"
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
                      className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="address"
                      className="text-base font-medium text-card-foreground"
                    >
                      Full Address{" "}
                      <Badge variant="secondary" className="ml-2 bg-muted">
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
                      className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="gender"
                      className="text-base font-medium text-card-foreground"
                    >
                      Gender
                    </Label>
                    <Select
                      value={formData.gender || ""}
                      onValueChange={(value) =>
                        handleSelectChange("gender", value)
                      }
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground">
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
                  <div className="p-2 bg-primary/10 rounded-xl mr-3">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium text-card-foreground">
                    Parent/Guardian Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="parentName"
                      className="text-base font-medium text-card-foreground"
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
                      className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="parentPhone"
                      className="text-base font-medium text-card-foreground"
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
                      className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="parentEmail"
                      className="text-base font-medium text-card-foreground"
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
                      className="h-12 rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Learning Needs */}
              <div className="space-y-6">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-destructive/10 rounded-xl mr-3">
                    <HeartIcon className="h-5 w-5 text-destructive" />
                  </div>
                  <h3 className="text-xl font-medium text-card-foreground">
                    Learning Preferences & Special Needs
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-secondary rounded-2xl">
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
                      className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="hasLearningDisabilities"
                        className="text-base font-medium text-card-foreground cursor-pointer"
                      >
                        I have learning disabilities or special needs
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
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
                        className="text-base font-medium text-card-foreground"
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
                        className="resize-none rounded-2xl border-border focus:border-primary focus:ring-primary bg-background text-foreground"
                      />
                      <p className="text-sm text-muted-foreground">
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
                  <Alert className="border-primary/30 bg-primary/10 rounded-2xl">
                    <CheckCircleIcon className="h-5 w-5 text-primary" />
                    <AlertDescription className="text-primary">
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
                  <Alert className="border-destructive/30 bg-destructive/10 rounded-2xl">
                    <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
                    <AlertDescription className="text-destructive">
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
                  className="min-w-[140px] h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
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
