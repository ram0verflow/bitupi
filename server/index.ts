import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { cleanupExpiredClients, getActiveClientCounts, startCleanupInterval } from './utils/clientTracker'
import { calculateStats } from './utils/stats'
import { ServerResponse } from 'http'

// Simple in-memory database for the app
// In a real app you'd use Redis or another database
export const store = {
  // Exchange rate - initialized with estimates (will be updated with real API data)
  exchangeRate: {
    BTC_INR: 6300000, // April 2025 estimate for BTC/INR
    SAT_INR: 6300000 / 100000000
  },

  // Orders collection
  orders: new Map<string, Order>(),

  // SSE clients
  sseClients: {
    exchangeRate: new Set<ServerResponse>(),
    orders: new Set<ServerResponse>(),
    stats: new Set<ServerResponse>(),  // Add stats channel for SSE clients
    specificOrder: new Map<string, Set<ServerResponse>>()
  },

  // Activity stats
  activeUsers: {
    earners: 0,
    buyers: 0,
    visitors: 0,
    total: 0
  }
}

// Order type definition
export type Order = {
  id: string;
  inrAmount: number;
  satAmount: number;
  upiId: string;
  upiName?: string;
  status: 'pending' | 'processing' | 'verifying' | 'completed' | 'failed';
  createdAt: string;
  expiresAt: string;
  lightning?: {
    invoice: string;
    paid: boolean;
  };
  receipt?: {
    image: string;
    uploadedAt: string;
  };
  earner?: {
    lightningAddress?: string;
    authKey?: string; // Earner's auth key part
  };
  // Multi-signature authentication
  securityKeys?: {
    buyerKey: string;    // Buyer's private key
    earnerKey?: string;  // Earner's private key
    systemKey: string;   // System-generated key
    sharedSecret?: string; // Shared secret for verification
  };
  // Refund information
  refund?: {
    walletAddress?: string; // Bitcoin or Lightning Network refund address
    refundKey?: string;     // Key required for processing refunds
  };
}

// Function to update exchange rate by fetching real rates
export async function updateExchangeRate() {
  try {
    // Fetch the latest rate from our own API endpoint
    const response = await fetch('http://localhost:3000/api/exchange-rate');
    const data = await response.json();

    if (data.success) {
      // API already updates the store, so we don't need to update it here
      // Just broadcast the updated rate to all clients
      console.log(`Exchange rate updated: BTC/INR = ${data.rate} (Source: ${data.source})`);
    } else {
      console.error('Failed to update exchange rate:', data.error);
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error);

    // If fetching fails, add a small jitter to the current rate (fallback)
    const jitter = 1 + (Math.random() * 0.002 - 0.001); // ±0.1% jitter
    const currentRate = store.exchangeRate.BTC_INR;
    const newRate = Math.round(currentRate * jitter);

    // Update store values with fallback approach
    store.exchangeRate.BTC_INR = newRate;
    store.exchangeRate.SAT_INR = newRate / 100000000;

    console.log(`Fallback exchange rate update: BTC/INR = ${newRate}`);
  }

  // Broadcast to all SSE clients
  broadcastToSSEClients('exchangeRate', {
    success: true,
    timestamp: new Date().toISOString(),
    rates: store.exchangeRate
  });

  // Schedule next update
  setTimeout(updateExchangeRate, 10000); // Every 10 seconds
}

// Function to broadcast to SSE clients
export function broadcastToSSEClients(channel: 'exchangeRate' | 'orders' | 'stats', data: any) {
  // Ensure clients is defined and is a Set
  const clients = store.sseClients[channel];
  if (!clients || !(clients instanceof Set) || clients.size === 0) {
    // No clients to broadcast to
    return;
  }

  const message = `data: ${JSON.stringify(data)}\n\n`;

  // Iterate using forEach which is safer than for..of for Sets
  clients.forEach(res => {
    try {
      if (res && typeof res.write === 'function') {
        res.write(message);
      }
    } catch (e) {
      console.error('Error sending SSE message:', e);
    }
  });
}

