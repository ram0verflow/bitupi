import { defineEventHandler, readBody, createError, getRouterParam } from 'h3';
import { store, broadcastToSSEClients, broadcastToOrderClients } from '../../../index';
import { createWithdrawLink } from '../../../lightning-payment';
import { processInternalPayment } from '../../../utils/internal-payment';

/**
 * Order Approval API
 * 
 * POST /api/orders/:id/approve - Approve order receipt and complete order
 */
export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id');
  const body = await readBody(event);
  
  if (!orderId) {
    throw createError({
      statusCode: 400,
      message: 'Order ID is required'
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
  
  // Verify buyer's auth key
  const { buyerKey } = body;
  
  if (!buyerKey) {
    throw createError({
      statusCode: 401,
      message: 'Buyer authentication key is required'
    });
  }
  
  // Check if the buyer key matches the one associated with this order
  if (!order.securityKeys?.buyerKey || order.securityKeys.buyerKey !== buyerKey) {
    throw createError({
      statusCode: 401,
      message: 'Invalid buyer authentication key'
    });
  }
  
  // Check if order is in verifying status
  if (order.status !== 'verifying') {
    throw createError({
      statusCode: 400,
      message: 'Order can only be approved in verifying status'
    });
  }
  
  try {
    // Process the payment to the earner if we have a lightning address
    if (order.earner?.lightningAddress) {
      // Calculate earner's reward (1% of the order's sat amount)
      const exchangeFeePercent = 0.02; // 2%
      const earnerSharePercent = 0.5; // 50% of the fee
      const reward = Math.ceil(order.satAmount * exchangeFeePercent * earnerSharePercent);
      
      // Based on the type of lightning address/invoice
      const address = order.earner.lightningAddress;
      
      // Handle Lightning Address or LNURL
      if (address.includes('@') || address.toLowerCase().startsWith('lnurl')) {
        await createWithdrawLink(
          reward,
          `LN2UPI Payment for order ${orderId.substring(0, 8)}`,
          Math.max(1, Math.floor(reward * 0.01))
        );
        console.log(`Created withdrawal link of ${reward} sats for ${address}`);
      }
      // Handle Lightning Invoice
      else if (address.toLowerCase().startsWith('ln')) {
        await processInternalPayment(address, `Payment for order ${orderId}`);
        console.log(`Paid invoice directly for ${reward} sats`);
      }
    } else {
      console.warn(`Order ${orderId} completed but no lightning address available for payment`);
    }
  } catch (error) {
    console.error(`Error processing payment for order ${orderId}:`, error);
    // Continue with order completion even if payment fails
  }
  
  // Update status to completed
  order.status = 'completed';
  
  // Store updated order
  store.orders.set(orderId, order);
  
  // Notify specific order clients
  broadcastToOrderClients(orderId, {
    id: orderId,
    status: 'completed',
    updatedAt: new Date().toISOString()
  });
  
  // Notify all orders clients about status change
  broadcastToSSEClients('orders', {
    action: 'update',
    order: {
      ...order,
      updatedAt: new Date().toISOString(),
      securityKeys: undefined,
      refund: undefined
    }
  });
  
  console.log(`Completed order ${orderId}`);
  
  return {
    success: true,
    orderId,
    status: 'completed'
  };
});