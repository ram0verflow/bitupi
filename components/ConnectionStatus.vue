<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

// Connection status can be 'connected', 'connecting', or 'disconnected'
const status = ref('connecting');
const statusMessage = ref('Connecting...');
const showStatusDetails = ref(false);
const activeEarners = ref(0);
const showEarnerBadge = ref(true);

// Use the injected socket service
const { $socket } = useNuxtApp();

// Compute display for earner count badge
const earnerBadgeText = computed(() => {
  return activeEarners.value === 1
    ? '1 earner online'
    : `${activeEarners.value} earners online`;
});

// Only show positive badge with success color
const earnerBadgeColor = computed(() => {
  return 'bg-success/20 text-success border-success/30';
});

onMounted(() => {
  // Check if we're on the client side
  if (process.client) {
    // Listen for any SSE events to determine if we're connected
    $socket.on('stats', (data) => {
      if (status.value !== 'connected') {
        status.value = 'connected';
        statusMessage.value = 'Connected via SSE';
      }
      
      // Update active earners count if available
      if (data && typeof data.activeEarners === 'number') {
        activeEarners.value = data.activeEarners;
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

function toggleEarnerBadge() {
  showEarnerBadge.value = !showEarnerBadge.value;
}
</script>

<template>
  <div>
    <!-- Earner count badge - only shown when earners are online -->
    <div v-if="showEarnerBadge && status === 'connected' && activeEarners > 0" 
         class="fixed top-20 right-4 z-50 py-2 px-4 rounded-lg shadow-md border animate-fadeIn animate-pulse-subtle transition-all"
         :class="earnerBadgeColor">
      <div class="flex items-center space-x-2">
        <div class="flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <span class="font-medium text-sm">{{ earnerBadgeText }}</span>
        <button @click="toggleEarnerBadge" class="ml-2 p-1 rounded-full hover:bg-black/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  
    <!-- Connection status indicator -->
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
          
          <!-- Add active earners info to the connection popup, only when there are earners -->
          <div v-if="status === 'connected' && activeEarners > 0" class="mt-3 pt-3 border-t border-border-dark">
            <div class="flex items-center space-x-2">
              <div class="text-success">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span class="text-sm text-text-light font-medium">{{ earnerBadgeText }}</span>
            </div>
          </div>
          
          <p class="text-xs text-text-muted mt-3">
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
  </div>
</template>