<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  order: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    default: 'buy', // buy or earn
    validator: (value) => ['buy', 'earn'].includes(value)
  },
  selectable: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    default: 'pending' // pending, processing, completed, expired, error
  }
});

const emit = defineEmits(['select', 'action']);

const formattedAmount = computed(() => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(props.order.inrAmount);
});

const formattedSats = computed(() => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  }).format(props.order.satAmount);
});

const statusClass = computed(() => {
  const statusMap = {
    'pending': 'bg-warning/20 text-warning border-warning/30',
    'processing': 'bg-info/20 text-info border-info/30',
    'completed': 'bg-success/20 text-success border-success/30',
    'expired': 'bg-error/20 text-error border-error/30',
    'error': 'bg-error/20 text-error border-error/30'
  };
  return statusMap[props.status] || statusMap.pending;
});

const statusText = computed(() => {
  const statusMap = {
    'pending': 'Pending',
    'processing': 'Processing',
    'completed': 'Completed',
    'expired': 'Expired',
    'error': 'Failed'
  };
  return statusMap[props.status] || 'Pending';
});

const actionText = computed(() => {
  if (props.type === 'buy') {
    if (props.status === 'pending') return 'Waiting for payment';
    if (props.status === 'processing') return 'Verify payment';
    if (props.status === 'completed') return 'Completed';
    if (props.status === 'expired') return 'Order expired';
    return 'View details';
  } else {
    if (props.status === 'pending') return 'Claim order';
    if (props.status === 'processing') return 'Send UPI payment';
    if (props.status === 'completed') return 'Funds received';
    if (props.status === 'expired') return 'Order expired';
    return 'View details';
  }
});

function handleAction() {
  emit('action', props.order);
}

function handleSelect() {
  if (props.selectable) {
    emit('select', props.order);
  }
}

// Calculate time remaining if there's an expiry time
const timeRemaining = computed(() => {
  if (!props.order.expiresAt) return null;
  
  const now = Date.now();
  const expiry = new Date(props.order.expiresAt).getTime();
  const remaining = Math.max(0, expiry - now);
  
  if (remaining <= 0) return '0:00';
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});
</script>

<template>
  <div 
    class="card transition-all duration-200 cursor-pointer hover:border-primary/50 hover:shadow-md"
    :class="{
      'border-primary shadow-primary': selected,
      'shadow-md': status === 'processing',
      'opacity-75': status === 'expired'
    }"
    @click="handleSelect"
  >
    <!-- Order header with status and ID -->
    <div class="flex justify-between items-center mb-4">
      <div 
        class="text-xs font-medium px-2 py-1 rounded-full"
        :class="statusClass"
      >
        {{ statusText }}
      </div>
      <div class="text-text-muted text-xs font-mono">
        ID: {{ order.id.substring(0, 8) }}
      </div>
    </div>
    
    <!-- Order amount details -->
    <div class="mb-6">
      <div class="flex justify-between items-baseline mb-2">
        <h3 class="font-display text-xl font-medium text-text-light">{{ formattedAmount }}</h3>
        <span v-if="timeRemaining" class="text-xs text-text-muted">
          Expires in: <span :class="{'text-warning': timeRemaining && parseInt(timeRemaining) < 5}">{{ timeRemaining }}</span>
        </span>
      </div>
      <div class="text-primary text-sm">
        {{ formattedSats }} sats
      </div>
    </div>
    
    <!-- UPI details if available -->
    <div v-if="order.upiId" class="mb-4 bg-bg-input p-3 rounded-lg border border-border-dark">
      <div class="text-xs text-text-muted mb-1">Payment to</div>
      <div class="flex items-center justify-between">
        <div class="font-medium text-secondary truncate">{{ order.upiId }}</div>
        <div class="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">UPI</div>
      </div>
    </div>
    
    <!-- Action button -->
    <button 
      class="w-full btn-dark mt-2 flex justify-center items-center"
      :class="{
        'btn-primary': type === 'earn' && status === 'pending',
        'btn-outline-primary': type === 'buy' && ['pending', 'processing'].includes(status),
        'btn-outline-secondary': type === 'earn' && ['processing'].includes(status),
        'opacity-50 cursor-not-allowed': status === 'expired'
      }"
      @click.stop="handleAction"
      :disabled="status === 'expired'"
    >
      {{ actionText }}
      
      <svg v-if="type === 'earn' && status === 'pending'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</template>