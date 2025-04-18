import { defineEventHandler, getRequestHeader } from 'h3';
import { registerClient, updateClientActivity } from '../utils/clientTracker';
import crypto from 'crypto';

// Cookie name for client tracking
const CLIENT_ID_COOKIE = 'bitupi_client_id';

export default defineEventHandler((event) => {
  // Get request cookies
  const cookies = parseCookies(getRequestHeader(event, 'cookie') || '');
  const userAgent = getRequestHeader(event, 'user-agent') || '';
  
  // Get or create client ID
  let clientId = cookies[CLIENT_ID_COOKIE];
  let isNewClient = false;
  
  if (!clientId) {
    // Generate new client ID
    clientId = generateClientId();
    isNewClient = true;
    
    // Set cookie for client ID with security flags
    const isSecure = process.env.NODE_ENV === 'production';
    event.node.res.setHeader('Set-Cookie', 
      `${CLIENT_ID_COOKIE}=${clientId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Strict${isSecure ? '; Secure' : ''}`);
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
    registerClient(clientId, clientType, userAgent);
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