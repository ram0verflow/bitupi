import { defineEventHandler } from 'h3'
import { store } from '../index'

export default defineEventHandler(async (event) => {
  try {
    // Count orders by status
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
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        activeSessions: store.sseClients.exchangeRate.size + store.sseClients.orders.size,
        pendingOrders: pendingCount,
        processingOrders: processingCount,
        completedOrders: completedCount,
        failedOrders: failedCount,
        totalOrders: store.orders.size,
        uptime: process.uptime().toFixed(2) + 's',
        currentRate: store.exchangeRate.BTC_INR
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