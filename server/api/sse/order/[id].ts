import { defineEventHandler, setHeader, sendStream, getRouterParam } from 'h3';
import { Readable } from 'stream';
import { getRedisClient, getSubscriberClient } from '../../../utils/redis';
import { CHANNELS } from '../../../websockets/socket-server';

/**
 * Server-Sent Events endpoint for specific order updates.
 * This is a fallback for WebSockets when they're unavailable.
 */
export default defineEventHandler(async (event) => {
  // Get order ID from params
  const orderId = getRouterParam(event, 'id');
  
  if (!orderId) {
    return {
      statusCode: 400,
      body: { error: 'Order ID is required' }
    };
  }
  
  // Validate order ID format
  if (!/^[a-zA-Z0-9_-]+$/.test(orderId)) {
    return {
      statusCode: 400,
      body: { error: 'Invalid order ID format' }
    };
  }
  
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
    orderId,
    time: new Date().toISOString(),
    message: `SSE connection established for order ${orderId}`
  };
  
  stream.push(`data: ${JSON.stringify(initialMessage)}\n\n`);
  
  // Get Redis clients
  const redis = getRedisClient();
  const subscriber = getSubscriberClient();
  
  // Get initial order data
  try {
    const orderData = await redis.get(`order:${orderId}`);
    if (orderData) {
      console.log(`SSE sending initial order data for ${orderId}`);
      stream.push(`data: ${orderData}\n\n`);
    }
  } catch (e) {
    console.error(`Error fetching initial order data for ${orderId}:`, e);
  }
  
  // Subscribe to order channel
  await subscriber.subscribe(`order:${orderId}:update`);
  // Also subscribe to the general orders update channel
  await subscriber.subscribe('order:update');
  
  // Handle incoming messages from Redis PubSub
  subscriber.on('message', (channel, message) => {
    if (channel === `order:${orderId}:update`) {
      console.log(`SSE received update for order ${orderId}`);
      stream.push(`data: ${message}\n\n`);
    } else if (channel === 'order:update') {
      try {
        const data = JSON.parse(message);
        // Check if this update is for our order
        if (data.orderId === orderId) {
          console.log(`SSE received general update for order ${orderId}`);
          stream.push(`data: ${message}\n\n`);
        }
      } catch (e) {
        console.error('Error parsing order update data:', e);
      }
    }
  });
  
  // Keep connection alive with heartbeat
  const heartbeatInterval = setInterval(() => {
    stream.push(`: heartbeat ${Date.now()}\n\n`);
  }, 30000);
  
  // Handle client disconnect
  event.node.req.on('close', () => {
    clearInterval(heartbeatInterval);
    subscriber.unsubscribe(`order:${orderId}:update`);
    subscriber.unsubscribe('order:update');
    console.log(`SSE connection closed for order ${orderId}`);
    stream.push(null); // End the stream
  });
  
  // Return the stream
  return sendStream(event, stream);
});