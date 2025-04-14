<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Connection status can be 'connected', 'connecting', or 'disconnected'
const status = ref('connecting');
const statusMessage = ref('Connecting...');
const showStatusDetails = ref(false);
const socket = ref(null);

onMounted(() => {
  // Check if we're on the client side
  if (process.client) {
    // Get the socket from the Nuxt app context
    socket.value = window.$nuxt?.$socket;
    
    if (socket.value) {
      // Listen for socket events
      socket.value.on('connect', () => {
        status.value = 'connected';
        statusMessage.value = 'Connected';
      });
      
      socket.value.on('disconnect', () => {
        status.value = 'disconnected';
        statusMessage.value = 'Disconnected';
      });
      
      socket.value.on('connect_error', (error) => {
        status.value = 'disconnected';
        statusMessage.value = `Connection error: ${error.message}`;
      });
      
      socket.value.on('connect_timeout', () => {
        status.value = 'disconnected';
        statusMessage.value = 'Connection timeout';
      });
      
      socket.value.on('reconnecting', (attemptNumber) => {
        status.value = 'connecting';
        statusMessage.value = `Reconnecting (attempt ${attemptNumber})...`;
      });
      
      // Check initial connection status
      if (socket.value.connected) {
        status.value = 'connected';
        statusMessage.value = 'Connected';
      } else {
        status.value = 'connecting';
        statusMessage.value = 'Connecting...';
      }
    } else {
      status.value = 'disconnected';
      statusMessage.value = 'Socket not initialized';
    }
    
    // Fallback using SSE if socket fails
    const checkSocketTimeout = setTimeout(() => {
      if (status.value !== 'connected') {
        initSSEFallback();
      }
    }, 5000);
    
    return () => clearTimeout(checkSocketTimeout);
  }
});

function initSSEFallback() {
  // Only initialize SSE if we're on client and socket isn't working
  if (!process.client || status.value === 'connected') return;
  
  try {
    const eventSource = new EventSource('/api/sse/stats');
    
    eventSource.onopen = () => {
      status.value = 'connected';
      statusMessage.value = 'Connected (SSE)';
    };
    
    eventSource.onerror = () => {
      if (status.value === 'connected') {
        status.value = 'disconnected';
        statusMessage.value = 'SSE Connection lost';
      }
    };
    
    onUnmounted(() => {
      eventSource.close();
    });
  } catch (error) {
    console.error('Failed to initialize SSE:', error);
  }
}

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