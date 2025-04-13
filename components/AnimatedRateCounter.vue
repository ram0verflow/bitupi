<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useNuxtApp } from '#app';

const props = defineProps({
  initialValue: {
    type: Number,
    required: true
  }
});

const nuxtApp = useNuxtApp();
const currentValue = ref(props.initialValue);
const displayValue = ref(props.initialValue);
const trend = ref('stable'); // 'up', 'down', or 'stable'
const flashColor = ref('');

// Format currency
const formattedValue = computed(() => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(displayValue.value);
});

// Satoshi rate (per 1000 sats)
const satoshiRate = computed(() => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format((displayValue.value / 100000000) * 1000);
});

// Animate between values
function animateToValue(newValue) {
  // Determine trend
  if (newValue > currentValue.value) {
    trend.value = 'up';
    flashColor.value = 'green';
  } else if (newValue < currentValue.value) {
    trend.value = 'down';
    flashColor.value = 'red';
  } else {
    trend.value = 'stable';
    flashColor.value = '';
  }
  
  // Store the target value
  currentValue.value = newValue;
  
  // Animate the display value
  const startValue = displayValue.value;
  const difference = newValue - startValue;
  const duration = 1000; // 1 second animation
  const start = performance.now();
  
  function updateValue(timestamp) {
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    
    // Use easing for smoother animation
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    displayValue.value = startValue + difference * easedProgress;
    
    if (progress < 1) {
      requestAnimationFrame(updateValue);
    } else {
      // Ensure we end exactly at the target value
      displayValue.value = newValue;
      // Reset trend after a delay
      setTimeout(() => {
        trend.value = 'stable';
        flashColor.value = '';
      }, 1000);
    }
  }
  
  requestAnimationFrame(updateValue);
}

onMounted(() => {
  // Subscribe to exchange rate updates
  nuxtApp.hook('socket:exchange-update', (data) => {
    if (data && data.rates && data.rates.BTC_INR) {
      animateToValue(data.rates.BTC_INR);
    }
  });
});

// Watch for prop changes
watch(() => props.initialValue, (newValue) => {
  if (newValue !== currentValue.value) {
    animateToValue(newValue);
  }
});
</script>

<template>
  <div class="rate-counter">
    <div class="value-container" :class="flashColor">
      <div class="main-value" :class="trend">
        {{ formattedValue }}
      </div>
      <div class="satoshi-rate">
        {{ satoshiRate }} per 1000 sats
      </div>
      <div class="trend-indicator">
        <div v-if="trend === 'up'" class="trend-up">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd" />
          </svg>
        </div>
        <div v-else-if="trend === 'down'" class="trend-down">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rate-counter {
  @apply relative;
}

.value-container {
  @apply relative bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md border border-gray-200 dark:border-dark-border transition-all;
}

.value-container.green {
  @apply border-green-500 dark:border-green-500/50;
  animation: flash-green 1s ease-out;
}

.value-container.red {
  @apply border-red-500 dark:border-red-500/50;
  animation: flash-red 1s ease-out;
}

.main-value {
  @apply text-2xl md:text-3xl font-bold text-gray-800 dark:text-dark-text mb-1;
  font-variant-numeric: tabular-nums;
  transition: color 0.5s;
}

.main-value.up {
  @apply text-green-600 dark:text-green-400;
}

.main-value.down {
  @apply text-red-600 dark:text-red-400;
}

.satoshi-rate {
  @apply text-sm text-gray-600 dark:text-dark-text-secondary;
}

.trend-indicator {
  @apply absolute top-3 right-3;
}

.trend-up {
  @apply text-green-600 dark:text-green-400;
  animation: bounce-up 1s;
}

.trend-down {
  @apply text-red-600 dark:text-red-400;
  animation: bounce-down 1s;
}

@keyframes flash-green {
  0% { background-color: rgba(16, 185, 129, 0.2); }
  100% { background-color: transparent; }
}

@keyframes flash-red {
  0% { background-color: rgba(239, 68, 68, 0.2); }
  100% { background-color: transparent; }
}

@keyframes bounce-up {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
  60% { transform: translateY(-2px); }
}

@keyframes bounce-down {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(5px); }
  60% { transform: translateY(2px); }
}
</style>