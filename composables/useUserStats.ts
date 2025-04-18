import { ref, onMounted } from 'vue';

export default function useUserStats() {
  const userStats = ref({
    totalOrders: 0,
    completedOrders: 0,
    totalSent: 0,     // sats
    totalReceived: 0, // sats
    totalInr: 0,      // INR processed
    lastUpdated: null,
  });

  const STORAGE_KEY = 'bitupi_user_stats';

  // Load stats from localStorage
  function loadStats() {
    if (process.client) {
      const storedStats = localStorage.getItem(STORAGE_KEY);
      if (storedStats) {
        try {
          userStats.value = JSON.parse(storedStats);
        } catch (error) {
          console.error('Error parsing user stats:', error);
          // Reset stats if parsing fails
          resetStats();
        }
      }
    }
  }

  // Save stats to localStorage
  function saveStats() {
    if (process.client) {
      userStats.value.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userStats.value));
    }
  }

  // Reset stats
  function resetStats() {
    userStats.value = {
      totalOrders: 0,
      completedOrders: 0,
      totalSent: 0,
      totalReceived: 0,
      totalInr: 0,
      lastUpdated: new Date().toISOString(),
    };
    saveStats();
  }

  // Record a send transaction
  function recordSend(inrAmount: number, satAmount: number, completed = false) {
    userStats.value.totalOrders++;
    if (completed) {
      userStats.value.completedOrders++;
      userStats.value.totalSent += satAmount;
      userStats.value.totalInr += inrAmount;
    }
    saveStats();
  }

  // Record a receive transaction
  function recordReceive(inrAmount: number, satAmount: number, reward: number, completed = false) {
    userStats.value.totalOrders++;
    if (completed) {
      userStats.value.completedOrders++;
      userStats.value.totalReceived += (satAmount + reward);
      userStats.value.totalInr += inrAmount;
    }
    saveStats();
  }

  // Update transaction status
  function updateTransactionStatus(isSend: boolean, completed: boolean, inrAmount: number, satAmount: number, reward = 0) {
    if (completed) {
      userStats.value.completedOrders++;
      if (isSend) {
        userStats.value.totalSent += satAmount;
      } else {
        userStats.value.totalReceived += (satAmount + reward);
      }
      userStats.value.totalInr += inrAmount;
      saveStats();
    }
  }

  // Initialize on component mount
  onMounted(() => {
    loadStats();
  });

  return {
    userStats,
    recordSend,
    recordReceive,
    updateTransactionStatus,
    resetStats
  };
}