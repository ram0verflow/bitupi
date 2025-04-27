import { defineEventHandler, readBody, createError } from 'h3';
import { createWithdrawLink } from '../../lightning-payment';

/**
 * Lightning Withdraw API - Creates a new Lightning withdraw link
 * 
 * POST /api/lightning/withdraw - Create a new withdraw link
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  // Validate amount
  if (!body.amount || isNaN(parseInt(String(body.amount)))) {
    throw createError({
      statusCode: 400,
      message: 'Valid amount in satoshis is required'
    });
  }
  
  try {
    // Generate a Lightning LNURL withdraw link
    const satAmount = parseInt(String(body.amount));
    const title = body.title || 'LN2UPI Withdrawal';
    
    // Get minimum amount or default to 1% of total amount, with a minimum of 1 sat
    let minAmount;
    if (body.minAmount && !isNaN(parseInt(String(body.minAmount)))) {
      minAmount = parseInt(String(body.minAmount));
    } else {
      // Default to either 1% of satAmount or 1000 sats, whichever is less
      minAmount = Math.min(Math.max(Math.floor(satAmount * 0.01), 1), 1000);
    }
    
    const lnurl = await createWithdrawLink(satAmount, String(title), minAmount);
    
    return {
      success: true,
      lnurl,
      amount: satAmount,
      minAmount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating Lightning withdraw link:', error);
    
    throw createError({
      statusCode: 500,
      message: 'Failed to generate Lightning withdraw link'
    });
  }
});