import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { BookOpenIcon } from "@heroicons/react/24/solid";
import { useAuth } from "@/contexts/AuthContext";
import GameLoadingAnimation from "@/components/ui/GameLoadingAnimation";
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
    <div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-2 relative bg-background text-foreground font-clash">
      {/* Left Column - Visual Panel (placeholder image) */}
      <motion.div
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative hidden lg:flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-stone-900 overflow-visible border border-amber-500/20 shadow-2xl">
          <div className="absolute -left-10 -bottom-24 h-[38rem] w-[38rem] rounded-full border-2 border-amber-400/10" />
          <div className="absolute left-10 top-16 h-[28rem] w-[28rem] rounded-full border-2 border-amber-400/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

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
              fill="#f59e0b"
              fontSize="8"
              fontFamily="Arial, sans-serif"
            >
              +
            </text>
            <text
              x="85"
              y="35"
              fill="#f59e0b"
              fontSize="6"
              fontFamily="Arial, sans-serif"
            >
              +
            </text>
            <text
              x="25"
              y="75"
              fill="#f59e0b"
              fontSize="7"
              fontFamily="Arial, sans-serif"
            >
              +
            </text>

            {/* Minus symbol */}
            <text
              x="75"
              y="20"
              fill="#f59e0b"
              fontSize="5"
              fontFamily="Arial, sans-serif"
            >
              −
            </text>
            <text
              x="10"
              y="60"
              fill="#f59e0b"
              fontSize="6"
              fontFamily="Arial, sans-serif"
            >
              −
            </text>

            {/* Multiplication symbol */}
            <text
              x="90"
              y="70"
              fill="#f59e0b"
              fontSize="7"
              fontFamily="Arial, sans-serif"
            >
              ×
            </text>
            <text
              x="35"
              y="45"
              fill="#f59e0b"
              fontSize="5"
              fontFamily="Arial, sans-serif"
            >
              ×
            </text>

            {/* Division symbol */}
            <text
              x="65"
              y="85"
              fill="#f59e0b"
              fontSize="6"
              fontFamily="Arial, sans-serif"
            >
              ÷
            </text>
            <text
              x="5"
              y="40"
              fill="#f59e0b"
              fontSize="4"
              fontFamily="Arial, sans-serif"
            >
              ÷
            </text>

            {/* Equals symbol */}
            <text
              x="80"
              y="50"
              fill="#f59e0b"
              fontSize="5"
              fontFamily="Arial, sans-serif"
            >
              =
            </text>
            <text
              x="20"
              y="85"
              fill="#f59e0b"
              fontSize="6"
              fontFamily="Arial, sans-serif"
            >
              =
            </text>

            {/* Pi symbol */}
            <text
              x="95"
              y="15"
              fill="#f59e0b"
              fontSize="4"
              fontFamily="Arial, sans-serif"
            >
              π
            </text>
            <text
              x="45"
              y="80"
              fill="#f59e0b"
              fontSize="5"
              fontFamily="Arial, sans-serif"
            >
              π
            </text>

            {/* Square root symbol */}
            <text
              x="70"
              y="25"
              fill="#f59e0b"
              fontSize="6"
              fontFamily="Arial, sans-serif"
            >
              √
            </text>
            <text
              x="15"
              y="90"
              fill="#f59e0b"
              fontSize="5"
              fontFamily="Arial, sans-serif"
            >
              √
            </text>

            {/* Infinity symbol */}
            <text
              x="50"
              y="15"
              fill="#f59e0b"
              fontSize="4"
              fontFamily="Arial, sans-serif"
            >
              ∞
            </text>
            <text
              x="30"
              y="95"
              fill="#f59e0b"
              fontSize="5"
              fontFamily="Arial, sans-serif"
            >
              ∞
            </text>

            {/* Degree symbol */}
            <text
              x="85"
              y="90"
              fill="#f59e0b"
              fontSize="3"
              fontFamily="Arial, sans-serif"
            >
              °
            </text>
            <text
              x="55"
              y="65"
              fill="#f59e0b"
              fontSize="4"
              fontFamily="Arial, sans-serif"
            >
              °
            </text>
          </svg>

          <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center text-amber-50 px-10 pt-0 ">
            <motion.h1
              className="text-5xl md:text-6xl font-extrabold leading-tight mb-4 text-amber-100 drop-shadow-lg tracking-wide"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Welcome Back
            </motion.h1>
            <motion.p
              className="text-amber-200/90 max-w-[640px] mb-12 text-base md:text-xl"
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
        className="bg-card max-w-full flex flex-col justify-center items-center p-6 md:p-10 relative border-l border-border/50"
      >
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent tracking-wide">
            Sign in to MathMentor
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-amber-500 mx-auto rounded-full" />
        </div>

        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 w-full max-w-md bg-black/20 border border-white/5 rounded-2xl p-6 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Email */}
          <motion.div className="space-y-2" variants={fadeInUp}>
            <Label htmlFor="email" className="text-amber-200/90">Email Address</Label>
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
              <p className="text-sm text-red-400">{errors.email.message}</p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div className="space-y-2" variants={fadeInUp}>
            <Label htmlFor="password" className="text-amber-200/90">Password</Label>
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
              <p className="text-sm text-red-400">{errors.password.message}</p>
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
              className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </motion.div>

          {/* Error */}
          {errors.root && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 bg-red-950/50 border border-red-500/30 rounded-lg backdrop-blur-sm"
            >
              <p className="text-sm text-red-400">{errors.root.message}</p>
            </motion.div>
          )}

          {/* Submit */}
          <motion.div variants={fadeInUp}>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
              size="lg"
            >
              {isLoading ? (
                <GameLoadingAnimation size="sm" />
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
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Register here
              </Link>
            </p>
          </motion.div>

          {/* Admin Login link */}
          <motion.div className="text-center" variants={fadeInUp}>
            <p className="text-muted-foreground">
              <Link
                to="/admin/login"
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
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
