import { defineNuxtPlugin } from '#app'

/**
 * Plugin to manage SSE connections for real-time updates
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Store SSE connections
  const sseConnections = new Map()
  
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
          nuxtApp.hook('sse:exchange-rate', data)
        } catch (error) {
          console.error('Error parsing exchange rate SSE data:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('Exchange rate SSE error:', error)
        // Try to reconnect after a delay
        setTimeout(() => {
          if (sseConnections.has('exchange-rate')) {
            setupExchangeRateSSE()
          }
        }, 3000)
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
  
  // Register event listener
  const on = (event: string, callback: Function) => {
    nuxtApp.hook(`sse:${event}`, callback)
  }
  
  // Remove event listener
  const off = (event: string, callback?: Function) => {
    if (callback) {
      // Remove specific callback
      const hookName = `sse:${event}`
      if (nuxtApp.hooks[hookName]) {
        nuxtApp.hooks[hookName] = nuxtApp.hooks[hookName].filter(hook => hook !== callback)
      }
    } else {
      // Remove all callbacks for this event
      delete nuxtApp.hooks[`sse:${event}`]
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
        getTransport: () => 'sse'
      }
    }
  }
})