import { defineEventHandler, readBody, createError, getQuery } from 'h3';
import { generateInvoice, associatePaymentWithOrder } from '../../lightning-payment';

/**
 * Lightning Invoice API - Creates a new Lightning invoice
 * 
 * Dedicated endpoint for invoice generation:
 * - POST /api/lightning/invoice
 * - GET /api/lightning/invoice?amount=1000
 */
export default defineEventHandler(async (event) => {
  // Support both GET and POST methods
  const method = event.method || 'GET';
  const query = getQuery(event);
  
  // For POST, read the body
  const body = method === 'POST' 
    ? await readBody(event).catch(() => ({})) 
    : {};
  
  // Get amount from query or body
  const amountParam = query.amount || body.amount;
  if (!amountParam || isNaN(parseInt(String(amountParam)))) {
    throw createError({
      statusCode: 400,
      message: 'Valid amount in satoshis is required'
    });
  }
  
  try {
    // Generate a Lightning invoice
    const satAmount = parseInt(String(amountParam));
    const memo = query.memo || body.memo || 'LN2UPI Payment';
    const orderId = query.orderId || body.orderId;
    
    const result = await generateInvoice(satAmount, memo);
    
    // If an order ID is provided, associate the payment with that order
    if (orderId) {
      // Associate the payment hash with the order ID
      associatePaymentWithOrder(result.paymentHash, String(orderId));
      console.log(`Order ${orderId} is waiting for payment of ${satAmount} sats`);
    }
    
    return {
      success: true,
      invoice: result.invoice,
      paymentHash: result.paymentHash,
      amount: satAmount,
      expiry: 3600, // 1 hour expiry in seconds
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating Lightning invoice:', error);
    
    throw createError({
      statusCode: 500,
      message: 'Failed to generate Lightning invoice'
    });
  }
});