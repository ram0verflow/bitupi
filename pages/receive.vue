<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useNuxtApp } from '#app';
import UpiLogo from '~/components/UpiLogo.vue';
import BitcoinLogo from '~/components/BitcoinLogo.vue';

// Page state
const step = ref(1);
const selectedOrder = ref(null);
const timeLeft = ref(0);
const receiptUploaded = ref(false);
const errorMessage = ref('');

// Real-time orders from socket connection
const availableOrders = reactive([]);
const loading = ref(true);
const { $socket } = useNuxtApp();

// Connect to socket for real-time updates
onMounted(() => {
  // Subscribe to order updates
  useNuxtApp().hook('socket:orders-update', (data) => {
    if (data && Array.isArray(data)) {
      // Replace or update available orders
      availableOrders.splice(0, availableOrders.length, ...data);
      loading.value = false;
    }
  });
  
  // Signal that we're an earner
  if ($socket && $socket.connected) {
    $socket.emit('register-earner');
  }
  
  // Fallback if socket doesn't receive data in 3 seconds
  setTimeout(() => {
    if (loading.value) {
      loading.value = false;
    }
  }, 3000);
});

onUnmounted(() => {
  // Unregister as earner when leaving page
  if ($socket && $socket.connected) {
    $socket.emit('unregister-earner');
  }
});

// Order timer countdown
let timerInterval = null;

function selectOrder(order) {
  selectedOrder.value = order;
  timeLeft.value = 15 * 60; // 15 minutes in seconds
  step.value = 2;
  
  // Start countdown timer
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval);
      // Return to order list
      errorMessage.value = 'Time expired! The order has been returned to the marketplace.';
      step.value = 1;
    }
  }, 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeAgo(timestamp) {
  const now = new Date();
  const createdTime = new Date(timestamp);
  const diffSeconds = Math.floor((now - createdTime) / 1000);
  
  if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  } else if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
}

function uploadReceipt(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.match('image.*')) {
    errorMessage.value = 'Please upload an image file';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    // Simulate receipt verification (would connect to backend in real app)
    setTimeout(() => {
      receiptUploaded.value = true;
      step.value = 3;
      
      // Clear the timer
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }, 1500);
  };
  reader.readAsDataURL(file);
}
</script>

