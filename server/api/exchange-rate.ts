export default defineEventHandler(async (event) => {
  try {
    // In a real app, we would fetch data from a reliable exchange API
    // For demo purposes, we'll simulate a response
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Generate a somewhat realistic exchange rate with minor random fluctuations
    const baseRate = 5600000 // 1 BTC = ~₹5,600,000
    const fluctuation = 1 + (Math.random() * 0.04 - 0.02) // ±2%
    const currentRate = Math.round(baseRate * fluctuation)
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      rates: {
        BTC_INR: currentRate,
        SAT_INR: currentRate / 100000000
      },
      source: 'BitUPI Demo API'
    }
  } catch (error) {
    console.error('Exchange rate fetch error:', error)
    return {
      success: false,
      error: 'Failed to fetch exchange rate'
    }
  }
})