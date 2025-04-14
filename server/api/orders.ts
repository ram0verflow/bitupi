import { defineEventHandler } from 'h3'
import { store } from '../index'

export default defineEventHandler(async (event) => {
  try {
    // Convert the Map to an Array
    const orders = Array.from(store.orders.values())
    
    // Sort by most recent first
    orders.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    
    return orders
  } catch (error) {
    console.error('Orders API error:', error)
    return []
  }
})