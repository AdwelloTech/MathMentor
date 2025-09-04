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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getActiveProfileImage, getProfileImageUrl } from "@/lib/profileImages";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { validateDocumentFile } from "@/constants/form";

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
  cvStoragePath?: string;
}

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
    cvFileName: profile?.cv_file_name || "",
    cvStoragePath: profile?.cv_storage_path || "",
  });

  // Load fresh profile data + active profile image
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!profileError && profileData) {
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
            cvFileName: profileData.cv_file_name || "",
            cvStoragePath: profileData.cv_storage_path || "",
          });
        }

        // Active profile image
        const activeImage = await getActiveProfileImage(user.id);
        const imageUrl = activeImage
          ? getProfileImageUrl(activeImage.file_path)
          : null;
        setCurrentProfileImageUrl(imageUrl);
      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id]);

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
    if (updateProfile) {
      try {
        // Only pass fields that exist on the updateProfile type to avoid ts(2353)
        await updateProfile({
          profile_image_url: imageUrl || undefined,
        } as any);
      } catch (err) {
        console.error("Failed to update AuthContext:", err);
      }
    }
  };

  // -----------------------------
  // CV upload (single, consistent version)
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
      const fileExt = file.name.split(".").pop();
      const objectPath = `${user.id}/cv/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("cv-uploads")
        .upload(objectPath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      // Save storage path + filename in DB (no public URL)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          cv_file_name: file.name,
          cv_storage_path: objectPath,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Clean up old file (best-effort)
      try {
        const previousPath = formData.cvStoragePath;
        if (previousPath && previousPath !== objectPath) {
          const { error: removeErr } = await supabase.storage
            .from("cv-uploads")
            .remove([previousPath]);
          if (removeErr)
            console.warn("Failed to delete previous CV file:", removeErr);
        }
      } catch (cleanupErr) {
        console.warn("Cleanup of previous CV failed:", cleanupErr);
      }

      // Update local form + (optionally) auth context
      setFormData((prev) => ({
        ...prev,
        cvFileName: file.name,
        cvStoragePath: objectPath,
      }));

      if (updateProfile) {
        try {
          // Only pass fields that your context type allows
          await updateProfile({
            cv_file_name: file.name,
            cv_storage_path: objectPath,
          } as any);
        } catch (err) {
          // Non-fatal if context type rejects; DB already has truth
          console.warn("updateProfile for CV fields failed (non-fatal):", err);
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
    const { data, error } = await supabase.storage
      .from("cv-uploads")
      .createSignedUrl(formData.cvStoragePath, 60 * 10); // 10 minutes
    if (error || !data?.signedUrl) {
      setCvUploadError("Failed to open CV. Please try again.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleCVRemove = async () => {
    if (!user?.id || !formData.cvStoragePath) return;
    try {
      // remove file from storage (best effort)
      await supabase.storage
        .from("cv-uploads")
        .remove([formData.cvStoragePath]);

      // clear DB fields
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          cv_file_name: null,
          cv_storage_path: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // clear local + (optional) context
      setFormData((prev) => ({ ...prev, cvFileName: "", cvStoragePath: "" }));
      if (updateProfile) {
        try {
          await updateProfile({
            cv_file_name: undefined,
            cv_storage_path: undefined,
          } as any);
        } catch {
          /* ignore */
        }
      }
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

      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone || null,
        address: formData.address || null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        emergency_contact: formData.emergencyContact || null,
        qualification: formData.qualification || null,
        experience_years: formData.experienceYears ?? null,
        specializations: formData.specializations || [],
        hourly_rate: formData.hourlyRate ?? null,
        availability: formData.availability || null,
        bio: formData.bio || null,
        certifications: formData.certifications || null,
        languages: formData.languages || null,
        cv_storage_path: formData.cvStoragePath || null,
        cv_file_name: formData.cvFileName || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      // Update auth context with safe/known keys only to avoid ts(2353)
      if (updateProfile) {
        await updateProfile({
          // These are likely declared in your context type:
          // Adjust as needed, or keep the cast as any for extra fields.
          first_name: updateData.first_name,
          last_name: updateData.last_name,
          full_name: updateData.full_name,
          phone: updateData.phone ?? undefined,
          address: updateData.address ?? undefined,
          date_of_birth: updateData.date_of_birth ?? undefined,
          gender: updateData.gender ?? undefined,
          emergency_contact: updateData.emergency_contact ?? undefined,
          qualification: updateData.qualification ?? undefined,
          experience_years: updateData.experience_years ?? undefined,
          specializations: updateData.specializations ?? undefined,
          hourly_rate: updateData.hourly_rate ?? undefined,
          availability: updateData.availability ?? undefined,
          bio: updateData.bio ?? undefined,
          certifications: updateData.certifications ?? undefined,
          languages: updateData.languages ?? undefined,
          // If your type doesn't include these, they won't compile without a cast:
          cv_storage_path: updateData.cv_storage_path ?? undefined,
          cv_file_name: updateData.cv_file_name ?? undefined,
        } as any);
      }

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
      <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white pb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-400 rounded-xl">
              <AcademicCapIcon className="h-6 w-6 text-emerald-900" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-white">
                Tutor Profile
              </CardTitle>
              <CardDescription className="text-emerald-100 mt-1">
                View and update your professional information and
                qualifications.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Profile Image */}
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

          {/* Form */}
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
                    className="text-base font-medium text-slate-700"
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
                    htmlFor="phone"
                    className="text-base font-medium text-slate-700"
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
                    className="text-base font-medium text-slate-700"
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
                    <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900">
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
                    className="text-base font-medium text-slate-700"
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
                    className="text-base font-medium text-slate-700"
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
                <div className="p-2 bg-emerald-900/10 rounded-xl mr-3">
                  <AcademicCapIcon className="h-5 w-5 text-emerald-900" />
                </div>
                <h3 className="text-xl font-medium text-slate-900">
                  Professional Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="qualification"
                    className="text-base font-medium text-slate-700"
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
                    className="text-base font-medium text-slate-700"
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
                    className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="hourlyRate"
                    className="text-base font-medium text-slate-700"
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
                    className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="availability"
                    className="text-base font-medium text-slate-700"
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
                    className="text-base font-medium text-slate-700"
                  >
                    <span className="inline-flex items-center">
                      <AcademicCapIcon className="h-4 w-4 text-gray-500 mr-1" />
                      Specializations
                    </span>
                  </Label>
                  <Input
                    type="text"
                    id="specializations"
                    name="specializations"
                    value={formData.specializations.join(", ")}
                    onChange={(e) =>
                      handleArrayInputChange("specializations", e.target.value)
                    }
                    placeholder="e.g., Algebra, Calculus, SAT Prep, Special Education"
                    maxLength={300}
                    showCharCount
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate multiple specializations with commas
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="certifications"
                    className="text-base font-medium text-slate-700"
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
                  <p className="mt-1 text-xs text-gray-500">
                    Separate multiple certifications with commas
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="languages"
                    className="text-base font-medium text-slate-700"
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
                  <p className="mt-1 text-xs text-gray-500">
                    Separate multiple languages with commas
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="bio"
                    className="text-base font-medium text-slate-700"
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
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                <DocumentTextIcon className="h-5 w-5 text-green-500 inline mr-2" />
                CV Upload
              </h3>

              {formData.cvFileName && formData.cvStoragePath ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg"
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
                        <button
                          type="button"
                          onClick={handleCVView}
                          className="text-sm text-green-600 hover:text-green-800 underline mt-1 inline-block"
                        >
                          View CV
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCVRemove}
                      className="text-red-600 hover:text-red-800"
                      title="Remove CV"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 text-center">
                  <DocumentArrowUpIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
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
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
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
              <Alert className="border-green-2 00 bg-green-50 text-green-800">
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
                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2 shadow-lg hover:shadow-xl"
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
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TutorProfile;
