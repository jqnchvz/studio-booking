import Redis from 'ioredis';

/**
 * Redis connection for BullMQ queues
 * Uses REDIS_URL environment variable
 */

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Shared Redis connection for queue operations
 * Used by BullMQ for job queuing and processing
 */
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false, // Recommended for BullMQ
});

/**
 * Create a new Redis connection for workers
 * BullMQ requires separate connections for workers
 */
export function createRedisConnection(): Redis {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// Handle connection errors
redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error.message);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});
