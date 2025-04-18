import { defineEventHandler, getRouterParam, createError, readBody } from 'h3'
import { store, broadcastToSSEClients, broadcastToOrderClients } from '../../../index'
import { generateSecurityKey, generateTrackingToken } from '../../../utils/security'

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!orderId) {
    throw createError({
      statusCode: 400,
      message: 'Order ID is required'
    })
  }
  
  // Get the order
  const order = store.orders.get(orderId)
  
  if (!order) {
    throw createError({
      statusCode: 404,
      message: 'Order not found'
    })
  }
  
  // Check if order is available to claim
  if (order.status !== 'pending') {
    throw createError({
      statusCode: 400,
      message: 'This order is no longer available'
    })
  }
  
  // Generate earner key for multi-signature authentication
  const earnerKey = generateSecurityKey()
  
  // Update the security keys to include earner key
  if (order.securityKeys) {
    order.securityKeys.earnerKey = earnerKey
  }
  
  // Update order status to processing
  order.status = 'processing'
  
  // Initialize earner object if it doesn't exist
  if (!order.earner) {
    order.earner = {}
  }
  
  // Store the earner's auth key
  order.earner.authKey = earnerKey
  
  // Set processing expiry time (15 minutes from now)
  const processingExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
  
  // Store updated order
  store.orders.set(orderId, order)
  
  // Notify specific order clients
  broadcastToOrderClients(orderId, {
    id: orderId,
    status: 'processing',
    updatedAt: new Date().toISOString()
  })
  
  // Notify all orders clients about status change
  broadcastToSSEClients('orders', {
    action: 'update',
    order: {
      ...order,
      securityKeys: undefined, // Don't broadcast security keys
      refund: undefined // Don't broadcast refund information
    }
  })
  
  // Generate a tracking token for the earner
  const trackingToken = generateTrackingToken(orderId, 'earner', earnerKey)
  
  return {
    success: true,
    orderId,
    status: 'processing',
    trackingToken,
    earnerKey,
    // Return filtered order information (no sensitive data)
    order: {
      id: order.id,
      inrAmount: order.inrAmount,
      upiId: order.upiId,
      upiName: order.upiName,
      status: order.status,
      createdAt: order.createdAt,
      expiresAt: order.expiresAt
    }
  }
})