import { defineEventHandler } from 'h3';
import { getRedisClient } from '../utils/redis';
import { getSocketServer } from '../websockets/socket-server';

/**
 * API endpoint to get real-time stats about the platform.
 * This includes:
 * - Active users/sessions
 * - Active orders
 * - Completed transactions
 * - Failed transactions
 * - Current redis cache size
 */
export default defineEventHandler(async (event) => {
  try {
    const redis = getRedisClient();
    const io = getSocketServer();
    
    // Get active connections count
    const connectedClients = io ? io.engine.clientsCount : 0;
    
    // Get active orders (orders with 'PENDING' status)
    const pendingOrders = await redis.keys('order:*');
    let pendingOrdersCount = 0;
    let successfulTransactions = 0;
    let failedTransactions = 0;
    
    // Count orders by status
    if (pendingOrders.length > 0) {
      // Get all orders in a multi command
      const pipeline = redis.pipeline();
      pendingOrders.forEach(key => {
        pipeline.get(key);
      });
      
      const results = await pipeline.exec();
      
      // Process results
      results.forEach(([err, data]) => {
        if (err) return;
        
        try {
          const order = JSON.parse(data);
          if (order.status === 'PENDING') {
            pendingOrdersCount++;
          } else if (order.status === 'COMPLETED') {
            successfulTransactions++;
          } else if (order.status === 'FAILED') {
            failedTransactions++;
          }
        } catch (e) {
          console.error('Error parsing order data:', e);
        }
      });
    }
    
    // Get Redis memory usage
    const memory = await redis.info('memory');
    const usedMemory = memory.match(/used_memory_human:([^\r\n]+)/)?.[1] || '0B';
    
    // Get active earners (a special key we maintain for active earners)
    const activeEarnersCount = await redis.scard('active:earners') || 0;
    
    // Get exchange rate
    const exchangeRate = await redis.get('exchange:rates:btc-inr');
    let rateData = null;
    
    if (exchangeRate) {
      try {
        rateData = JSON.parse(exchangeRate);
      } catch (e) {
        console.error('Error parsing exchange rate:', e);
      }
    }
    
    // Return stats
    return {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        activeSessions: connectedClients,
        activeEarners: activeEarnersCount,
        pendingOrders: pendingOrdersCount,
        successfulTransactions,
        failedTransactions,
        totalTransactions: successfulTransactions + failedTransactions,
        uptime: process.uptime().toFixed(2) + 's',
        memoryUsage: usedMemory,
        currentRate: rateData?.rates?.BTC_INR || null,
        currentTransport: io ? io.engine.transport.name : 'none',
      }
    };
  } catch (error) {
    console.error('Stats API error:', error);
    
    return {
      success: false,
      error: 'Failed to fetch stats'
    };
  }
});