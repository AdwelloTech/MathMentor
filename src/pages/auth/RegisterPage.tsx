import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { UserPlusIcon } from "@heroicons/react/24/solid";
import { Facebook, Instagram, Youtube, Linkedin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  getRoleDisplayName,
  getPackageDisplayName,
  getPackageFeatures,
} from "@/utils/permissions";
import { PACKAGE_PRICING_DISPLAY } from "@/lib/stripe";
import PaymentForm from "@/components/payment/PaymentForm";
import type { RegisterFormData, UserRole, StudentPackage } from "@/types/auth";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
// removed card container to make layout fullscreen
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to parse experience string to number
const parseExperience = (experience: string): number => {
  if (experience === "0-1") return 1;
  if (experience === "1-3") return 2;
  if (experience === "3-5") return 4;
  if (experience === "5-10") return 7;
  if (experience === "10+") return 10;
  return 0;
};

const RegisterPage: React.FC = () => {
  // Animation presets
  const fadeInUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  } as const;
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  } as const;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingRegistration, setPendingRegistration] =
    useState<RegisterFormData | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<RegisterFormData>();

  const watchedRole = watch("role");
  const watchedPackage = watch("package");

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", {
        message: "Passwords do not match",
      });
      return;
    }

    // Check if payment is required for the selected package
    const requiresPayment =
      data.role === "student" &&
      data.package &&
      ["silver", "gold"].includes(data.package);

    if (requiresPayment) {
      // Store registration data and show payment form
      setPendingRegistration(data);
      setShowPayment(true);
      return;
    }

    // Proceed with free registration
    await completeRegistration(data);
  };

  const completeRegistration = async (
    data: RegisterFormData,
    paymentIntentId?: string
  ) => {
    try {
      setIsLoading(true);

      // Create user profile data
      const profileData = {
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        phone: data.phone,
        package: data.role === "student" ? data.package : undefined,
        // Tutor-specific fields
        subjects:
          data.role === "tutor" && data.subjects
            ? data.subjects.split(",").map((s) => s.trim())
            : undefined,
        experience_years:
          data.role === "tutor" && data.experience
            ? parseExperience(data.experience)
            : undefined,
        qualification: data.role === "tutor" ? data.qualification : undefined,
        profile_completed: data.role === "tutor" ? false : undefined, // Tutors need to complete profile with CV
      };

      // Add payment metadata if available
      const metadata = paymentIntentId
        ? {
            ...profileData,
            payment_intent_id: paymentIntentId,
          }
        : profileData;

      console.log("Starting registration with metadata:", metadata);

      await signUp(data.email, data.password, metadata);

      // Give a brief moment for the user to be created before redirecting
      setTimeout(() => {
        navigate("/login", {
          state: {
            message:
              "Registration successful! Please sign in with your credentials.",
            email: data.email,
          },
        });
      }, 1000);
    } catch (error: any) {
      console.error("Registration error:", error);
      setError("root", {
        message: error.message || "Registration failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (pendingRegistration) {
      await completeRegistration(pendingRegistration, paymentIntentId);
    }
  };

  const handlePaymentError = (error: string) => {
    setError("root", {
      message: `Payment failed: ${error}`,
    });
    setShowPayment(false);
    setPendingRegistration(null);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setPendingRegistration(null);
  };

  // Available roles for self-registration
  const availableRoles: UserRole[] = ["student", "parent", "tutor"];

  // Available packages for students
  const availablePackages: StudentPackage[] = ["free", "silver", "gold"];

  // Show payment form if payment is required
  if (
    showPayment &&
    pendingRegistration &&
    pendingRegistration.package &&
    ["silver", "gold"].includes(pendingRegistration.package)
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#32a852] via-white to-[#16a34a] flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Your Registration
            </h2>
            <p className="text-gray-600">
              You're almost done! Please complete the payment for your{" "}
              {pendingRegistration.package} package.
            </p>
          </motion.div>

          <PaymentForm
            packageType={pendingRegistration.package as "silver" | "gold"}
            customerEmail={pendingRegistration.email}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onCancel={handlePaymentCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-2 relative">
      {/* Left Column - Visual Panel */}
      <motion.div
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative hidden lg:flex items-center justify-center overflow-hidden"
      >
        {/* Decorative rounded gradient card with content inside */}
        <div className="absolute inset-10 rounded-3xl bg-gradient-to-br from-[#1f6d37] via-[#1c5d30] to-[#144d23] overflow-visible">
          {/* Subtle circles */}
          <div className="absolute -left-10 -bottom-24 h-[38rem] w-[38rem] rounded-full border-2 border-white/10" />
          <div className="absolute left-10 top-16 h-[28rem] w-[28rem] rounded-full border-2 border-white/10" />
          {/* Math Symbols Background */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Plus symbol */}
            <text
              x="15"
              y="25"
              fill="#fbbf24"
              fontSize="8"
              fontFamily="Arial, sans-serif"
            >
              +
            </text>
            <text
              x="85"
              y="35"
              fill="#fbbf24"
              fontSize="6"
              fontFamily="Arial, sans-serif"
            >
              +
            </text>
            <text
              x="25"
              y="75"
              fill="#fbbf24"
              fontSize="7"
              fontFamily="Arial, sans-serif"
            >
              +
            </text>

            {/* Minus symbol */}
            <text
              x="75"
              y="20"
              fill="#fbbf24"
              fontSize="5"
              fontFamily="Arial, sans-serif"
            >
              −
            </text>
            <text
              x="10"
              y="60"
              fill="#fbbf24"
              fontSize="6"
              fontFamily="Arial, sans-serif"
            >
              −
            </text>

            {/* Multiplication symbol */}
            <text
              x="90"
              y="70"
              fill="#fbbf24"
              fontSize="7"
              fontFamily="Arial, sans-serif"
            >
              ×
            </text>
            <text
              x="35"
              y="45"
              fill="#fbbf24"
              fontSize="5"
              fontFamily="Arial, sans-serif"
            >
              ×
            </text>

            {/* Division symbol */}
            <text
              x="65"
              y="85"
              fill="#fbbf24"
              fontSize="6"
              fontFamily="Arial, sans-serif"
            >
              ÷
            </text>
            <text
              x="5"
              y="40"
              fill="#fbbf24"
              fontSize="4"
              fontFamily="Arial, sans-serif"
            >
              ÷
            </text>

            {/* Equals symbol */}
            <text
              x="80"
              y="50"
              fill="#fbbf24"
              fontSize="5"
              fontFamily="Arial, sans-serif"
            >
              =
            </text>
            <text
              x="20"
              y="85"
              fill="#fbbf24"
              fontSize="6"
              fontFamily="Arial, sans-serif"
            >
              =
            </text>

            {/* Pi symbol */}
            <text
              x="95"
              y="15"
              fill="#fbbf24"
              fontSize="4"
              fontFamily="Arial, sans-serif"
            >
              π
            </text>
            <text
              x="45"
              y="80"
              fill="#fbbf24"
              fontSize="5"
              fontFamily="Arial, sans-serif"
            >
              π
            </text>

            {/* Square root symbol */}
            <text
              x="70"
              y="25"
              fill="#fbbf24"
              fontSize="6"
              fontFamily="Arial, sans-serif"
            >
              √
            </text>
            <text
              x="15"
              y="90"
              fill="#fbbf24"
              fontSize="5"
              fontFamily="Arial, sans-serif"
            >
              √
            </text>

            {/* Infinity symbol */}
            <text
              x="50"
              y="15"
              fill="#fbbf24"
              fontSize="4"
              fontFamily="Arial, sans-serif"
            >
              ∞
            </text>
            <text
              x="30"
              y="95"
              fill="#fbbf24"
              fontSize="5"
              fontFamily="Arial, sans-serif"
            >
              ∞
            </text>

            {/* Degree symbol */}
            <text
              x="85"
              y="90"
              fill="#fbbf24"
              fontSize="3"
              fontFamily="Arial, sans-serif"
            >
              °
            </text>
            <text
              x="55"
              y="65"
              fill="#fbbf24"
              fontSize="4"
              fontFamily="Arial, sans-serif"
            >
              °
            </text>
          </svg>

          {/* Content wrapper */}
          <div className="relative z-10 h-full w-full flex flex-col items-center text-center text-white px-8 pt-12 md:pt-16">
            <motion.h1
              className="text-4xl font-bold leading-tight mb-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Master Math. Unlock Your Potential.
            </motion.h1>
            <motion.p
              className="text-white/90 max-w-[640px] mb-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Learn from expert tutors, practice with interactive tools, and
              achieve top results in your GCSE, A-Levels, and beyond — all in
              one place.
            </motion.p>

            {/* Popped-out image at the bottom of the card */}
            <motion.img
              src={"src/assets/student-register.png"}
              alt="Student"
              className="pointer-events-none absolute -translate-x-1/2 bottom-[-42px] w-[88%] max-w-[680px] object-contain drop-shadow-2xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Right Column - Registration Form */}
      <motion.div
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white max-w-full flex flex-col justify-center items-center p-6 md:p-10 relative"
      >
        {/* Brand header */}

        {/* Form Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sign up to Math Mentor
          </h2>
        </div>

        {/* Registration Form */}
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div className="space-y-2" variants={fadeInUp}>
              <Label htmlFor="firstName">Name</Label>
              <Input
                {...register("firstName", {
                  required: "First name is required",
                  minLength: {
                    value: 2,
                    message: "First name must be at least 2 characters",
                  },
                })}
                id="firstName"
                placeholder="Enter your name"
                className={
                  errors.firstName
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </motion.div>

            <motion.div className="space-y-2" variants={fadeInUp}>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                {...register("lastName", {
                  required: "Last name is required",
                  minLength: {
                    value: 2,
                    message: "Last name must be at least 2 characters",
                  },
                })}
                id="lastName"
                placeholder="Enter your last name"
                className={
                  errors.lastName
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </motion.div>
          </div>

          {/* Email */}
          <motion.div className="space-y-2" variants={fadeInUp}>
            <Label htmlFor="email">Email</Label>
            <Input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              })}
              type="email"
              id="email"
              placeholder="Enter your email"
              className={
                errors.email ? "border-red-500 focus-visible:ring-red-500" : ""
              }
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </motion.div>

          {/* Phone */}
          <motion.div className="space-y-2" variants={fadeInUp}>
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              {...register("phone", {
                pattern: {
                  value: /^[+]?[\d\s-()]+$/,
                  message: "Please enter a valid phone number",
                },
              })}
              type="tel"
              id="phone"
              placeholder="Enter your phone number"
              className={
                errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""
              }
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </motion.div>

          {/* Role Selection */}
          <motion.div className="space-y-2" variants={fadeInUp}>
            <Label htmlFor="role">I am a</Label>
            <Select
              value={watchedRole}
              onValueChange={(value) => setValue("role", value as UserRole)}
            >
              <SelectTrigger
                className={
                  errors.role ? "border-red-500 focus-visible:ring-red-500" : ""
                }
              >
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleDisplayName(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
          </motion.div>

          {/* Package Selection (for students only) */}
          {watchedRole === "student" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <Label>Select Package</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availablePackages.map((pkg) => (
                  <label
                    key={pkg}
                    className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      watchedPackage === pkg
                        ? "border-[#32a852] bg-green-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    } ${pkg === "gold" ? "ring-2 ring-yellow-400" : ""}`}
                  >
                    <input
                      {...register("package", {
                        required:
                          watchedRole === "student"
                            ? "Please select a package"
                            : false,
                      })}
                      type="radio"
                      value={pkg}
                      className="sr-only"
                    />

                    {/* Popular badge for Gold */}
                    {pkg === "gold" && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-bold text-gray-900 text-lg">
                          {getPackageDisplayName(pkg)}
                        </span>
                        <div className="text-2xl font-bold text-[#32a852] mt-1">
                          {PACKAGE_PRICING_DISPLAY[pkg]}
                        </div>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          watchedPackage === pkg
                            ? "border-[#32a852] bg-[#32a852]"
                            : "border-gray-300"
                        }`}
                      >
                        {watchedPackage === pkg && (
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                        )}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-2 flex-grow">
                      {getPackageFeatures(pkg).map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-green-500 mr-2 mt-0.5 text-xs">
                            ✓
                          </span>
                          <span className="flex-1">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Payment indicator for paid packages */}
                    {pkg !== "free" && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Secure Payment Required
                          </span>
                        </div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              {errors.package && (
                <p className="text-sm text-red-600">{errors.package.message}</p>
              )}
            </motion.div>
          )}

          {/* Tutor-specific fields */}
          {watchedRole === "tutor" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Tutor Information
                </h3>
                <p className="text-sm text-blue-700">
                  After registration, you'll need to complete your profile and
                  upload your CV to start tutoring.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subjects">Subjects You Can Teach</Label>
                  <Textarea
                    {...register("subjects", {
                      required:
                        watchedRole === "tutor"
                          ? "Please specify subjects you can teach"
                          : false,
                    })}
                    id="subjects"
                    rows={3}
                    placeholder="e.g., Mathematics, Physics, Chemistry..."
                    className={
                      errors.subjects
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {errors.subjects && (
                    <p className="text-sm text-red-600">
                      {errors.subjects.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Select
                    value={watch("experience")}
                    onValueChange={(value) => setValue("experience", value)}
                  >
                    <SelectTrigger
                      className={
                        errors.experience
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 years</SelectItem>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5-10">5-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.experience && (
                    <p className="text-sm text-red-600">
                      {errors.experience.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification">Highest Qualification</Label>
                <Input
                  {...register("qualification", {
                    required:
                      watchedRole === "tutor"
                        ? "Please enter your qualification"
                        : false,
                  })}
                  type="text"
                  id="qualification"
                  placeholder="e.g., Bachelor's in Mathematics, Master's in Physics..."
                  className={
                    errors.qualification
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {errors.qualification && (
                  <p className="text-sm text-red-600">
                    {errors.qualification.message}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div className="space-y-2" variants={fadeInUp}>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  className={`pr-10 ${
                    errors.password
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </motion.div>

            <motion.div className="space-y-2" variants={fadeInUp}>
              <Label htmlFor="confirmPassword">Retype Password</Label>
              <div className="relative">
                <Input
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                  })}
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  className={`pr-10 ${
                    errors.confirmPassword
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </motion.div>
          </div>

          {/* Terms and Conditions */}
          <motion.div className="space-y-2" variants={fadeInUp}>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreesToTerms"
                checked={watch("agreesToTerms")}
                onCheckedChange={(checked) =>
                  setValue("agreesToTerms", checked as boolean)
                }
              />
              <Label htmlFor="agreesToTerms" className="text-sm font-normal">
                I accepted all terms & conditions.
              </Label>
            </div>
            {errors.agreesToTerms && (
              <p className="text-sm text-red-600">
                {errors.agreesToTerms.message}
              </p>
            )}
          </motion.div>

          {/* Error Message */}
          {errors.root && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-600">{errors.root.message}</p>
            </motion.div>
          )}

          {/* OAuth divider */}

          {/* Google CTA (UI only) */}

          {/* Submit Button */}
          <motion.div variants={fadeInUp}>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <UserPlusIcon className="h-5 w-5" />
                  Sign up
                </>
              )}
            </Button>
          </motion.div>

          {/* Login Link */}
          <motion.div className="text-center" variants={fadeInUp}>
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#32a852] hover:text-[#16a34a] font-medium"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.form>

        {/* Social icons footer */}
        <div className="hidden lg:flex gap-3 items-center text-gray-500 absolute bottom-6 right-6">
          <a href="#" aria-label="Facebook" className="hover:text-[#32a852]">
            <Facebook className="h-5 w-5" />
          </a>
          <a href="#" aria-label="Instagram" className="hover:text-[#32a852]">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="#" aria-label="YouTube" className="hover:text-[#32a852]">
            <Youtube className="h-5 w-5" />
          </a>
          <a href="#" aria-label="LinkedIn" className="hover:text-[#32a852]">
            <Linkedin className="h-5 w-5" />
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
