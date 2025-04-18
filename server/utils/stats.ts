import { store } from '../index';

/**
 * Calculates platform statistics
 * @returns Platform statistics
 */
export function calculateStats() {
  // Calculate total orders
  const totalOrders = store.orders.size;
  
  // Calculate orders by status
  let pendingOrders = 0;
  let processingOrders = 0;
  let completedOrders = 0;
  let failedOrders = 0;
  
  // Calculate total volume
  let totalVolumeInr = 0;
  let totalVolumeSats = 0;
  
  // Loop through orders to calculate stats
  for (const order of store.orders.values()) {
    // Count by status
    if (order.status === 'pending') pendingOrders++;
    else if (order.status === 'processing' || order.status === 'verifying') processingOrders++;
    else if (order.status === 'completed') {
      completedOrders++;
      totalVolumeInr += order.inrAmount;
      totalVolumeSats += order.satAmount;
    }
    else if (order.status === 'failed') failedOrders++;
  }
  
  // Get current exchange rate
  const currentRate = store.exchangeRate.BTC_INR;
  
  // Get active user counts
  const { earners, buyers, visitors, total } = store.activeUsers;
  
  // Calculate additional statistics
  const averageOrderValueInr = completedOrders > 0 ? Math.round(totalVolumeInr / completedOrders) : 0;
  const averageOrderValueSats = completedOrders > 0 ? Math.round(totalVolumeSats / completedOrders) : 0;
  
  return {
    // Order stats
    totalOrders,
    pendingOrders,
    processingOrders,
    completedOrders,
    failedOrders,
    
    // Volume stats
    totalVolumeInr,
    totalVolumeSats,
    averageOrderValueInr,
    averageOrderValueSats,
    
    // Rate stats
    currentRate,
    
    // User activity stats
    activeEarners: earners,
    activeBuyers: buyers,
    activeVisitors: visitors,
    activeUsers: total
  };
}