import { defineEventHandler } from 'h3';
import { getCachedValue, publishMessage } from '../utils/redis';
import { CHANNELS } from '../websockets/socket-server';

// Constants
const EXCHANGE_RATE_CACHE_KEY = 'exchange:rates:btc-inr';
const CACHE_TTL = 60 * 5; // 5 minutes
const FALLBACK_RATE = 5600000; // Fallback rate if API fails

// API sources for Bitcoin price data
const API_SOURCES = {
  COINGECKO: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=inr',
  BINANCE: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCINR',
  // Add more API sources as needed
};

// Fetch from CoinGecko API
async function fetchFromCoinGecko(): Promise<number> {
  try {
    const response = await fetch(API_SOURCES.COINGECKO);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.bitcoin && data.bitcoin.inr) {
      return data.bitcoin.inr;
    }
    
    throw new Error('Invalid data format from CoinGecko');
  } catch (error) {
    console.error('Error fetching from CoinGecko:', error);
    throw error;
  }
}

// Fetch from Binance API
async function fetchFromBinance(): Promise<number> {
  try {
    const response = await fetch(API_SOURCES.BINANCE);
    
    if (!response.ok) {
      throw new Error(`Binance API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.price) {
      return parseFloat(data.price);
    }
    
    throw new Error('Invalid data format from Binance');
  } catch (error) {
    console.error('Error fetching from Binance:', error);
    throw error;
  }
}

// Get exchange rate with fallback strategy
async function getExchangeRate(): Promise<number> {
  try {
    // First try CoinGecko
    return await fetchFromCoinGecko();
  } catch (error) {
    console.warn('CoinGecko API failed, trying Binance...');
    
    try {
      // Try Binance as fallback
      return await fetchFromBinance();
    } catch (secondError) {
      console.error('All exchange rate APIs failed:', secondError);
      
      // Use fallback rate
      return FALLBACK_RATE;
    }
  }
}

// Format exchange rate data
function formatExchangeRateData(rate: number) {
  // Add a small random fluctuation for demo purposes (±1%)
  const jitter = 1 + (Math.random() * 0.02 - 0.01);
  const adjustedRate = Math.round(rate * jitter);
  
  return {
    success: true,
    timestamp: new Date().toISOString(),
    rates: {
      BTC_INR: adjustedRate,
      SAT_INR: adjustedRate / 100000000
    },
    source: 'LN2UPI Exchange API'
  };
}

// The main event handler
export default defineEventHandler(async (event) => {
  try {
    // Get exchange rate from cache or fetch new data
    const exchangeRateData = await getCachedValue(
      EXCHANGE_RATE_CACHE_KEY,
      async () => {
        const rate = await getExchangeRate();
        const formattedData = formatExchangeRateData(rate);
        
        // Publish the new rate to Redis PubSub
        publishMessage(CHANNELS.EXCHANGE_RATE_UPDATED, formattedData);
        
        return formattedData;
      },
      { ttl: CACHE_TTL }
    );
    
    return exchangeRateData;
  } catch (error) {
    console.error('Exchange rate handler error:', error);
    
    return {
      success: false,
      error: 'Failed to fetch exchange rate',
      fallback: true,
      rates: {
        BTC_INR: FALLBACK_RATE,
        SAT_INR: FALLBACK_RATE / 100000000
      }
    };
  }
});