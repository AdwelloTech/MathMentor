import mongoose from 'mongoose';
import { GradeLevelService } from '../services/gradeLevelService';
import { SubjectService } from '../services/subjectService';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';

    // Skip MongoDB connection in test environment
    if (process.env.NODE_ENV === 'test') {
      console.log('🧪 Skipping MongoDB connection in test environment');
      return;
    }

    const options: any = {
      maxPoolSize: 50, // Increased pool size for better concurrency
      minPoolSize: 10, // Maintain minimum connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
      retryWrites: true,
      retryReads: true,
      compressors: 'zlib' as const, // Enable compression for network traffic
      zlibCompressionLevel: 6,
      readPreference: 'primaryPreferred', // Read from primary, fall back to secondary
      directConnection: false,
      connectTimeoutMS: 10000,
      family: 4, // Use IPv4
    };

    // Set mongoose global options for better performance
    mongoose.set('strictQuery', false);
    mongoose.set('autoIndex', process.env.NODE_ENV === 'development');
    
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection pool size: ${options.maxPoolSize}`);

    // Initialize default data
    try {
      await GradeLevelService.initializeDefaultGradeLevels();
      await SubjectService.initializeDefaultSubjects();
    } catch (initError) {
      console.error('Error initializing default data:', initError);
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📴 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);

    // In development, don't exit - allow the app to run without DB
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Running without MongoDB - some features will not work');
      console.log('💡 To fix: Install MongoDB locally or use MongoDB Atlas');
      console.log('   Local: https://docs.mongodb.com/manual/installation/');
      console.log('   Atlas: https://cloud.mongodb.com/');
      return;
    }

    process.exit(1);
  }
};

export default mongoose;
