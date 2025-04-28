<!-- This file is a renamed copy of the former send.vue -->
<!-- Please update references to this file in other components -->

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import AnimatedRateCounter from '~/components/AnimatedRateCounter.vue';
import QRCodeUploader from '~/components/QRCodeUploader.vue';
import OrderCard from '~/components/OrderCard.vue';
import useUserStats from '~/composables/useUserStats';

// State variables
const step = ref(1); // 1: Form, 2: QR Upload, 3: Invoice, 4: Waiting, 5: Complete
const inrAmount = ref(500);
const satAmount = ref(0);
const currentRate = ref(0);
const upiData = ref(null);
const orderId = ref(null);
const orderStatus = ref('pending');
const lightningInvoice = ref('');
const paymentHash = ref(''); // Store payment hash for status checks
const invoicePaid = ref(false); // Track if invoice has been paid
const checkingPayment = ref(false); // Track if payment check is in progress
const exchangeFee = ref(0.02); // 2% default
const serviceFeePercent = ref(0.01); // 1% service fee
const isSubmitting = ref(false);
const errorMessage = ref('');
const qrProcessing = ref(false);
const eventSource = ref(null);
const randomInsight = ref(null);
const insightLoading = ref(false); // Track loading state of insights
const trackingToken = ref(''); // Order tracking token
const refundWallet = ref(''); // Refund wallet address

// Get user stats utility
const { recordSend, updateTransactionStatus } = useUserStats();

// Exchange fee calculation
const exchangeFeeAmount = computed(() => {
  return Math.ceil(inrAmount.value * exchangeFee.value);
});

// Service fee calculation (for profit)
const serviceFee = computed(() => {
  return Math.ceil(inrAmount.value * serviceFeePercent.value);
});

// Total fees
const totalFees = computed(() => {
  return exchangeFeeAmount.value + serviceFee.value;
});

// User gets exactly the amount they entered
const userReceivesInr = computed(() => {
  return inrAmount.value;
});

// Calculate how much EXTRA we need to charge in sats to cover the fees
const feeAdjustedInr = computed(() => {
  // Add the fees to the base amount to calculate how much to request in sats
  return inrAmount.value + totalFees.value;
});

// Calculate sats to request to ensure user gets exact INR amount they entered
const totalSats = computed(() => {
  if (!currentRate.value) return 0;
  // Convert fee-adjusted INR to BTC, then to sats (100 million sats per BTC)
  // We add the fees to the INR amount to ensure the user gets exactly what they asked for
  return Math.ceil((feeAdjustedInr.value / currentRate.value) * 100000000);
});

// Check if form is valid
const isFormValid = computed(() => {
  return inrAmount.value >= 100 && inrAmount.value <= 10000 && !!refundWallet.value;
});

// Get current BTC to INR exchange rate
async function fetchExchangeRate() {
  try {
    const response = await fetch('/api/utils/exchange-rate');
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }
    
    const data = await response.json();
    currentRate.value = data.rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    errorMessage.value = 'Failed to fetch current exchange rate. Please try again.';
  }
}

// Get a random Bitcoin insight
async function fetchRandomInsight() {
  // If still loading, don't fetch again
  if (insightLoading.value) return;
  
  try {
    insightLoading.value = true;
    
    // Using AbortController to set a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch('/api/utils/random-insight', {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error('Failed to fetch random insight');
    }
    
    const data = await response.json();
    
    if (data.success) {
      randomInsight.value = {
        heading: data.heading,
        insight: data.insight,
        isFallback: data.fallback || false
      };
    }
  } catch (error) {
    console.error('Error fetching random insight:', error);
    // Don't show error to user for this non-critical feature
  } finally {
    insightLoading.value = false;
  }
}

