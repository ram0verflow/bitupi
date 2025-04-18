import { defineEventHandler } from 'h3'
import { store } from '../index'
import { sanitizeOrdersList } from '../utils/orderUtils'

export default defineEventHandler(async (event) => {
  try {
    // Convert the Map to an Array
    const orders = Array.from(store.orders.values())
    
    // Sort by most recent first
    orders.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    
    // Filter out only pending orders for the marketplace
    // and sanitize the data to remove sensitive information
    const pendingOrders = orders.filter(order => order.status === 'pending')
    return sanitizeOrdersList(pendingOrders)
  } catch (error) {
    console.error('Orders API error:', error)
    return []
  }
})