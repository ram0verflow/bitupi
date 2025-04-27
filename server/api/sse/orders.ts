import { defineEventHandler, setHeader } from 'h3'
import { store } from '../../index'
import { sanitizeOrdersList } from '../../utils/orderUtils'

export default defineEventHandler(async (event) => {
  // Set headers for SSE
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  
  const response = event.node.res
  
  // Send initial list of active orders with paid invoices
  const activeOrders = Array.from(store.orders.values())
    .filter(order => order.status === 'pending')
  
  // Sanitize order data before sending - this also filters for paid invoices
  const sanitizedOrders = sanitizeOrdersList(activeOrders)
  
  console.log(`SSE orders: Sending ${sanitizedOrders.length} orders with paid invoices to new client`)
  
  response.write(`data: ${JSON.stringify({
    action: 'init',
    orders: sanitizedOrders
  })}\n\n`)
  
  // Add this client to the orders SSE clients
  store.sseClients.orders.add(response)
  
  // Handle client disconnect
  response.on('close', () => {
    store.sseClients.orders.delete(response)
  })
})