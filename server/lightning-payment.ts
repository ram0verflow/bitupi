// Lightning Network payment integration with LNbits
import { $fetch } from 'ohmyfetch';

// LNbits API configuration
const LNBITS_URL = process.env.LNBITS_URL || 'https://legend.lnbits.com';
const LNBITS_ADMIN_KEY = process.env.LNBITS_ADMIN_KEY; // For sending payments, creating withdraw links
const LNBITS_INVOICE_KEY = process.env.LNBITS_INVOICE_KEY; // For creating invoices, checking payment status
const CALLBACK_URL = process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/api/lightning-callback` : null;

// Define interfaces for Lightning responses
export interface LNbitsInvoice {
  payment_hash: string;
  payment_request: string;
  checking_id: string;
}

export interface LNbitsWithdraw {
  id: string;
  lnurl: string;
  max_withdrawable: number;
  min_withdrawable: number;
}

export interface LNbitsPaymentStatus {
  paid: boolean;
  preimage?: string;
  details?: {
    checking_id: string;
    pending: boolean;
    amount: number;
    fee: number;
    memo: string;
    time: number;
    bolt11: string;
    preimage?: string;
    payment_hash: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface PaymentStatusResponse {
  paid: boolean;
  confirmedAt?: string;
  status: 'pending' | 'paid' | 'expired' | 'failed';
}

/**
 * Verify LNbits connection by checking wallet info
 * @returns Connection status
 */
export async function verifyLNbitsConnection(): Promise<boolean> {
  try {
    if (!LNBITS_INVOICE_KEY) {
      console.error('LNBITS_INVOICE_KEY not set');
      return false;
    }

    const response = await $fetch(`${LNBITS_URL}/api/v1/wallet`, {
      headers: {
        'X-Api-Key': LNBITS_INVOICE_KEY
      }
    });

    return !!response.id;
  } catch (error) {
    console.error('Failed to connect to LNbits:', error);
    return false;
  }
}

/**
 * Generate a Lightning Network invoice using LNbits
 * @param satAmount - The amount in satoshis
 * @param memo - Optional memo for the invoice
 * @returns Object containing the invoice and payment hash
 */
export async function generateInvoice(satAmount: number, memo?: string): Promise<{
  invoice: string;
  paymentHash: string;
}> {
  if (!LNBITS_INVOICE_KEY) {
    throw new Error('LNBITS_INVOICE_KEY not set in environment variables');
  }

  try {
    const response: LNbitsInvoice = await $fetch(`${LNBITS_URL}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'X-Api-Key': LNBITS_INVOICE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        out: false,
        amount: satAmount,
        memo: memo || 'BitUPI Payment',
        webhook: CALLBACK_URL
      })
    });

    // Store payment hash temporarily for later verification
    // In a production environment with a database, you would save this
    // We're using an in-memory cache for this stateless application
    pendingPayments.set(response.payment_hash, {
      amount: satAmount,
      created: Date.now(),
      checking_id: response.checking_id
    });

    return {
      invoice: response.payment_request,
      paymentHash: response.payment_hash
    };
  } catch (error) {
    console.error('Error generating Lightning invoice:', error);
    throw new Error('Failed to generate Lightning invoice');
  }
}

// In-memory cache for pending payments
// This would be a database in a persistent application
export const pendingPayments = new Map<string, {
  amount: number;
  created: number;
  checking_id: string;
  paid?: boolean;
  orderId?: string;
}>();

/**
 * Create a withdraw link for earner rewards or refunds
 * @param satAmount - Maximum amount in satoshis
 * @param title - Title for the withdrawal
 * @param minAmount - Minimum withdrawal amount
 * @returns LNURL for withdrawal
 */
export async function createWithdrawLink(
  satAmount: number,
  title: string = 'BitUPI Payment',
  minAmount: number = 1000
): Promise<string> {
  if (!LNBITS_ADMIN_KEY) {
    throw new Error('LNBITS_ADMIN_KEY not set in environment variables');
  }

  try {
    const response: LNbitsWithdraw = await $fetch(`${LNBITS_URL}/api/v1/withdraw`, {
      method: 'POST',
      headers: {
        'X-Api-Key': LNBITS_ADMIN_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title,
        min_withdrawable: minAmount,
        max_withdrawable: satAmount,
        uses: 1,
        wait_time: 1,
        is_unique: true
      })
    });

    // Store the withdraw info in memory for verification
    pendingWithdraws.set(response.id, {
      amount: satAmount,
      created: Date.now(),
      lnurl: response.lnurl
    });

    return response.lnurl;
  } catch (error) {
    console.error('Error creating withdraw link:', error);
    throw new Error('Failed to create withdraw link');
  }
}

// In-memory cache for pending withdrawals
const pendingWithdraws = new Map<string, {
  amount: number;
  created: number;
  lnurl: string;
  paid?: boolean;
}>();

/**
 * Pay a Lightning invoice (for sending to earners or refunds)
 * @param bolt11 - Lightning invoice to pay
 * @param memo - Optional memo for the payment
 * @returns Payment success status
 */
