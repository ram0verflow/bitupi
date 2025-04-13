import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getRedisClient, getSubscriberClient } from '../utils/redis';

// Socket server instance
let io: Server | null = null;

// Socket.io event channels
export const CHANNELS = {
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_COMPLETED: 'order:completed',
  ORDER_EXPIRED: 'order:expired',
  PAYMENT_RECEIVED: 'payment:received',
  EXCHANGE_RATE_UPDATED: 'exchange:updated'
};

// Initialize the Socket.io server
export function initSocketServer(httpServer: any) {
  if (io !== null) {
    return io;
  }
  
  const pubClient = getRedisClient();
  const subClient = getSubscriberClient();
  
  // Create the Socket.io server
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? 'https://ln2upi.com' 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Configure Socket.io
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
    // For security
    maxHttpBufferSize: 1e6, // 1MB
  });
  
  // Setup Redis adapter for horizontal scaling
  io.adapter(createAdapter(pubClient, subClient));
  
  // Connection handler
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Join the order room when a client requests it
    socket.on('join:order', (orderId) => {
      if (typeof orderId === 'string' && orderId.match(/^[a-zA-Z0-9-]+$/)) {
        console.log(`Client ${socket.id} joined order room: ${orderId}`);
        socket.join(`order:${orderId}`);
      }
    });
    
    // Leave order room
    socket.on('leave:order', (orderId) => {
      if (typeof orderId === 'string') {
        console.log(`Client ${socket.id} left order room: ${orderId}`);
        socket.leave(`order:${orderId}`);
      }
    });
    
    // Join exchange rate updates room
    socket.on('join:exchange', () => {
      console.log(`Client ${socket.id} subscribed to exchange rate updates`);
      socket.join('exchange:rates');
    });
    
    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
  
  console.log('Socket.io server initialized');
  
  return io;
}

// Get the Socket.io server instance
export function getSocketServer() {
  if (io === null) {
    throw new Error('Socket.io server not initialized');
  }
  return io;
}

// Broadcast to specific order room
export function notifyOrderUpdate(orderId: string, eventType: string, data: any) {
  if (io === null) {
    console.warn('Socket.io server not initialized, skipping broadcast');
    return;
  }
  
  // Broadcast to the specific order room
  io.to(`order:${orderId}`).emit(eventType, data);
}

// Broadcast exchange rate updates
export function broadcastExchangeRate(rateData: any) {
  if (io === null) {
    console.warn('Socket.io server not initialized, skipping broadcast');
    return;
  }
  
  // Broadcast to all clients interested in exchange rates
  io.to('exchange:rates').emit(CHANNELS.EXCHANGE_RATE_UPDATED, rateData);
}