import { defineEventHandler, getRouterParam, createError } from 'h3';
import { store } from '../../../index';

/**
 * Order details API
 * 
 * GET /api/orders/:id - Get order details
 */
export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id');
  
  if (!orderId) {
    throw createError({
      statusCode: 400,
      message: 'Order ID is required'
    });
  }
  
  const order = store.orders.get(orderId);
  
  if (!order) {
    throw createError({
      statusCode: 404,
      message: 'Order not found'
    });
  }
  
  // Return sanitized order
  return {
    success: true,
    order: {
      ...order,
      securityKeys: undefined,
      refund: {
        walletAddress: order.refund?.walletAddress
      }
    }
  };
});