import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { UserPlusIcon } from "@heroicons/react/24/solid";
import { useAuth } from "@/contexts/AuthContext";
import GameLoadingAnimation from "@/components/ui/GameLoadingAnimation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  getRoleDisplayName,
  getPackageDisplayName,
  getPackageFeatures,
} from "@/utils/permissions";
import { PACKAGE_PRICING_DISPLAY } from "@/lib/stripe";
import PaymentForm from "@/components/payment/PaymentForm";
import type { RegisterFormData, UserRole, StudentPackage } from "@/types/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


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
    _paymentIntentId?: string
  ) => {
    try {
      setIsLoading(true);

      // Create registration data matching backend schema
      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone,
        // Student-specific fields
        ...(data.role === "student" && { package: data.package }),
        // Tutor-specific fields
        ...(data.role === "tutor" && {
          subjects: data.subjects ? data.subjects.split(",").map((s) => s.trim()).filter(Boolean) : [],
          experience: data.experience,
          qualification: data.qualification,
        }),
      };

      console.log("Starting registration with data:", registrationData);

      await signUp(data.email, data.password, registrationData);

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

  if (
    showPayment &&
    pendingRegistration &&
    pendingRegistration.package &&
    ["silver", "gold"].includes(pendingRegistration.package)
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Complete Your Registration
            </h2>
            <p className="text-muted-foreground">
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
    <div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-2 relative bg-background text-foreground">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle className="text-foreground hover:bg-muted shadow-lg" />
      </div>

      <motion.div
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative hidden lg:flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-primary/80"
      >
        <div className="absolute inset-0 overflow-visible">
          <div className="absolute -left-10 -bottom-24 h-[38rem] w-[38rem] rounded-full border-2 border-white/10" />
          <div className="absolute left-10 top-16 h-[28rem] w-[28rem] rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          <svg
            className="absolute inset-0 w-full h-full opacity-40"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <text
              x="15"
              y="25"
              fill="rgba(255, 255, 255, 0.8)"
              fontSize="8"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              +
            </text>
            <text
              x="85"
              y="35"
              fill="rgba(255, 255, 255, 0.7)"
              fontSize="6"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              +
            </text>
            <text
              x="25"
              y="75"
              fill="rgba(255, 255, 255, 0.75)"
              fontSize="7"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              +
            </text>

            <text
              x="75"
              y="20"
              fill="rgba(255, 255, 255, 0.7)"
              fontSize="5"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              −
            </text>
            <text
              x="10"
              y="60"
              fill="rgba(255, 255, 255, 0.75)"
              fontSize="6"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              −
            </text>

            <text
              x="90"
              y="70"
              fill="rgba(255, 255, 255, 0.8)"
              fontSize="7"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              ×
            </text>
            <text
              x="35"
              y="45"
              fill="rgba(255, 255, 255, 0.7)"
              fontSize="5"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              ×
            </text>

            <text
              x="65"
              y="85"
              fill="rgba(255, 255, 255, 0.75)"
              fontSize="6"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              ÷
            </text>
            <text
              x="5"
              y="40"
              fill="rgba(255, 255, 255, 0.7)"
              fontSize="4"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              ÷
            </text>

            <text
              x="80"
              y="50"
              fill="rgba(255, 255, 255, 0.75)"
              fontSize="5"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              =
            </text>
            <text
              x="20"
              y="85"
              fill="rgba(255, 255, 255, 0.8)"
              fontSize="6"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              =
            </text>

            <text
              x="95"
              y="15"
              fill="rgba(255, 255, 255, 0.7)"
              fontSize="4"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              π
            </text>
            <text
              x="45"
              y="80"
              fill="rgba(255, 255, 255, 0.75)"
              fontSize="5"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              π
            </text>

            <text
              x="70"
              y="25"
              fill="rgba(255, 255, 255, 0.8)"
              fontSize="6"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              √
            </text>
            <text
              x="15"
              y="90"
              fill="rgba(255, 255, 255, 0.75)"
              fontSize="5"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              √
            </text>

            <text
              x="50"
              y="15"
              fill="rgba(255, 255, 255, 0.7)"
              fontSize="4"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              ∞
            </text>
            <text
              x="30"
              y="95"
              fill="rgba(255, 255, 255, 0.75)"
              fontSize="5"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              ∞
            </text>

            <text
              x="85"
              y="90"
              fill="rgba(255, 255, 255, 0.7)"
              fontSize="3"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              °
            </text>
            <text
              x="55"
              y="65"
              fill="rgba(255, 255, 255, 0.75)"
              fontSize="4"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
            >
              °
            </text>
          </svg>

          <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-10 pt-0">
            <motion.h1
              className="text-5xl md:text-6xl font-extrabold leading-tight mb-4 text-white drop-shadow-lg tracking-wide"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Join MathMentor
            </motion.h1>
            <motion.p
              className="text-white/90 max-w-[640px] mb-12 text-base md:text-xl font-medium"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Start your learning journey with expert tutors and achieve academic excellence
            </motion.p>
            <motion.img
              src={"/src/assets/student-register.png"}
              alt="Registration Illustration"
              className="pointer-events-none absolute -translate-x-1/2 bottom-[-42px] w-[88%] max-w-[680px] object-contain drop-shadow-2xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-background max-w-full flex flex-col justify-center items-center p-6 md:p-10 relative border-l border-border"
      >
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
            Create Your Account
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
        </div>

        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div className="space-y-2" variants={fadeInUp}>
              <Label htmlFor="firstName" className="text-card-foreground font-medium">Name</Label>
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
                className={`bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary ${
                  errors.firstName
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive font-medium">
                  {errors.firstName.message}
                </p>
              )}
            </motion.div>

            <motion.div className="space-y-2" variants={fadeInUp}>
              <Label htmlFor="lastName" className="text-card-foreground font-medium">Last Name</Label>
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
                className={`bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary ${
                  errors.lastName
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive font-medium">
                  {errors.lastName.message}
                </p>
              )}
            </motion.div>
          </div>

          <motion.div className="space-y-2" variants={fadeInUp}>
            <Label htmlFor="email" className="text-card-foreground font-medium">Email Address</Label>
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
              className={`bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary ${
                errors.email ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
            />
            {errors.email && (
              <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
            )}
          </motion.div>

          <motion.div className="space-y-2" variants={fadeInUp}>
            <Label htmlFor="phone" className="text-card-foreground font-medium">Phone Number (Optional)</Label>
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
              className={`bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary ${
                errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
            />
            {errors.phone && (
              <p className="text-sm text-destructive font-medium">{errors.phone.message}</p>
            )}
          </motion.div>

          <motion.div className="space-y-2" variants={fadeInUp}>
            <Label htmlFor="role" className="text-card-foreground font-medium">I am a</Label>
            <Select
              value={watchedRole}
              onValueChange={(value) => setValue("role", value as UserRole)}
            >
              <SelectTrigger
                className={`bg-input border-border text-foreground ${
                  errors.role ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
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
              <p className="text-sm text-destructive font-medium">{errors.role.message}</p>
            )}
          </motion.div>

          {watchedRole === "student" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <Label className="text-card-foreground font-medium">Select Package</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availablePackages.map((pkg) => (
                  <label
                    key={pkg}
                    className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      watchedPackage === pkg
                        ? "border-primary bg-primary/10 shadow-lg"
                        : "border-border hover:border-muted-foreground hover:shadow-md"
                    } ${pkg === "gold" ? "ring-2 ring-accent" : ""}`}
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

                    {pkg === "gold" && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-bold text-card-foreground text-lg">
                          {getPackageDisplayName(pkg)}
                        </span>
                        <div className="text-2xl font-bold text-primary mt-1">
                          {PACKAGE_PRICING_DISPLAY[pkg]}
                        </div>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          watchedPackage === pkg
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {watchedPackage === pkg && (
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                        )}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-2 flex-grow">
                      {getPackageFeatures(pkg).map((feature, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-primary mr-2 mt-0.5 text-xs">
                            ✓
                          </span>
                          <span className="flex-1">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {pkg !== "free" && (
                      <div className="mt-4 pt-3 border-t border-border">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                            Secure Payment Required
                          </span>
                        </div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              {errors.package && (
                <p className="text-sm text-destructive font-medium">{errors.package.message}</p>
              )}
            </motion.div>
          )}

          {watchedRole === "tutor" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-accent-foreground mb-2">
                  Tutor Information
                </h3>
                <p className="text-sm text-muted-foreground">
                  After registration, you'll need to complete your profile and
                  upload your CV to start tutoring.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subjects" className="text-card-foreground font-medium">Subjects You Can Teach</Label>
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
                    className={`bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary ${
                      errors.subjects
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  {errors.subjects && (
                    <p className="text-sm text-destructive font-medium">
                      {errors.subjects.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-card-foreground font-medium">Years of Experience</Label>
                  <Select
                    value={watch("experience")}
                    onValueChange={(value) => setValue("experience", value)}
                  >
                    <SelectTrigger
                      className={`bg-input border-border text-foreground ${
                        errors.experience
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
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
                    <p className="text-sm text-destructive font-medium">
                      {errors.experience.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification" className="text-card-foreground font-medium">Highest Qualification</Label>
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
                  className={`bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary ${
                    errors.qualification
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
                {errors.qualification && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.qualification.message}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div className="space-y-2" variants={fadeInUp}>
              <Label htmlFor="password" className="text-card-foreground font-medium">Password</Label>
              <div className="relative">
                <Input
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  className={`pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary ${
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
                    <EyeSlashIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive font-medium">
                  {errors.password.message}
                </p>
              )}
            </motion.div>

            <motion.div className="space-y-2" variants={fadeInUp}>
              <Label htmlFor="confirmPassword" className="text-card-foreground font-medium">Confirm Password</Label>
              <div className="relative">
                <Input
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) => {
                      if (value !== watch("password")) {
                        return "Passwords do not match";
                      }
                      return true;
                    },
                  })}
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  className={`pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary ${
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
                    <EyeSlashIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </motion.div>
          </div>

          <motion.div className="space-y-2" variants={fadeInUp}>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreesToTerms"
                checked={watch("agreesToTerms")}
                onCheckedChange={(checked) =>
                  setValue("agreesToTerms", checked as boolean)
                }
              />
              <Label htmlFor="agreesToTerms" className="text-sm font-normal text-card-foreground">
                I accept all terms and conditions
              </Label>
            </div>
            {errors.agreesToTerms && (
              <p className="text-sm text-destructive font-medium">
                {errors.agreesToTerms.message}
              </p>
            )}
          </motion.div>

          {errors.root && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
            >
              <p className="text-sm text-destructive font-medium">{errors.root.message}</p>
            </motion.div>
          )}

          <motion.div variants={fadeInUp}>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {isLoading ? (
                <GameLoadingAnimation size="sm" />
              ) : (
                <>
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </motion.div>

          <motion.div className="text-center" variants={fadeInUp}>
            <p className="text-muted-foreground font-medium">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
