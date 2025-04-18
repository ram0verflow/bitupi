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
          
          <!-- Total Users Online and Active Connections removed for privacy -->
        </div>
      </div>
    </div>
    
    <!-- No User Stats section anymore - removed to align with no persistent data storage requirement -->
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import usePlatformStats from '~/composables/usePlatformStats';

const props = defineProps({
  view: {
    type: String,
    default: 'platform', 
    validator: (val) => val === 'platform'
  }
});

// Use the platform stats composable
const { stats: platformStats, isLoading: statsLoading, formatNumber, formatDate } = usePlatformStats();
</script>

<style scoped>
.stat-card {
  @apply bg-bg-input p-3 rounded-lg;
}
</style>