<template>
  <div class="container py-8 md:py-12">
    <h1 class="text-3xl font-bold text-center mb-8">Earn Bitcoin</h1>
    
    <div v-if="errorMessage" class="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
      {{ errorMessage }}
      <button @click="errorMessage = ''" class="ml-2 text-red-500 font-medium hover:text-red-700">Dismiss</button>
    </div>
    
    <!-- Step 1: Order List -->
    <div v-if="step === 1" class="max-w-4xl mx-auto">
      <div class="bg-white rounded-lg shadow-card p-6">
        <h2 class="text-xl font-semibold mb-4">Available Payment Requests</h2>
        <p class="text-gray-600 mb-6">
          Process UPI payments and earn Bitcoin. First-click-first-serve basis.
        </p>
        
        <div v-if="loading" class="py-8">
          <div class="flex flex-col items-center justify-center space-y-4">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-upi-green"></div>
            <p class="text-gray-600">Loading available orders...</p>
          </div>
        </div>
        
        <div v-else-if="availableOrders.length === 0" class="text-center py-8 text-gray-500">
          <div class="lightning-gradient text-white inline-flex items-center p-3 rounded-full mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p>No payment requests available at the moment.</p>
          <p class="text-sm mt-2">Check back soon for new opportunities to earn Bitcoin!</p>
          <button @click="$socket.emit('refresh-orders')" class="mt-4 bg-upi-green/10 hover:bg-upi-green/20 text-upi-green px-4 py-2 rounded-md font-medium transition-all transform hover:scale-105">
            Refresh Orders
          </button>
        </div>
        
        <div v-else class="space-y-4">
          <div v-for="order in availableOrders" :key="order.id" class="border border-gray-200 rounded-lg hover:border-upi-green hover:shadow-md transition-all">
            <div class="p-4">
              <div class="flex justify-between items-start">
                <div>
                  <div class="flex items-center">
                    <span class="font-semibold">{{ order.id }}</span>
                    <span class="ml-2 text-xs text-gray-500">{{ formatTimeAgo(order.timeCreated) }}</span>
                  </div>
                  <div class="text-lg font-medium mt-1">₹{{ order.amount }}</div>
                </div>
                
                <div class="text-right">
                  <div class="text-gray-600 text-sm">You'll receive</div>
                  <div class="text-lg font-medium">{{ order.satAmount + order.profit }} sats</div>
                  <div class="text-xs text-green-600">+{{ order.profit }} sats profit</div>
                </div>
              </div>
              
              <div class="mt-4 flex justify-between items-center">
                <div class="text-sm text-gray-600">
                  <span>UPI: {{ order.upiId }}</span>
                </div>
                
                <button 
                  @click="selectOrder(order)"
                  class="bg-upi-green hover:bg-upi-green/90 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  Process Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Step 2: Process Payment -->
    <div v-if="step === 2" class="max-w-2xl mx-auto bg-white rounded-lg shadow-card p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold">Process Payment</h2>
        <div class="text-red-600 font-medium">
          Time remaining: {{ formatTime(timeLeft) }}
        </div>
      </div>
      
      <div class="bg-gray-50 p-4 rounded mb-6">
        <div class="grid grid-cols-2 gap-3">
          <div class="text-gray-600">Order ID:</div>
          <div class="font-medium">{{ selectedOrder.id }}</div>
          
          <div class="text-gray-600">Amount to pay:</div>
          <div class="font-medium">₹{{ selectedOrder.amount }}</div>
          
          <div class="text-gray-600">UPI ID:</div>
          <div class="font-medium">{{ selectedOrder.upiId }}</div>
          
          <div class="text-gray-600">You will receive:</div>
          <div class="font-medium">{{ selectedOrder.satAmount + selectedOrder.profit }} sats</div>
          
          <div class="text-gray-600">Your profit:</div>
          <div class="font-medium text-green-600">+{{ selectedOrder.profit }} sats</div>
        </div>
      </div>
      
      <div class="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6">
        <p>Make the UPI payment of ₹{{ selectedOrder.amount }} to {{ selectedOrder.upiId }} and upload the payment receipt below.</p>
      </div>
      
      <!-- Upload receipt -->
      <div>
        <h3 class="text-lg font-medium mb-2">Upload Payment Receipt</h3>
        <div 
          class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-upi-green transition-colors"
          @click="$refs.receiptInput.click()"
        >
          <input 
            type="file" 
            ref="receiptInput"
            @change="uploadReceipt"
            accept="image/*"
            class="hidden"
          />
          
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="mt-2 text-sm text-gray-600">Upload a screenshot of your payment receipt</p>
            <p class="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
          </div>
        </div>
      </div>
      
      <button @click="step = 1" class="mt-4 text-upi-green hover:underline">
        Cancel and return to order list
      </button>
    </div>
    
    <!-- Step 3: Waiting for confirmation -->
    <div v-if="step === 3" class="max-w-2xl mx-auto bg-white rounded-lg shadow-card p-6">
      <div class="text-center mb-6">
        <div class="inline-block rounded-full bg-green-100 p-3 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-upi-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold">Receipt Uploaded Successfully!</h2>
        <p class="text-gray-600 mt-2">Waiting for buyer to confirm payment receipt...</p>
      </div>
      
      <div class="bg-yellow-50 border border-yellow-100 p-4 rounded-lg mb-6">
        <p class="text-sm">Do not close this window. Once the buyer confirms receipt, you will receive your Bitcoin payment automatically.</p>
      </div>
      
      <div class="mt-8 text-center">
        <button @click="step = 1" class="bg-upi-green hover:bg-upi-green/90 text-white px-6 py-2 rounded-lg">
          Return to Marketplace
        </button>
      </div>
    </div>
  </div>
</template>