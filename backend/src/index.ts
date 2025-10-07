import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import dotenv from 'dotenv';

// Import configuration and middleware
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';

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

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000');

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost and your VPS IP
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://72.60.20.140:3000',
      'http://72.60.20.140:3001',
      'http://72.60.20.140:3002',
      'https://72.60.20.140:3000',
      'https://72.60.20.140:3001',
      'https://72.60.20.140:3002',
      'https://72.60.20.140:5000',
      'https://72.60.20.140:5001',
      'https://offline-coal-difference-luggage.trycloudflare.com',
      'https://scenario-sbjct-pursuit-language.trycloudflare.com',
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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

// Health check route
app.use('/api/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/study-notes', studyNotesRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/quiz-pdfs', quizPdfsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/grade-levels', gradeLevelsRoutes);
app.use('/api/tutorial', tutorialRoutes);
app.use('/api/tutor-materials', tutorMaterialsRoutes);
app.use('/api/profile-images', profileImagesRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/admin', adminRoutes);

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
