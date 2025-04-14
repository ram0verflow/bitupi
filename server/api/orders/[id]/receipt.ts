import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { store, broadcastToSSEClients, broadcastToOrderClients } from '../../../index'

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!orderId) {
    throw createError({
      statusCode: 400,
      message: 'Order ID is required'
    })
  }
  
  if (!body.receiptImage) {
    throw createError({
      statusCode: 400,
      message: 'Receipt image is required'
    })
  }
  
  if (!body.lightningAddress) {
    throw createError({
      statusCode: 400,
      message: 'Lightning address is required'
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
  
  // Check if order is in processing status
  if (order.status !== 'processing') {
    throw createError({
      statusCode: 400,
      message: 'Receipt can only be submitted for orders in processing status'
    })
  }
  
  // Update order with receipt info
  order.receipt = {
    image: body.receiptImage,
    uploadedAt: new Date().toISOString()
  }
  
  order.earner = {
    lightningAddress: body.lightningAddress
  }
  
  // Update status to verifying
  order.status = 'verifying'
  
  // Store updated order
  store.orders.set(orderId, order)
  
  // Notify specific order clients
  broadcastToOrderClients(orderId, {
    id: orderId,
    status: 'verifying',
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
  
  // For demo purposes, auto-complete after 10 seconds
  setTimeout(() => {
    completeOrder(orderId)
  }, 10000)
  
  return {
    success: true,
    orderId,
    status: 'verifying'
  }
})

// Helper function to auto-complete orders (for demo)
async function completeOrder(orderId: string) {
  const order = store.orders.get(orderId)
  
  if (order && order.status === 'verifying') {
    // Update status to completed
    order.status = 'completed'
    
    // Store updated order
    store.orders.set(orderId, order)
    
    // Notify specific order clients
    broadcastToOrderClients(orderId, {
      id: orderId,
      status: 'completed',
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
    
    console.log(`Auto-completed order ${orderId} for demo purposes`)
  }
}