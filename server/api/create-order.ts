import { defineEventHandler, readBody } from 'h3'
import { store, broadcastToSSEClients, Order } from '../index'
import crypto from 'crypto'
import { generateSecurityKeys, generateRefundKey, generateTrackingToken } from '../utils/security'

// Generate a random order ID
function generateOrderId() {
  return 'order_' + crypto.randomBytes(8).toString('hex')
}

// Generate a random Lightning invoice
function generateLightningInvoice(satAmount: number) {
  const randomHex = crypto.randomBytes(32).toString('hex')
  return `lnbc${satAmount}n1p${randomHex}pp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdqa9qsp5emwvgdkar4ptp0trfzv0hrqfwfku29ru7n5zt45ve5a45qgc3ntq9qyyssq3vrmwj23r0p9m4e5kr65tn8nr350pw3w8ndl98rxfd9l6qj2ydc2n0whucrpzrwxdnf896qn9qy8mskuevm7h4tp6vg68nvtrpw3v83mcp27w5se`
}

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
    
    // Generate order ID and expiration time
    const orderId = generateOrderId()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
    
    // Calculate satoshi amount if not provided
    const finalSatAmount = satAmount || Math.round(parseFloat(inrAmount) * 100)
    
    // Generate a Lightning invoice for testing
    const lightningInvoice = generateLightningInvoice(finalSatAmount)
    
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
        invoice: lightningInvoice,
        paid: false
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
    
    // Store the order
    store.orders.set(orderId, order)
    
    // Broadcast to all clients listening to orders
    broadcastToSSEClients('orders', {
      action: 'add',
      // Filter out sensitive information from broadcast
      order: {
        ...order,
        securityKeys: undefined, // Don't broadcast security keys
        refund: undefined // Don't broadcast refund information
      }
    })
    
    // Generate a tracking token for the buyer
    const trackingToken = generateTrackingToken(orderId, 'buyer', securityKeys.buyerKey)
    
    return {
      success: true,
      id: orderId,
      invoice: lightningInvoice,
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