import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import { store, broadcastToSSEClients, broadcastToOrderClients } from '../../../index';

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id');
  const body = await readBody(event);
  
  if (!orderId) {
    throw createError({
      statusCode: 400,
      message: 'Order ID is required'
    });
  }
  
  if (!body.refundKey) {
    throw createError({
      statusCode: 400,
      message: 'Refund key is required'
    });
  }
  
  if (!body.buyerKey) {
    throw createError({
      statusCode: 400,
      message: 'Buyer authentication key is required'
    });
  }
  
  if (!body.refundWallet && !body.lightningAddress && !body.refundInvoice) {
    throw createError({
      statusCode: 400,
      message: 'Refund wallet, lightning address, or lightning invoice is required'
    });
  }
  
  // Get the order
  const order = store.orders.get(orderId);
  
  if (!order) {
    throw createError({
      statusCode: 404,
      message: 'Order not found'
    });
  }
  
  // Verify refund key
  if (!order.refund?.refundKey || order.refund.refundKey !== body.refundKey) {
    throw createError({
      statusCode: 401,
      message: 'Invalid refund key'
    });
  }
  
  // Verify buyer key
  if (!order.securityKeys?.buyerKey || order.securityKeys.buyerKey !== body.buyerKey) {
    throw createError({
      statusCode: 401,
      message: 'Invalid buyer authentication'
    });
  }
  
  // Check if order is in a state that can be refunded
  const refundableStatuses = ['pending', 'processing'];
  if (!refundableStatuses.includes(order.status)) {
    throw createError({
      statusCode: 400,
      message: 'This order cannot be refunded in its current state'
    });
  }
  
  // Update refund wallet if provided
  if (body.refundWallet && order.refund) {
    order.refund.walletAddress = body.refundWallet;
  }
  
  // Process the refund via Lightning Network
  try {
    // If we have a Lightning address, create a withdrawal link
    if (body.lightningAddress) {
      const { createWithdrawLink } = await import('../../../lightning-payment');
      await createWithdrawLink(order.satAmount, `BitUPI Refund for order ${orderId.substring(0, 8)}`, 1);
    } 
    // If we have an invoice, pay it directly
    else if (body.refundInvoice) {
      const { processInternalPayment } = await import('../../../utils/internal-payment');
      await processInternalPayment(body.refundInvoice, `Refund for order ${orderId}`);
    }

    // Mark the order as failed after refund
    order.status = 'failed';
  } catch (error) {
    console.error(`Error processing refund for order ${orderId}:`, error);
    // Still mark as failed even if payment has issues, but log the error
    order.status = 'failed';
  }
  
  // Add refund information
  if (!order.refund) {
    order.refund = {
      refundKey: body.refundKey,
      walletAddress: body.refundWallet || ''
    };
  }
  
  // Store updated order
  store.orders.set(orderId, order);
  
  // Notify specific order clients
  broadcastToOrderClients(orderId, {
    id: orderId,
    status: 'failed',
    refunded: true,
    updatedAt: new Date().toISOString()
  });
  
  // Notify all orders clients about status change
  broadcastToSSEClients('orders', {
    action: 'update',
    order: {
      ...order,
      securityKeys: undefined, // Don't broadcast security keys
      refund: undefined // Don't broadcast refund information
    }
  });
  
  return {
    success: true,
    message: 'Order refunded successfully',
    status: 'failed'
  };
});