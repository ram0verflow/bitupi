import Redis from 'ioredis';
import { defineEventHandler } from 'h3';

// Create Redis connection
let redisClient: Redis | null = null;

// Get Redis client with connection handling
export function getRedisClient() {
  if (redisClient === null) {
    // Get Redis configuration from environment variables or use defaults
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD || '';
    
    // Create Redis client
    redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      retryStrategy: (times) => {
            // Exponential backoff with max 30s retry delay
        const delay = Math.min(Math.pow(2, times) * 1000, 30000);
        console.log(`Redis connection attempt failed. Retrying in ${delay}ms...`);
        return delay;
      }
    });
    
    // Setup event handlers
    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    
    redisClient.on('reconnecting', () => {
      console.log('Redis client reconnecting...');
    });
  }
  
  return redisClient;
}

// Cache helpers
interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

// Get cached value or compute and cache
export async function getCachedValue<T>(
  key: string, 
  computeValue: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const redis = getRedisClient();
  const defaultTtl = 60 * 5; // 5 minutes default
  const ttl = options.ttl || defaultTtl;
  
  try {
    // Try to get from cache
    const cachedValue = await redis.get(key);
    
    if (cachedValue) {
      return JSON.parse(cachedValue) as T;
    }
    
    // Not in cache, compute value
    const value = await computeValue();
    
    // Cache the computed value
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
    
    return value;
  } catch (error) {
    console.error(`Redis cache error for key ${key}:`, error);
    // If Redis fails, compute value directly
    return computeValue();
  }
}

// Clear cache by key pattern
export async function clearCacheByPattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  
  try {
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cleared ${keys.length} cache entries matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`Failed to clear cache for pattern ${pattern}:`, error);
  }
}

// Pub/Sub helpers
export function publishMessage(channel: string, message: any): void {
  const redis = getRedisClient();
  redis.publish(channel, JSON.stringify(message));
}

// Create a separate Redis client for subscriptions
let subscriberClient: Redis | null = null;

export function getSubscriberClient() {
  if (subscriberClient === null) {
    // Create a new Redis client for subscriptions with same config
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD || '';
    
    subscriberClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword
    });
  }
  
  return subscriberClient;
}

// Middleware for handling Redis errors
export const handleRedisErrors = defineEventHandler(async (event) => {
  try {
    // Make sure Redis is connected
    const redis = getRedisClient();
    await redis.ping();
    
    // Continue to handler
    return;
  } catch (error) {
    console.error('Redis connection error in middleware:', error);
    
    return {
      statusCode: 503,
      statusMessage: 'Service Temporarily Unavailable',
      body: {
        error: 'Database connection error',
        message: 'Service is temporarily unavailable. Please try again later.'
      }
    };
  }
});