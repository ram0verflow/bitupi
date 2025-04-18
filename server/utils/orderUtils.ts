import { Order } from '../index';

/**
 * Sanitizes an order object to remove sensitive information
 * Used before broadcasting order data to clients
 * 
 * @param order The order to sanitize
 * @param isOwner Whether the recipient is the owner of the order
 * @returns A sanitized copy of the order
 */
export function sanitizeOrder(order: Order, isOwner: boolean = false): Partial<Order> {
  // Create a copy to avoid modifying the original
  const sanitized: Partial<Order> = {
    id: order.id,
    inrAmount: order.inrAmount,
    satAmount: order.satAmount,
    status: order.status,
    createdAt: order.createdAt,
    expiresAt: order.expiresAt
  };

  // Include UPI information - this is already public in the marketplace
  if (order.upiId) {
    sanitized.upiId = order.upiId;
  }
  
  if (order.upiName) {
    sanitized.upiName = order.upiName;
  }
  
  // Only include certain fields if the recipient is the owner
  if (isOwner) {
    if (order.lightning) {
      sanitized.lightning = {
        paid: order.lightning.paid,
        // Only include invoice if needed (e.g., for the buyer)
        invoice: order.lightning.invoice
      };
    }
    
    // Include receipt information for verification purposes
    if (order.receipt) {
      sanitized.receipt = {
        image: order.receipt.image,
        uploadedAt: order.receipt.uploadedAt
      };
    }
  }
  
  // Always exclude security keys, authentication tokens, and other sensitive data
  // These fields are omitted by default since we're creating a new object
  
  return sanitized;
}

/**
 * Sanitizes a list of orders for public display in the marketplace 
 * 
 * @param orders Array of orders to sanitize
 * @returns Array of sanitized orders
 */
export function sanitizeOrdersList(orders: Order[]): Partial<Order>[] {
  return orders.map(order => sanitizeOrder(order, false));
}