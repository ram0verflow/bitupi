import { defineEventHandler, createError } from 'h3';
import { $fetch } from 'ohmyfetch';

// Cache exchange rate data to minimize API calls
let exchangeRateCache = {
  inr: 0,
  lastUpdated: 0
};

// Cache lifetime in milliseconds (5 minutes)
const CACHE_LIFETIME = 5 * 60 * 1000;

/**
 * Get current Bitcoin to INR exchange rate
 */
async function getBitcoinToInrRate(): Promise<{
  inr: number;
  lastUpdated: number;
}> {
  const now = Date.now();
  
  // Return cached value if still valid
  if (exchangeRateCache.inr > 0 && now - exchangeRateCache.lastUpdated < CACHE_LIFETIME) {
    return exchangeRateCache;
  }
  
  try {
    // Use CoinGecko API to get Bitcoin price in INR
    const response = await $fetch('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'inr',
        include_last_updated_at: true
      }
    });
    
    if (response.bitcoin && response.bitcoin.inr) {
      // Update cache
      exchangeRateCache = {
        inr: response.bitcoin.inr,
        lastUpdated: now
      };
      
      return exchangeRateCache;
    }
    
    throw new Error('Invalid response from exchange rate API');
  } catch (error) {
    console.error('Error fetching Bitcoin to INR rate:', error);
    
    // If we have cached data, return it even if expired
    if (exchangeRateCache.inr > 0) {
      return exchangeRateCache;
    }
    
    // No cached data available, must throw error
    throw new Error('Failed to fetch exchange rate data');
  }
}

/**
 * Convert satoshis to INR
 */
export function satoshisToInr(satoshis: number, rate: number): number {
  const bitcoin = satoshis / 100000000; // 1 BTC = 100,000,000 satoshis
  return bitcoin * rate;
}

/**
 * Convert INR to satoshis
 */
export function inrToSatoshis(inr: number, rate: number): number {
  const bitcoin = inr / rate;
  return Math.floor(bitcoin * 100000000); // Round down to whole satoshis
}

export default defineEventHandler(async () => {
  try {
    const rate = await getBitcoinToInrRate();
    
    // Calculate some example conversions
    const examples = {
      '100inr': inrToSatoshis(100, rate.inr),
      '500inr': inrToSatoshis(500, rate.inr),
      '1000inr': inrToSatoshis(1000, rate.inr),
      '10000sats': satoshisToInr(10000, rate.inr),
      '100000sats': satoshisToInr(100000, rate.inr)
    };
    
    return {
      success: true,
      rate: rate.inr,
      lastUpdated: new Date(rate.lastUpdated).toISOString(),
      examples
    };
  } catch (error) {
    console.error('Exchange rate API error:', error);
    
    throw createError({
      statusCode: 503,
      message: 'Exchange rate service temporarily unavailable'
    });
  }
});