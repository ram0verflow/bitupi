/**
 * Client tracker utility to keep track of active users
 */

// Track active users with a Map of client IDs to last activity timestamps
const activeClients = new Map<string, {
  lastSeen: number;
  type: 'earner' | 'buyer' | 'visitor';
}>();

// TTL for client activity in milliseconds (15 minutes)
const CLIENT_TTL = 15 * 60 * 1000;

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
  
  // Update the client record - don't track browser info anymore
  activeClients.set(clientId, {
    lastSeen: Date.now(),
    type
  });
  
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
      
      // If becoming an earner or leaving earner status, log it more prominently
      if (type === 'earner' || oldType === 'earner') {
        const counts = getActiveClientCounts();
        console.log(`[EARNER COUNT UPDATED] Now ${counts.earners} active earners`);
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
      // Schedule the rest for next cycle
      console.log(`Processed ${processedCount} clients, continuing in next cleanup cycle`);
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

// Browser info extraction function removed to enhance privacy

// Set up periodic cleanup
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
      const removedCount = cleanupExpiredClients();
      if (removedCount > 0) {
        console.log(`Cleaned up ${removedCount} inactive clients`);
      }
    }, 5 * 60 * 1000);
  }
}

/**
 * Stop the cleanup interval (useful for graceful shutdown)
 */
export function stopCleanupInterval() {
  if (cleanupInterval) {
    console.log('Stopping client tracking cleanup interval');
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}