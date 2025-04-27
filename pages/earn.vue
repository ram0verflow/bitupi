<!-- This file is a renamed copy of the former receive.vue -->
<!-- Please update references to this file in other components -->

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import OrderCard from '~/components/OrderCard.vue';
import ReceiptUploader from '~/components/ReceiptUploader.vue';
import useUserStats from '~/composables/useUserStats';

// State variables
const step = ref(1); // 1: Marketplace, 2: Payment, 3: Complete
const orders = ref([]);
const selectedOrder = ref(null);
const receipt = ref(null);
const lightningAddress = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');
const eventSource = ref(null);
const isLoading = ref(true);
const orderStatus = ref('pending');
const showTestTools = ref(false); // Toggle for test tools
const trackingToken = ref(''); // Order tracking token
const earnerKey = ref(''); // Earner authentication key
const activeEarnerCount = ref(0); // Number of active earners

// Get user stats utility
const { recordReceive, updateTransactionStatus } = useUserStats();

// Filtered active orders
const activeOrders = computed(() => {
  return orders.value.filter(order => order.status === 'pending');
});

// Get all available orders
async function fetchOrders() {
  try {
    isLoading.value = true;
    const response = await fetch('/api/orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    const data = await response.json();
    if (data.success && Array.isArray(data.orders)) {
      orders.value = data.orders;
    } else if (Array.isArray(data)) {
      orders.value = data;
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    errorMessage.value = 'Failed to load available orders. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

// Set up SSE for real-time order updates
function setupOrderUpdates() {
  if (process.client) {
    try {
      const { $socket } = useNuxtApp();
      
      // Subscribe to orders updates
      $socket.subscribeToOrders();
      
      // Subscribe to stats updates for active earner count
      $socket.subscribeToStats();
      
      // Listen for orders updates
      $socket.on('orders', (data) => {
        if (data.action === 'init') {
          // Initialize orders list
          orders.value = data.orders || [];
        } else if (data.action === 'add') {
          // Add new order to the list
          orders.value.unshift(data.order);
        } else if (data.action === 'update') {
          // Update existing order
          const index = orders.value.findIndex(o => o.id === data.order.id);
          if (index !== -1) {
            orders.value[index] = data.order;
            
            // If this is our selected order, update status
            if (selectedOrder.value && selectedOrder.value.id === data.order.id) {
              selectedOrder.value = data.order;
              orderStatus.value = data.order.status;
              
              if (data.order.status === 'completed') {
                step.value = 3; // Move to complete step
              }
            }
          }
        }
      });
      
      // Listen for stats updates to get active earner count
      $socket.on('stats', (data) => {
        if (data && typeof data.activeEarners === 'number') {
          activeEarnerCount.value = data.activeEarners;
        }
      });
    } catch (error) {
      console.error('Failed to initialize real-time updates:', error);
    }
  }
}

// Claim an order
async function claimOrder(order) {
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    
    const response = await fetch(`/api/orders/${order.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'claim'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to claim order');
    }
    
    const data = await response.json();
    if (data.success) {
      selectedOrder.value = order;
      orderStatus.value = 'processing';
      step.value = 2; // Move to payment step
      
      // Store tracking token and earner key
      if (data.trackingToken) {
        trackingToken.value = data.trackingToken;
        localStorage.setItem('bitupi_tracking_token', data.trackingToken);
      }
      
      if (data.earnerKey) {
        earnerKey.value = data.earnerKey;
        localStorage.setItem('bitupi_earner_key', data.earnerKey);
      }
      
      // Calculate earner's reward (1% of the order's sat amount)
      const exchangeFeePercent = 0.02; // 2%
      const earnerSharePercent = 0.5; // 50% of the fee
      const reward = Math.ceil(order.satAmount * exchangeFeePercent * earnerSharePercent);
      
      // Record the receive transaction (not completed yet)
      recordReceive(order.inrAmount, order.satAmount, reward, false);
      
      // Setup specific order updates
      setupSpecificOrderUpdates(order.id);
    } else {
      throw new Error('Order claim failed');
    }
  } catch (error) {
    errorMessage.value = error.message || 'Failed to claim order';
  } finally {
    isSubmitting.value = false;
  }
}

// Set up SSE for specific order status updates
function setupSpecificOrderUpdates(id) {
  if (process.client && id) {
    try {
      const { $socket } = useNuxtApp();
      
      // Join the order room for updates
      $socket.joinOrder(id);
      
      // Listen for updates for this specific order
      $socket.on(`order:${id}`, (data) => {
        if (data && data.status) {
          orderStatus.value = data.status;
          
          if (data.status === 'completed') {
            step.value = 3; // Move to complete step
            
            // Calculate earner's reward (1% of the order's sat amount)
            const exchangeFeePercent = 0.02; // 2%
            const earnerSharePercent = 0.5; // 50% of the fee
            const reward = Math.ceil(selectedOrder.value.satAmount * exchangeFeePercent * earnerSharePercent);
            
            // Update transaction as completed in user stats
            updateTransactionStatus(false, true, selectedOrder.value.inrAmount, selectedOrder.value.satAmount, reward);
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize order updates:', error);
    }
  }
}

// Receipt upload handling
function handleReceiptUpload(result) {
  receipt.value = result;
}

// Submit receipt for verification
async function submitReceipt() {
  if (!receipt.value || !selectedOrder.value) {
    errorMessage.value = 'Please upload a receipt first';
    return;
  }
  
  if (!lightningAddress.value) {
    errorMessage.value = 'Please enter your Lightning address to receive payment';
    return;
  }
  
  if (!earnerKey.value) {
    errorMessage.value = 'Authentication key is missing. Please try claiming the order again.';
    return;
  }
  
  isSubmitting.value = true;
  errorMessage.value = '';
  
  try {
    const response = await fetch(`/api/orders/${selectedOrder.value.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'receipt',
        receiptImage: receipt.value.image,
        lightningAddress: lightningAddress.value,
        earnerKey: earnerKey.value
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit receipt');
    }
    
    const data = await response.json();
    if (data.success) {
      // Receipt submitted, now waiting for buyer to confirm
      orderStatus.value = 'verifying';
    } else {
      throw new Error('Receipt submission failed');
    }
  } catch (error) {
    errorMessage.value = error.message || 'Failed to submit receipt';
  } finally {
    isSubmitting.value = false;
  }
}

// Handle order card action buttons
function handleOrderAction(order) {
  // If order is pending, claim it
  if (order.status === 'pending') {
    claimOrder(order);
  } 
  // If it's processing and you're already on the order, do nothing (we're already showing the receipt upload)
  // If it's completed, also do nothing
}

// Reset process and go back to marketplace
function resetProcess() {
  const { $socket } = useNuxtApp();
  
  // Leave the order room if we were in one
  if (selectedOrder.value) {
    $socket.leaveOrder(selectedOrder.value.id);
    $socket.off(`order:${selectedOrder.value.id}`);
  }
  
  step.value = 1;
  selectedOrder.value = null;
  receipt.value = null;
  lightningAddress.value = '';
  errorMessage.value = '';
  
  // Clear tracking information if we've completed the order
  if (orderStatus.value === 'completed') {
    trackingToken.value = '';
    earnerKey.value = '';
    localStorage.removeItem('bitupi_tracking_token');
    localStorage.removeItem('bitupi_earner_key');
  }
  
  // Reset status
  orderStatus.value = 'pending';
  
  // Set up marketplace updates again
  setupOrderUpdates();
  fetchOrders();
}

// Ping server to update earner status
async function pingAsEarner() {
  try {
    await fetch('/api/ping?type=earner');
  } catch (error) {
    console.error('Failed to ping server:', error);
  }
}

// Start periodic pinging
let pingInterval = null;
let visibilityHandler = null;

function startEarnerPing() {
  // Ping immediately
  pingAsEarner();
  
  // Set up more frequent pinging to ensure accurate earner counts
  // Ping every 30 seconds while on the receive page
  pingInterval = setInterval(pingAsEarner, 30 * 1000);
  
  // Additionally set up a visibility change event listener to ping
  // when the user returns to the page after having it in the background
  if (typeof document !== 'undefined') {
    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        pingAsEarner();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchOrders();
  setupOrderUpdates();
  
  // Load stored keys if available
  const storedToken = localStorage.getItem('bitupi_tracking_token');
  if (storedToken) {
    trackingToken.value = storedToken;
  }
  
  const storedEarnerKey = localStorage.getItem('bitupi_earner_key');
  if (storedEarnerKey) {
    earnerKey.value = storedEarnerKey;
  }
  
  // Register as earner and start periodic pinging
  startEarnerPing();
});

// Clean up ping interval on unmount
onUnmounted(() => {
  const { $socket } = useNuxtApp();

  // Clean up ping interval
  if (pingInterval) {
    clearInterval(pingInterval);
  }
  
  // Clean up visibility change event listener
  if (typeof document !== 'undefined' && visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
  }
  
  // Clean up event listeners
  $socket.off('orders');
  $socket.off('stats');
  
  // Leave order room if we were in one
  if (selectedOrder.value) {
    $socket.leaveOrder(selectedOrder.value.id);
    $socket.off(`order:${selectedOrder.value.id}`);
  }
  
  // Cleanup any remaining SSE connection
  if (eventSource.value && eventSource.value !== null) {
    eventSource.value.close();
  }
  
  // Notify server we're no longer an earner when leaving the page
  if (process.client) {
    try {
      fetch('/api/ping?type=visitor');
    } catch (error) {
      console.error('Failed to ping as visitor on unmount:', error);
    }
  }
});
</script>

<template>
  <div class="container py-12 px-6">
    <!-- Error message -->
    <div v-if="errorMessage" class="mb-8 p-4 bg-error/10 border border-error rounded-lg max-w-4xl mx-auto">
      <p class="text-error">{{ errorMessage }}</p>
    </div>
    
    <!-- Step 1: Order Marketplace -->
    <div v-if="step === 1">
      <div class="text-center mb-12">
        <h1 class="font-display text-3xl font-medium text-text-light mb-4">Earn Sats by Sending UPI Payments</h1>
        <p class="text-text-muted max-w-2xl mx-auto">
          Browse available orders, make UPI payments, and earn bitcoin in return. 
          Orders are claimed on a first-come, first-served basis.
        </p>
        <p class="text-secondary mt-2 max-w-2xl mx-auto">
          <span class="font-medium">Earn 50% of the exchange fee</span> on every order you process!
        </p>
        
        <!-- Active Earners Display -->
        <div class="mt-6 inline-flex bg-secondary/10 border border-secondary/30 rounded-lg px-6 py-3 items-center">
          <div class="flex items-center">
            <span class="mr-3 text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            <div class="text-left">
              <p class="text-text-muted text-sm">Currently Online</p>
              <p class="text-secondary font-medium">{{ activeEarnerCount }} Earners</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-secondary/10 border border-secondary/30 rounded-lg p-4 mb-8 max-w-4xl mx-auto">
        <h3 class="font-display font-medium text-secondary mb-2">How It Works</h3>
        <ol class="list-decimal pl-5 space-y-2 text-text-muted">
          <li>Select an order from the available listings</li>
          <li>Send the UPI payment to the provided account within the time limit</li>
          <li>Upload a screenshot/receipt of your payment</li>
          <li>Once the buyer confirms receipt, you'll receive the bitcoin payment</li>
        </ol>
        
      </div>
      
      <div class="max-w-4xl mx-auto">
        <h2 class="font-display text-2xl font-medium text-text-light mb-6">Available Orders</h2>
        
        <div v-if="isLoading" class="flex justify-center my-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        
        <div v-else-if="activeOrders.length === 0" class="card text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="font-display text-xl font-medium text-text-light mb-2">No Orders Available</h3>
          <p class="text-text-muted">
            There are currently no active orders to process. 
            Please check back later or refresh the page.
          </p>
          <button 
            @click="fetchOrders"
            class="btn-outline-primary mt-6"
          >
            Refresh
          </button>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <OrderCard 
            v-for="order in activeOrders"
            :key="order.id"
            :order="order"
            type="earn"
            status="pending"
            :selectable="true"
            @action="handleOrderAction(order)"
          />
        </div>
      </div>
    </div>
    
    <!-- Step 2: Payment Process -->
    <div v-else-if="step === 2" class="max-w-4xl mx-auto">
      <h2 class="font-display text-2xl font-medium text-text-light mb-6">Process UPI Payment</h2>
      
      <div v-if="selectedOrder" class="mb-8">
        <OrderCard 
          :order="selectedOrder"
          type="earn"
          :status="orderStatus"
        />
      </div>
      
      <div class="card mb-8">
        <h3 class="font-display text-xl font-medium text-text-light mb-4">UPI Payment Instructions</h3>
        
        <div class="bg-bg-input p-4 rounded-lg mb-4">
          <p class="font-medium text-text-light mb-2">Send payment to:</p>
          <div class="flex items-center justify-between bg-bg-dark p-3 rounded-lg">
            <span class="font-mono text-secondary">{{ selectedOrder?.upiId }}</span>
            
            <button 
              @click="navigator.clipboard.writeText(selectedOrder?.upiId)"
              class="px-2 py-1 text-xs rounded bg-bg-card text-text-muted hover:text-secondary transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
        
        <div class="space-y-4 text-text-muted">
          <div class="flex items-start">
            <div class="mr-3 text-secondary">1.</div>
            <p>Open your UPI app (Google Pay, PhonePe, Paytm, etc.)</p>
          </div>
          
          <div class="flex items-start">
            <div class="mr-3 text-secondary">2.</div>
            <p>Send exactly ₹{{ selectedOrder?.inrAmount }} to the UPI ID above</p>
          </div>
          
          <div class="flex items-start">
            <div class="mr-3 text-secondary">3.</div>
            <p>Take a screenshot of the payment confirmation</p>
          </div>
          
          <div class="flex items-start">
            <div class="mr-3 text-secondary">4.</div>
            <p>Upload the screenshot below</p>
          </div>
        </div>
      </div>
      
      <div v-if="orderStatus === 'processing'" class="card mb-8">
        <h3 class="font-display text-xl font-medium text-text-light mb-4">Upload Payment Receipt</h3>
        
        <ReceiptUploader 
          @upload-success="handleReceiptUpload"
          @upload-error="errorMessage = $event.message"
        />
        
        <div class="mt-6" v-if="receipt">
          <div class="bg-warning/5 border border-warning/30 rounded-lg p-4 mb-4">
            <div class="flex items-start">
              <div class="text-warning mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 class="font-medium text-warning mb-1">Important</h4>
                <p class="text-text-muted text-sm">
                  Make sure to enter a valid Lightning address. This will be used to send your Bitcoin payment.
                  Double-check that your address is correct - you won't be able to change it later!
                </p>
              </div>
            </div>
          </div>
          
          <label class="block mb-2 text-text-light font-medium">
            <span class="text-warning">*</span> Your Lightning Address (to receive sats)
          </label>
          <input 
            v-model="lightningAddress"
            type="text"
            class="input"
            placeholder="your@lightning.address"
            required
          />
          <div class="flex flex-wrap gap-2 mt-2">
            <p class="text-text-muted text-sm">You can use:</p>
            <span class="px-2 py-0.5 bg-secondary/10 text-secondary rounded-full text-xs">Lightning Address</span>
            <span class="px-2 py-0.5 bg-secondary/10 text-secondary rounded-full text-xs">LNURL</span>
            <span class="px-2 py-0.5 bg-secondary/10 text-secondary rounded-full text-xs">Lightning Invoice</span>
          </div>
          
          <div class="bg-info/10 border border-info/30 rounded-lg p-4 mt-4">
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
        
        <div class="flex justify-between mt-6">
          <button 
            @click="resetProcess"
            class="btn-outline-primary"
          >
            Back to Marketplace
          </button>
          
          <button 
            v-if="receipt"
            @click="submitReceipt"
            :disabled="isSubmitting || !lightningAddress"
            class="btn-secondary"
            :class="{'opacity-50 cursor-not-allowed': isSubmitting || !lightningAddress}"
          >
            <span v-if="isSubmitting">Submitting...</span>
            <span v-else>Submit Receipt</span>
          </button>
        </div>
      </div>
      
      <div v-else-if="orderStatus === 'verifying'" class="card mb-8 text-center">
        <div class="text-warning mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h3 class="font-display text-xl font-medium text-text-light mb-2">Receipt Submitted</h3>
        
        <p class="text-text-muted mb-6">
          Your receipt has been submitted and is awaiting confirmation from the buyer.
          This usually takes just a few minutes.
        </p>
        
        <div class="flex justify-center">
          <button 
            @click="resetProcess"
            class="btn-outline-secondary"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    </div>
    
    <!-- Step 3: Transaction Complete -->
    <div v-else-if="step === 3" class="max-w-4xl mx-auto">
      <div class="card text-center py-8">
        <div class="text-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 class="font-display text-2xl font-medium text-text-light mb-4">Payment Complete!</h2>
        
        <p class="text-text-muted mb-8">
          The buyer has confirmed receipt of your UPI payment.
          Your Bitcoin payment has been sent to your Lightning address.
        </p>
        
        <div class="bg-success/10 border border-success/30 rounded-lg p-4 text-text-light mb-8 mx-auto max-w-md">
          <h3 class="font-medium mb-2">Transaction Summary</h3>
          <div class="text-left">
            <div class="flex justify-between py-2 border-b border-border-dark">
              <span class="text-text-muted">Order ID</span>
              <span class="text-text-light font-mono">{{ selectedOrder?.id?.substring(0, 8) }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-border-dark">
              <span class="text-text-muted">UPI Payment</span>
              <span class="text-text-light">₹ {{ selectedOrder?.inrAmount }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-text-muted">Sats Received</span>
              <span class="text-primary">{{ selectedOrder?.satAmount?.toLocaleString() }} sats</span>
            </div>
          </div>
        </div>
        
        <button 
          @click="resetProcess"
          class="btn-secondary"
        >
          Find More Orders
        </button>
      </div>
    </div>
  </div>
</template>