import { defineEventHandler, readBody, createError, getQuery } from 'h3';
import { checkPaymentStatus } from '../lightning-payment';

export default defineEventHandler(async (event) => {
  // Get paymentHash from route or body params
  const query = getQuery(event);
  const body = await readBody(event).catch(() => ({}));
  
  const paymentHash = query.paymentHash as string || body.paymentHash;
  
  if (!paymentHash) {
    throw createError({
      statusCode: 400,
      message: 'Lightning payment hash is required'
    });
  }
  
  try {
    // Check Lightning payment status
    const result = await checkPaymentStatus(paymentHash);
    
    return {
      success: true,
      paid: result.paid,
      status: result.status,
      confirmedAt: result.confirmedAt,
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