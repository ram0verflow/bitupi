import { createServer } from 'http';
import { initSocketServer } from './websockets/socket-server';
import { getRedisClient } from './utils/redis';
import consola from 'consola';

// Initialize Redis client early to catch any connection issues
const redisClient = getRedisClient();

export default async function() {
  // This will be called when Nuxt starts
  const logger = consola.withScope('server');
  
  logger.info('Starting LN2UPI server...');
  
  try {
    // Test Redis connection
    await redisClient.ping();
    logger.success('Redis connection established');
  } catch (error) {
    logger.error('Redis connection failed:', error);
    // Continue with the app, since Redis might be temporarily unavailable
  }
  
  // Create HTTP server
  const httpServer = createServer();
  
  // Initialize Socket.io
  const io = initSocketServer(httpServer);
  
  logger.success('WebSocket server initialized');
  
  // Return the server instance
  return httpServer;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  consola.info('SIGTERM received, shutting down...');
  
  try {
    // Close Redis connection
    const redis = getRedisClient();
    await redis.quit();
    consola.success('Redis connection closed');
  } catch (error) {
    consola.error('Error closing Redis connection:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  consola.info('SIGINT received, shutting down...');
  
  try {
    // Close Redis connection
    const redis = getRedisClient();
    await redis.quit();
    consola.success('Redis connection closed');
  } catch (error) {
    consola.error('Error closing Redis connection:', error);
  }
  
  process.exit(0);
});