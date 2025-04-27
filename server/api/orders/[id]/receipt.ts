import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { store, broadcastToSSEClients, broadcastToOrderClients } from '../../../index'

// Constants for image validation
const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Validate receipt image
 * @param base64Image - Base64 encoded image
 * @returns Validation result
 */
function validateReceiptImage(base64Image: string): { valid: boolean; message?: string } {
  // Check if image data is in base64 format
  if (!base64Image.includes('base64,')) {
    return {
      valid: false,
      message: 'Invalid image format. Must be base64 encoded'
    };
  }
  
  // Extract MIME type and base64 data
  const matches = base64Image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return {
      valid: false,
      message: 'Invalid image format'
    };
  }
  
  // Check MIME type
  const mimeType = matches[1];
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      message: `Invalid image type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    };
  }
  
  // Check file size
  const base64Data = matches[2];
  const sizeInBytes = Buffer.from(base64Data, 'base64').length;
  if (sizeInBytes > MAX_RECEIPT_SIZE_BYTES) {
    return {
      valid: false,
      message: `Image too large. Maximum size is ${MAX_RECEIPT_SIZE_BYTES / (1024 * 1024)}MB`
    };
  }
  
  return { valid: true };
}

/**
 * Validate Lightning Address format
 * @param address - Lightning address to validate
 * @returns Validation result
 */
function validateLightningAddress(address: string): { valid: boolean; message?: string } {
  // Basic validation for Lightning addresses (user@domain.com) format
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(address)) {
    return { valid: true };
  }
  
  // Check if it's a Lightning Invoice (BOLT11 format - starts with ln)
  if (address.toLowerCase().startsWith('ln')) {
    return { valid: true };
  }
  
  // Check if it's an LNURL (starts with LNURL or lnurl)
  if (address.toLowerCase().startsWith('lnurl')) {
    return { valid: true };
  }
  
  return {
    valid: false,
    message: 'Invalid Lightning address format. Must be a valid Lightning Address, LNURL, or Lightning Invoice'
  };
}

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!orderId) {
    throw createError({
      statusCode: 400,
      message: 'Order ID is required'
    })
  }
  
  if (!body.receiptImage) {
    throw createError({
      statusCode: 400,
      message: 'Receipt image is required'
    })
  }
  
  // Validate receipt image
  const receiptValidation = validateReceiptImage(body.receiptImage);
  if (!receiptValidation.valid) {
    throw createError({
      statusCode: 400,
      message: receiptValidation.message || 'Invalid receipt image'
    });
  }
  
  if (!body.lightningAddress) {
    throw createError({
      statusCode: 400,
      message: 'Lightning address is required'
    })
  }
  
  // Validate Lightning address format
  const lightningValidation = validateLightningAddress(body.lightningAddress);
  if (!lightningValidation.valid) {
    throw createError({
      statusCode: 400,
      message: lightningValidation.message || 'Invalid Lightning address'
    });
  }
  
  // Get the order
  const order = store.orders.get(orderId)
  
  if (!order) {
    throw createError({
      statusCode: 404,
      message: 'Order not found'
    })
  }
  
  // Check if order is in processing status
  if (order.status !== 'processing') {
    throw createError({
      statusCode: 400,
      message: 'Receipt can only be submitted for orders in processing status'
    })
  }
  
  // Verify earner's auth key
  if (!body.earnerKey) {
    throw createError({
      statusCode: 401,
      message: 'Earner authentication key is required'
    });
  }
  
  // Check if the earner key matches the one associated with this order
  if (!order.earner?.authKey || order.earner.authKey !== body.earnerKey) {
    throw createError({
      statusCode: 401,
      message: 'Invalid earner authentication key'
    });
  }
  
  // Update order with receipt info
  order.receipt = {
    image: body.receiptImage,
    uploadedAt: new Date().toISOString()
  }
  
  // Update earner info (preserve the auth key)
  order.earner = {
    ...order.earner,
    lightningAddress: body.lightningAddress
  }
  
  // Update status to verifying
  order.status = 'verifying'
  
  // Store updated order
  store.orders.set(orderId, order)
  
  // Notify specific order clients
  broadcastToOrderClients(orderId, {
    id: orderId,
    status: 'verifying',
    updatedAt: new Date().toISOString()
  })
  
  // Notify all orders clients about status change
  broadcastToSSEClients('orders', {
    action: 'update',
    order: {
      ...order,
      updatedAt: new Date().toISOString()
    }
  })
  
  // TODO: In a production implementation, this is where you would trigger
  // a notification to the buyer to review and approve the receipt
  // For development/testing, we can use a timeout to simulate buyer approval
  if (process.env.NODE_ENV === 'development') {
    // For development only - auto-complete after 10 seconds
    console.log(`DEV MODE: Auto-completing order ${orderId} in 10 seconds`);
    setTimeout(() => {
      completeOrder(orderId);
    }, 10000);
  }
  
  return {
    success: true,
    orderId,
    status: 'verifying'
  }
})

// Helper function to auto-complete orders and process payment
async function completeOrder(orderId: string) {
  const order = store.orders.get(orderId)
  
  if (order && order.status === 'verifying') {
    try {
      // Process the payment to the earner if we have a lightning address
      if (order.earner?.lightningAddress) {
        // Calculate earner's reward (1% of the order's sat amount)
        const exchangeFeePercent = 0.02; // 2%
        const earnerSharePercent = 0.5; // 50% of the fee
        const reward = Math.ceil(order.satAmount * exchangeFeePercent * earnerSharePercent);
        
        // Based on the type of lightning address/invoice
        const address = order.earner.lightningAddress;
        
        // Handle Lightning Address or LNURL
        if (address.includes('@') || address.toLowerCase().startsWith('lnurl')) {
          const { createWithdrawLink } = await import('../../../lightning-payment');
          await createWithdrawLink(
            reward, 
            `BitUPI Payment for order ${orderId.substring(0, 8)}`, 
            Math.max(1, Math.floor(reward * 0.01))
          );
          console.log(`Created withdrawal link of ${reward} sats for ${address}`);
        } 
        // Handle Lightning Invoice
        else if (address.toLowerCase().startsWith('ln')) {
          const { processInternalPayment } = await import('../../../utils/internal-payment');
          await processInternalPayment(address, `Payment for order ${orderId}`);
          console.log(`Paid invoice directly for ${reward} sats`);
        }
      } else {
        console.warn(`Order ${orderId} completed but no lightning address available for payment`);
      }
    } catch (error) {
      console.error(`Error processing payment for order ${orderId}:`, error);
      // Continue with order completion even if payment fails
    }
    
    // Update status to completed
    order.status = 'completed'
    
    // Store updated order
    store.orders.set(orderId, order)
    
    // Notify specific order clients
    broadcastToOrderClients(orderId, {
      id: orderId,
      status: 'completed',
      updatedAt: new Date().toISOString()
    })
    
    // Notify all orders clients about status change
    broadcastToSSEClients('orders', {
      action: 'update',
      order: {
        ...order,
        updatedAt: new Date().toISOString()
      }
    })
    
    console.log(`Completed order ${orderId}`)
  }
}