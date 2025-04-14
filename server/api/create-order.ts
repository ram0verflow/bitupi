import { defineEventHandler, readBody } from 'h3';
import { getRedisClient, publishMessage } from '../utils/redis';
import { CHANNELS } from '../websockets/socket-server';
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

// Constants
const ORDER_TTL = 60 * 60; // 1 hour
const ORDER_PREFIX = 'order:';

// Generate a random order ID
function generateOrderId() {
  return 'order_' + crypto.randomBytes(8).toString('hex');
}

// Store order in Redis and publish event
async function storeOrder(order) {
  const redis = getRedisClient();
  const key = ORDER_PREFIX + order.id;
  
  await redis.set(key, JSON.stringify(order), 'EX', ORDER_TTL);
  console.log(`Stored order ${order.id} in Redis`);
  
  // Publish order created event
  publishMessage(CHANNELS.ORDER_CREATED, order);
  console.log(`Published order created event for ${order.id}`);
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { amount, upiId, satAmount, serviceFee } = body;
    
    // Validate inputs
    if (!amount || isNaN(parseFloat(amount))) {
      return {
        success: false,
        error: 'Valid amount required'
      };
    }
    
    if (!upiId || !/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+$/.test(upiId)) {
      return {
        success: false,
        error: 'Valid UPI ID required'
      };
    }
    
    // Generate order ID and timestamps
    const orderId = generateOrderId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ORDER_TTL * 1000);
    
    // Calculate profit for earner (50% of service fee)
    const earnerProfit = Math.round(serviceFee * 0.5);
    
    // Create order object
    const order = {
      id: orderId,
      amount: parseFloat(amount),
      upiId: upiId,
      satAmount: satAmount || Math.round(parseFloat(amount) * 0.056), // Fallback sat conversion
      profit: earnerProfit,
      status: 'PENDING',
      timeCreated: now.toISOString(),
      timeExpires: expiresAt.toISOString()
    };
    
    // Store in Redis and publish event
    await storeOrder(order);
    
    return {
      success: true,
      orderId,
      order
    };
  } catch (error) {
    console.error('Order creation error:', error);
    
    return {
      success: false,
      error: 'Failed to create order',
      message: error.message
    };
  }
});