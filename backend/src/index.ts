// Load environment variables FIRST - before any other imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';

// Import configuration and middleware
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import { 
  advancedSecurityHeaders, 
  securityContext, 
  sanitizeHeaders,
  preventParameterPollution,
  requestSizeLimiter
} from './middleware/securityHeaders';
import { apiLimiter } from './middleware/rateLimiter';
import { decryptRequest, encryptResponse } from './middleware/encryption';
import { cacheMiddleware, invalidateCacheOnMutation } from './middleware/cache';

// Import routes
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import flashcardRoutes from './routes/flashcards';
import aiRoutes from './routes/ai';
import quizRoutes from './routes/quizzes';
import studyNotesRoutes from './routes/studyNotes';
import messagingRoutes from './routes/messaging';
import filesRoutes from './routes/files';
import quizPdfsRoutes from './routes/quizPdfs';
import dashboardRoutes from './routes/dashboard';
import packagesRoutes from './routes/packages';
import classesRoutes from './routes/classes';
import bookingsRoutes from './routes/bookings';
import subjectsRoutes from './routes/subjects';
import gradeLevelsRoutes from './routes/gradeLevels';
import tutorialRoutes from './routes/tutorial';
import tutorMaterialsRoutes from './routes/tutorMaterials';
import profileImagesRoutes from './routes/profileImages';
import tutorRoutes from './routes/tutors';
import adminRoutes from './routes/admin';
import ratingsRoutes from './routes/ratings';
import instantSessionsRoutes from './routes/instantSessions';
import parentsRoutes from './routes/parents';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');

// Connect to MongoDB
connectDB();

// Security middleware - Order matters!
// 1. Basic security headers from helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // We'll handle this with our custom middleware
}));

// 2. Advanced security headers
app.use(advancedSecurityHeaders);

// 3. Security context
app.use(securityContext);

// 4. Sanitize headers
app.use(sanitizeHeaders);

// 5. Prevent parameter pollution
app.use(preventParameterPollution);

// 6. Request size limiter
app.use(requestSizeLimiter(10 * 1024 * 1024)); // 10MB limit

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost and your VPS IP
    const allowedOrigins = [
      'https://mathmentor.co.uk',
      'https://www.mathmentor.co.uk',
      'https://app.mathmentor.co.uk',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked CORS origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Encrypted', 'X-Request-Encryption'],
  exposedHeaders: ['X-Encrypted']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static('uploads', {
  maxAge: '1d', // Cache for 1 day
  etag: true
}));

// Request logging
app.use(requestLogger);

// Global rate limiting (applies to all API routes)
app.use('/api/', apiLimiter);

// Cache invalidation on mutations
app.use('/api/', invalidateCacheOnMutation);

// Encryption middleware (optional - only for clients that request it)
app.use(decryptRequest);
app.use(encryptResponse);

// Health check route (no rate limiting on health checks)
app.use('/api/health', healthRoutes);

// API routes with selective caching
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', cacheMiddleware(60000), dashboardRoutes); // 1 min cache
app.use('/api/packages', cacheMiddleware(300000), packagesRoutes); // 5 min cache
app.use('/api/flashcards', cacheMiddleware(120000), flashcardRoutes); // 2 min cache
app.use('/api/ai', aiRoutes); // No cache for AI
app.use('/api/quizzes', cacheMiddleware(60000), quizRoutes); // 1 min cache
app.use('/api/study-notes', cacheMiddleware(60000), studyNotesRoutes); // 1 min cache
app.use('/api/messaging', messagingRoutes); // No cache for messaging
app.use('/api/files', filesRoutes); // No cache for file uploads
app.use('/api/quiz-pdfs', cacheMiddleware(300000), quizPdfsRoutes); // 5 min cache
app.use('/api/classes', cacheMiddleware(60000), classesRoutes); // 1 min cache
app.use('/api/bookings', cacheMiddleware(30000), bookingsRoutes); // 30 sec cache
app.use('/api/subjects', cacheMiddleware(600000), subjectsRoutes); // 10 min cache
app.use('/api/grade-levels', cacheMiddleware(600000), gradeLevelsRoutes); // 10 min cache
app.use('/api/tutorial', cacheMiddleware(300000), tutorialRoutes); // 5 min cache
app.use('/api/tutor-materials', cacheMiddleware(120000), tutorMaterialsRoutes); // 2 min cache
app.use('/api/profile-images', profileImagesRoutes); // No cache for images
app.use('/api/tutors', cacheMiddleware(120000), tutorRoutes); // 2 min cache
app.use('/api/admin', cacheMiddleware(30000), adminRoutes); // 30 sec cache
app.use('/api/ratings', cacheMiddleware(120000), ratingsRoutes); // 2 min cache
app.use('/api/instant-sessions', instantSessionsRoutes); // No cache for real-time sessions
app.use('/api/parents', cacheMiddleware(60000), parentsRoutes); // 1 min cache

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MathMentor Backend Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
