import { io, Socket } from 'socket.io-client';
import { defineNuxtPlugin, useRuntimeConfig } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  // Socket instance with fallback mechanisms
  let socket: Socket | null = null;
  let sseConnections = new Map();
  let isUsingSSE = false;
  let connectionAttempts = 0;
  const MAX_WEBSOCKET_ATTEMPTS = 3;
  const config = useRuntimeConfig();
  
  // Connect to WebSocket server with fallback strategy
  const connect = () => {
    if (socket && socket.connected) return socket;
    
    // Get base URL from runtime config
    const baseUrl = config.public.wsUrl || 'http://localhost:3000';
    
    // If we've tried WebSockets too many times, use long polling
    if (connectionAttempts >= MAX_WEBSOCKET_ATTEMPTS) {
      console.log('Switching to long polling transport only');
      
      // Connect using only long polling
      socket = io(baseUrl, {
        transports: ['polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000, 
        reconnectionDelayMax: 10000,
        timeout: 30000,
        forceNew: true,
        extraHeaders: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
    } else {
      // Try WebSocket first, with polling as fallback
      socket = io(baseUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true
      });
      
      connectionAttempts++;
    }
    
    // Setup enhanced error handling
    socket.on('connect', () => {
      console.log('Socket connected successfully:', socket?.id);
      connectionAttempts = 0; // Reset counter on successful connection
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      // If server disconnected us, try to reconnect
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          socket?.connect();
        }, 5000);
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (connectionAttempts >= MAX_WEBSOCKET_ATTEMPTS && !isUsingSSE) {
        console.log('WebSocket connection failed, trying SSE fallback');
        setupSSEFallback();
      }
    });
    
    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);
    });
    
    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      if (!isUsingSSE) {
        setupSSEFallback();
      }
    });
    
    socket.io.on("error", (error) => {
      console.error('Socket.io manager error:', error);
    });
    
    socket.io.on("reconnect_error", (error) => {
      console.error('Socket.io reconnect error:', error);
    });
    
    return socket;
  };
  
  // SSE fallback for critical updates when socket fails
  const setupSSEFallback = () => {
    isUsingSSE = true;
    console.log('Setting up SSE fallback');
    
    // Set up SSE for order updates
    const config = useRuntimeConfig();
    const baseUrl = config.public.apiBaseUrl || 'http://localhost:3000';
    
    // For exchange rate updates
    const exchangeSource = new EventSource(`${baseUrl}/api/sse/exchange-rate`);
    exchangeSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        nuxtApp.hook('socket:exchange-update', data);
      } catch (e) {
        console.error('Error parsing SSE exchange rate data', e);
      }
    };
    
    exchangeSource.onerror = (error) => {
      console.error('SSE exchange rate error', error);
      exchangeSource.close();
      
      // Try to reconnect SSE after delay
      setTimeout(() => {
        setupSSEFallback();
      }, 5000);
    };
    
    sseConnections.set('exchange', exchangeSource);
  };
  
  // Clean up SSE connections
  const cleanupSSE = () => {
    if (isUsingSSE) {
      sseConnections.forEach((source) => {
        source.close();
      });
      sseConnections.clear();
      isUsingSSE = false;
    }
  };
  
  // Join an order room with Redis persistence
  const joinOrder = (orderId: string) => {
    if (!socket || !socket.connected) connect();
    
    if (socket && socket.connected) {
      socket.emit('join:order', orderId);
      console.log(`Joined order room: ${orderId}`);
      
      // Set up order-specific SSE fallback
      if (isUsingSSE && !sseConnections.has(`order:${orderId}`)) {
        const config = useRuntimeConfig();
        const baseUrl = config.public.apiBaseUrl || 'http://localhost:3000';
        const orderSource = new EventSource(`${baseUrl}/api/sse/order/${orderId}`);
        
        orderSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            nuxtApp.hook(`socket:order-update:${orderId}`, data);
          } catch (e) {
            console.error(`Error parsing SSE order data for ${orderId}`, e);
          }
        };
        
        sseConnections.set(`order:${orderId}`, orderSource);
      }
    } else {
      console.error('Cannot join order room, socket not connected');
    }
  };
  
  // Leave an order room
  const leaveOrder = (orderId: string) => {
    if (socket && socket.connected) {
      socket.emit('leave:order', orderId);
      console.log(`Left order room: ${orderId}`);
    }
    
    // Close SSE connection if exists
    if (sseConnections.has(`order:${orderId}`)) {
      sseConnections.get(`order:${orderId}`).close();
      sseConnections.delete(`order:${orderId}`);
    }
  };
  
  // Subscribe to exchange rate updates
  const subscribeToExchangeRates = () => {
    if (!socket || !socket.connected) connect();
    
    if (socket && socket.connected) {
      socket.emit('join:exchange');
      console.log('Subscribed to exchange rate updates');
    } else {
      console.error('Cannot subscribe to exchange rates, socket not connected');
      if (!isUsingSSE) {
        setupSSEFallback();
      }
    }
  };
  
  // Subscribe to platform stats
  const subscribeToStats = () => {
    if (!socket || !socket.connected) connect();
    
    if (socket && socket.connected) {
      socket.emit('join:stats');
      console.log('Subscribed to platform stats');
    } else {
      console.error('Cannot subscribe to stats, socket not connected');
    }
  };
  
  // Listen for specific events with hook integration
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (!socket || !socket.connected) connect();
    
    if (socket && socket.connected) {
      socket.on(event, callback);
      
      // Also register a hook so SSE can trigger the same callback
      nuxtApp.hook(`socket:${event}`, callback);
    } else {
      console.error(`Cannot listen for event ${event}, socket not connected`);
      // Only register the hook for SSE
      nuxtApp.hook(`socket:${event}`, callback);
    }
  };
  
  // Remove event listener
  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
    
    // Remove hook if possible
    if (callback) {
      nuxtApp.hooks[`socket:${event}`] = 
        nuxtApp.hooks[`socket:${event}`]?.filter(h => h !== callback) || [];
    } else {
      delete nuxtApp.hooks[`socket:${event}`];
    }
  };
  
  // Disconnect socket and clean up SSE
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    
    cleanupSSE();
    connectionAttempts = 0;
  };
  
  // Check connection state
  const isConnected = () => {
    return (socket && socket.connected) || isUsingSSE;
  };
  
  // Get current transport
  const getTransport = () => {
    if (isUsingSSE) return 'sse';
    if (!socket) return 'none';
    return socket.io.engine.transport.name;
  };
  
  // Heartbeat to detect zombie connections
  let heartbeatInterval: any = null;
  
  const startHeartbeat = () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    
    heartbeatInterval = setInterval(() => {
      if (socket && socket.connected) {
        socket.emit('heartbeat', Date.now());
      } else if (!isUsingSSE) {
        console.log('Heartbeat detected disconnected socket, reconnecting...');
        connect();
      }
    }, 30000); // 30 second heartbeat
  };
  
  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };
  
  // Auto-connect when app starts
  if (process.client) {
    // Only run on client-side
    nuxtApp.hook('app:mounted', () => {
      connect();
      startHeartbeat();
    });
    
    // Disconnect when page is closed
    nuxtApp.hook('app:beforeUnmount', () => {
      stopHeartbeat();
      disconnect();
    });
  }
  
  // Export socket functions
  return {
    provide: {
      socket: {
        connect,
        disconnect,
        joinOrder,
        leaveOrder,
        subscribeToExchangeRates,
        subscribeToStats,
        on,
        off,
        isConnected,
        getTransport,
      }
    }
  };
});