// Set up SSE for real-time rate updates
function setupRateUpdates() {
  if (process.client) {
    try {
      const { $socket } = useNuxtApp();
      
      // Subscribe to exchange rate updates
      $socket.subscribeToExchangeRates();
      
      // Listen for updates
      $socket.on('exchange-rate', (data) => {
        if (data && data.rates && data.rates.BTC_INR) {
          currentRate.value = data.rates.BTC_INR;
        }
      });
    } catch (error) {
      console.error('Failed to initialize exchange rate updates:', error);
    }
  }
}

// QR code upload handling
function handleQRUpload(result) {
  qrProcessing.value = false;
  
  if (result && result.upiId) {
    upiData.value = result;
    step.value = 3; // Move to invoice step
    createOrder();
  } else {
    errorMessage.value = 'Failed to extract UPI information from QR code';
  }
}

function handleQRError(error) {
  qrProcessing.value = false;
  errorMessage.value = error.message || 'Failed to process QR code';
}

function handleProcessingStart() {
  qrProcessing.value = true;
}

function handleProcessingEnd() {
  qrProcessing.value = false;
}

// Create order in backend
async function createOrder() {
  if (!upiData.value || !isFormValid.value) {
    errorMessage.value = 'Please complete all required information first';
    return;
  }
  
  isSubmitting.value = true;
  errorMessage.value = '';
  
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create',
        inrAmount: inrAmount.value,
        satAmount: totalSats.value,
        upiId: upiData.value.upiId,
        upiName: upiData.value.name || '',
        orderType: 'buy',
        refundWallet: refundWallet.value
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create order');
    }
    
    const data = await response.json();
    
    if (data.id && data.invoice) {
      orderId.value = data.id;
      lightningInvoice.value = data.invoice;
      paymentHash.value = data.paymentHash;
      
      // Store tracking token and keys in localStorage
      if (data.trackingToken) {
        trackingToken.value = data.trackingToken;
        localStorage.setItem('bitupi_tracking_token', data.trackingToken);
      }
      
      if (data.buyerKey) {
        localStorage.setItem('bitupi_buyer_key', data.buyerKey);
      }
      
      if (data.refundKey) {
        localStorage.setItem('bitupi_refund_key', data.refundKey);
      }
      
      // Record the send transaction in user stats (not completed yet)
      recordSend(inrAmount.value, totalSats.value, false);
      
      step.value = 3; // Move to invoice step
      
      // Start listening for order updates
      setupOrderUpdates(data.id);
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    errorMessage.value = error.message || 'Failed to create order';
  } finally {
    isSubmitting.value = false;
  }
}

