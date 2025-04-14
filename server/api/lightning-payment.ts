import { defineEventHandler, readBody, createError } from 'h3';
import { processPayment, checkPaymentStatus } from '../lightning-payment';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.invoice) {
    throw createError({
      statusCode: 400,
      message: 'Lightning invoice is required'
    });
  }
  
  try {
    // Process the Lightning payment
    const result = await processPayment(body.invoice);
    
    return {
      success: result.success,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error processing Lightning payment:', error);
    
    throw createError({
      statusCode: 500,
      message: 'Failed to process Lightning payment'
    });
  }
});
