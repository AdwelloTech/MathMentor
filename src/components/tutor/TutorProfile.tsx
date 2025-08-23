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
import { getActiveProfileImage } from "@/lib/profileImages";
import ProfileImageUpload from "@/components/ui/ProfileImageUpload";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
// Note: toast functionality removed as it's not available in this project

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

        // Load active profile image
        if (profileData.id) {
          const imageUrl = await getActiveProfileImage(profileData.id);
          setCurrentProfileImageUrl(imageUrl);
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name: string, value: string[]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name: string, value: number | undefined) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBooleanChange = (name: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        specializations: formData.specializations || [],
        hourly_rate: formData.hourlyRate || null,
        availability: formData.availability || null,
        bio: formData.bio || null,
        certifications: formData.certifications || [],
        languages: formData.languages || [],
        cv_url: formData.cvUrl || null,
        cv_file_name: formData.cvFileName || null,
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
      setErrorMessage("");
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setCvUploadError("Please upload a PDF file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setCvUploadError("File size must be less than 5MB");
      return;
    }

    setIsUploadingCV(true);
    setCvUploadError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/cv/${Date.now()}.${fileExt}`;
      const filePath = `cv-uploads/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("cv-uploads")
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("cv-uploads")
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) {
        throw new Error("Failed to get public URL");
      }

      // Update form data
      setFormData((prev) => ({
        ...prev,
        cvUrl: urlData.publicUrl,
        cvFileName: file.name,
      }));

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          cv_url: urlData.publicUrl,
          cv_file_name: file.name,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Update AuthContext
      if (updateProfile) {
        await updateProfile({
          cv_url: urlData.publicUrl,
          cv_file_name: file.name,
        });
      }

      console.log("CV uploaded successfully!");
    } catch (error) {
      console.error("Error uploading CV:", error);
      setCvUploadError(
        error instanceof Error ? error.message : "Failed to upload CV"
      );
    } finally {
      setIsUploadingCV(false);
    }
  };

  const handleCVRemove = async () => {
    if (!user?.id || !formData.cvUrl) return;

    try {
      // Extract file path from URL
      const urlParts = formData.cvUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/cv/${fileName}`;

      // Remove file from storage
      const { error: deleteError } = await supabase.storage
        .from("cv-uploads")
        .remove([filePath]);

      if (deleteError) {
        console.error("Error deleting file:", deleteError);
      }

      // Update form data
      setFormData((prev) => ({
        ...prev,
        cvUrl: "",
        cvFileName: "",
      }));

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          cv_url: null,
          cv_file_name: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      // Update AuthContext
      if (updateProfile) {
        await updateProfile({
          cv_url: undefined,
          cv_file_name: undefined,
        });
      }

      console.log("CV removed successfully!");
    } catch (error) {
      console.error("Error removing CV:", error);
      console.error("Failed to remove CV");
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
                    htmlFor="phone"
                    className="text-base font-medium text-slate-700"
                  >
                  Phone Number
                  </Label>
                  <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                    className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                />
              </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="dateOfBirth"
                    className="text-base font-medium text-slate-700"
                  >
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                  onChange={handleInputChange}
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
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-base font-medium text-slate-700"
                >
                  Address
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                  rows={3}
                  className="rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
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
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact information"
                  className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                />
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
                  id="qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                    placeholder="Enter your qualification"
                    className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
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
                  value={formData.experienceYears || ""}
                    onChange={(e) =>
                      handleNumberChange(
                        "experienceYears",
                        parseInt(e.target.value) || undefined
                      )
                    }
                    placeholder="Enter years of experience"
                  min="0"
                  max="50"
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
                  value={formData.hourlyRate || ""}
                    onChange={(e) =>
                      handleNumberChange(
                        "hourlyRate",
                        parseFloat(e.target.value) || undefined
                      )
                    }
                    placeholder="Enter your hourly rate"
                  min="0"
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
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                    placeholder="e.g., Weekdays 9 AM - 5 PM"
                    className="h-12 rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                />
              </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="bio"
                  className="text-base font-medium text-slate-700"
                >
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself and your teaching approach"
                  rows={4}
                  className="rounded-2xl border-slate-200 focus:border-emerald-900 focus:ring-emerald-900"
                />
            </div>
          </div>

            <Separator />

            {/* CV Upload Section */}
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-emerald-900/10 rounded-xl mr-3">
                  <DocumentArrowUpIcon className="h-5 w-5 text-emerald-900" />
                </div>
                <h3 className="text-xl font-medium text-slate-900">
                  CV/Resume
            </h3>
              </div>

              {formData.cvFileName && formData.cvUrl ? (
                <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DocumentArrowUpIcon className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">
                        File: {formData.cvFileName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                    type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(formData.cvUrl, "_blank")}
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                      >
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCVRemove}
                        className="text-red-600 border-red-200 hover:bg-red-100"
                      >
                        Remove
                      </Button>
                </div>
                    </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 text-center">
                  <DocumentArrowUpIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    Upload your CV/Resume (PDF format, max 5MB)
                  </p>
                    <input
                      type="file"
                    accept=".pdf"
                      onChange={handleCVUpload}
                      className="hidden"
                    id="cv-upload"
                  />
                  <Label
                    htmlFor="cv-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
                  >
                    Choose File
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

            {/* Success/Error Messages */}
          {saveStatus === "success" && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
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

          {/* Submit Button */}
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
