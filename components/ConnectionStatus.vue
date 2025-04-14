<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Connection status can be 'connected', 'connecting', or 'disconnected'
const status = ref('connecting');
const statusMessage = ref('Connecting...');
const showStatusDetails = ref(false);

// Use the injected socket service
const { $socket } = useNuxtApp();

onMounted(() => {
  // Check if we're on the client side
  if (process.client) {
    // Listen for any SSE events to determine if we're connected
    $socket.on('stats', () => {
      if (status.value !== 'connected') {
        status.value = 'connected';
        statusMessage.value = 'Connected via SSE';
      }
    });
    
    $socket.on('exchange-rate', () => {
      if (status.value !== 'connected') {
        status.value = 'connected';
        statusMessage.value = 'Connected via SSE';
      }
    });
    
    // Initialize connection status check
    checkConnectionStatus();
  }
});

function checkConnectionStatus() {
  // Check if we're connected
  if ($socket.isConnected()) {
    status.value = 'connected';
    statusMessage.value = 'Connected via SSE';
  } else {
    status.value = 'connecting';
    statusMessage.value = 'Connecting...';
    
    // Try again after a delay
    setTimeout(checkConnectionStatus, 2000);
  }
}

onUnmounted(() => {
  // Clean up event listeners
  $socket.off('stats');
  $socket.off('exchange-rate');
});

function toggleStatusDetails() {
  showStatusDetails.value = !showStatusDetails.value;
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50">
    <div class="relative">
      <!-- Status indicator button -->
      <button 
        @click="toggleStatusDetails" 
        class="flex items-center space-x-2 bg-bg-card py-2 px-3 rounded-full shadow-md border border-border-dark hover:border-primary transition-all"
      >
        <div :class="[
          'status-dot',
          status === 'connected' ? 'connected' : 
          status === 'connecting' ? 'connecting' : 'disconnected'
        ]"></div>
        <span v-if="showStatusDetails" class="text-sm text-text-light">{{ statusMessage }}</span>
      </button>
      
      <!-- Detailed status info popup -->
      <div 
        v-if="showStatusDetails"
        class="absolute bottom-full right-0 mb-2 p-4 bg-bg-card rounded-lg shadow-lg border border-border-dark w-64 fade-in"
      >
        <h4 class="font-display text-sm font-medium text-text-light mb-2">Connection Status</h4>
        <div class="flex items-center space-x-2 mb-3">
          <div :class="[
            'status-dot',
            status === 'connected' ? 'connected' : 
            status === 'connecting' ? 'connecting' : 'disconnected'
          ]"></div>
          <p class="text-sm text-text-light">{{ statusMessage }}</p>
        </div>
        <p class="text-xs text-text-muted">
          {{ status === 'connected' 
            ? 'You are connected to the real-time service' 
            : status === 'connecting' 
              ? 'Trying to establish connection...'
              : 'Connection to real-time service lost. Retrying...'
          }}
        </p>
      </div>
    </div>
  </div>
</template>