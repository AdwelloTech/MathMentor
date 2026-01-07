import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * General API rate limiter
 * Limits each IP to 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain IPs (optional - for testing)
  skip: (req: Request) => {
    // Skip if from trusted proxy or internal network (optional)
    return false;
  }
});

/**
 * Strict rate limiter for authentication routes
 * Prevents brute force attacks - 5 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again in 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit?.resetTime ? Math.ceil(req.rateLimit.resetTime / 1000) : 900
    });
  }
});

/**
 * File upload rate limiter
 * 10 uploads per 15 minutes per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    error: 'Too many file uploads. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Password reset rate limiter
 * Prevents abuse of password reset functionality - 3 attempts per hour
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: {
    success: false,
    error: 'Too many password reset attempts. Please try again in an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * OTP/Verification code rate limiter
 * Prevents OTP brute forcing - 10 attempts per 15 minutes
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many verification attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Email sending rate limiter
 * Prevents email flooding - 5 emails per hour
 */
export const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: 'Too many email requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Create custom rate limiter with specific options
 */
export const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string
) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

