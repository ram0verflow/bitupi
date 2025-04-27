import { defineEventHandler, readBody, createError, getQuery, getRouterParam } from 'h3';
import { checkPaymentStatus } from '../../../lightning-payment';

/**
 * Lightning Payment Status API
 * 
 * GET /api/lightning/payment/:hash - Check payment status with hash in URL
 * GET /api/lightning/payment?paymentHash=xxx - Check payment status with hash in query
 * POST /api/lightning/payment - Check payment status with hash in body
 */
export default defineEventHandler(async (event) => {
  // Get paymentHash from route param, query, or body
  const hashParam = getRouterParam(event, 'hash');
  const query = getQuery(event);
  const body = await readBody(event).catch(() => ({}));
  
  const paymentHash = hashParam || query.paymentHash as string || body.paymentHash;
  
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