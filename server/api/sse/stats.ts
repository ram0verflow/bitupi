import { defineEventHandler, setHeader, sendStream } from 'h3';
import { Readable } from 'stream';
import { getRedisClient, getSubscriberClient } from '../../utils/redis';

/**
 * Server-Sent Events endpoint for platform stats.
 * This is a fallback for WebSockets when they're unavailable.
 */
export default defineEventHandler(async (event) => {
  // Set SSE headers
  setHeader(event, 'Content-Type', 'text/event-stream');
  setHeader(event, 'Cache-Control', 'no-cache');
  setHeader(event, 'Connection', 'keep-alive');
  
  // Create a readable stream for SSE
  const stream = new Readable({
    read() {} // We push data manually
  });
  
  // Send initial message
  const initialMessage = {
    type: 'connected',
    time: new Date().toISOString(),
    message: 'SSE stats connection established'
  };
  
  stream.push(`data: ${JSON.stringify(initialMessage)}\n\n`);
  
  // Get Redis clients
  const redis = getRedisClient();
  const subscriber = getSubscriberClient();
  
  // Get initial stats data
  try {
    // Call our stats API and get the results
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
      results.forEach(([err, data]) => {
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
          console.error('Error parsing order data:', e);
        }
      });
    }
    
    // Get active earners
    const activeEarnersCount = await redis.scard('active:earners') || 0;
    
    // Get exchange rate
    const exchangeRate = await redis.get('exchange:rates:btc-inr');
    let rateValue = null;
    
    if (exchangeRate) {
      try {
        const rateData = JSON.parse(exchangeRate);
        rateValue = rateData?.rates?.BTC_INR || null;
      } catch (e) {
        console.error('Error parsing exchange rate:', e);
      }
    }
    
    // Create stats object
    const stats = {
      timestamp: new Date().toISOString(),
      activeEarners: activeEarnersCount,
      pendingOrders: pendingOrdersCount,
      successfulTransactions,
      failedTransactions,
      totalTransactions: successfulTransactions + failedTransactions,
      uptime: process.uptime().toFixed(2) + 's',
      currentRate: rateValue
    };
    
    stream.push(`data: ${JSON.stringify(stats)}\n\n`);
  } catch (e) {
    console.error('Error fetching initial stats:', e);
  }
  
  // Subscribe to stats channel
  await subscriber.subscribe('platform:stats:update');
  
  // Handle incoming messages from Redis PubSub
  subscriber.on('message', (channel, message) => {
    if (channel === 'platform:stats:update') {
      stream.push(`data: ${message}\n\n`);
    }
  });
  
  // Keep connection alive with heartbeat
  const heartbeatInterval = setInterval(() => {
    stream.push(`: heartbeat ${Date.now()}\n\n`);
  }, 30000);
  
  // Handle client disconnect
  event.node.req.on('close', () => {
    clearInterval(heartbeatInterval);
    subscriber.unsubscribe('platform:stats:update');
    stream.push(null); // End the stream
  });
  
  // Return the stream
  return sendStream(event, stream);
});