import { defineEventHandler, getRequestHeader } from 'h3';
import { registerClient, updateClientActivity } from '../utils/clientTracker';
import crypto from 'crypto';

// Cookie name for client tracking - use a session-only cookie instead of long-lived
const CLIENT_ID_COOKIE = 'bitupi_session_id';

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
    // Make it a session cookie only (no Max-Age or Expires)
    // This way it's deleted when the browser is closed
    const isSecure = process.env.NODE_ENV === 'production';
    event.node.res.setHeader('Set-Cookie', 
      `${CLIENT_ID_COOKIE}=${clientId}; Path=/; HttpOnly; SameSite=Strict${isSecure ? '; Secure' : ''}`);
  }
  
  // Determine client type based on URL path
  const url = event.node.req.url || '';
  let clientType: 'earner' | 'buyer' | 'visitor' = 'visitor';
  
  if (url.includes('/receive')) {
    clientType = 'earner';
  } else if (url.includes('/send')) {
    clientType = 'buyer';
  }
  
  // Register or update client - don't store user agent info anymore
  if (isNewClient) {
    registerClient(clientId, clientType);
  } else {
    updateClientActivity(clientId);
  }
  
  // Add client ID to request context for use in handlers
  event.context.clientId = clientId;
  event.context.clientType = clientType;
});

// Helper function to parse cookies
// This is a simplified version - in production, consider using a well-tested library like cookie-parser
function parseCookies(cookieHeader: string): Record<string, string> {
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
    // Return empty cookies object on error instead of failing
  }
  
  return cookies;
}

// Generate a unique client ID
function generateClientId() {
  return `client_${crypto.randomBytes(16).toString('hex')}`;
}