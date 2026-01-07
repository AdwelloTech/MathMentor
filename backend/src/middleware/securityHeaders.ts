import { Request, Response, NextFunction } from 'express';

/**
 * Advanced security headers middleware
 * Implements comprehensive security headers for production
 */
export const advancedSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://meet.jit.si",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://cdn.jsdelivr.net",
      "connect-src 'self' https://*.trycloudflare.com wss://*.trycloudflare.com https://meet.jit.si wss://meet.jit.si",
      "frame-src 'self' https://meet.jit.si",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  );

  // Strict Transport Security (HSTS)
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Protection (legacy but still useful)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature-Policy)
  res.setHeader(
    'Permissions-Policy',
    [
      'camera=self',
      'microphone=self',
      'geolocation=self',
      'interest-cohort=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()'
    ].join(', ')
  );

  // Cross-Origin policies
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
};

/**
 * Add security context to request
 */
export const securityContext = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate request ID for tracking
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', requestId);

  // Add request metadata for security logging
  (req as any).securityContext = {
    requestId,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  };

  next();
};

/**
 * Sanitize request headers
 * Remove potentially dangerous headers
 */
export const sanitizeHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove headers that could be used for attacks
  const dangerousHeaders = [
    'x-forwarded-host',
    'x-forwarded-server',
    'x-host',
    'x-original-url',
    'x-rewrite-url'
  ];

  dangerousHeaders.forEach(header => {
    if (req.headers[header]) {
      delete req.headers[header];
    }
  });

  next();
};

/**
 * Prevent parameter pollution
 */
export const preventParameterPollution = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Ensure query parameters are not arrays (except explicitly allowed ones)
  const allowedArrayParams = ['tags', 'subjects', 'ids'];

  Object.keys(req.query).forEach(key => {
    if (Array.isArray(req.query[key]) && !allowedArrayParams.includes(key)) {
      // Take only the first value if it's an unexpected array
      req.query[key] = (req.query[key] as string[])[0];
    }
  });

  next();
};

/**
 * Request size limiter middleware
 * Prevents DOS attacks via large payloads
 */
export const requestSizeLimiter = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);

    if (contentLength > maxSize) {
      res.status(413).json({
        success: false,
        error: 'Request payload too large',
        maxSize: `${maxSize / 1024 / 1024}MB`
      });
      return;
    }

    next();
  };
};

