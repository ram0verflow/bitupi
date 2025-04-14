import { defineEventHandler, setHeader } from 'h3'
import { store } from '../../index'

export default defineEventHandler(async (event) => {
  // Set headers for SSE
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  
  const response = event.node.res
  
  // Send initial list of active orders
  const activeOrders = Array.from(store.orders.values())
    .filter(order => order.status === 'pending')
  
  response.write(`data: ${JSON.stringify({
    action: 'init',
    orders: activeOrders
  })}\n\n`)
  
  // Add this client to the orders SSE clients
  store.sseClients.orders.add(response)
  
  // Handle client disconnect
  response.on('close', () => {
    store.sseClients.orders.delete(response)
  })
})