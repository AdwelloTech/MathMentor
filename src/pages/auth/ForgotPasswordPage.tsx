import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { AcademicCapIcon, EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import GameLoadingAnimation from '@/components/ui/GameLoadingAnimation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';
import type { PasswordResetFormData } from '@/types/auth';

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<PasswordResetFormData>();

  const onSubmit = async (data: PasswordResetFormData) => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.post<{ message: string }>('/api/auth/forgot-password', {
        email: data.email
      });

      if (response.message) {
        toast.success('Password reset code sent to your email!');
        navigate('/reset-password', { state: { email: data.email } });
      }
    } catch (error: any) {
      setError('root', {
        message: error.response?.data?.error || 'Failed to send reset email',
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
              <AcademicCapIcon className="h-12 w-12 text-primary" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-foreground mb-2"
          >
            Forgot Password?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            No worries! We'll send you a reset code.
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
            <Label htmlFor="email" className="text-card-foreground font-medium">
              Email Address
            </Label>
            <Input
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
              className={`bg-input border-border text-foreground placeholder:text-muted-foreground ${
                errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
            />
            {errors.email && (
              <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
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
              {isLoading ? (
                <GameLoadingAnimation size="sm" />
              ) : (
                <>
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  Send Reset Code
                </>
              )}
            </Button>
          </motion.div>

          <motion.div variants={fadeInUp} className="text-center pt-4">
            <Link
              to="/login"
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage; 