// Function to broadcast to specific order SSE clients
export function broadcastToOrderClients(orderId: string, data: any) {
  if (!store.sseClients.specificOrder.has(orderId)) return;

  const clients = store.sseClients.specificOrder.get(orderId);
  if (!clients || !(clients instanceof Set) || clients.size === 0) {
    // No clients to broadcast to
    return;
  }

  // Importing the sanitizeOrder function here would create a circular dependency
  // So we perform minimal sanitization by excluding sensitive fields
  // A full implementation would use the sanitizeOrder utility
  const sanitizedData = { ...data };
  
  // Remove sensitive fields if present
  if (sanitizedData.securityKeys) delete sanitizedData.securityKeys;
  if (sanitizedData.earner?.authKey) delete sanitizedData.earner.authKey;
  if (sanitizedData.refund?.refundKey) delete sanitizedData.refund.refundKey;

  const message = `data: ${JSON.stringify(sanitizedData)}\n\n`;

  // Iterate using forEach which is safer than for..of for Sets
  clients.forEach(res => {
    try {
      if (res && typeof res.write === 'function') {
        res.write(message);
      }
    } catch (e) {
      console.error('Error sending SSE message to order client:', e);
    }
  });
}

// Nitro plugin to initialize the server
export default defineNitroPlugin((nitroApp) => {
  console.log('Starting LN2UPI server...');

  // Start exchange rate updates (immediately and every 5 minutes)
  updateExchangeRate();
  setInterval(updateExchangeRate, 5 * 60 * 1000); // Every 5 minutes

  // Clean up expired and completed orders every minute
  setInterval(() => {
    const now = new Date();
    let expiredCount = 0;
    let completedCount = 0;
    let failedCount = 0;
    
    for (const [id, order] of store.orders) {
      const expiresAt = new Date(order.expiresAt);
      const createdAt = new Date(order.createdAt);
      
      // Mark pending orders as failed if they've expired
      if (expiresAt < now && order.status === 'pending') {
        order.status = 'failed';
        store.orders.set(id, order);
        broadcastToOrderClients(id, {
          status: 'failed',
          updatedAt: new Date().toISOString()
        });
        expiredCount++;
      }
      
      // Remove completed orders after 30 minutes
      // This gives users enough time to see the completion status
      // but ensures we don't store any data permanently
      if (order.status === 'completed') {
        const completedTime = 30 * 60 * 1000; // 30 minutes in milliseconds
        if (now.getTime() - createdAt.getTime() > completedTime) {
          store.orders.delete(id);
          completedCount++;
        }
      }
      
      // Remove failed orders after 15 minutes
      if (order.status === 'failed') {
        const failedTime = 15 * 60 * 1000; // 15 minutes in milliseconds
        if (now.getTime() - createdAt.getTime() > failedTime) {
          store.orders.delete(id);
          failedCount++;
        }
      }
    }
    
    // Log cleanup stats only if something was cleaned
    if (expiredCount > 0 || completedCount > 0 || failedCount > 0) {
      console.log(`Order cleanup: ${expiredCount} expired, ${completedCount} completed removed, ${failedCount} failed removed`);
    }
  }, 60000);

  // Start client tracking cleanup interval
  startCleanupInterval();

  // Clean up expired clients every minute
  setInterval(() => {
    // Remove expired clients
    const removedCount = cleanupExpiredClients();
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} expired clients`);
    }
  }, 60000);
  
  // Update and broadcast stats more frequently (every 10 seconds)
  setInterval(() => {
    // Update active user counts
    const counts = getActiveClientCounts();
    store.activeUsers = counts;

    try {
      // Get stats from the calculateStats function
      // The function already includes active user counts from store.activeUsers
      const stats = calculateStats();
      
      // Broadcast updated stats to all clients (send the stats directly for simpler client handling)
      broadcastToSSEClients('stats', stats);
    } catch (error) {
      console.error('Error broadcasting stats:', error);
    }
  }, 10000);

  console.log('LN2UPI server initialized');
});