// Set up SSE for order status updates
function setupOrderUpdates(id) {
  if (process.client && id) {
    try {
      const { $socket } = useNuxtApp();
      
      // Join the order room to receive updates
      $socket.joinOrder(id);
      
      // Listen for updates for this specific order
      $socket.on(`order:${id}`, (data) => {
        if (data && data.status) {
          orderStatus.value = data.status;
          
          if (data.status === 'completed') {
            step.value = 5; // Move to complete step
            // Update transaction as completed in user stats
            updateTransactionStatus(true, true, inrAmount.value, totalSats.value);
          } else if (data.status === 'processing') {
            step.value = 4; // Move to waiting for confirmation step
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize order updates:', error);
    }
  }
}

// Go to next step in the form
function nextStep() {
  if (step.value === 1 && isFormValid.value) {
    step.value = 2;
  }
}

// Go back to previous step
function prevStep() {
  if (step.value > 1) {
    step.value--;
  }
}

// Reset the whole form
function resetForm() {
  const { $socket } = useNuxtApp();
  
  // Leave the order room if we were in one
  if (orderId.value) {
    $socket.leaveOrder(orderId.value);
    $socket.off(`order:${orderId.value}`);
  }
  
  step.value = 1;
  inrAmount.value = 500;
  upiData.value = null;
  orderId.value = null;
  orderStatus.value = 'pending';
  lightningInvoice.value = '';
  paymentHash.value = '';
  invoicePaid.value = false;
  errorMessage.value = '';
  
  // Setup rate updates again
  setupRateUpdates();
}

// Copy lightning invoice to clipboard
function copyInvoice() {
  if (lightningInvoice.value) {
    navigator.clipboard.writeText(lightningInvoice.value)
      .then(() => {
        // You can add a toast notification here
        console.log('Invoice copied to clipboard');
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
      });
  }
}

// Check the payment status
async function checkPaymentStatus() {
  if (!paymentHash.value) {
    errorMessage.value = 'No payment hash available to check';
    return;
  }
  
  checkingPayment.value = true;
  
  try {
    const response = await fetch(`/api/lightning/payment/${paymentHash.value}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to check payment status');
    }
    
    const data = await response.json();
    
    // Update paid status
    if (data.status === 'paid' || data.paid) {
      invoicePaid.value = true;
      console.log('Invoice has been paid!');
      
      // Move to order waiting stage after payment
      step.value = 4;
    } else {
      console.log('Invoice not paid yet. Status:', data.status);
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    errorMessage.value = 'Failed to check payment status';
  } finally {
    checkingPayment.value = false;
  }
}

// Ping server to update buyer status
async function pingAsBuyer() {
  try {
    await fetch('/api/ping?type=buyer'); // Keep using /api/ping as it's a simple utility endpoint
  } catch (error) {
    console.error('Failed to ping server:', error);
  }
}

// Start periodic pinging
let pingInterval = null;
let visibilityHandler = null;

function startBuyerPing() {
  // Ping immediately
  pingAsBuyer();
  
  // Set up more frequent pinging to ensure accurate buyer counts
  // Ping every 30 seconds while on the send page
  pingInterval = setInterval(pingAsBuyer, 30 * 1000);
  
  // Additionally set up a visibility change event listener to ping
  // when the user returns to the page after having it in the background
  if (typeof document !== 'undefined') {
    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        pingAsBuyer();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchExchangeRate();
  setupRateUpdates();
  // Enable random insights feature
  fetchRandomInsight();
  
  // Register as buyer and start periodic pinging
  startBuyerPing();
});

onUnmounted(() => {
  const { $socket } = useNuxtApp();
  
  // Clean up event listeners
  $socket.off('exchange-rate');
  
  // Leave order room if we were in one
  if (orderId.value) {
    $socket.leaveOrder(orderId.value);
    $socket.off(`order:${orderId.value}`);
  }
  
  // Clean up ping interval
  if (pingInterval) {
    clearInterval(pingInterval);
  }
  
  // Clean up visibility change event listener
  if (typeof document !== 'undefined' && visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
  }
  
  // Notify server we're no longer a buyer when leaving the page
  if (process.client) {
    try {
      fetch('/api/ping?type=visitor'); // Keep using /api/ping as it's a simple utility endpoint
    } catch (error) {
      console.error('Failed to ping as visitor on unmount:', error);
    }
  }
});
</script>

<template>
  <div class="container py-12 px-6">
    <div class="max-w-4xl mx-auto">
      <!-- Steps indicator -->
      <div class="flex justify-between mb-12 relative">
        <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-border-dark -translate-y-1/2 z-0"></div>
        
        <template v-for="(s, index) in ['Amount', 'QR Code', 'Invoice', 'Waiting', 'Complete']" :key="index">
          <div class="flex flex-col items-center relative z-10">
            <div 
              class="h-8 w-8 rounded-full flex items-center justify-center text-sm mb-2 transition-all"
              :class="step > index + 1 
                ? 'bg-primary text-white' 
                : step === index + 1 
                  ? 'bg-primary text-white animate-pulse'
                  : 'bg-bg-input text-text-muted'"
            >
              <span v-if="step > index + 1">✓</span>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span 
              class="text-xs transition-all"
              :class="step >= index + 1 ? 'text-text-light' : 'text-text-muted'"
            >
              {{ s }}
            </span>
          </div>
        </template>
      </div>
      

      
      <!-- Step 1: Amount Form -->
      <div v-if="step === 1" class="card mb-8">
        <h2 class="font-display text-2xl font-medium text-text-light mb-6">Enter Amount</h2>
        
        <div class="mb-6">
          <label for="amount" class="block mb-2 text-text-light font-medium">INR Amount</label>
          <div class="relative">
            <span class="absolute top-1/2 left-4 transform -translate-y-1/2 text-text-muted">₹</span>
            <input 
              id="amount"
              v-model.number="inrAmount"
              type="number"
              min="100"
              max="10000"
              class="input pl-8"
              placeholder="Enter amount in INR"
            />
          </div>
          <p class="text-text-muted text-sm mt-2">Minimum: ₹100, Maximum: ₹10,000</p>
        </div>
        
        <!-- Refund Wallet - Optional but recommended -->
        <div class="mb-6">
          <label for="refundWallet" class="block mb-2 text-text-light font-medium">
            <span class="text-warning">*</span> Refund Wallet (Required)
          </label>
          <input 
            id="refundWallet"
            v-model="refundWallet"
            type="text"
            class="input"
            placeholder="Lightning address or LNURL for refunds"
            required
          />
          <p class="text-text-muted text-sm mt-2">
            Your Lightning Network address for receiving refunds in case of transaction issues.
            <span class="text-warning">This is necessary to protect your funds.</span>
          </p>
        </div>
        
        <div class="bg-bg-input p-4 rounded-lg border border-border-dark mb-6">
          <h3 class="font-medium text-text-light mb-2">Exchange Summary</h3>
          
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-text-muted">Amount</span>
              <span class="text-text-light">₹ {{ inrAmount }}</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-text-muted">Exchange Fee ({{ exchangeFee * 100 }}%)</span>
              <span class="text-text-light">₹ {{ exchangeFeeAmount }}</span>
            </div>
            
            <div class="flex justify-between items-center">
              <span class="text-text-muted">Service Fee ({{ serviceFeePercent * 100 }}%)</span>
              <span class="text-text-light">₹ {{ serviceFee }}</span>
            </div>
            
            <div class="border-t border-border-dark my-2 pt-2">
              <div class="flex justify-between items-center font-medium">
                <span class="text-text-muted">You'll Receive (UPI)</span>
                <span class="text-text-light">₹ {{ userReceivesInr }}</span>
              </div>
            </div>
            
            <div class="flex justify-between items-center mt-4">
              <span class="text-text-muted">You Pay</span>
              <span class="text-primary font-medium">{{ totalSats.toLocaleString() }} sats</span>
            </div>
            
            <div class="flex justify-between items-center text-xs">
              <span class="text-text-muted">Current Rate</span>
              <span class="text-text-muted">
                <AnimatedRateCounter :value="currentRate" prefix="₹ " :decimals="2" />
                <span class="ml-1">per BTC</span>
              </span>
            </div>
          </div>
          
          <!-- Bitcoin insight -->
          <div v-if="randomInsight" class="mt-4 pt-4 border-t border-border-dark">
            <div class="flex items-start">
              <div class="text-primary mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-xs font-medium text-primary mb-1">{{ randomInsight.heading }}</p>
                <p class="text-sm text-text-light italic">{{ randomInsight.insight }}</p>
                <div class="text-xs text-text-muted mt-1 text-right">~ From satoshinotebook.com</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button 
            @click="nextStep"
            :disabled="!isFormValid"
            class="btn-primary"
            :class="{'opacity-50 cursor-not-allowed': !isFormValid}"
          >
            Next
          </button>
        </div>
      </div>
      
      <!-- Step 2: QR Code Upload -->
      <div v-else-if="step === 2" class="card mb-8">
        <h2 class="font-display text-2xl font-medium text-text-light mb-6">Upload UPI QR Code</h2>
        
        <p class="text-text-muted mb-6">
          Upload the QR code of the UPI account where you want to receive payment.
        </p>
        
        <QRCodeUploader 
          @upload-success="handleQRUpload"
          @upload-error="handleQRError"
          @processing-start="handleProcessingStart"
          @processing-end="handleProcessingEnd"
        />
        
        <div class="flex justify-between mt-8">
          <button 
            @click="prevStep"
            class="btn-outline-primary"
            :disabled="qrProcessing"
          >
            Back
          </button>
          
          <button 
            v-if="false" 
            @click="nextStep"
            :disabled="!upiData || qrProcessing"
            class="btn-primary"
            :class="{'opacity-50 cursor-not-allowed': !upiData || qrProcessing}"
          >
            Next
          </button>
        </div>
      </div>
      
      <!-- Step 3: Lightning Invoice -->
      <div v-else-if="step === 3" class="card mb-8">
        <h2 class="font-display text-2xl font-medium text-text-light mb-6">Pay Lightning Invoice</h2>
        
        <p class="text-text-muted mb-6">
          Pay the Lightning invoice below to start your transaction. Once payment is detected, 
          your order will be available for someone to process.
        </p>
        
        <!-- UPI data summary -->
        <div class="bg-success/10 p-4 rounded-lg border border-success/30 mb-6">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-medium text-text-light">UPI Information</h3>
          </div>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-text-muted font-medium">UPI ID:</span>
              <span class="text-text-light">{{ upiData?.upiId }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-muted font-medium">Payee Name:</span>
              <span class="text-text-light">{{ upiData?.name || 'Not provided' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-muted font-medium">Amount:</span>
              <span class="text-text-light">₹ {{ userReceivesInr }}</span>
            </div>
            <div v-if="upiData?.meta?.transactionId" class="flex justify-between">
              <span class="text-text-muted font-medium">Transaction ID:</span>
              <span class="text-text-light">{{ upiData.meta.transactionId }}</span>
            </div>
            <div v-if="upiData?.meta?.reference" class="flex justify-between">
              <span class="text-text-muted font-medium">Reference:</span>
              <span class="text-text-light">{{ upiData.meta.reference }}</span>
            </div>
          </div>
        </div>
        
        <!-- Lightning invoice -->
        <div class="bg-bg-input p-4 rounded-lg border border-border-dark mb-6">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-medium text-text-light">Lightning Invoice</h3>
            
            <button 
              @click="copyInvoice"
              class="px-2 py-1 text-xs rounded bg-bg-dark text-text-muted hover:text-primary transition-colors"
            >
              Copy
            </button>
          </div>
          
          <!-- QR Code for Lightning invoice -->
          <div v-if="lightningInvoice" class="flex flex-col items-center mb-4">
            <img 
              :src="`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(lightningInvoice)}`" 
              alt="Lightning Invoice QR Code" 
              class="mb-2 h-48 w-48 border border-border-dark rounded"
            />
            <span class="text-text-muted text-sm">Scan with Lightning wallet</span>
          </div>
          
          <div class="overflow-x-auto font-mono text-xs text-text-muted bg-bg-dark p-3 rounded break-all">
            {{ lightningInvoice || 'Generating invoice...' }}
          </div>
          
          <!-- Payment status section -->
          <div v-if="paymentHash" class="mt-4 pt-4 border-t border-border-dark">
            <div class="flex items-center justify-between">
              <span class="text-text-muted">Payment Status:</span>
              <span 
                :class="{'text-warning': !invoicePaid, 'text-success': invoicePaid}"
                class="font-medium"
              >
                {{ invoicePaid ? 'Paid' : 'Awaiting Payment' }}
              </span>
            </div>
            <div v-if="!invoicePaid" class="flex justify-center mt-4">
              <button 
                @click="checkPaymentStatus" 
                class="px-4 py-2 rounded bg-primary/20 hover:bg-primary/30 text-primary text-sm"
                :disabled="checkingPayment"
              >
                {{ checkingPayment ? 'Checking...' : 'Check Payment Status' }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="bg-info/10 border border-info/30 rounded-lg p-4 text-text-light mb-6">
          <h3 class="font-medium mb-2">What happens next?</h3>
          <ol class="list-decimal pl-5 space-y-2 text-text-muted">
            <li>After payment, your order enters the marketplace</li>
            <li>You'll be automatically notified when someone processes your payment</li>
            <li>Confirm receipt of UPI payment to complete the transaction</li>
          </ol>
          
          <div class="mt-4 pt-4 border-t border-info/30">
            <p class="text-text-muted mb-2">
              We've created a secure tracking page for this order. You can access it anytime:
            </p>
            <div class="flex">
              <NuxtLink to="/track" class="btn-outline-primary text-sm">
                Track Your Order
              </NuxtLink>
            </div>
          </div>
        </div>
        
        
        <div class="flex justify-between">
          <button 
            @click="prevStep"
            class="btn-outline-primary"
            :disabled="isSubmitting"
          >
            Back
          </button>
          
          <button 
            v-if="false"
            @click="nextStep" 
            :disabled="!lightningInvoice || isSubmitting"
            class="btn-primary"
            :class="{'opacity-50 cursor-not-allowed': !lightningInvoice || isSubmitting}"
          >
            I've Paid the Invoice
          </button>
        </div>
      </div>
      
      <!-- Step 4: Waiting for UPI Payment -->
      <div v-else-if="step === 4" class="card mb-8">
        <h2 class="font-display text-2xl font-medium text-text-light mb-6">Waiting for UPI Payment</h2>
        
        <div class="bg-warning/10 border border-warning/30 rounded-lg p-4 text-text-light mb-6">
          <h3 class="font-medium mb-2">Order in Progress</h3>
          <p class="text-text-muted">
            Someone is processing your order right now. They will make the UPI payment
            and upload proof of payment shortly. Please be patient.
          </p>
        </div>
        
        <div v-if="orderId" class="mb-6">
          <OrderCard 
            :order="{
              id: orderId,
              inrAmount: userReceivesInr,
              satAmount: totalSats,
              upiId: upiData?.upiId || '',
              expiresAt: null
            }"
            type="buy"
            :status="orderStatus"
          />
        </div>
        
        <div class="flex justify-center">
          <button 
            class="btn-outline-primary"
            @click="resetForm"
          >
            Create New Order
          </button>
        </div>
      </div>
      
      <!-- Step 5: Transaction Complete -->
      <div v-else-if="step === 5" class="card mb-8">
        <div class="text-center">
          <div class="text-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 class="font-display text-2xl font-medium text-text-light mb-4">Transaction Complete!</h2>
          
          <p class="text-text-muted mb-8">
            Your order has been successfully completed. The payment of {{ userReceivesInr }} INR has been sent to your UPI account.
          </p>
          
          <div class="bg-success/10 border border-success/30 rounded-lg p-4 text-text-light mb-8 mx-auto max-w-md">
            <h3 class="font-medium mb-2">Transaction Summary</h3>
            <div class="text-left">
              <div class="flex justify-between py-2 border-b border-border-dark">
                <span class="text-text-muted">Order ID</span>
                <span class="text-text-light font-mono">{{ orderId?.substring(0, 8) }}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-border-dark">
                <span class="text-text-muted">Amount Received</span>
                <span class="text-text-light">₹ {{ userReceivesInr }}</span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-text-muted">Sats Sent</span>
                <span class="text-primary">{{ totalSats.toLocaleString() }} sats</span>
              </div>
            </div>
          </div>
          
          <button 
            @click="resetForm"
            class="btn-primary"
          >
            Start New Transaction
          </button>
        </div>
      </div>
    </div>
  </div>
</template>