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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
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
