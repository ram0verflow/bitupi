import { defineEventHandler } from 'h3';
import { store } from '../index';
import fetch from 'node-fetch';

// Cache for the exchange rate
let rateCache = {
  rate: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutes cache
};

export default defineEventHandler(async () => {
  try {
    const now = Date.now();
    
    // Check if we need to refresh the cache
    if (!rateCache.rate || now - rateCache.timestamp > rateCache.ttl) {
      try {
        // Try to fetch from CoinGecko API first
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=inr');
        
        if (response.ok) {
          const data = await response.json();
          if (data.bitcoin && data.bitcoin.inr) {
            // Update the cache
            rateCache.rate = data.bitcoin.inr;
            rateCache.timestamp = now;
            
            // Also update the store for other parts of the application
            store.exchangeRate.BTC_INR = data.bitcoin.inr;
            store.exchangeRate.SAT_INR = data.bitcoin.inr / 100000000;
            
            return {
              success: true,
              source: 'coingecko',
              rate: data.bitcoin.inr,
              timestamp: new Date().toISOString(),
              rates: store.exchangeRate
            };
          }
        }
        
        // Fallback to another API if CoinGecko fails
        const fallbackResponse = await fetch('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=INR');
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.INR) {
            // Update the cache
            rateCache.rate = fallbackData.INR;
            rateCache.timestamp = now;
            
            // Also update the store for other parts of the application
            store.exchangeRate.BTC_INR = fallbackData.INR;
            store.exchangeRate.SAT_INR = fallbackData.INR / 100000000;
            
            return {
              success: true,
              source: 'cryptocompare',
              rate: fallbackData.INR,
              timestamp: new Date().toISOString(),
              rates: store.exchangeRate
            };
          }
        }
        
        // If all APIs fail, fall back to the existing rate in the store
        return {
          success: true,
          source: 'local',
          rate: store.exchangeRate.BTC_INR,
          timestamp: new Date().toISOString(),
          rates: store.exchangeRate
        };
      } catch (fetchError) {
        console.error('Error fetching exchange rate from APIs:', fetchError);
        
        // Return the current rate from the store if API calls fail
        return {
          success: true,
          source: 'local',
          rate: store.exchangeRate.BTC_INR,
          timestamp: new Date().toISOString(),
          rates: store.exchangeRate
        };
      }
    } else {
      // Return cached rate if it's still fresh
      return {
        success: true,
        source: 'cache',
        rate: rateCache.rate || store.exchangeRate.BTC_INR,
        timestamp: new Date().toISOString(),
        rates: store.exchangeRate
      };
    }
  } catch (error) {
    console.error('Exchange rate error:', error);
    
    // Return the current rate from the store as fallback
    return {
      success: true,
      source: 'fallback',
      rate: store.exchangeRate.BTC_INR,
      timestamp: new Date().toISOString(),
      rates: store.exchangeRate
    };
  }
});