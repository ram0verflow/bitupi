import { defineEventHandler, getQuery, createError } from 'h3';
import { store } from '../index';
import { parseTrackingToken } from '../utils/security';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { token } = query;
  
  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Tracking token is required'
    });
  }
  
  // Parse the tracking token
  const tokenData = parseTrackingToken(token as string);
  
  if (!tokenData) {
    throw createError({
      statusCode: 401,
      message: 'Invalid tracking token'
    });
  }
  
  // Get the order
  const order = store.orders.get(tokenData.id);
  
  if (!order) {
    throw createError({
      statusCode: 404,
      message: 'Order not found'
    });
  }
  
  // Verify the user's key based on their type (buyer/earner)
  let isAuthorized = false;
  
  if (tokenData.type === 'buyer' && order.securityKeys?.buyerKey === tokenData.key) {
    isAuthorized = true;
  } else if (tokenData.type === 'earner' && order.earner?.authKey === tokenData.key) {
    isAuthorized = true;
  }
  
  if (!isAuthorized) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized access to order'
    });
  }
  
  // Check if order has expired
  const now = new Date();
  const expiresAt = new Date(order.expiresAt);
  
  if (expiresAt < now && ['pending', 'processing'].includes(order.status)) {
    order.status = 'failed';
    store.orders.set(tokenData.id, order);
  }
  
  // Define response type
  interface OrderStatusResponse {
    success: boolean;
    orderId: string;
    status: 'pending' | 'processing' | 'verifying' | 'completed' | 'failed';
    inrAmount: number;
    satAmount: number;
    createdAt: string;
    expiresAt: string;
    userType: 'buyer' | 'earner';
    upiId?: string;
    upiName?: string;
    receipt?: {
      uploadedAt: string;
      image: string;
    };
    refund?: {
      walletAddress: string;
    };
    lightningAddress?: string;
  }
  
  // Create a response with appropriate data based on user type
  const response: OrderStatusResponse = {
    success: true,
    orderId: order.id,
    status: order.status,
    inrAmount: order.inrAmount,
    satAmount: order.satAmount,
    createdAt: order.createdAt,
    expiresAt: order.expiresAt,
    userType: tokenData.type as 'buyer' | 'earner'
  };
  
  // Add buyer-specific data
  if (tokenData.type === 'buyer') {
    response.upiId = order.upiId;
    response.upiName = order.upiName;
    
    if (order.receipt) {
      response.receipt = {
        uploadedAt: order.receipt.uploadedAt,
        image: order.receipt.image
      };
    }
    
    if (order.refund) {
      response.refund = {
        walletAddress: order.refund.walletAddress
      };
    }
  }
  
  // Add earner-specific data
  if (tokenData.type === 'earner') {
    response.upiId = order.upiId;
    response.upiName = order.upiName;
    
    if (order.earner?.lightningAddress) {
      response.lightningAddress = order.earner.lightningAddress;
    }
  }
  
  return response;
});