import { defineEventHandler, readBody, getRouterParam, createError } from 'h3';
import { store, broadcastToSSEClients, broadcastToOrderClients } from '../../../index';
import { generateTrackingToken } from '../../../utils/security';
import crypto from 'crypto';

/**
 * Order claim API
 * 
 * POST /api/orders/:id/claim - Claim an order for processing
 */
export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id');
  
  if (\!orderId) {
    throw createError({
      statusCode: 400,
      message: 'Order ID is required'
    });
  }
  
  // Get the order
  const order = store.orders.get(orderId);
  if (\!order) {
    throw createError({
      statusCode: 404,
      message: 'Order not found'
    });
  }
  
  // Check if order is in pending status
  if (order.status \!== 'pending') {
    throw createError({
      statusCode: 400,
      message: 'Order cannot be claimed in its current state'
    });
  }
  
  // Check if Lightning payment is confirmed
  if (\!order.lightning?.paid) {
    throw createError({
      statusCode: 400,
      message: 'Order payment has not been confirmed yet'
    });
  }
  
  // Generate earner key
  const earnerKey = crypto.randomBytes(16).toString('hex');
  
  // Update order status and add earner info
  order.status = 'processing';
  order.earner = {
    authKey: earnerKey
  };
  
  if (order.securityKeys) {
    order.securityKeys.earnerKey = earnerKey;
  }
  
  // Store updated order
  store.orders.set(orderId, order);
  
  // Notify specific order clients
  broadcastToOrderClients(orderId, {
    id: orderId,
    status: 'processing',
    updatedAt: new Date().toISOString()
  });
  
  // Notify all orders clients about status change
  broadcastToSSEClients('orders', {
    action: 'update',
    order: {
      ...order,
      securityKeys: undefined,
      refund: undefined,
      earner: undefined,
      updatedAt: new Date().toISOString()
    }
  });
  
  // Generate tracking token for earner
  const trackingToken = generateTrackingToken(orderId, 'earner', earnerKey);
  
  return {
    success: true,
    orderId,
    status: 'processing',
    trackingToken,
    earnerKey
  };
});
EOF < /dev/null