import { defineEventHandler, readBody, createError } from 'h3';
import { checkPaymentStatus } from '../lightning-payment';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.invoice) {
    throw createError({
      statusCode: 400,
      message: 'Lightning invoice is required'
    });
  }
  
  try {
    // Check Lightning payment status
    const result = await checkPaymentStatus(body.invoice);
    
    return {
      success: true,
      paid: result.paid,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error checking Lightning payment status:', error);
    
    throw createError({
      statusCode: 500,
      message: 'Failed to check payment status'
    });
  }
});