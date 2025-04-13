import { defineEventHandler, readBody } from 'h3';
import { getRedisClient, publishMessage } from '../utils/redis';
import { CHANNELS, notifyOrderUpdate } from '../websockets/socket-server';
import crypto from 'crypto';

// Constants
const INVOICE_PREFIX = 'invoice:';
const ORDER_PREFIX = 'order:';
const PAYMENT_PREFIX = 'payment:';

// Helper to extract invoice ID from lnbc invoice
function extractInvoiceId(invoice: string): string | null {
  try {
    // Very simplistic extraction - in production would use bolt11 decoder
    const parts = invoice.split('1p');
    if (parts.length > 1) {
      const lastPart = parts[1].substring(parts[1].length - 8);
      // Retrieve the invoice with this ID pattern
      return 'inv_' + lastPart;
    }
    return null;
  } catch (e) {
    console.error('Error extracting invoice ID:', e);
    return null;
  }
}

// Helper function to extract amount from BOLT11 invoice
function extractAmountFromInvoice(invoice: string): number {
  try {
    // More robust regex to extract amount
    const match = invoice.match(/lnbc(\d+)n/);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
    return 1000; // Fallback value
  } catch (e) {
    console.error('Error extracting amount:', e);
    return 1000; // Fallback value
  }
}

// Generate payment preimage
function generatePaymentPreimage(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Retrieve invoice from Redis
async function getInvoice(invoiceId: string) {
  const redis = getRedisClient();
  const key = INVOICE_PREFIX + invoiceId;
  
  const data = await redis.get(key);
  if (!data) {
    return null;
  }
  
  return JSON.parse(data);
}

// Retrieve order from Redis
async function getOrder(orderId: string) {
  const redis = getRedisClient();
  const key = ORDER_PREFIX + orderId;
  
  const data = await redis.get(key);
  if (!data) {
    return null;
  }
  
  return JSON.parse(data);
}

// Update invoice status in Redis
async function updateInvoiceStatus(invoice, status: string) {
  const redis = getRedisClient();
  const key = INVOICE_PREFIX + invoice.id;
  
  invoice.status = status;
  invoice.updatedAt = new Date().toISOString();
  
  await redis.set(key, JSON.stringify(invoice), 'EX', 3600); // Keep for an hour
}

// Update order status in Redis
async function updateOrderStatus(order, status: string) {
  const redis = getRedisClient();
  const key = ORDER_PREFIX + order.id;
  
  order.status = status;
  order.updatedAt = new Date().toISOString();
  
  await redis.set(key, JSON.stringify(order), 'EX', 3600); // Keep for an hour
  
  // Notify clients about order status change
  notifyOrderUpdate(order.id, CHANNELS.ORDER_UPDATED, order);
}

// Store payment record in Redis
async function storePayment(payment) {
  const redis = getRedisClient();
  const key = PAYMENT_PREFIX + payment.id;
  
  await redis.set(key, JSON.stringify(payment), 'EX', 86400); // Keep for a day
  
  // Publish payment received event
  publishMessage(CHANNELS.PAYMENT_RECEIVED, payment);
}

// The main event handler
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { lnbcInvoice, orderId, paymentRequest } = body;
    
    if (!lnbcInvoice && !paymentRequest) {
      return {
        success: false,
        error: 'Lightning invoice or payment request required'
      };
    }
    
    // Use the provided invoice string
    const invoiceString = lnbcInvoice || paymentRequest;
    
    // Check invoice format (very basic check)
    if (!invoiceString.startsWith('lnbc')) {
      return {
        success: false,
        error: 'Invalid Lightning invoice format'
      };
    }
    
    // Extract invoice ID or use order to find it
    let invoice = null;
    let order = null;
    const invoiceId = extractInvoiceId(invoiceString);
    
    if (invoiceId) {
      invoice = await getInvoice(invoiceId);
      if (invoice && invoice.orderId) {
        order = await getOrder(invoice.orderId);
      }
    } else if (orderId) {
      order = await getOrder(orderId);
      if (order && order.invoiceId) {
        invoice = await getInvoice(order.invoiceId);
      }
    }
    
    if (!invoice) {
      return {
        success: false,
        error: 'Invoice not found'
      };
    }
    
    if (!order) {
      return {
        success: false,
        error: 'Order not found'
      };
    }
    
    // In a real app, connect to Lightning Network node and process payment
    // For demo, simulate success with high probability
    const isSuccessful = Math.random() > 0.05; // 95% success rate
    
    if (isSuccessful) {
      // Generate payment preimage
      const paymentPreimage = generatePaymentPreimage();
      const paymentId = 'pmt_' + crypto.randomBytes(8).toString('hex');
      
      // Create payment record
      const payment = {
        id: paymentId,
        orderId: order.id,
        invoiceId: invoice.id,
        amount: invoice.amount,
        fee: Math.floor(Math.random() * 10), // Simulate a small fee
        preimage: paymentPreimage,
        paymentHash: order.paymentHash,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
      };
      
      // Update statuses
      await Promise.all([
        updateInvoiceStatus(invoice, 'PAID'),
        updateOrderStatus(order, 'COMPLETED'),
        storePayment(payment)
      ]);
      
      return {
        success: true,
        payment: {
          id: paymentId,
          paymentHash: order.paymentHash,
          preimage: paymentPreimage,
          amount: invoice.amount,
          fee: payment.fee,
          timestamp: payment.timestamp,
          status: 'COMPLETED',
          order: {
            id: order.id,
            status: 'COMPLETED'
          }
        }
      };
    } else {
      // Simulate various payment failures
      const errors = [
        'Payment timed out',
        'No route found',
        'Insufficient funds',
        'Invalid payment details'
      ];
      const randomError = errors[Math.floor(Math.random() * errors.length)];
      
      // Update statuses to indicate failure
      await Promise.all([
        updateInvoiceStatus(invoice, 'FAILED'),
        updateOrderStatus(order, 'FAILED')
      ]);
      
      return {
        success: false,
        error: randomError,
        order: {
          id: order.id,
          status: 'FAILED'
        }
      };
    }
  } catch (error) {
    console.error('Lightning payment error:', error);
    return {
      success: false,
      error: 'Failed to process payment',
      message: error.message
    };
  }
});