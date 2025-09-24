import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.status(200).json({
      status: 'OK',
      message: 'MathMentor Backend API is running',
      timestamp: new Date().toISOString(),
      services: {
        database: mongoStatus,
        server: 'running'
      },
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const mongoStatus = mongoose.connection.readyState;
    const mongoStatusMap: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    const mongoStatusText = mongoStatusMap[mongoStatus] || 'unknown';

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: {
          status: mongoStatusText,
          name: mongoose.connection.name,
          host: mongoose.connection.host,
          port: mongoose.connection.port
        },
        server: {
          status: 'running',
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        }
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Detailed health check failed',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

export default router;
