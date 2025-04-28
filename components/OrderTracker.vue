<template>
  <div class="card p-6">
    <h3 class="font-display text-xl font-medium text-text-light mb-4">Order Tracker</h3>
    
    <div v-if="!orderData && !isLoading">
      <!-- Token Input Form -->
      <div v-if="!trackingToken">
        <p class="text-text-muted mb-4">Enter your tracking token to view order status</p>
        <div class="mb-4">
          <label class="block mb-2 text-text-light font-medium">Tracking Token</label>
          <textarea
            v-model="tokenInput"
            class="input h-24 font-mono text-xs"
            placeholder="Paste your tracking token here"
          ></textarea>
        </div>
        <button 
          @click="loadOrderFromToken"
          class="btn-primary w-full"
          :disabled="!tokenInput"
          :class="{'opacity-50 cursor-not-allowed': !tokenInput}"
        >
          Track Order
        </button>
      </div>
      
      <!-- Stored Order Selection -->
      <div v-else class="mb-4">
        <p class="text-text-muted mb-4">You have a saved tracking token</p>
        <button 
          @click="loadOrderFromToken"
          class="btn-primary w-full mb-2"
        >
          Load Order Status
        </button>
        <button 
          @click="clearToken"
          class="btn-outline-error w-full"
        >
          Clear Saved Token
        </button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-else-if="isLoading" class="flex justify-center my-6">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <!-- Error Message -->
    <div v-if="errorMessage" class="mb-4 p-4 bg-error/10 border border-error rounded-lg">
      <p class="text-error">{{ errorMessage }}</p>
    </div>
    
    <!-- Order Display -->
    <div v-if="orderData" class="space-y-4">
      <!-- Order Status Banner -->
      <div :class="statusClasses" class="p-4 rounded-lg">
        <div class="flex items-center mb-2">
          <div v-if="orderData.status === 'completed'" class="mr-3 text-success">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div v-else-if="orderData.status === 'failed'" class="mr-3 text-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div v-else-if="orderData.status === 'processing'" class="mr-3 text-warning">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div v-else-if="orderData.status === 'verifying'" class="mr-3 text-info">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div v-else class="mr-3 text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="font-medium">
            <span v-if="orderData.status === 'pending'">Pending Payment</span>
            <span v-else-if="orderData.status === 'processing'">Processing Payment</span>
            <span v-else-if="orderData.status === 'verifying'">Verifying Payment</span>
            <span v-else-if="orderData.status === 'completed'">Payment Complete</span>
            <span v-else-if="orderData.status === 'failed'">Payment Failed</span>
          </h3>
        </div>
        <p class="text-sm">
          {{ statusMessages[orderData.status] || 'Unknown status' }}
        </p>
      </div>
      
      <!-- Order Details -->
      <div class="bg-bg-input rounded-lg p-4">
        <h4 class="font-medium mb-3">Order Details</h4>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Order ID:</span>
            <span class="font-mono">{{ orderData.orderId }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Amount (INR):</span>
            <span>₹ {{ orderData.inrAmount }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Amount (Sats):</span>
            <span>{{ orderData.satAmount.toLocaleString() }} sats</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">UPI ID:</span>
            <span class="font-mono">{{ orderData.upiId }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Created:</span>
            <span>{{ formatDate(orderData.createdAt) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Expires:</span>
            <span>{{ formatDate(orderData.expiresAt) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Your Role:</span>
            <span class="capitalize">{{ orderData.userType }}</span>
          </div>
        </div>
      </div>
      
      <!-- Receipt Display (for buyers only) -->
      <div v-if="orderData.userType === 'buyer' && orderData.receipt" class="bg-bg-input rounded-lg p-4">
        <h4 class="font-medium mb-3">Payment Receipt</h4>
        <div class="mb-2 text-sm">
          <span class="text-text-muted">Uploaded:</span>
          <span class="ml-2">{{ formatDate(orderData.receipt.uploadedAt) }}</span>
        </div>
        <div class="border border-border-dark rounded overflow-hidden mb-2">
          <img 
            :src="orderData.receipt.image" 
            alt="Payment Receipt" 
            class="w-full h-auto"
          />
        </div>
        <div v-if="orderData.status === 'verifying'" class="mt-4 flex justify-between">
          <button class="btn-outline-error">Reject Receipt</button>
          <button class="btn-success">Approve Payment</button>
        </div>
      </div>
      
      <!-- Refund Information (for buyers) -->
      <div v-if="orderData.userType === 'buyer' && canRefund" class="bg-bg-input rounded-lg p-4">
        <h4 class="font-medium mb-3">Refund Options</h4>
        <p class="text-sm text-text-muted mb-3">
          You can request a refund for this order if it hasn't been processed yet.
        </p>
        
        <div class="mb-3">
          <label class="block mb-2 text-sm font-medium text-text-light">Refund Wallet (Lightning)</label>
          <input 
            v-model="refundWallet"
            type="text"
            class="input text-sm"
            placeholder="Enter Lightning address or LNURL"
          />
        </div>
        
        <button 
          @click="requestRefund"
          class="btn-outline-error w-full"
          :disabled="!refundWallet"
          :class="{'opacity-50 cursor-not-allowed': !refundWallet}"
        >
          Request Refund
        </button>
      </div>
      
      <!-- Reload Button -->
      <div class="flex justify-between">
        <button 
          @click="clearToken"
          class="btn-outline-primary"
        >
          Track Different Order
        </button>
        
        <button 
          @click="loadOrderFromToken"
          class="btn-primary"
        >
          Refresh Status
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Props
const props = defineProps({
  initialToken: {
    type: String,
    default: ''
  }
});

// State variables
const trackingToken = ref(props.initialToken || localStorage.getItem('bitupi_tracking_token') || '');
const tokenInput = ref('');
const orderData = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');
const refundWallet = ref('');
const buyerKey = ref(localStorage.getItem('bitupi_buyer_key') || '');
const refundKey = ref(localStorage.getItem('bitupi_refund_key') || '');

// Status-based styling classes and messages
const statusClasses = computed(() => {
  if (!orderData.value) return '';
  
  switch (orderData.value.status) {
    case 'completed':
      return 'bg-success/10 border border-success/30';
    case 'failed':
      return 'bg-error/10 border border-error/30';
    case 'processing':
      return 'bg-warning/10 border border-warning/30';
    case 'verifying':
      return 'bg-info/10 border border-info/30';
    default:
      return 'bg-secondary/10 border border-secondary/30';
  }
});

const statusMessages = {
  pending: 'Your order is awaiting payment confirmation.',
  processing: 'Your payment is being processed by an earner.',
  verifying: 'Receipt has been uploaded and is awaiting verification.',
  completed: 'Transaction has been completed successfully.',
  failed: 'The transaction failed or was cancelled.'
};

// Check if order can be refunded
const canRefund = computed(() => {
  if (!orderData.value) return false;
  
  return (
    orderData.value.userType === 'buyer' &&
    ['pending', 'processing'].includes(orderData.value.status) &&
    buyerKey.value && 
    refundKey.value
  );
});

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Load order data using tracking token
async function loadOrderFromToken() {
  const token = trackingToken.value || tokenInput.value;
  
  if (!token) {
    errorMessage.value = 'Please enter a tracking token';
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    // Extract order ID from token if possible
    const tokenParts = token.split('.');
    let orderIdFromToken = 'unknown';
    
    if (tokenParts.length >= 3) {
      try {
        const decodedPayload = JSON.parse(atob(tokenParts[1]));
        if (decodedPayload && decodedPayload.id) {
          orderIdFromToken = decodedPayload.id;
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
    
    const apiUrl = `/api/orders/${orderIdFromToken}/status?token=${encodeURIComponent(token)}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to load order data');
    }
    
    const data = await response.json();
    
    if (data.success) {
      orderData.value = data;
      
      // Save token to localStorage if it was from input
      if (tokenInput.value) {
        trackingToken.value = tokenInput.value;
        localStorage.setItem('bitupi_tracking_token', tokenInput.value);
        tokenInput.value = '';
      }
      
      // If the order is for a buyer and we don't have keys saved, save them if included in response
      if (data.userType === 'buyer') {
        if (data.buyerKey && !buyerKey.value) {
          buyerKey.value = data.buyerKey;
          localStorage.setItem('bitupi_buyer_key', data.buyerKey);
        }
        
        if (data.refundKey && !refundKey.value) {
          refundKey.value = data.refundKey;
          localStorage.setItem('bitupi_refund_key', data.refundKey);
        }
      }
    } else {
      throw new Error('Failed to load order data');
    }
  } catch (error) {
    console.error('Error loading order data:', error);
    errorMessage.value = error.message || 'Failed to load order data';
  } finally {
    isLoading.value = false;
  }
}

// Request a refund for the order
async function requestRefund() {
  if (!orderData.value || !canRefund.value) return;
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const response = await fetch(`/api/orders/${orderData.value.orderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        buyerKey: buyerKey.value,
        refundKey: refundKey.value,
        refundWallet: refundWallet.value
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to request refund');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Refresh order data
      await loadOrderFromToken();
    } else {
      throw new Error('Failed to process refund');
    }
  } catch (error) {
    console.error('Error requesting refund:', error);
    errorMessage.value = error.message || 'Failed to request refund';
  } finally {
    isLoading.value = false;
  }
}

// Clear tracking token and order data
function clearToken() {
  trackingToken.value = '';
  orderData.value = null;
  localStorage.removeItem('bitupi_tracking_token');
}

// Load order data on mount if token exists
onMounted(() => {
  if (trackingToken.value) {
    loadOrderFromToken();
  }
});
</script>