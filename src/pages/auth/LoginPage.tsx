import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { BookOpenIcon } from "@heroicons/react/24/solid";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import type { LoginFormData } from "@/types/auth";
// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<LoginFormData>();

  // Handle navigation state from registration
  useEffect(() => {
    const state = location.state as any;
    if (state?.message) {
      toast.success(state.message);
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
    if (state?.email) {
      setValue("email", state.email);
    }
  }, [location.state, setValue]);

  // animations similar to RegisterPage
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

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      const to = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(to, { replace: true });
    } catch (error: any) {
      setError("root", {
        message: error.message || "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-2 relative">
      {/* Left Column - Visual Panel (placeholder image) */}
      <motion.div
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative hidden lg:flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-10 rounded-3xl bg-gradient-to-br from-[#1f6d37] via-[#1c5d30] to-[#144d23] overflow-visible">
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

          <div className="relative z-10 h-full w-full flex flex-col items-center text-center text-white px-8 pt-12 md:pt-16">
            <motion.h1
              className="text-4xl font-bold leading-tight mb-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Welcome Back
            </motion.h1>
            <motion.p
              className="text-white/90 max-w-[640px] mb-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Enter your credentials to sign in to MathMentor
            </motion.p>
            {/* Placeholder image. Replace the src with your asset. */}
            <motion.img
              src={"/src/assets/student-login.png"}
              alt="Login Illustration"
              className="pointer-events-none absolute -translate-x-1/2 bottom-[-42px] w-[88%] max-w-[680px] object-contain drop-shadow-2xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Right Column - Form */}
      <motion.div
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white max-w-full flex flex-col justify-center items-center p-6 md:p-10 relative"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sign in to MathMentor
          </h2>
        </div>

        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Email */}
          <motion.div className="space-y-2" variants={fadeInUp}>
            <Label htmlFor="email">Email Address</Label>
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

          {/* Password */}
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
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </motion.div>

          {/* Remember & Forgot */}
          <motion.div
            className="flex items-center justify-between"
            variants={fadeInUp}
          >
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" {...register("remember")} />
              <Label htmlFor="remember" className="text-sm font-normal">
                Remember me
              </Label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-[#32a852] hover:text-[#16a34a] font-medium"
            >
              Forgot password?
            </Link>
          </motion.div>

          {/* Error */}
          {errors.root && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-600">{errors.root.message}</p>
            </motion.div>
          )}

          {/* Submit */}
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
                  <BookOpenIcon className="h-5 w-5" />
                  Sign In
                </>
              )}
            </Button>
          </motion.div>

          {/* Register link */}
          <motion.div className="text-center" variants={fadeInUp}>
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-[#32a852] hover:text-[#16a34a] font-medium"
              >
                Register here
              </Link>
            </p>
          </motion.div>

          {/* Admin Login link */}
          <motion.div className="text-center" variants={fadeInUp}>
            <p className="text-gray-600">
              <Link
                to="/admin/login"
                className="text-red-600 hover:text-red-500 font-medium"
              >
                Admin Login →
              </Link>
            </p>
          </motion.div>

          {/* Demo credentials */}
        </motion.form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
