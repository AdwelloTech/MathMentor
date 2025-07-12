import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { AcademicCapIcon, UserPlusIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getRoleDisplayName, getPackageDisplayName, getPackageFeatures } from '@/utils/permissions';
import type { RegisterFormData, UserRole, StudentPackage } from '@/types/auth';

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<RegisterFormData>();

  const watchedRole = watch('role');
  const watchedPackage = watch('package');

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {
        message: 'Passwords do not match',
      });
      return;
    }

    try {
      setIsLoading(true);
      await signUp(data.email, data.password, {
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        phone: data.phone,
        package: data.role === 'student' ? data.package : undefined,
      });
      navigate('/login');
    } catch (error: any) {
      setError('root', {
        message: error.message || 'Registration failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Available roles for self-registration
  const availableRoles: UserRole[] = ['student', 'parent'];

  // Available packages for students
  const availablePackages: StudentPackage[] = ['free', 'silver', 'gold'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
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
            Create Your Account
          </h2>
          <p className="text-gray-600">
            Join the Institute Management System
          </p>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card"
        >
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <input
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters',
                      },
                    })}
                    type="text"
                    id="firstName"
                    placeholder="Enter your first name"
                    className={`input ${errors.firstName ? 'input-error' : ''}`}
                  />
                  {errors.firstName && (
                    <p className="form-error">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <input
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters',
                      },
                    })}
                    type="text"
                    id="lastName"
                    placeholder="Enter your last name"
                    className={`input ${errors.lastName ? 'input-error' : ''}`}
                  />
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                />
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number (Optional)
                </label>
                <input
                  {...register('phone', {
                    pattern: {
                      value: /^[+]?[\d\s-()]+$/,
                      message: 'Please enter a valid phone number',
                    },
                  })}
                  type="tel"
                  id="phone"
                  placeholder="Enter your phone number"
                  className={`input ${errors.phone ? 'input-error' : ''}`}
                />
                {errors.phone && (
                  <p className="form-error">{errors.phone.message}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="form-group">
                <label htmlFor="role" className="form-label">
                  I am a
                </label>
                <select
                  {...register('role', {
                    required: 'Please select your role',
                  })}
                  id="role"
                  className={`input ${errors.role ? 'input-error' : ''}`}
                >
                  <option value="">Select your role</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleDisplayName(role)}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="form-error">{errors.role.message}</p>
                )}
              </div>

              {/* Package Selection (for students only) */}
              {watchedRole === 'student' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="form-group"
                >
                  <label htmlFor="package" className="form-label">
                    Select Package
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {availablePackages.map((pkg) => (
                      <label
                        key={pkg}
                        className={`relative flex flex-col p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          watchedPackage === pkg
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          {...register('package', {
                            required: watchedRole === 'student' ? 'Please select a package' : false,
                          })}
                          type="radio"
                          value={pkg}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {getPackageDisplayName(pkg)}
                          </span>
                          <span
                            className={`w-4 h-4 rounded-full border-2 ${
                              watchedPackage === pkg
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300'
                            }`}
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          {getPackageFeatures(pkg).slice(0, 2).map((feature, index) => (
                            <div key={index} className="flex items-center mb-1">
                              <span className="text-green-500 mr-1">✓</span>
                              {feature}
                            </div>
                          ))}
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.package && (
                    <p className="form-error">{errors.package.message}</p>
                  )}
                </motion.div>
              )}

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="Enter your password"
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

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="Confirm your password"
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
              </div>

              {/* Terms and Conditions */}
              <div className="form-group">
                <div className="flex items-center">
                  <input
                    {...register('agreesToTerms', {
                      required: 'You must agree to the terms and conditions',
                    })}
                    id="agreesToTerms"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="agreesToTerms" className="ml-2 block text-sm text-gray-900">
                    I agree to the{' '}
                    <a href="#" className="text-primary-600 hover:text-primary-500">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-primary-600 hover:text-primary-500">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.agreesToTerms && (
                  <p className="form-error">{errors.agreesToTerms.message}</p>
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
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    Create Account
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage; 