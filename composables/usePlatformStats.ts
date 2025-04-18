import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Composable for platform-wide statistics
 * Uses SSE for real-time updates and HTTP fallback
 */
export default function usePlatformStats() {
  // Platform stats with default values
  const stats = ref({
    currentRate: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    failedOrders: 0,
    totalOrders: 0,
    totalVolumeInr: 0,
    totalVolumeSats: 0,
    activeEarners: 0,
    activeBuyers: 0,
    averageOrderValueInr: 0,
    averageOrderValueSats: 0,
    lastUpdated: null,
  });
  
  const isLoading = ref(true);
  let updateInterval = null;
  
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
  
  // Fetch stats via HTTP API
  async function fetchStats() {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      
      if (data.success) {
        updateStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      isLoading.value = false;
    }
  }
  
  // Update stats from either SSE or HTTP source
  function updateStats(newStats) {
    if (!newStats) return;
    
    // Update all stats fields that are present in the new data
    Object.keys(stats.value).forEach(key => {
      if (newStats[key] !== undefined) {
        stats.value[key] = newStats[key];
      }
    });
    
    // Update timestamp
    stats.value.lastUpdated = new Date().toISOString();
  }
  
  // Set up SSE for real-time stats
  function setupSSEListener() {
    if (process.client) {
      const { $socket } = useNuxtApp();
      
      // Subscribe to stats updates
      $socket.subscribeToStats();
      
      // Listen for stats updates
      $socket.on('stats', (data) => {
        updateStats(data);
        isLoading.value = false;
      });
    }
  }
  
  // Set up fallback HTTP polling
  function setupPolling() {
    if (process.client) {
      fetchStats(); // Initial fetch
      
      // Refresh every 30 seconds
      updateInterval = setInterval(() => {
        fetchStats();
      }, 30000);
    }
  }
  
  onMounted(() => {
    if (process.client) {
      setupSSEListener();
      setupPolling(); // Still set up polling as a fallback
    }
  });
  
  onUnmounted(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    
    if (process.client) {
      const { $socket } = useNuxtApp();
      $socket.off('stats');
    }
  });
  
  return {
    stats,
    isLoading,
    formatNumber,
    formatDate
  };
}