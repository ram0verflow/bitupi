import { defineNitroPlugin } from 'nitropack/runtime/plugin'

// Simple in-memory database for the app
// In a real app you'd use Redis or another database
export const store = {
  // Exchange rate
  exchangeRate: {
    BTC_INR: 5650000,
    SAT_INR: 5650000 / 100000000
  },
  
  // Orders collection
  orders: new Map<string, Order>(),
  
  // SSE clients
  sseClients: {
    exchangeRate: new Set<any>(),
    orders: new Set<any>(),
    specificOrder: new Map<string, Set<any>>()
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
  };
}

// Function to update exchange rate with small jitter
export function updateExchangeRate() {
  // Add small random fluctuation (±0.5%)
  const jitter = 1 + (Math.random() * 0.01 - 0.005);
  store.exchangeRate.BTC_INR = Math.round(store.exchangeRate.BTC_INR * jitter);
  store.exchangeRate.SAT_INR = store.exchangeRate.BTC_INR / 100000000;
  
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
export function broadcastToSSEClients(channel: 'exchangeRate' | 'orders', data: any) {
  const clients = store.sseClients[channel];
  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  for (const res of clients) {
    try {
      res.write(message);
    } catch (e) {
      console.error('Error sending SSE message:', e);
    }
  }
}

// Function to broadcast to specific order SSE clients
export function broadcastToOrderClients(orderId: string, data: any) {
  if (!store.sseClients.specificOrder.has(orderId)) return;
  
  const clients = store.sseClients.specificOrder.get(orderId)!;
  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  for (const res of clients) {
    try {
      res.write(message);
    } catch (e) {
      console.error('Error sending SSE message to order client:', e);
    }
  }
}

// Nitro plugin to initialize the server
export default defineNitroPlugin((nitroApp) => {
  console.log('Starting LN2UPI server...');
  
  // Start exchange rate updates
  updateExchangeRate();
  
  // Clean up expired orders every minute
  setInterval(() => {
    const now = new Date();
    for (const [id, order] of store.orders) {
      const expiresAt = new Date(order.expiresAt);
      if (expiresAt < now && order.status === 'pending') {
        order.status = 'failed';
        store.orders.set(id, order);
        broadcastToOrderClients(id, { 
          status: 'failed',
          updatedAt: new Date().toISOString()
        });
      }
    }
  }, 60000);
  
  console.log('LN2UPI server initialized');
});