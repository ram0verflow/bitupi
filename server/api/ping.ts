import { defineEventHandler, getQuery } from 'h3';
import { updateClientActivity, updateClientType } from '../utils/clientTracker';

/**
 * Simple ping endpoint that also updates client activity and type
 */
export default defineEventHandler((event) => {
  // Get query parameters
  const query = getQuery(event);
  const { type } = query;
  
  // Get client ID from context (set by client-tracker middleware)
  const clientId = event.context.clientId;
  
  if (clientId) {
    // Update client activity
    updateClientActivity(clientId);
    
    // Update client type if provided
    if (type === 'earner' || type === 'buyer' || type === 'visitor') {
      updateClientType(clientId, type as 'earner' | 'buyer' | 'visitor');
    }
  }
  
  // Return simple pong response
  return {
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
    clientId // Return client ID for debugging
  };
});