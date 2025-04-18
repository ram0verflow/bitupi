import { defineEventHandler, setHeader } from 'h3'
import { store } from '../../index'
import { getActiveClientCounts } from '../../utils/clientTracker'
import { calculateStats } from '../../utils/stats'

export default defineEventHandler(async (event) => {
  // Set headers for SSE
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  
  const response = event.node.res
  
  // Add this client to the stats SSE clients set
  store.sseClients.stats.add(response)
  
  // Get stats from the utility function to ensure consistency
  const stats = calculateStats()
  
  try {
    // Send initial stats
    response.write(`data: ${JSON.stringify(stats)}\n\n`);
  } catch (error) {
    console.error('Error sending initial stats SSE:', error);
  }
  
  // Send updated stats every 5 seconds
  const interval = setInterval(() => {
    // Get updated stats from the utility function
    const updatedStats = calculateStats()
    
    try {
      response.write(`data: ${JSON.stringify(updatedStats)}\n\n`)
    } catch (e) {
      console.error('Error sending stats SSE:', e)
      clearInterval(interval)
    }
  }, 5000)
  
  // Clean up on disconnect
  response.on('close', () => {
    clearInterval(interval)
    
    // Remove this client from the stats SSE clients set
    store.sseClients.stats.delete(response)
  })
})