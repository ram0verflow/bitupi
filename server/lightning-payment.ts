// Lightning Payment Type Definitions for TypeScript

export interface LightningInvoice {
  id: string;
  orderId: string;
  paymentHash: string;
  amount: number;
  description: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface LightningPayment {
  id: string;
  orderId: string;
  invoiceId: string;
  amount: number;
  fee: number;
  preimage: string;
  paymentHash: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  timestamp: string;
}

export interface Order {
  id: string;
  invoiceId: string;
  paymentHash: string;
  amount: number;
  upiId: string;
  satAmount: number;
  serviceFee: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRate {
  timestamp: string;
  rates: {
    BTC_INR: number;
    BTC_USD?: number;
    SAT_INR: number;
  }
}