import { defineEventHandler, setHeader } from 'h3'
import { store } from '../../index'

export default defineEventHandler(async (event) => {
  // Set headers for SSE
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  
  const response = event.node.res
  
  // Send initial message
  response.write(`data: ${JSON.stringify({
    success: true,
    timestamp: new Date().toISOString(),
    rates: store.exchangeRate
  })}\n\n`)
  
  // Add this client to the exchange rate SSE clients
  store.sseClients.exchangeRate.add(response)
  
  // Trigger a heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    if (!response.writableEnded) {
      response.write(`: heartbeat\n\n`);
    }
  }, 30000);
  
  // Handle client disconnect
  response.on('close', () => {
    clearInterval(heartbeatInterval);
    store.sseClients.exchangeRate.delete(response)
  })
})