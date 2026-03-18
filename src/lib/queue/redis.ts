import Redis, { type RedisOptions } from 'ioredis';

/**
 * Redis connection for BullMQ queues
 * Uses REDIS_URL environment variable
 */

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isProduction = process.env.NODE_ENV === 'production';

// Warn if production Redis has no authentication
if (isProduction) {
  try {
    const parsed = new URL(redisUrl);
    if (!parsed.password && parsed.hostname !== 'localhost') {
      console.warn(
        '⚠️  Redis URL has no authentication. Use redis://:password@host:port in production.'
      );
    }
  } catch {
    // URL parsing failed — ioredis will handle the connection error
  }
}

// Enable TLS for rediss:// URLs (standard for managed Redis providers)
const useTls = redisUrl.startsWith('rediss://');

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false, // Recommended for BullMQ
  ...(useTls && { tls: { rejectUnauthorized: false } }),
};

/**
 * Shared Redis connection for queue operations
 * Used by BullMQ for job queuing and processing
 */
export const redis = new Redis(redisUrl, redisOptions);

/**
 * Create a new Redis connection for workers
 * BullMQ requires separate connections for workers
 */
export function createRedisConnection(): Redis {
  return new Redis(redisUrl, redisOptions);
}

// Log the first error, then suppress repeats until reconnection.
// ioredis retries indefinitely (maxRetriesPerRequest: null is required by BullMQ),
// so without this guard the console floods when Redis is unavailable.
let redisErrorLogged = false;

redis.on('error', (error) => {
  if (!redisErrorLogged) {
    console.error('❌ Redis connection error:', error.message || error);
    redisErrorLogged = true;
  }
});

redis.on('connect', () => {
  redisErrorLogged = false;
  console.log('✅ Redis connected');
});
