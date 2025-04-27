/**
 * Internal payment utilities - Not exposed as API endpoints
 * These utilities should only be used by server-side code
 */
import { payInvoice as makePayment } from '../lightning-payment';

/**
 * Process a Lightning payment internally
 * This should not be exposed as an API endpoint
 * 
 * @param invoice - The Lightning invoice to pay
 * @param memo - Optional memo for the payment
 * @returns Payment result
 */
export async function processInternalPayment(invoice: string, memo?: string) {
  if (!invoice) {
    throw new Error('Lightning invoice is required');
  }
  
  try {
    // Process the Lightning payment
    const result = await makePayment(invoice, memo);
    
    if (!result.success) {
      throw new Error(result.error || 'Payment failed');
    }
    
    return {
      success: true,
      transactionId: result.transactionId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error processing internal Lightning payment:', error);
    throw error;
  }
}