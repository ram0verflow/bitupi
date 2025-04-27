import { defineEventHandler } from 'h3'
import { store } from '../../index'
import { calculateStats } from '../../utils/clientTracker'

/**
 * Stats API endpoint
 * 
 * GET /api/stats - Get platform statistics
 */
export default defineEventHandler(async (event) => {
  try {
    // Get comprehensive statistics - this includes active users already
    const stats = calculateStats();
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        ...stats,
        activeSessions: store.sseClients.exchangeRate.size + store.sseClients.orders.size + store.sseClients.stats.size,
        uptime: process.uptime().toFixed(2) + 's'
      }
    }
  } catch (error) {
    console.error('Stats API error:', error)
    return {
      success: false,
      error: 'Failed to get stats'
    }
  }
})