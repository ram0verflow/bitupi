import { defineEventHandler, readBody, createError, getQuery } from 'h3';
import { generateInvoice, checkPaymentStatus, createWithdrawLink, handlePaymentConfirmation } from '../lightning-payment';

export default defineEventHandler(async (event) => {
  // Get HTTP method
  const method = readMethod(event);

  // Get query parameters
  const query = getQuery(event);
  const action = query.action as string || '';

  // Handle POST requests
  if (method === 'POST') {
    const body = await readBody(event);

    // Create invoice
    if (action === 'invoice') {
      // Validate inputs
      const amountParam = body.amount;
      if (!amountParam || isNaN(parseInt(String(amountParam)))) {
        throw createError({
          statusCode: 400,
          message: 'Valid amount in satoshis is required'
        });
      }

      try {
        // Generate a Lightning invoice
        const satAmount = parseInt(String(amountParam));
        const memo = body.memo || 'BitUPI Payment';
        const orderId = body.orderId;

        const result = await generateInvoice(satAmount, memo);

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
    }

    // Check payment status
    if (action === 'check') {
      if (!body.paymentHash) {
        throw createError({
          statusCode: 400,
          message: 'Lightning payment hash is required'
        });
      }

      try {
        // Check Lightning payment status
        const result = await checkPaymentStatus(body.paymentHash);

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
    }

    // Create withdraw link
    if (action === 'withdraw') {
      if (!body.amount || isNaN(parseInt(String(body.amount)))) {
        throw createError({
          statusCode: 400,
          message: 'Valid amount in satoshis is required'
        });
      }

      try {
        // Generate a Lightning LNURL withdraw link
        const satAmount = parseInt(String(body.amount));
        const title = body.title || 'BitUPI Withdrawal';

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
    }

    // Handle callback notifications 
    if (action === 'callback') {
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
    }

    // Unknown action
    throw createError({
      statusCode: 400,
      message: `Unknown action: ${action}`
    });
  }

  // Handle GET requests
  if (method === 'GET') {
    // Query-based actions
    if (action === 'check') {
      const paymentHash = query.paymentHash as string;

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
    }

    // Status check (simple connection test)
    if (action === 'status') {
      try {
        return {
          success: true,
          connected: true,
          provider: 'LNbits',
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error checking Lightning connection status:', error);

        throw createError({
          statusCode: 500,
          message: 'Failed to check Lightning connection status'
        });
      }
    }

    // Default response for unknown actions
    return {
      success: false,
      message: 'Unknown action or method. Use POST with action=invoice|check|withdraw|callback'
    };
  }

  // Method not allowed
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
});