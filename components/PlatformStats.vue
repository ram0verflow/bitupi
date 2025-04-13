<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useNuxtApp } from '#app';

const nuxtApp = useNuxtApp();
const stats = ref({
  activeSessions: 0,
  activeEarners: 0,
  pendingOrders: 0,
  successfulTransactions: 0,
  failedTransactions: 0,
  totalTransactions: 0,
  uptime: '0s',
  currentRate: 0,
  currentTransport: 'connecting...'
});

const isLoading = ref(true);
const connectionStatus = ref('connecting');
const animated = ref(true);

// For animation effects
const transitionValues = ref({
  activeSessions: 0,
  activeEarners: 0,
  pendingOrders: 0,
  successfulTransactions: 0,
  failedTransactions: 0,
  totalTransactions: 0
});

// Function to animate number changes
function animateValue(property, start, end, duration = 800) {
  if (!animated.value) {
    transitionValues.value[property] = end;
    return;
  }
  
  const startTime = performance.now();
  const updateValue = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Easing function for smoother animation
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    
    transitionValues.value[property] = Math.floor(start + (end - start) * easedProgress);
    
    if (progress < 1) {
      requestAnimationFrame(updateValue);
    }
  };
  
  requestAnimationFrame(updateValue);
}

// Update stats with animation
function updateStatsWithAnimation(newStats) {
  if (!newStats) return;
  
  for (const [key, value] of Object.entries(newStats)) {
    if (typeof value === 'number' && key in transitionValues.value) {
      animateValue(key, transitionValues.value[key], value);
    }
    stats.value[key] = value;
  }
  
  isLoading.value = false;
}

// Update connection status
function updateConnectionStatus(status) {
  connectionStatus.value = status;
}

// Get initial stats
async function fetchInitialStats() {
  try {
    const response = await fetch('/api/stats');
    if (response.ok) {
      const data = await response.json();
      updateStatsWithAnimation(data);
    }
  } catch (error) {
    console.error('Failed to fetch initial stats:', error);
  }
}

onMounted(async () => {
  await fetchInitialStats();
  
  // Listen for socket stats updates
  nuxtApp.hook('socket:stats-update', (data) => {
    updateStatsWithAnimation(data);
  });
  
  // Listen for socket connection status
  nuxtApp.hook('socket:connection-status', (status) => {
    updateConnectionStatus(status);
  });
});

onUnmounted(() => {
  // Clean up listeners if needed
});

// Toggle animations
function toggleAnimations() {
  animated.value = !animated.value;
}
</script>

<template>
  <div class="platform-stats">
    <div class="stats-header">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-dark-text mb-2 flex items-center">
        <span>Platform Status</span>
        <div class="ml-3 connection-indicator">
          <div :class="{
            'pulse': connectionStatus === 'connecting',
            'connected': connectionStatus === 'connected',
            'disconnected': connectionStatus === 'disconnected'
          }"></div>
          <span class="text-xs text-gray-500 dark:text-dark-text-secondary ml-1">
            {{ connectionStatus === 'connected' ? stats.currentTransport : connectionStatus }}
          </span>
        </div>
      </h3>
    </div>
    
    <div v-if="isLoading" class="stats-loading">
      <div class="stats-skeleton">
        <div v-for="i in 6" :key="i" class="skeleton-item"></div>
      </div>
    </div>
    
    <div v-else class="stats-grid">
      <div class="stat-card" data-aos="fade-up" data-aos-delay="100">
        <div class="stat-icon bg-lightning-blue/10 text-lightning-blue">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ transitionValues.activeSessions }}</div>
          <div class="stat-label">Active Sessions</div>
        </div>
      </div>
      
      <div class="stat-card" data-aos="fade-up" data-aos-delay="150">
        <div class="stat-icon bg-upi-green/10 text-upi-green">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ transitionValues.activeEarners }}</div>
          <div class="stat-label">Active Earners</div>
        </div>
      </div>
      
      <div class="stat-card" data-aos="fade-up" data-aos-delay="200">
        <div class="stat-icon bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 8a1 1 0 11-2 0 1 1 0 012 0zm-1-3a1 1 0 00-1 1v3a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ transitionValues.pendingOrders }}</div>
          <div class="stat-label">Pending Orders</div>
        </div>
      </div>
      
      <div class="stat-card" data-aos="fade-up" data-aos-delay="250">
        <div class="stat-icon bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ transitionValues.successfulTransactions }}</div>
          <div class="stat-label">Successful Transactions</div>
        </div>
      </div>
      
      <div class="stat-card" data-aos="fade-up" data-aos-delay="300">
        <div class="stat-icon bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ transitionValues.failedTransactions }}</div>
          <div class="stat-label">Failed Transactions</div>
        </div>
      </div>
      
      <div class="stat-card" data-aos="fade-up" data-aos-delay="350">
        <div class="stat-icon bg-lightning-purple/10 text-lightning-purple">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-value uptime-value">{{ stats.uptime }}</div>
          <div class="stat-label">Server Uptime</div>
        </div>
      </div>
    </div>
    
    <div class="text-right mt-2">
      <button @click="toggleAnimations" class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        {{ animated ? 'Disable animations' : 'Enable animations' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.platform-stats {
  @apply bg-white dark:bg-dark-surface rounded-lg shadow-md p-4 border border-gray-200 dark:border-dark-border;
}

.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-3 gap-4;
}

.stat-card {
  @apply flex items-center p-3 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  @apply shadow-lg;
}

.stat-icon {
  @apply p-2 rounded-full mr-3 flex-shrink-0;
}

.stat-content {
  @apply flex-grow;
}

.stat-value {
  @apply text-xl font-bold text-gray-800 dark:text-dark-text;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  @apply text-xs text-gray-500 dark:text-dark-text-secondary;
}

.connection-indicator {
  @apply flex items-center;
}

.connection-indicator div {
  @apply w-2 h-2 rounded-full;
}

.pulse {
  @apply bg-yellow-400;
  animation: pulse 1.5s infinite;
}

.connected {
  @apply bg-green-500;
}

.disconnected {
  @apply bg-red-500;
}

.uptime-value {
  @apply text-lg;
}

/* Loading skeletons */
.stats-loading {
  @apply py-4;
}

.stats-skeleton {
  @apply grid grid-cols-2 md:grid-cols-3 gap-4;
}

.skeleton-item {
  @apply h-16 bg-gray-200 dark:bg-dark-border rounded animate-pulse;
}

@keyframes pulse {
  0% {
    opacity: 0.5;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}
</style>