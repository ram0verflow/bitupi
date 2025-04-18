import { defineEventHandler, getRequestHeader } from 'h3';
import { 
  registerClient, 
  updateClientActivity, 
  parseCookies, 
  generateClientId, 
  CLIENT_ID_COOKIE 
} from '../utils/clientTracker';

export default defineEventHandler((event) => {
  // Get request cookies
  const cookies = parseCookies(getRequestHeader(event, 'cookie') || '');
  
  // Get or create client ID
  let clientId = cookies[CLIENT_ID_COOKIE];
  let isNewClient = false;
  
  if (!clientId) {
    // Generate new client ID
    clientId = generateClientId();
    isNewClient = true;
    
    // Set cookie for client ID with security flags
    // Set it to expire in 24 hours instead of a session cookie
    // This prevents new client IDs being created on page refresh
    const isSecure = process.env.NODE_ENV === 'production';
    const MAX_AGE = 24 * 60 * 60; // 24 hours in seconds
    event.node.res.setHeader('Set-Cookie', 
      `${CLIENT_ID_COOKIE}=${clientId}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Strict${isSecure ? '; Secure' : ''}`);
  }
  
  // Determine client type based on URL path
  const url = event.node.req.url || '';
  let clientType: 'earner' | 'buyer' | 'visitor' = 'visitor';
  
  if (url.includes('/receive')) {
    clientType = 'earner';
  } else if (url.includes('/send')) {
    clientType = 'buyer';
  }
  
  // Register or update client
  if (isNewClient) {
    registerClient(clientId, clientType);
  } else {
    updateClientActivity(clientId);
  }
  
  // Add client ID to request context for use in handlers
  event.context.clientId = clientId;
  event.context.clientType = clientType;
});