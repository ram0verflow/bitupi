// Lightning Network callback endpoint to handle payment notifications from LNbits
import { H3Event, defineEventHandler, readBody } from 'h3';
import { pendingPayments, handlePaymentConfirmation } from '../lightning-payment';

/**
 * LNbits webhook callback for payment notifications
 * This endpoint receives notifications when payments are made
 */
export default defineEventHandler(async (event: H3Event) => {
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