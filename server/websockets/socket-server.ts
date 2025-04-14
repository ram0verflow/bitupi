import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisClient, getSubscriberClient, publishMessage } from '../utils/redis';
import consola from 'consola';

// Socket server instance
let io: Server | null = null;

// Socket.io event channels
export const CHANNELS = {
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_COMPLETED: 'order:completed',
  ORDER_EXPIRED: 'order:expired',
  PAYMENT_RECEIVED: 'payment:received',
  EXCHANGE_RATE_UPDATED: 'exchange:updated',
  STATS_UPDATED: 'stats:updated',
  CONNECTION_STATUS: 'connection:status'
};

// Stats interval for platform metrics
let statsInterval: NodeJS.Timeout | null = null;
const STATS_INTERVAL = 10000; // 10 seconds
const logger = consola.withScope('websocket');

// Initialize the Socket.io server with robust error handling
export function initSocketServer(httpServer: any) {
  if (io !== null) {
    return io;
  }

  const pubClient = getRedisClient();
  const subClient = getSubscriberClient();

  if (!pubClient || !subClient) {
    logger.error('Redis clients not available, WebSocket server initialization failed');
    return null;
  }

  try {
    // Create the Socket.io server with optimized settings
    io = new Server(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? ['https://ln2upi.com', 'https://www.ln2upi.com']
          : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
      },
      // Configure Socket.io for reliability
      transports: ['websocket', 'polling'],
      pingInterval: 20000, // 20 seconds
      pingTimeout: 30000, // 30 seconds
      // Security settings
      maxHttpBufferSize: 1e6, // 1MB
      // Connection handling
      connectTimeout: 30000, // 30 seconds
      // Polling settings
      allowEIO3: true,
      // Cookie settings for better security
      cookie: {
        name: 'ln2upi_io',
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
      }
    });

    // Setup Redis adapter for horizontal scaling
    io.adapter(createAdapter(pubClient, subClient));

    // Engine.IO error handling
    io.engine.on('connection_error', (err) => {
      logger.error('Socket.io connection error:', err);
    });

    // Connection handler with improved reliability
    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Mark connection as active in Redis
      pubClient.sadd('active:connections', socket.id);
      updateStats();

      // Track earner connections
      socket.on('register:earner', async () => {
        logger.info(`Client ${socket.id} registered as earner`);
        await pubClient.sadd('active:earners', socket.id);
        socket.join('active:earners');

        // Immediately send current orders to the new earner
        const redis = getRedisClient();
        const orderKeys = await redis.keys('order:*');
        const activeOrders = [];

        if (orderKeys.length > 0) {
          const pipeline = redis.pipeline();
          orderKeys.forEach(key => {
            pipeline.get(key);
          });

          const results = await pipeline.exec();
          if (!results) {
            //TODO: Handle this properl
            throw new Error("Undefined results")
          }
          results.forEach((result) => {
            const [err, data] = result as [Error | null, string];
            if (!err && data) {
              try {
                const order = JSON.parse(data);
                if (order.status === 'PENDING') {
                  activeOrders.push(order);
                }
              } catch (e) {
                logger.error('Error parsing order data:', e);
              }
            }
          });
        }

        logger.info(`Sending ${activeOrders.length} active orders to new earner ${socket.id}`);
        socket.emit('orders-update', activeOrders);

        updateStats();
      });

      // Join the order room when a client requests it
      socket.on('join:order', (orderId) => {
        if (typeof orderId === 'string' && orderId.match(/^[a-zA-Z0-9_-]+$/)) {
          logger.info(`Client ${socket.id} joined order room: ${orderId}`);
          socket.join(`order:${orderId}`);

          // Emit current order status from Redis
          pubClient.get(`order:${orderId}`).then(data => {
            if (data) {
              try {
                const order = JSON.parse(data);
                socket.emit(CHANNELS.ORDER_UPDATED, order);
              } catch (e) {
                logger.error(`Error parsing order data for ${orderId}:`, e);
              }
            }
          });
        } else {
          logger.warn(`Client ${socket.id} tried to join invalid order room: ${orderId}`);
        }
      });

      // Leave order room
      socket.on('leave:order', (orderId) => {
        if (typeof orderId === 'string') {
          logger.info(`Client ${socket.id} left order room: ${orderId}`);
          socket.leave(`order:${orderId}`);
        }
      });

      // Join exchange rate updates room
      socket.on('join:exchange', () => {
        logger.info(`Client ${socket.id} subscribed to exchange rate updates`);
        socket.join('exchange:rates');

        // Send current exchange rate from Redis
        pubClient.get('exchange:rates:btc-inr').then(data => {
          if (data) {
            try {
              const rate = JSON.parse(data);
              socket.emit(CHANNELS.EXCHANGE_RATE_UPDATED, rate);
            } catch (e) {
              logger.error('Error parsing exchange rate data:', e);
            }
          }
        });
      });

      // Join stats room
      socket.on('join:stats', () => {
        logger.info(`Client ${socket.id} subscribed to platform stats`);
        socket.join('platform:stats');

        // Immediately send stats
        sendStatsToClient(socket);
      });

      // Heartbeat to keep connections alive
      socket.on('heartbeat', (timestamp) => {
        socket.emit('heartbeat:ack', { timestamp, server_time: Date.now() });
      });

      // Error handling
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });

      // Disconnect handler
      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);

        // Remove from active connections and earners
        pubClient.srem('active:connections', socket.id);
        pubClient.srem('active:earners', socket.id);
        updateStats();
      });
    });

    // Start stats interval if not already running
    if (!statsInterval) {
      statsInterval = setInterval(updateStats, STATS_INTERVAL);
    }

    // Setup Redis subscriber for events
    setupRedisSubscriber();

    logger.success('Socket.io server initialized successfully');
    logger.info('Redis subscriptions established for order:update, exchange:update, stats:update');

    return io;
  } catch (error) {
    logger.error('Error initializing Socket.io server:', error);
    return null;
  }
}

