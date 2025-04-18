// This file is deprecated and no longer needed
// Local user stats are not kept to ensure privacy
// The file remains to prevent import errors in existing code
// but all functionality has been removed

export default function useUserStats() {
  // Return empty functions that do nothing
  return {
    userStats: { value: {} },
    recordSend: () => {},
    recordReceive: () => {},
    updateTransactionStatus: () => {},
    resetStats: () => {}
  };
}