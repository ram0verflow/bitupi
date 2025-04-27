import { defineEventHandler, readBody } from 'h3'
import { store, broadcastToSSEClients, Order } from '../index'
import crypto from 'crypto'
import { generateSecurityKeys, generateRefundKey, generateTrackingToken } from '../utils/security'

// Generate a random order ID
function generateOrderId() {
  return 'order_' + crypto.randomBytes(8).toString('hex')
}

// Import Lightning invoice generation function
import { generateInvoice } from '../lightning-payment'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { inrAmount, upiId, satAmount, upiName, orderType, refundWallet } = body
    
    // Validate inputs
    if (!inrAmount || isNaN(parseFloat(inrAmount))) {
      return {
        success: false,
        error: 'Valid INR amount required'
      }
    }
    
    if (!upiId || !/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+$/.test(upiId)) {
      return {
        success: false,
        error: 'Valid UPI ID required'
      }
    }
    
    // Generate expiration time
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
    
    // Calculate satoshi amount if not provided
    const finalSatAmount = satAmount || Math.round(parseFloat(inrAmount) * 100)
    
    // Generate a real Lightning invoice
    const memo = `BitUPI Payment: ₹${inrAmount} via ${upiId}`
    const invoiceResult = await generateInvoice(finalSatAmount, memo)
    
    // Create an order ID first so we can associate the invoice with it
    const orderId = generateOrderId()
    
    // Associate the payment with the order
    const { associatePaymentWithOrder } = await import('../lightning-payment')
    associatePaymentWithOrder(invoiceResult.paymentHash, orderId)
    
    // Generate security keys for multi-signature authentication
    const securityKeys = generateSecurityKeys()
    
    // Generate refund information
    const refundKey = generateRefundKey()
    
    // Create the order
    const order: Order = {
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
      // Add refund information if provided
      refund: {
        walletAddress: refundWallet || '', // Optional refund wallet
        refundKey: refundKey
      }
    }
    
    // Store the order in memory but don't broadcast yet
    // Order will only be broadcast to the marketplace after LN invoice is paid
    store.orders.set(orderId, order)
    
    // Store the order creation timestamp for cleanup
    console.log(`Created order ${orderId}, waiting for Lightning payment before publishing to marketplace`)
    
    // Generate a tracking token for the buyer
    const trackingToken = generateTrackingToken(orderId, 'buyer', securityKeys.buyerKey)
    
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
        securityKeys: undefined, // Don't return complete security keys
        refund: {
          walletAddress: order.refund?.walletAddress
        }
      }
    }
  } catch (error) {
    console.error('Create order error:', error)
    return {
      success: false,
      error: 'Failed to create order'
    }
  }
})