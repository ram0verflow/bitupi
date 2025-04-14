import { createServer } from 'http';
import { initSocketServer, shutdownSocketServer } from './websockets/socket-server';
import { getRedisClient, getSubscriberClient } from './utils/redis';
import consola from 'consola';
import Redis from 'ioredis';

// Server-wide logger
const logger = consola.withScope('server');

// Initialize Redis client with retry strategy
let redisClient: Redis | null = null;
let subscriberClient: Redis | null = null;
let httpServer: any = null;
let isShuttingDown = false;

// Enhanced Redis connection handling
async function setupRedis() {
  try {
    // Get Redis clients
    redisClient = getRedisClient();
    subscriberClient = getSubscriberClient();
    
    if (!redisClient) {
      logger.error('Redis client initialization failed');
      return false;
    }
    
    // Test connection
    await redisClient.ping();
    logger.success('Redis connection established successfully');
    
    // Check if Redis was restarted and clear connection list if needed
    const serverInfo = await redisClient.info('server');
    const uptime = serverInfo.match(/uptime_in_seconds:(\d+)/)?.[1];
    
    if (uptime && parseInt(uptime) < 60) {
      // Redis was likely restarted recently, clear active connections
      logger.warn('Redis server recently restarted, clearing stale connection data');
      await redisClient.del('active:connections');
      await redisClient.del('active:earners');
    }
    
    return true;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    return false;
  }
}

// Initialize SQLite for persistent data
async function setupSQLite() {
  try {
    // We'll implement this if Redis proves insufficient
    logger.info('SQLite support is ready for implementation if needed');
    return true;
  } catch (error) {
    logger.error('SQLite initialization failed:', error);
    return false;
  }
}

// Main server initialization
export default async function() {
  // Prevent multiple initializations
  if (httpServer) {
    return httpServer;
  }
  
  logger.info('Starting LN2UPI server...');
  
  // Setup Redis
  const redisOk = await setupRedis();
  if (!redisOk) {
    logger.warn('Continuing without Redis, some features will be degraded');
  }
  
  // Setup SQLite if needed
  await setupSQLite();
  
  try {
    // Create HTTP server
    httpServer = createServer();
    
    // Initialize Socket.io with enhanced error handling
    const io = initSocketServer(httpServer);
    
    if (io) {
      logger.success('WebSocket server initialized successfully');
    } else {
      logger.warn('WebSocket server initialization failed, using SSE fallback');
    }
    
    // Set up periodic Redis health check
    setInterval(async () => {
      if (isShuttingDown) return;
      
      try {
        if (redisClient) {
          await redisClient.ping();
        }
      } catch (error) {
        logger.error('Redis connection lost, attempting to reconnect...');
        
        // Try to reconnect
        redisClient = null;
        await setupRedis();
      }
    }, 30000); // Check every 30 seconds
    
    // Return the server instance
    return httpServer;
  } catch (error) {
    logger.error('Server initialization failed:', error);
    throw error;
  }
}

// Graceful shutdown with enhanced error handling
async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    logger.info('Shutdown already in progress, ignoring signal');
    return;
  }
  
  isShuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully...`);
  
  // Set a timeout for forced exit
  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s, forcing exit');
    process.exit(1);
  }, 10000);
  
  try {
    // Shutdown Socket.io server
    shutdownSocketServer();
    
    // Close Redis connections
    if (redisClient) {
      logger.info('Closing Redis connections...');
      try {
        await redisClient.quit();
        logger.success('Redis client closed successfully');
      } catch (redisError) {
        logger.error('Error closing Redis client:', redisError);
      }
    }
    
    if (subscriberClient) {
      try {
        await subscriberClient.quit();
        logger.success('Redis subscriber closed successfully');
      } catch (subError) {
        logger.error('Error closing Redis subscriber:', subError);
      }
    }
    
    // Cancel force exit timeout
    clearTimeout(forceExitTimeout);
    logger.success('Graceful shutdown completed');
    
    // Exit with success code
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    
    // Cancel force exit timeout
    clearTimeout(forceExitTimeout);
    
    // Exit with error code
    process.exit(1);
  }
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', reason);
  
  // If it's an ECONNRESET, it's likely a dropped connection which is normal
  if (reason instanceof Error && reason.message.includes('ECONNRESET')) {
    logger.info('Connection reset by client - this is normal behavior');
    return;
  }
  
  // For other errors, we should log them
  logger.error('Promise:', promise);
});