import { defineEventHandler, setHeader } from 'h3'
import { store } from '../../index'
import { calculateStats } from '../../utils/clientTracker'

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
    // Log initial stats for debugging
    console.log(`SSE initial stats: Active earners = ${stats.activeEarners}`);
    
    // Send initial stats - with a small delay to ensure connection is ready
    setTimeout(() => {
      try {
        // Get fresh stats right before sending
        const freshStats = calculateStats();
        console.log(`SSE sending delayed initial stats: Active earners = ${freshStats.activeEarners}`);
        response.write(`data: ${JSON.stringify(freshStats)}\n\n`);
      } catch (error) {
        console.error('Error sending delayed initial stats:', error);
      }
    }, 500);
  } catch (error) {
    console.error('Error preparing initial stats SSE:', error);
  }
  
  // Send updated stats every 5 seconds
  const interval = setInterval(() => {
    // Get updated stats from the utility function
    const updatedStats = calculateStats();
    
    // Log updated stats for debugging
    console.log(`SSE updated stats: Active earners = ${updatedStats.activeEarners}`);
    
    try {
      response.write(`data: ${JSON.stringify(updatedStats)}\n\n`);
    } catch (e) {
      console.error('Error sending stats SSE:', e);
      clearInterval(interval);
    }
  }, 5000)
  
  // Clean up on disconnect
  response.on('close', () => {
    clearInterval(interval)
    
    // Remove this client from the stats SSE clients set
    store.sseClients.stats.delete(response)
  })
})