export async function payInvoice(bolt11: string, memo?: string): Promise<PaymentResponse> {
  if (!LNBITS_ADMIN_KEY) {
    return {
      success: false,
      error: 'LNBITS_ADMIN_KEY not set in environment variables'
    };
  }

  try {
    const response = await $fetch(`${LNBITS_URL}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'X-Api-Key': LNBITS_ADMIN_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        out: true,
        bolt11: bolt11,
        memo: memo || 'BitUPI Payment'
      })
    });

    return {
      success: true,
      transactionId: response.payment_hash
    };
  } catch (error) {
    console.error('Error paying invoice:', error);
    return {
      success: false,
      error: 'Failed to pay Lightning invoice'
    };
  }
}

/**
 * Check payment status of an invoice
 * @param paymentHash - The payment hash to check
 * @returns Payment status
 */
export async function checkPaymentStatus(paymentHash: string): Promise<PaymentStatusResponse> {
  if (!LNBITS_INVOICE_KEY) {
    return {
      paid: false,
      status: 'failed'
    };
  }

  // First check our in-memory cache
  const pendingPayment = pendingPayments.get(paymentHash);
  if (pendingPayment?.paid) {
    return {
      paid: true,
      confirmedAt: new Date(pendingPayment.created).toISOString(),
      status: 'paid'
    };
  }

  try {
    const response: LNbitsPaymentStatus = await $fetch(`${LNBITS_URL}/api/v1/payments/${paymentHash}`, {
      headers: {
        'X-Api-Key': LNBITS_INVOICE_KEY
      }
    });

    // Update in-memory cache if payment is paid
    if (response.paid && pendingPayment) {
      pendingPayment.paid = true;
      pendingPayments.set(paymentHash, pendingPayment);
    }

    return {
      paid: response.paid,
      confirmedAt: response.paid ? new Date().toISOString() : undefined,
      status: response.paid ? 'paid' : 'pending'
    };
  } catch (error) {
    console.error('Error checking payment status:', error);
    return {
      paid: false,
      status: 'failed'
    };
  }
}


/**
 * Associate a payment hash with an order ID
 * This allows the callback to update order status when payment is received
 * @param paymentHash - The payment hash to associate
 * @param orderId - The order ID to associate with the payment
 * @returns Success status
 */
export function associatePaymentWithOrder(paymentHash: string, orderId: string): boolean {
  const payment = pendingPayments.get(paymentHash);

  if (!payment) {
    console.warn(`Attempted to associate unknown payment hash: ${paymentHash} with order: ${orderId}`);
    return false;
  }

  // Associate the order ID with the payment
  payment.orderId = orderId;
  pendingPayments.set(paymentHash, payment);

  console.log(`Associated payment ${paymentHash} with order ${orderId}`);
  return true;
}

/**
 * Handle payment confirmation from LNbits webhook
 * @param paymentHash - The payment hash that was paid
 * @param payload - The full webhook payload from LNbits
 * @returns Processing result
 */
export async function handlePaymentConfirmation(
  paymentHash: string,
  payload: any
): Promise<{ success: boolean, message: string, orderId?: string }> {
  // Check if we have this payment in our pending payments
  const payment = pendingPayments.get(paymentHash);

  if (!payment) {
    console.warn(`Payment confirmation received for unknown hash: ${paymentHash}`);
    return {
      success: false,
      message: 'Unknown payment hash'
    };
  }

  // Mark the payment as paid in our cache
  payment.paid = true;
  pendingPayments.set(paymentHash, payment);

  console.log(`Payment confirmed for hash: ${paymentHash}, amount: ${payment.amount} sats`);

  // If we have an orderId associated with this payment, we can update the order status
  // This would interact with your order system (through a cache, event bus, or Redis)
  if (payment.orderId) {
    try {
      // Update order in-memory store to mark invoice as paid
      const { store, broadcastToSSEClients, broadcastToOrderClients } = await import('./index');
      const order = store.orders.get(payment.orderId);

      if (order) {
        // Update lightning payment status
        if (order.lightning) {
          order.lightning.paid = true;
        } else {
          order.lightning = {
            invoice: 'PAID',
            paid: true,
            paymentHash: paymentHash
          };
        }

        // Update order in store
        store.orders.set(payment.orderId, order);

        // Now broadcast order update to clients
        console.log(`Order ${payment.orderId} payment confirmed - broadcasting to clients`);

        // Broadcast to the specific order's clients
        broadcastToOrderClients(payment.orderId, {
          status: order.status,
          lightning: { paid: true },
          updatedAt: new Date().toISOString()
        });

        // Only now publish the order to the marketplace for earners
        // This ensures orders only appear after payment is confirmed
        if (order.status === 'pending') {
          // Broadcast to all clients listening to orders
          const sanitizedOrder = {
            ...order,
            securityKeys: undefined, // Don't broadcast security keys
            refund: undefined,       // Don't broadcast refund information
            lightning: {
              paid: true
            }
          };

          broadcastToSSEClients('orders', {
            action: 'add',
            order: sanitizedOrder
          });

          console.log(`Order ${payment.orderId} is now visible in the marketplace`);
        }

        return {
          success: true,
          message: 'Payment confirmed and order published to marketplace',
          orderId: payment.orderId
        };
      } else {
        console.error(`Order ${payment.orderId} not found in store`);
        return {
          success: true,
          message: 'Payment confirmed but order not found',
          orderId: payment.orderId
        };
      }
    } catch (error) {
      console.error(`Failed to update order ${payment.orderId}:`, error);
      return {
        success: true, // Payment was still successful even if order update failed
        message: 'Payment confirmed but failed to update order',
        orderId: payment.orderId
      };
    }
  }

  return {
    success: true,
    message: 'Payment confirmed'
  };
}

// Cleanup old entries from in-memory payment caches every hour
// Since we have no persistent storage, this prevents memory leaks
setInterval(() => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  // Clean up old pending payments
  for (const [hash, payment] of pendingPayments.entries()) {
    if (now - payment.created > ONE_HOUR) {
      pendingPayments.delete(hash);
    }
  }

  // Clean up old pending withdrawals
  for (const [id, withdraw] of pendingWithdraws.entries()) {
    if (now - withdraw.created > ONE_HOUR) {
      pendingWithdraws.delete(id);
    }
  }
}, 60 * 60 * 1000);
