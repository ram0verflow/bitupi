import { defineEventHandler, readBody, getRouterParam, createError, getMethod } from 'h3';
import { store, broadcastToSSEClients, broadcastToOrderClients } from '../index';
import { sanitizeOrdersList } from '../utils/orderUtils';
import { generateSecurityKeys, generateRefundKey, generateTrackingToken } from '../utils/security';
import crypto from 'crypto';
import { generateInvoice, associatePaymentWithOrder, createWithdrawLink } from '../lightning-payment';
import { processInternalPayment } from '../utils/internal-payment';

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

// Generate a random order ID
function generateOrderId() {
  return 'order_' + crypto.randomBytes(8).toString('hex')
}

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
          await createWithdrawLink(
            reward,
            `BitUPI Payment for order ${orderId.substring(0, 8)}`,
            Math.max(1, Math.floor(reward * 0.01))
          );
          console.log(`Created withdrawal link of ${reward} sats for ${address}`);
        }
        // Handle Lightning Invoice
        else if (address.toLowerCase().startsWith('ln')) {
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
        updatedAt: new Date().toISOString(),
        securityKeys: undefined,
        refund: undefined
      }
    })

    console.log(`Completed order ${orderId}`)
  }
}

export default defineEventHandler(async (event) => {
  // Get HTTP method
  const method = readMethod(event);

  // Get order ID from URL if provided
  const orderId = getRouterParam(event, 'id');

  // Handle GET requests - List or Get Specific Order
  if (method === 'GET') {
    // GET /api/orders - List all orders
    if (!orderId) {
      // Only return pending orders with paid invoices (for marketplace)
      const activeOrders = Array.from(store.orders.values())
        .filter(order => order.status === 'pending' && order.lightning?.paid === true);

      // Sanitize orders (remove sensitive data)
      const sanitizedOrders = sanitizeOrdersList(activeOrders);

      return {
        success: true,
        orders: sanitizedOrders
      };
    }
    // GET /api/orders/:id - Get specific order
    else {
      const order = store.orders.get(orderId);

      if (!order) {
        throw createError({
          statusCode: 404,
          message: 'Order not found'
        });
      }

      // Return sanitized order
      return {
        success: true,
        order: {
          ...order,
          securityKeys: undefined,
          refund: undefined
        }
      };
    }
  }

  // Handle POST requests - Create Order, Claim, Submit Receipt, Approve, Refund
  if (method === 'POST') {
    const body = await readBody(event);
    const action = body.action || 'create';

    // POST /api/orders - Create new order
    if (action === 'create') {
      const { inrAmount, upiId, satAmount, upiName, refundWallet } = body;

      // Validate inputs
      if (!inrAmount || isNaN(parseFloat(inrAmount))) {
        throw createError({
          statusCode: 400,
          message: 'Valid INR amount required'
        });
      }

      if (!upiId || !/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+$/.test(upiId)) {
        throw createError({
          statusCode: 400,
          message: 'Valid UPI ID required'
        });
      }

      // Generate expiration time
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      // Calculate satoshi amount if not provided
      const finalSatAmount = satAmount || Math.round(parseFloat(inrAmount) * 100);

      // Generate a real Lightning invoice
      const memo = `BitUPI Payment: ₹${inrAmount} via ${upiId}`;
      const invoiceResult = await generateInvoice(finalSatAmount, memo);

      // Create an order ID
      const orderId = generateOrderId();

      // Associate the payment with the order
      associatePaymentWithOrder(invoiceResult.paymentHash, orderId);

      // Generate security keys for multi-signature authentication
      const securityKeys = generateSecurityKeys();

      // Generate refund information
      const refundKey = generateRefundKey();

      // Create the order
      const order = {
        id: orderId,
        inrAmount: parseFloat(inrAmount),
        satAmount: finalSatAmount,
        upiId,
        upiName: upiName || '',
        status: 'pending',
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        lightning: {
          invoice: invoiceResult.invoice,
          paid: false,
          paymentHash: invoiceResult.paymentHash
        },
        // Add security keys
        securityKeys: {
          buyerKey: securityKeys.buyerKey,
          systemKey: securityKeys.systemKey,
          sharedSecret: securityKeys.sharedSecret
        },
        // Add refund information
        refund: {
          walletAddress: refundWallet || '',
          refundKey: refundKey
        }
      };

      // Store the order in memory but don't broadcast yet
      // Order will only be broadcast to the marketplace after LN invoice is paid
      store.orders.set(orderId, order);

      // Store the order creation timestamp for cleanup
      console.log(`Created order ${orderId}, waiting for Lightning payment before publishing to marketplace`);

      // Generate a tracking token for the buyer
      const trackingToken = generateTrackingToken(orderId, 'buyer', securityKeys.buyerKey);

      return {
        success: true,
        id: orderId,
        invoice: invoiceResult.invoice,
        paymentHash: invoiceResult.paymentHash,
        // Return security information to the buyer
        trackingToken,
        buyerKey: securityKeys.buyerKey,
        refundKey,
        // Return a filtered version of the order
        order: {
          ...order,
          securityKeys: undefined,
          refund: {
            walletAddress: order.refund?.walletAddress
          }
        }
      };
    }

    // Require order ID for all other actions
    if (!orderId) {
      throw createError({
        statusCode: 400,
        message: 'Order ID is required'
      });
    }

    // Get the order
    const order = store.orders.get(orderId);
    if (!order) {
      throw createError({
        statusCode: 404,
        message: 'Order not found'
      });
    }

    // POST /api/orders/:id - Claim order
    if (action === 'claim') {
      // Check if order is in pending status
      if (order.status !== 'pending') {
        throw createError({
          statusCode: 400,
          message: 'Order cannot be claimed in its current state'
        });
      }

      // Check if Lightning payment is confirmed
      if (!order.lightning?.paid) {
        throw createError({
          statusCode: 400,
          message: 'Order payment has not been confirmed yet'
        });
      }

      // Generate earner key
      const earnerKey = crypto.randomBytes(16).toString('hex');

      // Update order status and add earner info
      order.status = 'processing';
      order.earner = {
        authKey: earnerKey
      };

      if (order.securityKeys) {
        order.securityKeys.earnerKey = earnerKey;
      }

      // Store updated order
      store.orders.set(orderId, order);

      // Notify specific order clients
      broadcastToOrderClients(orderId, {
        id: orderId,
        status: 'processing',
        updatedAt: new Date().toISOString()
      });

      // Notify all orders clients about status change
      broadcastToSSEClients('orders', {
        action: 'update',
        order: {
          ...order,
          securityKeys: undefined,
          refund: undefined,
          earner: undefined
        }
      });

      // Generate tracking token for earner
      const trackingToken = generateTrackingToken(orderId, 'earner', earnerKey);

      return {
        success: true,
        orderId,
        status: 'processing',
        trackingToken,
        earnerKey
      };
    }

    // POST /api/orders/:id - Submit receipt
    if (action === 'receipt') {
      const { receiptImage, lightningAddress, earnerKey } = body;

      // Validate inputs
      if (!receiptImage) {
        throw createError({
          statusCode: 400,
          message: 'Receipt image is required'
        });
      }

      // Validate receipt image
      const receiptValidation = validateReceiptImage(receiptImage);
      if (!receiptValidation.valid) {
        throw createError({
          statusCode: 400,
          message: receiptValidation.message || 'Invalid receipt image'
        });
      }

      if (!lightningAddress) {
        throw createError({
          statusCode: 400,
          message: 'Lightning address is required'
        });
      }

      // Validate Lightning address format
      const lightningValidation = validateLightningAddress(lightningAddress);
      if (!lightningValidation.valid) {
        throw createError({
          statusCode: 400,
          message: lightningValidation.message || 'Invalid Lightning address'
        });
      }

      // Check if order is in processing status
      if (order.status !== 'processing') {
        throw createError({
          statusCode: 400,
          message: 'Receipt can only be submitted for orders in processing status'
        });
      }

      // Verify earner's auth key
      if (!earnerKey) {
        throw createError({
          statusCode: 401,
          message: 'Earner authentication key is required'
        });
      }

      // Check if the earner key matches the one associated with this order
      if (!order.earner?.authKey || order.earner.authKey !== earnerKey) {
        throw createError({
          statusCode: 401,
          message: 'Invalid earner authentication key'
        });
      }

      // Update order with receipt info
      order.receipt = {
        image: receiptImage,
        uploadedAt: new Date().toISOString()
      };

      // Update earner info (preserve the auth key)
      order.earner = {
        ...order.earner,
        lightningAddress: lightningAddress
      };

      // Update status to verifying
      order.status = 'verifying';

      // Store updated order
      store.orders.set(orderId, order);

      // Notify specific order clients
      broadcastToOrderClients(orderId, {
        id: orderId,
        status: 'verifying',
        updatedAt: new Date().toISOString()
      });

      // Notify all orders clients about status change
      broadcastToSSEClients('orders', {
        action: 'update',
        order: {
          ...order,
          securityKeys: undefined,
          refund: undefined,
          earner: undefined,
          updatedAt: new Date().toISOString()
        }
      });

      // For development/testing, auto-complete after a delay
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
      };
    }

    // POST /api/orders/:id - Approve receipt and complete order
    if (action === 'approve') {
      const { buyerKey } = body;

      // Verify buyer's auth key
      if (!buyerKey) {
        throw createError({
          statusCode: 401,
          message: 'Buyer authentication key is required'
        });
      }

      // Check if the buyer key matches the one associated with this order
      if (!order.securityKeys?.buyerKey || order.securityKeys.buyerKey !== buyerKey) {
        throw createError({
          statusCode: 401,
          message: 'Invalid buyer authentication key'
        });
      }

      // Check if order is in verifying status
      if (order.status !== 'verifying') {
        throw createError({
          statusCode: 400,
          message: 'Order can only be approved in verifying status'
        });
      }

      // Process the order completion
      await completeOrder(orderId);

      return {
        success: true,
        orderId,
        status: 'completed'
      };
    }

    // POST /api/orders/:id - Refund order
    if (action === 'refund') {
      const { refundKey, buyerKey, refundWallet, lightningAddress, refundInvoice } = body;

      // Verify inputs
      if (!refundKey) {
        throw createError({
          statusCode: 400,
          message: 'Refund key is required'
        });
      }

      if (!buyerKey) {
        throw createError({
          statusCode: 400,
          message: 'Buyer authentication key is required'
        });
      }

      if (!refundWallet && !lightningAddress && !refundInvoice) {
        throw createError({
          statusCode: 400,
          message: 'Refund wallet, lightning address, or lightning invoice is required'
        });
      }

      // Verify refund key
      if (!order.refund?.refundKey || order.refund.refundKey !== refundKey) {
        throw createError({
          statusCode: 401,
          message: 'Invalid refund key'
        });
      }

      // Verify buyer key
      if (!order.securityKeys?.buyerKey || order.securityKeys.buyerKey !== buyerKey) {
        throw createError({
          statusCode: 401,
          message: 'Invalid buyer authentication'
        });
      }

      // Check if order is in a state that can be refunded
      const refundableStatuses = ['pending', 'processing'];
      if (!refundableStatuses.includes(order.status)) {
        throw createError({
          statusCode: 400,
          message: 'This order cannot be refunded in its current state'
        });
      }

      // Update refund wallet if provided
      if (refundWallet && order.refund) {
        order.refund.walletAddress = refundWallet;
      }

      // Process the refund via Lightning Network
      try {
        // If we have a Lightning address, create a withdrawal link
        if (lightningAddress) {
          await createWithdrawLink(
            order.satAmount,
            `BitUPI Refund for order ${orderId.substring(0, 8)}`,
            1
          );
        }
        // If we have an invoice, pay it directly
        else if (refundInvoice) {
          await processInternalPayment(refundInvoice, `Refund for order ${orderId}`);
        }

        // Mark the order as failed after refund
        order.status = 'failed';
      } catch (error) {
        console.error(`Error processing refund for order ${orderId}:`, error);
        // Still mark as failed even if payment has issues, but log the error
        order.status = 'failed';
      }

      // Add refund information
      if (!order.refund) {
        order.refund = {
          refundKey: refundKey,
          walletAddress: refundWallet || ''
        };
      }

      // Store updated order
      store.orders.set(orderId, order);

      // Notify specific order clients
      broadcastToOrderClients(orderId, {
        id: orderId,
        status: 'failed',
        refunded: true,
        updatedAt: new Date().toISOString()
      });

      // Notify all orders clients about status change
      broadcastToSSEClients('orders', {
        action: 'update',
        order: {
          ...order,
          securityKeys: undefined,
          refund: undefined
        }
      });

      return {
        success: true,
        message: 'Order refunded successfully',
        status: 'failed'
      };
    }

    // Unknown action
    throw createError({
      statusCode: 400,
      message: `Unknown action: ${action}`
    });
  }

  // Method not allowed
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
});