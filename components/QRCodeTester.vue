\<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  initialAmount: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['qr-generated']);

const upiId = ref('test@upi');
const name = ref('Test User');
const amount = ref(props.initialAmount || 500);
const isGenerating = ref(false);
const errorMessage = ref('');
const generatedQR = ref(null);
const showAdvanced = ref(false);

const isValid = computed(() => {
  return upiId.value && upiId.value.includes('@');
});

async function generateQRCode() {
  if (!isValid.value) {
    errorMessage.value = 'Please enter a valid UPI ID (format: username@provider)';
    return;
  }
  
  try {
    isGenerating.value = true;
    errorMessage.value = '';
    
    const response = await fetch('/api/generate-test-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        upiId: upiId.value,
        name: name.value,
        amount: amount.value.toString()
      })
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to generate QR code');
    }
    
    generatedQR.value = result;
    emit('qr-generated', result);
  } catch (error) {
    console.error('Error generating QR code:', error);
    errorMessage.value = error.message || 'An unexpected error occurred';
  } finally {
    isGenerating.value = false;
  }
}

function useGeneratedQR() {
  // This function will be called by the parent component
  emit('qr-generated', generatedQR.value);
}

function reset() {
  generatedQR.value = null;
  errorMessage.value = '';
}

// Initialize with props
if (props.initialAmount) {
  amount.value = props.initialAmount;
}
</script>

<template>
  <div class="qr-tester w-full p-4 rounded-lg border border-dashed border-border-dark bg-bg-card/50">
    <h3 class="font-display text-lg font-medium text-text-light mb-4">QR Code Test Generator</h3>
    
    <!-- Error message -->
    <div v-if="errorMessage" class="mb-4 p-3 bg-error/10 border border-error rounded-lg text-error text-sm">
      {{ errorMessage }}
    </div>
    
    <div v-if="!generatedQR" class="space-y-4">
      <!-- UPI ID input -->
      <div>
        <label class="block mb-1 text-sm font-medium text-text-light">UPI ID</label>
        <input 
          v-model="upiId"
          type="text"
          class="input text-sm"
          placeholder="username@provider"
        />
        <p class="text-xs text-text-muted mt-1">Format: username@provider</p>
      </div>
      
      <!-- Name input -->
      <div>
        <label class="block mb-1 text-sm font-medium text-text-light">Name (optional)</label>
        <input 
          v-model="name"
          type="text"
          class="input text-sm"
          placeholder="Payee Name"
        />
      </div>
      
      <!-- Amount input -->
      <div>
        <label class="block mb-1 text-sm font-medium text-text-light">Amount (₹)</label>
        <input 
          v-model.number="amount"
          type="number"
          min="1"
          class="input text-sm"
          placeholder="Amount in INR"
        />
      </div>
      
      <!-- Advanced toggle -->
      <div>
        <button 
          @click="showAdvanced = !showAdvanced"
          class="text-sm text-text-muted hover:text-primary transition-colors flex items-center"
        >
          <span>{{ showAdvanced ? 'Hide' : 'Show' }} Advanced Options</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            :class="showAdvanced ? 'rotate-180' : ''">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      <!-- Advanced options -->
      <div v-if="showAdvanced" class="space-y-4 p-3 bg-bg-dark rounded-lg">
        <p class="text-xs text-text-muted">
          The generated QR code will include random transaction ID and reference for testing. These are automatically generated.
        </p>
      </div>
      
      <!-- Generate button -->
      <div class="flex justify-end">
        <button 
          @click="generateQRCode"
          :disabled="isGenerating || !isValid"
          class="btn-primary text-sm"
          :class="{'opacity-50 cursor-not-allowed': isGenerating || !isValid}"
        >
          <span v-if="isGenerating">Generating...</span>
          <span v-else>Generate QR Code</span>
        </button>
      </div>
    </div>
    
    <!-- Generated QR code -->
    <div v-else class="text-center">
      <div class="mb-4">
        <img 
          :src="generatedQR.qrImage" 
          alt="Generated UPI QR Code" 
          class="mx-auto max-w-[200px] rounded-lg border border-border-dark"
        />
      </div>
      
      <div class="text-sm text-left bg-bg-dark p-3 rounded-lg mb-4">
        <div class="mb-2">
          <span class="text-text-muted">UPI URI:</span>
          <div class="font-mono text-xs text-text-light overflow-x-auto whitespace-nowrap">
            {{ generatedQR.upiUri }}
          </div>
        </div>
        
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-text-muted">UPI ID:</span>
            <span class="text-text-light">{{ generatedQR.details.upiId }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">Name:</span>
            <span class="text-text-light">{{ generatedQR.details.name || 'Not set' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">Amount:</span>
            <span class="text-text-light">₹ {{ generatedQR.details.amount || 'Not set' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">Transaction ID:</span>
            <span class="text-text-light">{{ generatedQR.details.txnId }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">Reference:</span>
            <span class="text-text-light">{{ generatedQR.details.refId }}</span>
          </div>
        </div>
      </div>
      
      <div class="flex space-x-3 justify-center">
        <button 
          @click="reset"
          class="btn-outline-secondary text-sm"
        >
          Create Another
        </button>
        
        <button 
          @click="useGeneratedQR"
          class="btn-primary text-sm"
        >
          Use This QR Code
        </button>
      </div>
    </div>
  </div>
</template>