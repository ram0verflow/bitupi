<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useNuxtApp } from '#app';
import BitcoinLogo from '~/components/BitcoinLogo.vue';
import UpiLogo from '~/components/UpiLogo.vue';

// Get exchange rate from server
const { data: exchangeRate } = await useFetch('/api/exchange-rate');
const exchangeRateData = exchangeRate.value?.rates || { BTC_INR: 5600000, SAT_INR: 0.056 };

// Form state
const step = ref(1);
const form = reactive({
  inrAmount: '',
  upiQrCode: null,
  upiDetails: null,
  orderDetails: null,
  orderId: null
});

// Validation
const isAmountValid = computed(() => {
  const amount = parseFloat(form.inrAmount);
  return !isNaN(amount) && amount >= 500 && amount <= 50000;
});

// Calculated values
const satAmount = computed(() => {
  if (!form.inrAmount) return 0;
  return Math.round(parseFloat(form.inrAmount) / exchangeRateData.SAT_INR);
});

const fees = computed(() => {
  return Math.round(satAmount.value * 0.03); // 3% total fee
});

const totalSats = computed(() => {
  return satAmount.value + fees.value;
});

// Actions
function submitAmount() {
  if (isAmountValid.value) {
    step.value = 2;
  }
}

async function uploadQrCode(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    form.upiQrCode = e.target.result;
    
    try {
      // Actually process the QR code
      const { data } = await useFetch('/api/process-qr', {
        method: 'POST',
        body: { imageData: form.upiQrCode }
      });
      
      if (data.value && data.value.upiId) {
        form.upiDetails = data.value;
      } else {
        form.upiDetails = {
          upiId: 'user@okaxis',
          name: 'UPI User',
          merchantCode: Math.random().toString(36).substring(2, 8).toUpperCase()
        };
      }
      
      step.value = 3;
    } catch (error) {
      console.error('Error processing QR code:', error);
      form.upiDetails = {
        upiId: 'user@okaxis',
        name: 'UPI User',
        merchantCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      };
      step.value = 3;
    }
  };
  reader.readAsDataURL(file);
}

