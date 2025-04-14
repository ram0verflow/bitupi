import { defineEventHandler, setHeader } from 'h3'
import { store } from '../../index'

export default defineEventHandler(async (event) => {
  // Set headers for SSE
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  
  const response = event.node.res
  
  // Calculate initial stats
  let pendingCount = 0
  let processingCount = 0
  let completedCount = 0
  let failedCount = 0
  
  store.orders.forEach(order => {
    if (order.status === 'pending') pendingCount++
    else if (order.status === 'processing' || order.status === 'verifying') processingCount++
    else if (order.status === 'completed') completedCount++
    else if (order.status === 'failed') failedCount++
  })
  
  // Send initial stats
  response.write(`data: ${JSON.stringify({
    timestamp: new Date().toISOString(),
    activeSessions: store.sseClients.exchangeRate.size + store.sseClients.orders.size,
    pendingOrders: pendingCount,
    processingOrders: processingCount,
    completedOrders: completedCount,
    failedOrders: failedCount,
    totalOrders: store.orders.size,
    uptime: process.uptime().toFixed(2) + 's',
    currentRate: store.exchangeRate.BTC_INR
  })}\n\n`)
  
  // Send updated stats every 5 seconds
  const interval = setInterval(() => {
    // Recalculate stats
    let pendingCount = 0
    let processingCount = 0
    let completedCount = 0
    let failedCount = 0
    
    store.orders.forEach(order => {
      if (order.status === 'pending') pendingCount++
      else if (order.status === 'processing' || order.status === 'verifying') processingCount++
      else if (order.status === 'completed') completedCount++
      else if (order.status === 'failed') failedCount++
    })
    
    try {
      response.write(`data: ${JSON.stringify({
        timestamp: new Date().toISOString(),
        activeSessions: store.sseClients.exchangeRate.size + store.sseClients.orders.size,
        pendingOrders: pendingCount,
        processingOrders: processingCount,
        completedOrders: completedCount,
        failedOrders: failedCount,
        totalOrders: store.orders.size,
        uptime: process.uptime().toFixed(2) + 's',
        currentRate: store.exchangeRate.BTC_INR
      })}\n\n`)
    } catch (e) {
      console.error('Error sending stats SSE:', e)
      clearInterval(interval)
    }
  }, 5000)
  
  // Clean up on disconnect
  response.on('close', () => {
    clearInterval(interval)
  })
})