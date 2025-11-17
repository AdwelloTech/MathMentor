import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GameLoadingAnimation from '@/components/ui/GameLoadingAnimation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';

interface ResetPasswordFormData {
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const email = (location.state as any)?.email;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError
  } = useForm<ResetPasswordFormData>();

  React.useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);

      const response = await apiClient.post<{ message: string }>('/api/auth/reset-password', {
        email,
        otp: data.otp,
        newPassword: data.newPassword
      });

      if (response.message) {
        toast.success('Password reset successful! Please login with your new password.');
        navigate('/login', { replace: true });
      }
    } catch (error: any) {
      setError('root', {
        message: error.response?.data?.error || 'Failed to reset password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle className="text-foreground hover:bg-muted shadow-lg" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-block mb-4"
          >
            <div className="bg-primary/10 p-4 rounded-full">
              <LockClosedIcon className="h-12 w-12 text-primary" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-foreground mb-2"
          >
            Reset Your Password
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            Enter the OTP sent to <span className="font-semibold text-foreground">{email}</span>
          </motion.p>
        </div>

        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="space-y-6 bg-card border border-border rounded-2xl p-8 shadow-xl"
        >
          <motion.div variants={fadeInUp} className="space-y-2">
            <Label htmlFor="otp" className="text-card-foreground font-medium">
              Verification Code
            </Label>
            <Input
              {...register('otp', {
                required: 'OTP is required',
                pattern: {
                  value: /^\d{6}$/,
                  message: 'OTP must be 6 digits'
                }
              })}
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit code"
              className={`bg-input border-border text-foreground placeholder:text-muted-foreground ${
                errors.otp ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
            />
            {errors.otp && (
              <p className="text-sm text-destructive font-medium">{errors.otp.message}</p>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-2">
            <Label htmlFor="newPassword" className="text-card-foreground font-medium">
              New Password
            </Label>
            <div className="relative">
              <Input
                {...register('newPassword', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase, and number'
                  }
                })}
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                className={`pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground ${
                  errors.newPassword ? 'border-red-500 focus-visible:ring-red-500' : ''
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
            {errors.newPassword && (
              <p className="text-sm text-destructive font-medium">{errors.newPassword.message}</p>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-card-foreground font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === watch('newPassword') || 'Passwords do not match'
                })}
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                className={`pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground ${
                  errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''
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
              <p className="text-sm text-destructive font-medium">{errors.confirmPassword.message}</p>
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
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              size="lg"
            >
              {isLoading ? <GameLoadingAnimation size="sm" /> : 'Reset Password'}
            </Button>
          </motion.div>

          <motion.div variants={fadeInUp} className="text-center pt-4">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Forgot Password
            </button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