// Setup Redis subscriber for passing messages to WebSockets
function setupRedisSubscriber() {
  try {
    const subscriber = getSubscriberClient();

    // Subscribe to channels
    subscriber.subscribe('order:update');
    subscriber.subscribe('exchange:update');
    subscriber.subscribe('stats:update');
    subscriber.subscribe(CHANNELS.ORDER_CREATED);

    subscriber.on('message', async (channel, message) => {
      if (!io) return;

      try {
        const data = JSON.parse(message);

        if (channel === 'order:update' && data.orderId) {
          logger.info(`Redis received order update for ${data.orderId}, broadcasting to room`);
          io.to(`order:${data.orderId}`).emit(CHANNELS.ORDER_UPDATED, data);
        } else if (channel === CHANNELS.ORDER_CREATED) {
          logger.info(`Redis received new order creation: ${data.id}, broadcasting to earners`);
          // Broadcast to all earners about the new order
          try {
            const sockets = await io.in('active:earners').fetchSockets();
            logger.info(`Broadcasting new order to ${sockets.length} earner sockets`);

            // Get all active orders
            const redis = getRedisClient();
            const orderKeys = await redis.keys('order:*');
            const activeOrders = [];

            if (orderKeys.length > 0) {
              const pipeline = redis.pipeline();
              orderKeys.forEach(key => {
                pipeline.get(key);
              });

              const results = await pipeline.exec();

              results.forEach((result) => {
                const [err, data] = result as [Error | null, string];
                if (!err && data) {
                  try {
                    const order = JSON.parse(data);
                    if (order.status === 'PENDING') {
                      activeOrders.push(order);
                    }
                  } catch (e) {
                    logger.error('Error parsing order data:', e);
                  }
                }
              });
            }

            logger.info(`Sending ${activeOrders.length} active orders to earners`);

            // Send orders to each earner socket
            sockets.forEach(socket => {
              socket.emit('orders-update', activeOrders);
            });
          } catch (err) {
            logger.error('Error broadcasting to earners:', err);
          }
        } else if (channel === 'exchange:update') {
          io.to('exchange:rates').emit(CHANNELS.EXCHANGE_RATE_UPDATED, data);
        } else if (channel === 'stats:update') {
          io.to('platform:stats').emit(CHANNELS.STATS_UPDATED, data);
        }
      } catch (e) {
        logger.error(`Error handling Redis message from ${channel}:`, e);
      }
    });

    logger.success('Redis subscriber setup complete');
  } catch (error) {
    logger.error('Error setting up Redis subscriber:', error);
  }
}

