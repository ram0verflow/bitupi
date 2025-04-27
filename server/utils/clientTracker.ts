/**
 * Simplified client tracking and stats utility
 */
import { store } from '../index';
import crypto from 'crypto';

// Track active users with a Map of client IDs to last activity timestamps
const activeClients = new Map<string, {
  lastSeen: number;
  type: 'earner' | 'buyer' | 'visitor';
}>();

// TTL for client activity in milliseconds (15 minutes)
const CLIENT_TTL = 15 * 60 * 1000;

// Cookie name for client tracking - use a session-only cookie
export const CLIENT_ID_COOKIE = 'bitupi_session_id';

/**
 * Generate a unique client ID
 */
export function generateClientId() {
  return `client_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Helper function to parse cookies
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  if (!cookieHeader) return cookies;
  
  try {
    // RFC 6265 compliant cookie parsing
    const cookiePairs = cookieHeader.split(/;\s*/);
    
    for (const cookiePair of cookiePairs) {
      // Find the first equals sign (cookies might have = in the value)
      const firstEquals = cookiePair.indexOf('=');
      if (firstEquals <= 0) continue; // Skip invalid cookies
      
      const cookieName = decodeURIComponent(cookiePair.substring(0, firstEquals).trim());
      const cookieValue = decodeURIComponent(cookiePair.substring(firstEquals + 1).trim());
      
      if (cookieName && cookieValue) {
        cookies[cookieName] = cookieValue;
      }
    }
  } catch (error) {
    console.error('Error parsing cookies:', error);
  }
  
  return cookies;
}

/**
 * Register a client as active
 * @param clientId - Unique identifier for the client
 * @param type - The type of client (earner, buyer, visitor)
 */
export function registerClient(clientId: string, type: 'earner' | 'buyer' | 'visitor') {
  // Check if client already exists
  const existingClient = activeClients.get(clientId);
  const isNewClient = !existingClient;
  const typeChanged = existingClient && existingClient.type !== type;
  
  // Update the client record
  activeClients.set(clientId, {
    lastSeen: Date.now(),
    type
  });
  
  // Update store.activeUsers to keep stats in sync
  updateActiveUserCounts();
  
  // Log client activity for easier debugging - sanitize the client ID by only showing prefix
  const clientPrefix = clientId.substring(0, 8);
  if (isNewClient) {
    console.log(`New client registered: ${clientPrefix}... as ${type}`);
  } else if (typeChanged) {
    console.log(`Client ${clientPrefix}... changed type from ${existingClient.type} to ${type}`);
  }
}

/**
 * Update client's last activity time
 * @param clientId - Unique identifier for the client
 */
export function updateClientActivity(clientId: string) {
  const client = activeClients.get(clientId);
  if (client) {
    client.lastSeen = Date.now();
    activeClients.set(clientId, client);
  }
}

/**
 * Change client type
 * @param clientId - Unique identifier for the client
 * @param type - New client type
 */
export function updateClientType(clientId: string, type: 'earner' | 'buyer' | 'visitor') {
  const client = activeClients.get(clientId);
  if (client) {
    const oldType = client.type;
    
    // Only update if the type is different
    if (oldType !== type) {
      client.type = type;
      client.lastSeen = Date.now();
      activeClients.set(clientId, client);
      
      // Log type change for easier debugging
      console.log(`Client ${clientId.substring(0, 8)}... changed type from ${oldType} to ${type}`);
      
      // Update store.activeUsers to keep stats in sync
      updateActiveUserCounts();
      
      // If becoming an earner or leaving earner status, log it more prominently
      if (type === 'earner' || oldType === 'earner') {
        const counts = getActiveClientCounts();
        console.log(`[EARNER COUNT UPDATED] Now ${counts.earners} active earners`);
        
        // Force an immediate stats update in the main store
        if (store) {
          store.activeUsers = counts;
        }
      }
    } else {
      // Just update the last seen timestamp
      client.lastSeen = Date.now();
      activeClients.set(clientId, client);
    }
  }
}

/**
 * Remove client from active clients
 * @param clientId - Unique identifier for the client
 */
export function removeClient(clientId: string) {
  activeClients.delete(clientId);
  // Update store.activeUsers to keep stats in sync
  updateActiveUserCounts();
}

/**
 * Clean up expired clients in batches to avoid blocking
 * @param batchSize - Maximum number of clients to process in one batch
 * @returns Number of clients removed
 */
export function cleanupExpiredClients(batchSize: number = 50): number {
  const now = Date.now();
  let removedCount = 0;
  let processedCount = 0;
  
  // Get all client IDs first
  const clientIds = Array.from(activeClients.keys());
  
  // Process clients in batches to avoid long-running synchronous operations
  for (const clientId of clientIds) {
    // Check if we've processed enough for this batch
    if (processedCount >= batchSize) {
      break;
    }
    
    processedCount++;
    
    // Check if client is expired
    const client = activeClients.get(clientId);
    if (client && now - client.lastSeen > CLIENT_TTL) {
      activeClients.delete(clientId);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`Removed ${removedCount} expired clients`);
    // Update active user counts after removing clients
    updateActiveUserCounts();
  }
  
  return removedCount;
}

/**
 * Get count of active clients by type
 */
export function getActiveClientCounts() {
  let earners = 0;
  let buyers = 0;
  let visitors = 0;
  
  activeClients.forEach(client => {
    switch (client.type) {
      case 'earner':
        earners++;
        break;
      case 'buyer':
        buyers++;
        break;
      case 'visitor':
        visitors++;
        break;
    }
  });
  
  return {
    earners,
    buyers,
    visitors,
    total: activeClients.size
  };
}

/**
 * Update store.activeUsers with the latest counts
 */
function updateActiveUserCounts() {
  if (store && store.activeUsers) {
    const counts = getActiveClientCounts();
    store.activeUsers = counts;
  }
}

/**
 * Calculate platform statistics including active users
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
  
  // Get active user counts directly
  const { earners, buyers, visitors, total } = getActiveClientCounts();
  
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

// Single cleanup interval for the entire system
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start automatic cleanup of inactive clients
 * Should be called once at server startup
 */
export function startCleanupInterval() {
  if (!cleanupInterval) {
    console.log('Starting client tracking cleanup interval');
    // Run cleanup every 5 minutes
    cleanupInterval = setInterval(() => {
      cleanupExpiredClients();
    }, 5 * 60 * 1000);
  }
}