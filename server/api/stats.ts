import { defineEventHandler } from 'h3'
import { store } from '../index'
import { calculateStats } from '../utils/stats'
import { getActiveClientCounts } from '../utils/clientTracker'

export default defineEventHandler(async (event) => {
  try {
    // Get comprehensive statistics
    const platformStats = calculateStats();
    
    // Get active user counts
    const activeUsers = getActiveClientCounts();
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        activeSessions: store.sseClients.exchangeRate.size + store.sseClients.orders.size,
        pendingOrders: platformStats.pendingOrders,
        processingOrders: platformStats.processingOrders,
        completedOrders: platformStats.completedOrders,
        failedOrders: platformStats.failedOrders,
        totalOrders: platformStats.totalOrders,
        uptime: process.uptime().toFixed(2) + 's',
        currentRate: platformStats.currentRate,
        totalVolumeInr: platformStats.totalVolumeInr,
        totalVolumeSats: platformStats.totalVolumeSats,
        
        // Include active user statistics
        activeEarners: activeUsers.earners,
        activeBuyers: activeUsers.buyers,
        activeVisitors: activeUsers.visitors,
        activeUsers: activeUsers.total
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