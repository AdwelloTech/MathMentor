import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { AcademicCapIcon, LockClosedIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import apiClient from '@/lib/apiClient';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { NewPasswordFormData } from '@/types/auth';

const ResetPasswordPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<NewPasswordFormData>();

  const password = watch('password');

  // Check if the user has a valid reset session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First, let's check for URL fragments (Supabase typically uses # instead of ?)
        const urlHash = window.location.hash;
        const urlParams = new URLSearchParams(urlHash.substring(1)); // Remove the # and parse
        
        // Also check search params as fallback
        const accessToken = urlParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || searchParams.get('refresh_token');
        const type = urlParams.get('type') || searchParams.get('type');
        const error = urlParams.get('error') || searchParams.get('error');
        
        console.log('Reset password URL check:', { 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken, 
          type,
          error,
          fullHash: urlHash
        });
        
        // If there's an error in the URL, show it
        if (error) {
          console.log('Error in reset URL:', error);
          setIsValidSession(false);
          return;
        }
        
        // If we have recovery type and tokens, this is a valid reset session
        if (type === 'recovery' && accessToken) {
          console.log('Valid recovery tokens found, setting session...');
          
          // Clean up the URL to remove sensitive tokens (optional, for security)
          if (urlHash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          setIsValidSession(true);
          return;
        }
        
        // Password reset functionality needs backend implementation
        // For now, mark as invalid since Supabase is removed
        console.warn('Password reset requires backend implementation');
        setIsValidSession(false);
        
      } catch (error) {
        console.error('Error checking session:', error);
        setIsValidSession(false);
      }
    };

    // Add a small delay to ensure Supabase has processed any URL tokens
    const timer = setTimeout(checkSession, 200);
    
    return () => clearTimeout(timer);
  }, [searchParams]);

  const onSubmit = async (data: NewPasswordFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {
        message: 'Passwords do not match',
      });
      return;
    }

    if (data.password.length < 6) {
      setError('password', {
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Password reset would need backend implementation
      // await apiClient.post('/api/auth/reset-password', { password: data.password, token: accessToken });
      
      toast.error('Password reset requires backend implementation');
      setError('root', {
        message: 'Password reset feature is currently unavailable. Please contact support.',
      });
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError('root', {
        message: error.message || 'Failed to update password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session validity
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show error if session is invalid (but only after we've checked properly)
  if (isValidSession === false) {
    // Give user feedback about what went wrong
    const urlHash = window.location.hash;
    const urlParams = new URLSearchParams(urlHash.substring(1));
    const hasTokens = urlParams.get('access_token') || searchParams.get('access_token');
    const errorDescription = urlParams.get('error_description') || searchParams.get('error_description');
    
    let errorMessage = "This password reset link is invalid or has expired. Please request a new password reset.";
    
    if (errorDescription) {
      errorMessage = `Reset link error: ${errorDescription}`;
    } else if (!hasTokens) {
      errorMessage = "No authentication tokens found in the URL. Please make sure you clicked the complete link from your email.";
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-600 rounded-2xl blur opacity-30"></div>
                <div className="relative bg-white p-3 rounded-2xl shadow-lg">
                  <LockClosedIcon className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Reset Link Issue
            </h2>
            <p className="text-gray-600 mb-6">
              {errorMessage}
            </p>
            <div className="space-y-4">
              <Link
                to="/forgot-password"
                className="btn btn-primary w-full"
              >
                Request New Reset Link
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center text-primary-600 hover:text-primary-500 font-medium"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl blur opacity-30 animate-pulse"></div>
              <div className="relative bg-white p-3 rounded-2xl shadow-lg">
                <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h2>
          <p className="text-gray-600">
            Enter your new password below to complete the reset process.
          </p>
        </motion.div>

        {/* Reset Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card"
        >
          <div className="card-body">
            {!isSuccess ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* New Password Field */}
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters long',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="Enter your new password"
                      className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
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
                    <p className="form-error">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) =>
                          value === password || 'Passwords do not match',
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="Confirm your new password"
                      className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
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
                    <p className="form-error">{errors.confirmPassword.message}</p>
                  )}
                </div>

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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full btn-lg hover-lift"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <LockClosedIcon className="h-5 w-5 mr-2" />
                      Update Password
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-6"
              >
                <div className="mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <LockClosedIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Password Updated!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your password has been successfully updated. You will be redirected to the login page shortly.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting in 3 seconds...
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Back to Login Link */}
        {!isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <Link
              to="/login"
              className="inline-flex items-center text-primary-600 hover:text-primary-500 font-medium"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage; 