import { defineEventHandler, readBody, createError } from 'h3';
import { generateInvoice } from '../lightning-payment';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.amount || isNaN(parseInt(body.amount))) {
    throw createError({
      statusCode: 400,
      message: 'Valid amount in satoshis is required'
    });
  }
  
  try {
    // Generate a mock invoice
    const satAmount = parseInt(body.amount);
    const invoice = generateInvoice(satAmount);
    
    return {
      success: true,
      invoice,
      amount: satAmount,
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
