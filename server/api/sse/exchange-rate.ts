import { defineEventHandler, setHeader, sendStream } from 'h3';
import { Readable } from 'stream';
import { getRedisClient, getSubscriberClient } from '../../utils/redis';

/**
 * Server-Sent Events endpoint for exchange rate updates.
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
    message: 'SSE connection established'
  };
  
  stream.push(`data: ${JSON.stringify(initialMessage)}\n\n`);
  
  // Get Redis clients
  const redis = getRedisClient();
  const subscriber = getSubscriberClient();
  
  // Get initial exchange rate
  try {
    const rateData = await redis.get('exchange:rates:btc-inr');
    if (rateData) {
      stream.push(`data: ${rateData}\n\n`);
    }
  } catch (e) {
    console.error('Error fetching initial exchange rate:', e);
  }
  
  // Subscribe to exchange rate channel
  await subscriber.subscribe('exchange:rates:update');
  
  // Handle incoming messages from Redis PubSub
  subscriber.on('message', (channel, message) => {
    if (channel === 'exchange:rates:update') {
      stream.push(`data: ${message}\n\n`);
    }
  });
  
  // Handle client disconnect
  event.node.req.on('close', () => {
    subscriber.unsubscribe('exchange:rates:update');
    stream.push(null); // End the stream
  });
  
  // Return the stream
  return sendStream(event, stream);
});