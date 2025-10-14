import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GameLoadingAnimation from '@/components/ui/GameLoadingAnimation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';
// import { useAuth } from '@/contexts/AuthContext';

const VerifyEmailPage: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = (location.state as any)?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer > 0 && !canResend) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
  }, [resendTimer, canResend]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    const nextEmptyIndex = newOtp.findIndex(val => !val);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);

      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>('/auth/verify-email', {
        email,
        otp: otpValue
      });

      toast.success('Email verified successfully!');

      const { accessToken, refreshToken } = response;
      apiClient.setTokens(accessToken, refreshToken);

      await new Promise(resolve => setTimeout(resolve, 500));
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsResending(true);

      const response = await apiClient.post<{ message: string }>('/auth/resend-verification-otp', { email });

      if (response.message) {
        toast.success('New OTP sent to your email!');
        setCanResend(false);
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
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
              <ShieldCheckIcon className="h-12 w-12 text-primary" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-foreground mb-2"
          >
            Verify Your Email
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            We've sent a 6-digit code to
            <br />
            <span className="font-semibold text-foreground">{email}</span>
          </motion.p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="space-y-6 bg-card border border-border rounded-2xl p-8 shadow-xl"
        >
          <motion.div variants={fadeInUp} className="space-y-2">
            <Label className="text-center block text-card-foreground font-medium">
              Enter Verification Code
            </Label>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-bold bg-input border-border text-foreground"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Button
              type="submit"
              disabled={isLoading || otp.some(d => !d)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              size="lg"
            >
              {isLoading ? <GameLoadingAnimation size="sm" /> : 'Verify Email'}
            </Button>
          </motion.div>

          <motion.div variants={fadeInUp} className="text-center">
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            ) : (
              <p className="text-muted-foreground text-sm">
                Resend code in <span className="font-semibold text-foreground">{resendTimer}s</span>
              </p>
            )}
          </motion.div>

          <motion.div variants={fadeInUp} className="text-center pt-4">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Registration
            </button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;

