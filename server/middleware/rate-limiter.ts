import { defineEventHandler } from 'h3';
import { getRedisClient } from '../utils/redis';

// Constants
const RATE_LIMIT_PREFIX = 'ratelimit:';
const DEFAULT_LIMIT = 60; // Requests per minute
const DEFAULT_WINDOW = 60; // Window in seconds
const ALLOWED_PATHS = ['/api/exchange-rate']; // Paths with higher rate limits

// Check if a path should have a higher rate limit
function getPathLimit(path: string): number {
  if (path.startsWith('/api/exchange-rate')) {
    return 120; // Higher limit for exchange rate API
  }
  return DEFAULT_LIMIT;
}

// Rate limiting middleware
export default defineEventHandler(async (event) => {
  const path = event.path || event.req.url || '';
  const clientIp = event.node.req.headers['x-forwarded-for'] || 
                   event.node.req.socket.remoteAddress || 
                   'unknown';
                   
  // Skip for non-API routes
  if (!path.startsWith('/api/')) {
    return;
  }
  
  try {
    const redis = getRedisClient();
    const key = `${RATE_LIMIT_PREFIX}${clientIp}:${path.split('/')[2]}`;
    const limit = getPathLimit(path);
    
    // Get current count and increment
    const count = await redis.incr(key);
    
    // Set expiry if this is the first request
    if (count === 1) {
      await redis.expire(key, DEFAULT_WINDOW);
    }
    
    // Set rate limit headers
    event.node.res.setHeader('X-RateLimit-Limit', limit.toString());
    event.node.res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count).toString());
    
    // Get TTL for the key
    const ttl = await redis.ttl(key);
    event.node.res.setHeader('X-RateLimit-Reset', ttl.toString());
    
    // If we've exceeded our limit, return 429
    if (count > limit) {
      return {
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        body: {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${ttl} seconds.`
        }
      };
    }
    
    // Continue with the request
    return;
  } catch (error) {
    console.error('Rate limiter error:', error);
    // Continue with the request if Redis fails
    return;
  }
});