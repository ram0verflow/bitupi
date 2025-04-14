import { defineEventHandler, readBody } from 'h3';
import { getRedisClient, publishMessage } from '../utils/redis';
import { CHANNELS } from '../websockets/socket-server';
import crypto from 'crypto';

// Constants
const INVOICE_TTL = 60 * 60; // 1 hour
const INVOICE_PREFIX = 'invoice:';
const ORDER_PREFIX = 'order:';

// Generate a random invoice ID
function generateInvoiceId() {
  return 'inv_' + crypto.randomBytes(8).toString('hex');
}

// Generate a random order ID
function generateOrderId() {
  return 'ord_' + crypto.randomBytes(8).toString('hex');
}

// Generate a payment hash
function generatePaymentHash() {
  return crypto.randomBytes(32).toString('hex');
}

// Create a BOLT11 invoice simulation
function createBolt11Invoice(satAmount, memo, invoiceId) {
  // In production, this would use a real Lightning implementation
  // This is just a realistic-looking simulation
  const timestamp = Math.floor(Date.now() / 1000);
  const randomBytes = crypto.randomBytes(20).toString('hex');
  
  return `lnbc${satAmount}n1p${randomBytes}qpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq${
    'a'.repeat(20)
  }${timestamp}${
    'd'.repeat(20)
  }${invoiceId.substring(4, 12)}`;
}

// Store invoice in Redis
async function storeInvoice(invoice) {
  const redis = getRedisClient();
  const key = INVOICE_PREFIX + invoice.id;
  
  await redis.set(key, JSON.stringify(invoice), 'EX', INVOICE_TTL);
  console.log(`Stored invoice ${invoice.id} in Redis`);
}

// Store order in Redis
async function storeOrder(order) {
  const redis = getRedisClient();
  const key = ORDER_PREFIX + order.id;
  
  await redis.set(key, JSON.stringify(order), 'EX', INVOICE_TTL);
  console.log(`Stored order ${order.id} in Redis`);
  
  // Publish order created event
  publishMessage(CHANNELS.ORDER_CREATED, order);
  console.log(`Published order created event for ${order.id}`);
}

// The main event handler
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { amount, memo, upiId, description } = body;
    
    // Validate inputs
    if (!amount || isNaN(parseInt(amount))) {
      return {
        success: false,
        error: 'Valid amount required'
      };
    }
    
    if (upiId && !/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+$/.test(upiId)) {
      return {
        success: false,
        error: 'Invalid UPI ID format'
      };
    }
    
    // Generate IDs and timestamps
    const invoiceId = generateInvoiceId();
    const orderId = generateOrderId();
    const paymentHash = generatePaymentHash();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVOICE_TTL * 1000);
    
    // Create BOLT11 invoice
    const satAmount = parseInt(amount);
    const lnbcInvoice = createBolt11Invoice(satAmount, memo || 'LN2UPI Payment', invoiceId);
    
    // Create invoice object
    const invoice = {
      id: invoiceId,
      orderId: orderId,
      amount: satAmount,
      memo: memo || 'LN2UPI Payment',
      paymentHash,
      lnbcInvoice,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'PENDING',
    };
    
    // Create order object
    const order = {
      id: orderId,
      invoiceId: invoiceId,
      amount: satAmount,
      upiId: upiId || null,
      description: description || 'Lightning payment to UPI',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'PENDING',
      paymentHash,
    };
    
    // Store in Redis
    await Promise.all([
      storeInvoice(invoice),
      storeOrder(order)
    ]);
    
    return {
      success: true,
      invoice,
      order
    };
  } catch (error) {
    console.error('Lightning invoice creation error:', error);
    
    return {
      success: false,
      error: 'Failed to create invoice',
      message: error.message
    };
  }
});