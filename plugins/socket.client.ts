import { io, Socket } from 'socket.io-client';
import { defineNuxtPlugin } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  // Socket instance
  let socket: Socket | null = null;
  
  // Connect to WebSocket server
  const connect = () => {
    if (socket) return socket;
    
    // Get base URL, default to localhost in development
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://ln2upi.com'
      : 'http://localhost:3000';
    
    // Connect to socket server
    socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    
    // Setup event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);
    });
    
    return socket;
  };
  
  // Join an order room
  const joinOrder = (orderId: string) => {
    if (!socket) connect();
    if (socket) {
      socket.emit('join:order', orderId);
      console.log(`Joined order room: ${orderId}`);
    }
  };
  
  // Leave an order room
  const leaveOrder = (orderId: string) => {
    if (socket) {
      socket.emit('leave:order', orderId);
      console.log(`Left order room: ${orderId}`);
    }
  };
  
  // Subscribe to exchange rate updates
  const subscribeToExchangeRates = () => {
    if (!socket) connect();
    if (socket) {
      socket.emit('join:exchange');
      console.log('Subscribed to exchange rate updates');
    }
  };
  
  // Listen for specific events
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (!socket) connect();
    if (socket) {
      socket.on(event, callback);
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
  };
  
  // Disconnect socket
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };
  
  // Auto-connect when app starts
  if (process.client) {
    // Only run on client-side
    nuxtApp.hook('app:mounted', () => {
      connect();
    });
    
    // Disconnect when page is closed
    nuxtApp.hook('app:beforeUnmount', () => {
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
        on,
        off,
      }
    }
  };
});