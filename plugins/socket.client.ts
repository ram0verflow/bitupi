import { defineNuxtPlugin } from '#app'

/**
 * Plugin to manage SSE connections for real-time updates
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Define EventSource map type
  type SSEConnectionMap = Map<string, EventSource>
  
  // Store SSE connections
  const sseConnections: SSEConnectionMap = new Map()
  
  // Connect to exchange rate updates
  const setupExchangeRateSSE = () => {
    if (process.server) return null
    
    try {
      // Close any existing connection
      if (sseConnections.has('exchange-rate')) {
        sseConnections.get('exchange-rate').close()
      }
      
      const eventSource = new EventSource('/api/sse/exchange-rate')
      
      eventSource.onopen = () => {
        console.log('Exchange rate SSE connected')
      }
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // Track the real-time rate source
          if (data.source) {
            console.log(`Exchange rate updated from ${data.source}`)
          }
          nuxtApp.hook('sse:exchange-rate', data)
        } catch (error) {
          console.error('Error parsing exchange rate SSE data:', error)
        }
      }
      
      // Implement exponential backoff for reconnection
      let reconnectAttempt = 0;
      const maxReconnectAttempts = 10;
      
      eventSource.onerror = (error) => {
        console.error('Exchange rate SSE error:', error);
        
        // Stop if we've reached max attempts
        if (reconnectAttempt >= maxReconnectAttempts) {
          console.error(`Giving up after ${maxReconnectAttempts} reconnection attempts`);
          return;
        }
        
        // Calculate exponential backoff time with jitter
        const baseDelay = 1000; // 1 second
        const maxDelay = 30000; // 30 seconds
        const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, reconnectAttempt));
        const jitter = Math.random() * 0.5 + 0.5; // 0.5-1.5 multiplier
        const delay = Math.floor(exponentialDelay * jitter);
        
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1}/${maxReconnectAttempts})`);
        
        // Try to reconnect after calculated delay
        setTimeout(() => {
          if (sseConnections.has('exchange-rate')) {
            reconnectAttempt++;
            setupExchangeRateSSE();
          }
        }, delay);
      }
      
      sseConnections.set('exchange-rate', eventSource)
      return eventSource
    } catch (error) {
      console.error('Failed to set up exchange rate SSE:', error)
      return null
    }
  }
  
  // Connect to stats updates
  const setupStatsSSE = () => {
    if (process.server) return null
    
    try {
      // Close any existing connection
      if (sseConnections.has('stats')) {
        sseConnections.get('stats').close()
      }
      
      const eventSource = new EventSource('/api/sse/stats')
      
      eventSource.onopen = () => {
        console.log('Stats SSE connected')
      }
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          nuxtApp.hook('sse:stats', data)
        } catch (error) {
          console.error('Error parsing stats SSE data:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('Stats SSE error:', error)
        // Try to reconnect after a delay
        setTimeout(() => {
          if (sseConnections.has('stats')) {
            setupStatsSSE()
          }
        }, 3000)
      }
      
      sseConnections.set('stats', eventSource)
      return eventSource
    } catch (error) {
      console.error('Failed to set up stats SSE:', error)
      return null
    }
  }
  
  // Connect to orders updates
  const setupOrdersSSE = () => {
    if (process.server) return null
    
    try {
      // Close any existing connection
      if (sseConnections.has('orders')) {
        sseConnections.get('orders').close()
      }
      
      const eventSource = new EventSource('/api/sse/orders')
      
      eventSource.onopen = () => {
        console.log('Orders SSE connected')
      }
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          nuxtApp.hook('sse:orders', data)
        } catch (error) {
          console.error('Error parsing orders SSE data:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('Orders SSE error:', error)
        // Try to reconnect after a delay
        setTimeout(() => {
          if (sseConnections.has('orders')) {
            setupOrdersSSE()
          }
        }, 3000)
      }
      
      sseConnections.set('orders', eventSource)
      return eventSource
    } catch (error) {
      console.error('Failed to set up orders SSE:', error)
      return null
    }
  }
  
  // Connect to specific order updates
  const joinOrder = (orderId: string) => {
    if (process.server || !orderId) return null
    
    try {
      const connectionKey = `order:${orderId}`
      
      // Close any existing connection for this order
      if (sseConnections.has(connectionKey)) {
        sseConnections.get(connectionKey).close()
      }
      
      const eventSource = new EventSource(`/api/sse/order/${orderId}`)
      
      eventSource.onopen = () => {
        console.log(`Order ${orderId} SSE connected`)
      }
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // Fire both a specific event for this order and a generic order update event
          nuxtApp.hook(`sse:order:${orderId}`, data)
          nuxtApp.hook('sse:order-update', { ...data, orderId })
        } catch (error) {
          console.error(`Error parsing order ${orderId} SSE data:`, error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error(`Order ${orderId} SSE error:`, error)
        // Try to reconnect after a delay
        setTimeout(() => {
          if (sseConnections.has(connectionKey)) {
            joinOrder(orderId)
          }
        }, 3000)
      }
      
      sseConnections.set(connectionKey, eventSource)
      return eventSource
    } catch (error) {
      console.error(`Failed to set up order ${orderId} SSE:`, error)
      return null
    }
  }
  
  // Disconnect from specific order updates
  const leaveOrder = (orderId: string) => {
    if (!orderId) return
    
    const connectionKey = `order:${orderId}`
    if (sseConnections.has(connectionKey)) {
      sseConnections.get(connectionKey).close()
      sseConnections.delete(connectionKey)
    }
  }
  
  // Define callback type
  type EventCallback = (data: unknown) => void;
  
  // Register event listener
  const on = (event: string, callback: EventCallback): void => {
    nuxtApp.hook(`sse:${event}`, callback);
  }
  
  // Remove event listener
  const off = (event: string, callback?: EventCallback): void => {
    if (callback) {
      // Remove specific callback
      const hookName = `sse:${event}`;
      if (nuxtApp.hooks[hookName]) {
        nuxtApp.hooks[hookName] = nuxtApp.hooks[hookName].filter(hook => hook !== callback);
      }
    } else {
      // Remove all callbacks for this event
      delete nuxtApp.hooks[`sse:${event}`];
    }
  }
  
  // Close all connections
  const disconnect = () => {
    sseConnections.forEach(connection => {
      connection.close()
    })
    sseConnections.clear()
  }
  
  // Check if any connections are active
  const isConnected = () => {
    return sseConnections.size > 0
  }
  
  // Initialize connections on app mount
  if (process.client) {
    nuxtApp.hook('app:mounted', () => {
      setupExchangeRateSSE()
      setupStatsSSE()
    })
    
    // Clean up connections on app unmount
    nuxtApp.hook('app:beforeUnmount', () => {
      disconnect()
    })
  }
  
  // Create reactive stats object - use a plain object for simplicity
  // We'll avoid functions or complex objects that might cause serialization issues
  const stats = {
    activeEarners: 0,
    activeBuyers: 0,
    activeVisitors: 0,
    activeUsers: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    failedOrders: 0,
    totalOrders: 0
  }
  
  // Define stats data type
  interface StatsData {
    activeEarners?: number;
    activeBuyers?: number;
    activeVisitors?: number;
    activeUsers?: number;
    pendingOrders?: number;
    processingOrders?: number;
    completedOrders?: number;
    failedOrders?: number;
    totalOrders?: number;
    [key: string]: any; // Allow other properties but we only use the ones we define
  }
  
  // Create a simple update function to handle stats updates
  function updateStats(data: StatsData): void {
    if (!data) return;
    
    // Only update properties that exist in our stats object
    if (typeof data.activeEarners === 'number') stats.activeEarners = data.activeEarners;
    if (typeof data.activeBuyers === 'number') stats.activeBuyers = data.activeBuyers;
    if (typeof data.activeVisitors === 'number') stats.activeVisitors = data.activeVisitors;
    if (typeof data.activeUsers === 'number') stats.activeUsers = data.activeUsers;
    if (typeof data.pendingOrders === 'number') stats.pendingOrders = data.pendingOrders;
    if (typeof data.processingOrders === 'number') stats.processingOrders = data.processingOrders;
    if (typeof data.completedOrders === 'number') stats.completedOrders = data.completedOrders;
    if (typeof data.failedOrders === 'number') stats.failedOrders = data.failedOrders;
    if (typeof data.totalOrders === 'number') stats.totalOrders = data.totalOrders;
  }
  
  // Listen for stats updates (make sure to only pass serializable data)
  nuxtApp.hook('sse:stats', (data: unknown) => {
    if (!data || typeof data !== 'object') return;
    
    // Make a safe copy with only primitive values
    const safeData: StatsData = {};
    
    // Handle both formats:
    // 1. Direct stats object
    // 2. Nested { success, stats } object
    const statsObject = 'stats' in (data as any) ? (data as any).stats : data;
    
    // Only include serializable properties
    if (statsObject && typeof statsObject === 'object') {
      Object.entries(statsObject as Record<string, unknown>).forEach(([key, value]) => {
        // Only include primitive values (string, number, boolean, null)
        if (value === null || 
            typeof value === 'string' || 
            typeof value === 'number' || 
            typeof value === 'boolean') {
          safeData[key] = value;
        }
      });
    }
    
    // Update stats with the safe data
    updateStats(safeData);
    
    // Also emit the stats event with the safe data
    nuxtApp.hook('sse:stats-updated', safeData);
  })
  
  // Provide functions to components
  return {
    provide: {
      socket: {
        // Keep socket naming for backward compatibility
        joinOrder,
        leaveOrder,
        subscribeToExchangeRates: setupExchangeRateSSE,
        subscribeToStats: setupStatsSSE,
        subscribeToOrders: setupOrdersSSE,
        on,
        off,
        isConnected,
        getTransport: () => 'sse',
        stats // Export the stats object directly
      }
    }
  }
})