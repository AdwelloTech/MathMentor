import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
  password: process.env.REDIS_PASSWORD || undefined,
});

// Redis connection events
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

// Connect to Redis
redisClient.connect().catch(console.error);

/**
 * Cache middleware for GET requests
 * Caches responses for a specified duration
 */
export function cache(duration: number = 300) { // Default 5 minutes
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      // Check if response is cached
      const cachedResponse = await redisClient.get(key);
      if (cachedResponse) {
        console.log(`📋 Cache hit for: ${req.originalUrl}`);
        const parsedResponse = JSON.parse(cachedResponse);
        return res.json(parsedResponse);
      }

      // Store original json method
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function(data: any) {
        // Cache the response
        redisClient.setEx(key, duration, JSON.stringify(data))
          .then(() => console.log(`💾 Cached response for: ${req.originalUrl}`))
          .catch(err => console.error('Redis cache error:', err));

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Clear cache for specific patterns
 */
export async function clearCache(pattern: string) {
  try {
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️ Cleared ${keys.length} cache entries for pattern: ${pattern}`);
    }
  } catch (error) {
    console.error('Clear cache error:', error);
  }
}

/**
 * Cache statistics
 */
export async function getCacheStats() {
  try {
    const info = await redisClient.info('memory');
    const keys = await redisClient.keys('cache:*');
    return {
      totalKeys: keys.length,
      memory: info,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return null;
  }
}

/**
 * Health check for Redis
 */
export async function checkRedisHealth() {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

export default redisClient;