// Update and broadcast platform stats
async function updateStats() {
  if (!io) return;

  try {
    const redis = getRedisClient();

    // Get active connections count
    const connectionsCount = await redis.scard('active:connections') || 0;
    const earnersCount = await redis.scard('active:earners') || 0;

    // Get orders stats
    const pendingOrders = await redis.keys('order:*');
    let pendingOrdersCount = 0;
    let successfulTransactions = 0;
    let failedTransactions = 0;

    // Count orders by status
    if (pendingOrders.length > 0) {
      // Get all orders in a multi command
      const pipeline = redis.pipeline();
      pendingOrders.forEach(key => {
        pipeline.get(key);
      });

      const results = await pipeline.exec();

      // Process results
      results.forEach((result) => {
        const [err, data] = result as [Error | null, string];
        if (err) return;

        try {
          const order = JSON.parse(data);
          if (order.status === 'PENDING') {
            pendingOrdersCount++;
          } else if (order.status === 'COMPLETED') {
            successfulTransactions++;
          } else if (order.status === 'FAILED') {
            failedTransactions++;
          }
        } catch (e) {
          logger.error('Error parsing order data:', e);
        }
      });
    }

    // Get exchange rate
    const exchangeRate = await redis.get('exchange:rates:btc-inr');
    let rateValue = null;

    if (exchangeRate) {
      try {
        const rateData = JSON.parse(exchangeRate);
        rateValue = rateData?.rates?.BTC_INR || null;
      } catch (e) {
        logger.error('Error parsing exchange rate:', e);
      }
    }

    // Create stats object
    const stats = {
      timestamp: new Date().toISOString(),
      activeSessions: connectionsCount,
      activeEarners: earnersCount,
      pendingOrders: pendingOrdersCount,
      successfulTransactions,
      failedTransactions,
      totalTransactions: successfulTransactions + failedTransactions,
      uptime: process.uptime().toFixed(2) + 's',
      currentRate: rateValue,
      currentTransport: io.engine?.transport?.name || 'unknown'
    };

    // Broadcast to all clients in stats room
    io.to('platform:stats').emit(CHANNELS.STATS_UPDATED, stats);

    // Also publish to Redis for SSE
    publishMessage('platform:stats:update', stats);

    // Store stats in Redis for new clients
    await redis.set('platform:stats:latest', JSON.stringify(stats), 'EX', 300);

  } catch (error) {
    logger.error('Error updating stats:', error);
  }
}

// Send current stats to a specific client
async function sendStatsToClient(socket) {
  try {
    const redis = getRedisClient();
    const statsJson = await redis.get('platform:stats:latest');

    if (statsJson) {
      const stats = JSON.parse(statsJson);
      socket.emit(CHANNELS.STATS_UPDATED, stats);
    } else {
      // If no cached stats, trigger an update
      updateStats();
    }
  } catch (error) {
    logger.error('Error sending stats to client:', error);
  }
}

// Get the Socket.io server instance
export function getSocketServer() {
  if (io === null) {
    logger.warn('Socket.io server not initialized, returning null');
  }
  return io;
}

// Broadcast to specific order room with Redis fallback
export function notifyOrderUpdate(orderId: string, eventType: string, data: any) {
  // Always publish to Redis for SSE and cross-server sync
  publishMessage(`order:${orderId}:update`, data);

  if (io === null) {
    logger.warn('Socket.io server not initialized, using only Redis for broadcast');
    return;
  }

  // Broadcast to the specific order room via WebSocket
  io.to(`order:${orderId}`).emit(eventType, data);
}

// Broadcast exchange rate updates with Redis fallback
export function broadcastExchangeRate(rateData: any) {
  // Always publish to Redis for SSE and cross-server sync
  publishMessage('exchange:rates:update', rateData);

  if (io === null) {
    logger.warn('Socket.io server not initialized, using only Redis for broadcast');
    return;
  }

  // Broadcast to all clients interested in exchange rates
  io.to('exchange:rates').emit(CHANNELS.EXCHANGE_RATE_UPDATED, rateData);
}

// Broadcast platform stats
export function broadcastStats(statsData: any) {
  // Always publish to Redis for SSE and cross-server sync
  publishMessage('platform:stats:update', statsData);

  if (io === null) {
    logger.warn('Socket.io server not initialized, using only Redis for broadcast');
    return;
  }

  // Broadcast to all clients interested in stats
  io.to('platform:stats').emit(CHANNELS.STATS_UPDATED, statsData);
}

// Clean up on shutdown
export function shutdownSocketServer() {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }

  if (io) {
    io.close();
    io = null;
    logger.success('Socket.io server shut down successfully');
  }
}