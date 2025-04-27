import { defineEventHandler, readBody, createError } from 'h3';
import { handlePaymentConfirmation } from '../../lightning-payment';

/**
 * Lightning Callback API - Handles payment notifications from Lightning provider
 * 
 * Dedicated endpoint for Lightning Network callbacks:
 * - POST /api/lightning/callback
 */
export default defineEventHandler(async (event) => {
  // Only allow POST for callbacks
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method not allowed'
    });
  }
  
  try {
    // Get the webhook payload
    const body = await readBody(event);
    
    if (!body || !body.payment_hash) {
      console.error('Invalid callback payload received:', body);
      return {
        success: false,
        message: 'Invalid callback payload'
      };
    }
    
    console.log(`Payment notification received for hash: ${body.payment_hash}`);
    
    // Process the payment notification
    const result = await handlePaymentConfirmation(body.payment_hash, body);
    
    // Return a 200 OK response to acknowledge receipt
    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    console.error('Error handling Lightning callback:', error);
    return {
      success: false,
      message: 'Error processing webhook'
    };
  }
});