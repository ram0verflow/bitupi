import { defineEventHandler } from 'h3'
import { store } from '../index'

export default defineEventHandler(async (event) => {
  try {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      rate: store.exchangeRate.BTC_INR,
      rates: store.exchangeRate
    }
  } catch (error) {
    console.error('Exchange rate API error:', error)
    return {
      success: false,
      error: 'Failed to get exchange rate'
    }
  }
})