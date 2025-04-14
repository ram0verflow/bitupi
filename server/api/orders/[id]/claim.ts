import { defineEventHandler, getRouterParam, createError } from 'h3'
import { store, broadcastToSSEClients, broadcastToOrderClients } from '../../../index'

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id')
  
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
  
  // Update order status to processing
  order.status = 'processing'
  
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
      updatedAt: new Date().toISOString()
    }
  })
  
  return {
    success: true,
    orderId,
    status: 'processing'
  }
})