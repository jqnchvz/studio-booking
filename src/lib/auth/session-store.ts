import crypto from 'crypto';
import { redis } from '@/lib/queue/redis';

const SESSION_KEY_PREFIX = 'sessions:';
const MAX_CONCURRENT_SESSIONS = 5;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days (matches JWT expiry)

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Register a new session for a user.
 * If the session count exceeds the limit, the oldest sessions are removed.
 */
export async function registerSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const key = `${SESSION_KEY_PREFIX}${userId}`;
  const now = Date.now();

  // Add session with current timestamp as score
  await redis.zadd(key, now, sessionId);

  // Remove oldest sessions if over limit
  const count = await redis.zcard(key);
  if (count > MAX_CONCURRENT_SESSIONS) {
    // Remove (count - limit) oldest entries (lowest scores)
    await redis.zremrangebyrank(key, 0, count - MAX_CONCURRENT_SESSIONS - 1);
  }

  // Set/refresh TTL on the sorted set
  await redis.expire(key, SESSION_TTL_SECONDS);
}

/**
 * Check if a session is still valid (exists in the user's session set)
 */
export async function isSessionValid(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const key = `${SESSION_KEY_PREFIX}${userId}`;
  const score = await redis.zscore(key, sessionId);
  return score !== null;
}

/**
 * Remove a specific session (logout)
 */
export async function removeSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const key = `${SESSION_KEY_PREFIX}${userId}`;
  await redis.zrem(key, sessionId);
}

/**
 * Remove all sessions for a user (logout all devices)
 */
export async function removeAllSessions(userId: string): Promise<number> {
  const key = `${SESSION_KEY_PREFIX}${userId}`;
  const count = await redis.zcard(key);
  await redis.del(key);
  return count;
}

/**
 * Get the number of active sessions for a user
 */
export async function getSessionCount(userId: string): Promise<number> {
  const key = `${SESSION_KEY_PREFIX}${userId}`;
  return redis.zcard(key);
}
