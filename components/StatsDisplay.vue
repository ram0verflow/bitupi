<template>
  <div class="stats-display">
    <!-- Platform Stats -->
    <div v-if="view === 'platform'" class="space-y-6">
      <div class="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
        <h3 class="font-display text-lg font-medium text-text-light mb-3">Platform Statistics</h3>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="stat-card">
            <div class="text-text-muted text-sm">Current Rate</div>
            <div class="font-medium text-text-light">₹ {{ formatNumber(platformStats.currentRate) }}</div>
          </div>
          
          <div class="stat-card">
            <div class="text-text-muted text-sm">Active Orders</div>
            <div class="font-medium text-text-light">{{ platformStats.pendingOrders + platformStats.processingOrders }}</div>
          </div>
          
          <div class="stat-card">
            <div class="text-text-muted text-sm">Total Volume</div>
            <div class="font-medium text-text-light">₹ {{ formatNumber(platformStats.totalVolumeInr) }}</div>
          </div>
          
          <div class="stat-card">
            <div class="text-text-muted text-sm">Completed Orders</div>
            <div class="font-medium text-text-light">{{ platformStats.completedOrders }}</div>
          </div>
          
          <div class="stat-card bg-secondary/5 border border-secondary/20">
            <div class="text-text-muted text-sm">Active Earners</div>
            <div class="font-medium text-secondary">{{ platformStats.activeEarners }}</div>
          </div>
          
          <div class="stat-card">
            <div class="text-text-muted text-sm">Total Users Online</div>
            <div class="font-medium text-text-light">{{ platformStats.activeUsers }}</div>
          </div>
          
          <div class="stat-card">
            <div class="text-text-muted text-sm">Active Connections</div>
            <div class="font-medium text-text-light">{{ platformStats.activeSessions || 0 }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- User Stats -->
    <div v-else-if="view === 'user'" class="space-y-6">
      <div class="bg-primary/10 border border-primary/30 rounded-lg p-4">
        <h3 class="font-display text-lg font-medium text-text-light mb-3">Your Statistics</h3>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="stat-card">
            <div class="text-text-muted text-sm">Total Orders</div>
            <div class="font-medium text-text-light">{{ userStats.totalOrders }}</div>
          </div>
          
          <div class="stat-card">
            <div class="text-text-muted text-sm">Completed</div>
            <div class="font-medium text-text-light">{{ userStats.completedOrders }}</div>
          </div>
          
          <div class="stat-card">
            <div class="text-text-muted text-sm">Sent</div>
            <div class="font-medium text-primary">{{ formatNumber(userStats.totalSent) }} sats</div>
          </div>
          
          <div class="stat-card">
            <div class="text-text-muted text-sm">Received</div>
            <div class="font-medium text-success">{{ formatNumber(userStats.totalReceived) }} sats</div>
          </div>
          
          <div class="stat-card col-span-2">
            <div class="text-text-muted text-sm">Total Volume</div>
            <div class="font-medium text-text-light">₹ {{ formatNumber(userStats.totalInr) }}</div>
          </div>
        </div>
        
        <div v-if="userStats.lastUpdated" class="text-right text-xs text-text-muted mt-3">
          Last updated: {{ formatDate(userStats.lastUpdated) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import useUserStats from '~/composables/useUserStats';

const props = defineProps({
  view: {
    type: String,
    default: 'platform', // 'platform' or 'user'
    validator: (val) => ['platform', 'user'].includes(val)
  }
});

// Platform stats
const platformStats = ref({
  currentRate: 0,
  pendingOrders: 0,
  processingOrders: 0,
  completedOrders: 0,
  totalOrders: 0,
  totalVolumeInr: 0,
  totalVolumeSats: 0,
  activeEarners: 0,
  activeBuyers: 0,
  activeVisitors: 0,
  activeUsers: 0
});
const statsLoading = ref(true);
const updateInterval = ref(null);

// User stats
const { userStats } = useUserStats();

// Format large numbers with commas
function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('en-IN').format(Math.round(num));
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Fetch platform stats
async function fetchStats() {
  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    
    if (data.success) {
      platformStats.value = data.stats;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  } finally {
    statsLoading.value = false;
  }
}

// Set up auto-refresh for platform stats
function setupStatsRefresh() {
  fetchStats(); // Initial fetch
  
  // Refresh every 60 seconds
  updateInterval.value = setInterval(() => {
    fetchStats();
  }, 60000);
}

// Lifecycle hooks
onMounted(() => {
  if (process.client && props.view === 'platform') {
    setupStatsRefresh();
  }
});

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }
});
</script>

<style scoped>
.stat-card {
  @apply bg-bg-input p-3 rounded-lg;
}
</style>