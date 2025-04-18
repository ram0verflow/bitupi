<template>
  <div class="card p-6">
    <h3 class="font-display text-xl font-medium text-text-light mb-4">Lightning Tester</h3>
    
    <!-- Amount Input -->
    <div class="mb-4">
      <label class="block mb-2 text-text-light font-medium">Sats Amount</label>
      <div class="relative">
        <input 
          v-model.number="satsAmount"
          type="number"
          min="1000"
          max="1000000"
          class="input"
          placeholder="Enter amount in sats"
        />
      </div>
      <p class="text-text-muted text-sm mt-2">Minimum: 1,000 sats, Maximum: 1,000,000 sats</p>
    </div>
    
    <!-- Generate Invoice Button -->
    <div class="mb-6">
      <button 
        @click="generateInvoice"
        class="btn-secondary w-full"
        :disabled="isGenerating || !satsAmount"
        :class="{'opacity-50 cursor-not-allowed': isGenerating || !satsAmount}"
      >
        <span v-if="isGenerating">Generating...</span>
        <span v-else>Generate Test Invoice</span>
      </button>
    </div>
    
    <!-- Invoice Display -->
    <div v-if="invoice" class="mb-6">
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-medium text-text-light">Test Invoice</h3>
        
        <button 
          @click="copyInvoice"
          class="px-2 py-1 text-xs rounded bg-bg-dark text-text-muted hover:text-primary transition-colors"
        >
          Copy
        </button>
      </div>
      
      <div class="overflow-x-auto font-mono text-xs text-text-muted bg-bg-dark p-3 rounded break-all">
        {{ invoice }}
      </div>
    </div>
    
    <!-- Payment Simulation -->
    <div v-if="invoice" class="mb-6">
      <h3 class="font-medium text-text-light mb-3">Simulate Payment</h3>
      
      <button 
        @click="simulatePayment"
        class="btn-primary w-full"
        :disabled="isProcessing"
        :class="{'opacity-50 cursor-not-allowed': isProcessing}"
      >
        <span v-if="isProcessing">Processing...</span>
        <span v-else>Pay Invoice</span>
      </button>
    </div>
    
    <!-- Payment Status -->
    <div v-if="paymentStatus" class="mb-4" :class="paymentClasses">
      <div class="flex items-center mb-2">
        <svg v-if="paymentStatus === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <h3 class="font-medium">Payment {{ paymentStatus === 'success' ? 'Successful' : 'Failed' }}</h3>
      </div>
      <p>{{ paymentMessage }}</p>
    </div>
    
    <!-- Error message -->
    <div v-if="errorMessage" class="p-4 bg-error/10 border border-error rounded-lg">
      <p class="text-error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  initialAmount: {
    type: Number,
    default: 10000 // Default 10,000 sats
  }
});

// State variables
const satsAmount = ref(props.initialAmount);
const invoice = ref('');
const isGenerating = ref(false);
const isProcessing = ref(false);
const errorMessage = ref('');
const paymentStatus = ref('');
const paymentMessage = ref('');

// Computed styles for payment status
const paymentClasses = ref('p-4 rounded-lg');

// Generate a test invoice
async function generateInvoice() {
  if (!satsAmount.value || satsAmount.value < 1000) {
    errorMessage.value = 'Please enter a valid amount (minimum 1,000 sats)';
    return;
  }
  
  errorMessage.value = '';
  isGenerating.value = true;
  paymentStatus.value = '';
  
  try {
    const response = await fetch('/api/lightning-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: satsAmount.value.toString()
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate invoice');
    }
    
    const data = await response.json();
    if (data.success && data.invoice) {
      invoice.value = data.invoice;
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    errorMessage.value = error.message || 'Failed to generate invoice';
    console.error('Error generating invoice:', error);
  } finally {
    isGenerating.value = false;
  }
}

// Simulate payment of the invoice
async function simulatePayment() {
  if (!invoice.value) {
    errorMessage.value = 'Please generate an invoice first';
    return;
  }
  
  errorMessage.value = '';
  isProcessing.value = true;
  
  try {
    const response = await fetch('/api/lightning-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        invoice: invoice.value
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process payment');
    }
    
    const data = await response.json();
    if (data.success) {
      paymentStatus.value = 'success';
      paymentMessage.value = `Payment of ${satsAmount.value.toLocaleString()} sats processed successfully at ${new Date().toLocaleTimeString()}`;
      paymentClasses.value = 'p-4 bg-success/10 border border-success/30 rounded-lg';
    } else {
      throw new Error('Payment failed');
    }
  } catch (error) {
    paymentStatus.value = 'error';
    paymentMessage.value = error.message || 'Failed to process payment';
    paymentClasses.value = 'p-4 bg-error/10 border border-error/30 rounded-lg';
    console.error('Error processing payment:', error);
  } finally {
    isProcessing.value = false;
  }
}

// Copy invoice to clipboard
function copyInvoice() {
  if (invoice.value) {
    navigator.clipboard.writeText(invoice.value)
      .then(() => {
        console.log('Invoice copied to clipboard');
      })
      .catch(err => {
        console.error('Could not copy text:', err);
      });
  }
}
</script>