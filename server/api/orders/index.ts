import { defineEventHandler, readBody, createError, getQuery, getMethod } from 'h3';
import { store, broadcastToSSEClients, broadcastToOrderClients } from '../../index';
import { sanitizeOrdersList } from '../../utils/orderUtils';
import { generateSecurityKeys, generateRefundKey, generateTrackingToken } from '../../utils/security';
import crypto from 'crypto';
import { generateInvoice, associatePaymentWithOrder } from '../../lightning-payment';

/**
 * RESTful Orders API
 * 
 * - GET /api/orders - List all available orders
 * - POST /api/orders - Create a new order
 */

// Generate a random order ID
function generateOrderId() {
  return 'order_' + crypto.randomBytes(8).toString('hex');
}

// Constants for image validation
const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default defineEventHandler(async (event) => {
  // Get HTTP method
  const method = getMethod(event);

  // Handle GET request - List orders
  if (method === 'GET') {
    try {
      // Only return pending orders with paid invoices (for marketplace)
      const activeOrders = Array.from(store.orders.values())
        .filter(order => order.status === 'pending' && order.lightning?.paid === true);

      // Sanitize orders (remove sensitive data)
      const sanitizedOrders = sanitizeOrdersList(activeOrders);

      return {
        success: true,
        orders: sanitizedOrders
      };
    } catch (error) {
      console.error('Error listing orders:', error);
      throw createError({
        statusCode: 500,
        message: 'Failed to retrieve orders'
      });
    }
  }

  // Handle POST request - Create order
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      const { inrAmount, upiId, satAmount, upiName, refundWallet } = body;

      // Validate inputs
      if (!inrAmount || isNaN(parseFloat(String(inrAmount)))) {
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
      const finalSatAmount = satAmount || Math.round(parseFloat(String(inrAmount)) * 100);

      // Generate a real Lightning invoice
      const memo = `LN2UPI Payment: ₹${inrAmount} via ${upiId}`;
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
        inrAmount: parseFloat(String(inrAmount)),
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
    } catch (error) {
      console.error('Error creating order:', error);
      
      if (error.statusCode) {
        throw error; // Re-throw H3 errors
      }
      
      throw createError({
        statusCode: 500,
        message: 'Failed to create order'
      });
    }
  }

  // Method not allowed
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
});