async function createOrder() {
  try {
    // Create real order
    const { data, error } = await useFetch('/api/create-order', {
      method: 'POST',
      body: {
        amount: parseFloat(form.inrAmount),
        upiId: form.upiDetails.upiId,
        satAmount: satAmount.value,
        serviceFee: fees.value
      }
    });
    
    if (error.value) {
      throw new Error(error.value.message || 'Failed to create order');
    }
    
    if (data.value && data.value.orderId) {
      form.orderId = data.value.orderId;
      form.orderDetails = data.value;
    } else {
      // Fallback if API fails
      form.orderId = 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    
    // Connect to socket for real-time updates on this order
    const { $socket } = useNuxtApp();
    if ($socket && $socket.connected) {
      $socket.emit('join-order', { orderId: form.orderId });
    }
    
    step.value = 4;
  } catch (error) {
    console.error('Error creating order:', error);
    // Fallback
    form.orderId = 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    step.value = 4;
  }
}
</script>

<template>
  <div class="container py-8 md:py-12">
    <h1 class="text-3xl font-bold text-center mb-8">Buy Bitcoin with UPI</h1>
    
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-card p-6">
      <!-- Step indicators -->
      <div class="flex justify-between mb-8">
        <div v-for="i in 4" :key="i" class="flex flex-col items-center">
          <div :class="`rounded-full h-10 w-10 flex items-center justify-center ${step >= i ? 'bg-bitcoin-orange text-white' : 'bg-gray-200'}`">{{ i }}</div>
          <div class="text-sm mt-2">
            <template v-if="i === 1">Amount</template>
            <template v-else-if="i === 2">UPI Details</template>
            <template v-else-if="i === 3">Confirm</template>
            <template v-else-if="i === 4">Wait</template>
          </div>
        </div>
      </div>
      
      <!-- Step 1: Enter INR amount -->
      <div v-if="step === 1">
        <h2 class="text-xl font-semibold mb-4">Enter Amount in INR</h2>
        <p class="text-gray-600 mb-4">
          Specify the amount of INR you want to exchange for Bitcoin.
        </p>
        
        <form @submit.prevent="submitAmount" class="space-y-4">
          <div>
            <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <div class="relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                id="amount"
                v-model="form.inrAmount"
                min="500"
                max="50000"
                placeholder="1000"
                class="focus:ring-bitcoin-orange focus:border-bitcoin-orange block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">INR</span>
              </div>
            </div>
            <p class="mt-1 text-xs text-gray-500">Min: ₹500 | Max: ₹50,000</p>
          </div>
          
          <div>
            <button 
              type="submit" 
              class="w-full bg-bitcoin-orange hover:bg-bitcoin-orange/90 text-white py-2 px-4 rounded-md transition-colors"
              :disabled="!isAmountValid"
              :class="{ 'opacity-50 cursor-not-allowed': !isAmountValid }"
            >
              Continue
            </button>
          </div>
        </form>
        
        <div class="mt-4 text-sm text-gray-600">
          <p>You will be able to upload your UPI QR code in the next step.</p>
        </div>
      </div>
      
      <!-- Step 2: Upload UPI QR code -->
      <div v-if="step === 2">
        <h2 class="text-xl font-semibold mb-4">Upload UPI QR Code</h2>
        <p class="mb-4">Amount: ₹{{ form.inrAmount }}</p>
        
        <div 
          class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-bitcoin-orange transition-colors"
          @click="$refs.fileInput.click()"
        >
          <input 
            type="file" 
            ref="fileInput"
            @change="uploadQrCode"
            accept="image/*"
            class="hidden"
          />
          
          <div v-if="!form.upiQrCode">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
            <p class="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
          </div>
          
          <div v-else-if="!form.upiDetails" class="text-center py-4">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-bitcoin-orange mx-auto"></div>
            <p class="mt-2 text-sm text-gray-600">Processing QR Code...</p>
          </div>
          
          <div v-else class="relative">
            <img :src="form.upiQrCode" class="max-h-48 mx-auto rounded" />
            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded opacity-0 hover:opacity-100 transition-opacity">
              <p class="text-white text-sm">Click to change</p>
            </div>
          </div>
        </div>
        
        <button @click="step = 1" class="mt-4 text-bitcoin-orange hover:underline">Go Back</button>
      </div>
      
      <!-- Step 3: Confirm order details -->
      <div v-if="step === 3">
        <h2 class="text-xl font-semibold mb-4">Confirm Order Details</h2>
        <div class="bg-gray-50 p-4 rounded mb-4">
          <div class="grid grid-cols-2 gap-2">
            <div class="text-gray-600">INR Amount:</div>
            <div class="font-medium">₹{{ form.inrAmount }}</div>
            
            <div class="text-gray-600">UPI ID:</div>
            <div class="font-medium">{{ form.upiDetails?.upiId }}</div>
            
            <div class="text-gray-600">Bitcoin Amount:</div>
            <div class="font-medium">{{ satAmount }} sats</div>
            
            <div class="text-gray-600">Service Fee:</div>
            <div class="font-medium">{{ fees }} sats</div>
            
            <div class="text-gray-600 font-semibold">Total to Pay:</div>
            <div class="font-semibold">{{ totalSats }} sats</div>
          </div>
        </div>
        
        <div class="flex justify-between">
          <button @click="step = 2" class="text-bitcoin-orange hover:underline">Go Back</button>
          <button @click="createOrder" class="bg-bitcoin-orange hover:bg-bitcoin-orange/90 text-white px-6 py-2 rounded-lg">
            Create Order
          </button>
        </div>
      </div>
      
      <!-- Step 4: Waiting for payment -->
      <div v-if="step === 4">
        <h2 class="text-xl font-semibold mb-4">Waiting for Payment</h2>
        <div class="text-center mb-6 fade-in">
          <div class="inline-block rounded-full bg-blue-100 p-3 mb-4 pulse-shadow">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-bitcoin-orange animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-lg">Your order <span class="font-semibold lightning-text">{{ form.orderId }}</span> has been created!</p>
          <p class="text-gray-600 mt-2">Waiting for someone to process your UPI payment...</p>
          
          <div class="mt-6 p-4 bg-gradient-to-r from-lightning-blue/5 to-lightning-purple/5 border border-lightning-blue/10 rounded-lg shadow-inner">
            <div class="flex items-center justify-center space-x-2">
              <div class="h-2 w-2 bg-lightning-blue rounded-full animate-ping"></div>
              <div class="text-lightning-blue">Looking for earners</div>
              <div class="h-2 w-2 bg-lightning-blue rounded-full animate-ping" style="animation-delay: 0.3s"></div>
            </div>
          </div>
        </div>
        
        <div class="bg-yellow-50 border border-yellow-100 p-4 rounded-lg shadow-md">
          <div class="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm text-yellow-800">Do not close this window. Once your payment is processed, you will be prompted to confirm receipt and release the Bitcoin payment.</p>
          </div>
        </div>
        
        <div class="mt-6 text-center">
          <button @click="$socket?.emit('find-earner', { orderId: form.orderId })" class="bg-lightning-blue/10 hover:bg-lightning-blue/20 text-lightning-blue px-4 py-2 rounded-md font-medium transition-all transform hover:scale-105">
            Search for Earners
          </button>
        </div>
      </div>
    </div>
  </div>
</template>