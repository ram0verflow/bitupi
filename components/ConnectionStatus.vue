<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useNuxtApp } from '#app';

const nuxtApp = useNuxtApp();
const connectionStatus = ref('connecting');
const transportType = ref('initializing');
const isVisible = ref(false);
const showDetails = ref(false);
const reconnectAttempt = ref(0);

function updateStatus(status) {
  connectionStatus.value = status;
  if (status === 'connecting') {
    reconnectAttempt.value++;
  } else {
    reconnectAttempt.value = 0;
  }
}

function updateTransport(transport) {
  transportType.value = transport || 'unknown';
}

function toggleDetails() {
  showDetails.value = !showDetails.value;
}

onMounted(() => {
  // Show after a short delay to avoid flashing during initial load
  setTimeout(() => {
    isVisible.value = true;
  }, 1500);

  // Connection status listener
  nuxtApp.hook('socket:connection-status', (status) => {
    updateStatus(status);
  });

  // Transport type listener
  nuxtApp.hook('socket:transport-change', (transport) => {
    updateTransport(transport);
  });
});

onUnmounted(() => {
  // Clean up if needed
});
</script>

<template>
  <div 
    v-if="isVisible" 
    class="connection-status"
    :class="{ 
      'connected': connectionStatus === 'connected',
      'connecting': connectionStatus === 'connecting',
      'disconnected': connectionStatus === 'disconnected',
      'expanded': showDetails
    }"
    @click="toggleDetails"
  >
    <div class="status-indicator">
      <div class="status-dot"></div>
      <span class="status-text">{{ connectionStatus }}</span>
    </div>
    
    <div v-if="showDetails" class="connection-details fade-in">
      <div class="transport-info">
        <span class="label">Transport:</span>
        <span class="value">{{ transportType }}</span>
      </div>
      <div v-if="reconnectAttempt > 0" class="reconnect-info">
        <span class="label">Reconnect attempts:</span>
        <span class="value">{{ reconnectAttempt }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.connection-status {
  @apply fixed bottom-4 right-4 bg-white dark:bg-dark-surface rounded-full shadow-md 
  border border-gray-200 dark:border-dark-border px-3 py-1.5 text-xs cursor-pointer z-50;
  transition: all 0.3s ease;
}

.connection-status:hover {
  transform: translateY(-2px);
  @apply shadow-lg;
}

.connection-status.expanded {
  @apply rounded-lg;
  transform: translateY(-2px);
}

.status-indicator {
  @apply flex items-center;
}

.status-dot {
  @apply h-2 w-2 rounded-full mr-2;
}

.connected .status-dot {
  @apply bg-green-500;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.connecting .status-dot {
  @apply bg-yellow-400;
  animation: pulse 1.5s infinite;
}

.disconnected .status-dot {
  @apply bg-red-500;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
}

.status-text {
  @apply font-medium capitalize;
}

.connected .status-text {
  @apply text-green-600 dark:text-green-400;
}

.connecting .status-text {
  @apply text-yellow-600 dark:text-yellow-400;
}

.disconnected .status-text {
  @apply text-red-600 dark:text-red-400;
}

.connection-details {
  @apply mt-2 pt-2 border-t border-gray-200 dark:border-dark-border;
}

.transport-info, .reconnect-info {
  @apply flex justify-between items-center text-gray-600 dark:text-dark-text-secondary mb-1;
}

.label {
  @apply mr-3 opacity-70;
}

.value {
  @apply font-mono font-medium;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}
</style>