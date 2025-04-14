import { defineEventHandler, setHeader, getRouterParam } from 'h3'
import { store } from '../../../index'

export default defineEventHandler(async (event) => {
  // Set headers for SSE
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  
  // Get order ID from route parameter
  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
    return 'Error: Order ID is required'
  }
  
  const response = event.node.res
  
  // Send initial order state
  const order = store.orders.get(orderId)
  if (order) {
    response.write(`data: ${JSON.stringify({
      id: order.id,
      status: order.status,
      updatedAt: new Date().toISOString()
    })}\n\n`)
  } else {
    response.write(`data: ${JSON.stringify({
      error: 'Order not found',
      orderId
    })}\n\n`)
  }
  
  // Create a set for this order if it doesn't exist
  if (!store.sseClients.specificOrder.has(orderId)) {
    store.sseClients.specificOrder.set(orderId, new Set())
  }
  
  // Add this client to the specific order SSE clients
  store.sseClients.specificOrder.get(orderId)!.add(response)
  
  // Handle client disconnect
  response.on('close', () => {
    const clients = store.sseClients.specificOrder.get(orderId)
    if (clients) {
      clients.delete(response)
      if (clients.size === 0) {
        store.sseClients.specificOrder.delete(orderId)
      }
    }
  })
})