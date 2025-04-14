<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  prefix: {
    type: String,
    default: ''
  },
  suffix: {
    type: String,
    default: ''
  },
  animationDuration: {
    type: Number,
    default: 1500
  },
  decimals: {
    type: Number,
    default: 2
  },
  autoStart: {
    type: Boolean,
    default: true
  }
});

const displayValue = ref(0);
const previousValue = ref(0);
const isAnimating = ref(false);
let animationStartTime = null;
let animationFrame = null;

// Start animation on mount if autoStart is true
onMounted(() => {
  if (props.autoStart) {
    startAnimation(0, props.value);
  }
});

// Watch for value changes
watch(() => props.value, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    previousValue.value = displayValue.value;
    startAnimation(previousValue.value, newValue);
  }
});

// Animation function
function startAnimation(startValue, endValue) {
  // Cancel any existing animation
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  
  isAnimating.value = true;
  animationStartTime = null;
  
  // Animation step function
  function step(timestamp) {
    if (!animationStartTime) animationStartTime = timestamp;
    
    const progress = Math.min((timestamp - animationStartTime) / props.animationDuration, 1);
    
    // Easing function - ease out cubic
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    // Calculate current value
    displayValue.value = startValue + (endValue - startValue) * easedProgress;
    
    // Continue animation if not complete
    if (progress < 1) {
      animationFrame = requestAnimationFrame(step);
    } else {
      // Ensure final value is exact
      displayValue.value = endValue;
      isAnimating.value = false;
      animationFrame = null;
    }
  }
  
  // Start animation
  animationFrame = requestAnimationFrame(step);
}

// Format the display value
function formatValue(value) {
  return value.toFixed(props.decimals);
}

// Clean up on component unmount
onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});
</script>

<template>
  <div class="animated-counter">
    <span class="font-display">
      {{ prefix }}{{ formatValue(displayValue) }}{{ suffix }}
    </span>
    <span 
      v-if="isAnimating" 
      class="ml-2 text-xs text-text-muted"
    >
      updating...
    </span>
  </div>
</template>