<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import AnimatedRateCounter from '~/components/AnimatedRateCounter.vue';
import StatsDisplay from '~/components/StatsDisplay.vue';
import useUserStats from '~/composables/useUserStats';

const router = useRouter();
const currentRate = ref(0);
const isLoading = ref(true);
const randomInsight = ref(null);
const insightLoading = ref(false);
const rateSource = ref('');
const lastUpdated = ref('');
const activeEarnerCount = ref(0);
const activeSessionCount = ref(0);

// Function to navigate to send or receive pages
function navigateTo(path) {
  router.push(path);
}

// Get current BTC to INR exchange rate
async function fetchExchangeRate() {
  try {
    isLoading.value = true;
    const response = await fetch('/api/exchange-rate');
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }
    
    const data = await response.json();
    currentRate.value = data.rate;
    
    // Track the source and update time
    if (data.source) {
      rateSource.value = data.source;
    }
    
    if (data.timestamp) {
      lastUpdated.value = new Date(data.timestamp).toLocaleTimeString();
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
  } finally {
    isLoading.value = false;
  }
}

// Fetch a random philosophical insight with error handling and retry
async function fetchRandomInsight() {
  if (insightLoading.value) return; // Don't allow concurrent fetches
  
  try {
    insightLoading.value = true;
    
    // Using AbortController to set a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch('/api/random-insight', {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error('Failed to fetch insight');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Fade out the current insight before updating
      if (randomInsight.value) {
        // Small artificial delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      randomInsight.value = {
        heading: data.heading,
        insight: data.insight,
        isFallback: data.fallback || false
      };
    }
  } catch (error) {
    console.error('Error fetching insight:', error);
    // Don't update UI on error, keep the current insight
  } finally {
    insightLoading.value = false;
  }
}

// Rotate insights automatically with progressive intervals
let insightInterval;
let fetchAttempts = 0;
const maxInterval = 30000; // 30 seconds max
const minInterval = 10000; // 10 seconds min

function startInsightRotation() {
  // First fetch immediately
  fetchRandomInsight();
  
  // Then set up interval with progressive timing
  function scheduleNextFetch() {
    // Calculate next interval - increases with each fetch, up to maxInterval
    const interval = Math.min(maxInterval, minInterval + (fetchAttempts * 5000));
    
    insightInterval = setTimeout(() => {
      fetchRandomInsight();
      fetchAttempts++;
      scheduleNextFetch();
    }, interval);
  }
  
  scheduleNextFetch();
}

function stopInsightRotation() {
  if (insightInterval) {
    clearTimeout(insightInterval);
    insightInterval = null;
  }
}

// Set up SSE for real-time rate updates
function setupRealTimeUpdates() {
  if (process.client) {
    try {
      const { $socket } = useNuxtApp();
      
      // Subscribe to exchange rate updates
      $socket.subscribeToExchangeRates();
      
      // Subscribe to stats updates
      $socket.subscribeToStats();
      
      // Listen for exchange rate updates
      $socket.on('exchange-rate', (data) => {
        if (data && data.rates && data.rates.BTC_INR) {
          currentRate.value = data.rates.BTC_INR;
          
          // Update source and timestamp
          if (data.source) {
            rateSource.value = data.source;
          }
          
          if (data.timestamp) {
            lastUpdated.value = new Date(data.timestamp).toLocaleTimeString();
          }
        }
      });
      
      // Listen for stats updates
      $socket.on('stats', (data) => {
        if (data) {
          if (typeof data.activeEarners === 'number') {
            activeEarnerCount.value = data.activeEarners;
          }
          if (typeof data.activeSessions === 'number') {
            activeSessionCount.value = data.activeSessions;
          }
        }
      });
      
      // Cleanup on component unmount
      onUnmounted(() => {
        $socket.off('exchange-rate');
        $socket.off('stats');
      });
    } catch (error) {
      console.error('Failed to initialize real-time updates:', error);
    }
  }
}

onMounted(() => {
  fetchExchangeRate();
  setupRealTimeUpdates();
  // Enable random insights feature
  if (process.client) {
    startInsightRotation();
    
    // Register as visitor
    try {
      fetch('/api/ping?type=visitor');
    } catch (error) {
      console.error('Failed to ping as visitor:', error);
    }
  }
});

onUnmounted(() => {
  stopInsightRotation();
});
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="section bg-bg-dark">
      <div class="container px-6 py-16 mx-auto">
        <div class="flex flex-col md:flex-row items-center">
          <div class="md:w-1/2 lg:pr-12 mb-10 md:mb-0">
            <h1 class="font-display text-4xl md:text-5xl font-bold text-text-light mb-6 leading-tight">
              <span class="text-primary">Bitcoin Lightning</span> to 
              <span class="text-secondary">UPI</span> Exchange
            </h1>
            <p class="text-text-muted text-lg mb-8 max-w-xl">
              Instantly exchange Bitcoin over Lightning Network to Indian UPI accounts. No registration, no KYC, just pure peer-to-peer transactions.
            </p>
            
            <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button @click="navigateTo('/send')" class="btn-primary">
                Send to UPI
              </button>
              <button @click="navigateTo('/receive')" class="btn-secondary">
                Receive Sats
              </button>
            </div>
          </div>
          
          <div class="md:w-1/2 flex justify-center">
            <div class="card p-8 w-full max-w-lg">
              <h2 class="font-display text-2xl font-medium text-text-light mb-6">Current Exchange Rate</h2>
              
              <div class="bg-bg-input p-4 rounded-lg border border-border-dark mb-6">
                <div class="flex justify-between items-center">
                  <span class="text-text-muted">1 BTC</span>
                  <span>=</span>
                  <div class="font-display text-xl font-medium">
                    <div v-if="isLoading" class="animate-pulse bg-border-dark h-6 w-32 rounded"></div>
                    <AnimatedRateCounter v-else :value="currentRate" prefix="₹ " :decimals="2" />
                  </div>
                </div>
              </div>
              
              <div class="text-text-muted text-sm">
                <div v-if="rateSource && lastUpdated" class="flex flex-wrap justify-between text-xs mb-2">
                  <span>Source: <span class="text-primary capitalize">{{ rateSource }}</span></span>
                  <span>Updated: {{ lastUpdated }}</span>
                </div>
                Rate updates in real-time. A small fee is applied to each transaction to support the service.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- How It Works Section -->
    <section class="section bg-bg-card">
      <div class="container py-16">
        <div class="text-center mb-12">
          <h2 class="font-display text-3xl font-medium text-text-light mb-4">How It Works</h2>
          <p class="text-text-muted max-w-2xl mx-auto">Simple, fast, and secure way to exchange Bitcoin to UPI and back</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Send to UPI -->
          <div class="card hover:shadow-md transition-all duration-300 hover:border-primary/30">
            <div class="text-primary mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h3 class="font-display text-xl font-medium text-text-light mb-3">Send to UPI</h3>
            <div class="flex flex-col text-text-muted space-y-3 mb-4">
              <p class="flex items-start">
                <span class="text-primary font-medium mr-2">1.</span>
                Enter INR amount and upload UPI QR
              </p>
              <p class="flex items-start">
                <span class="text-primary font-medium mr-2">2.</span>
                Wait for someone to process your payment
              </p>
              <p class="flex items-start">
                <span class="text-primary font-medium mr-2">3.</span>
                Confirm receipt and your sats are sent
              </p>
            </div>
            <button @click="navigateTo('/send')" class="btn-outline-primary mt-2 w-full">Start Now</button>
          </div>
          
          <!-- Receive Sats -->
          <div class="card hover:shadow-md transition-all duration-300 hover:border-secondary/30">
            <div class="text-secondary mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <h3 class="font-display text-xl font-medium text-text-light mb-3">Receive Sats</h3>
            <div class="flex flex-col text-text-muted space-y-3 mb-4">
              <p class="flex items-start">
                <span class="text-secondary font-medium mr-2">1.</span>
                Browse available orders in real-time
              </p>
              <p class="flex items-start">
                <span class="text-secondary font-medium mr-2">2.</span>
                Make UPI payment and upload receipt
              </p>
              <p class="flex items-start">
                <span class="text-secondary font-medium mr-2">3.</span>
                Get sats to your Lightning wallet
              </p>
            </div>
            <button @click="navigateTo('/receive')" class="btn-outline-secondary mt-2 w-full">Start Now</button>
          </div>
          
          <!-- Why Choose Us -->
          <div class="card hover:shadow-md transition-all duration-300">
            <div class="text-info mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="font-display text-xl font-medium text-text-light mb-3">Why Choose Us</h3>
            <div class="flex flex-col text-text-muted space-y-3 mb-4">
              <p class="flex items-start">
                <span class="text-info font-medium mr-2">•</span>
                No accounts or KYC required
              </p>
              <p class="flex items-start">
                <span class="text-info font-medium mr-2">•</span>
                Real-time Bitcoin exchange rates
              </p>
              <p class="flex items-start">
                <span class="text-info font-medium mr-2">•</span>
                Lightning-fast transactions
              </p>
              <p class="flex items-start">
                <span class="text-info font-medium mr-2">•</span>
                No data storage, complete privacy
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- FAQ Section -->
    <section class="section bg-bg-dark">
      <div class="container py-16">
        <div class="text-center mb-12">
          <h2 class="font-display text-3xl font-medium text-text-light mb-4">Frequently Asked Questions</h2>
          <p class="text-text-muted max-w-2xl mx-auto">Everything you need to know about LN2UPI</p>
        </div>
        
        <div class="max-w-3xl mx-auto">
          <div class="space-y-6">
            <div class="card hover:border-primary/30 transition-all">
              <h3 class="font-display text-xl font-medium text-text-light mb-2">How secure is LN2UPI?</h3>
              <p class="text-text-muted">
                All transactions are peer-to-peer with no middleman. We don't store your data or payment details. 
                Lightning Network's payment protocol ensures your bitcoin is secure throughout the process.
              </p>
            </div>
            
            <div class="card hover:border-primary/30 transition-all">
              <h3 class="font-display text-xl font-medium text-text-light mb-2">Are there any fees?</h3>
              <p class="text-text-muted">
                Yes, a small fee is applied to each transaction to maintain the service and incentivize liquidity providers. 
                The exact fee is shown upfront before you confirm any transaction.
              </p>
            </div>
            
            <div class="card hover:border-primary/30 transition-all">
              <h3 class="font-display text-xl font-medium text-text-light mb-2">How fast are the transactions?</h3>
              <p class="text-text-muted">
                Lightning Network transactions are near-instant. The overall process depends on how quickly 
                someone processes your UPI payment, but most transactions complete within minutes.
              </p>
            </div>
            
            <div class="card hover:border-primary/30 transition-all">
              <h3 class="font-display text-xl font-medium text-text-light mb-2">What if something goes wrong?</h3>
              <p class="text-text-muted">
                Our platform uses a verification system to ensure both parties confirm successful payments. 
                If a problem occurs, the transaction will timeout and funds will be returned to the original sender.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Bitcoin Insights Section -->
    <section class="section bg-secondary/5">
      <div class="container py-16">
        <div class="text-center mb-12">
          <h2 class="font-display text-3xl font-medium text-text-light mb-4">Bitcoin Insights</h2>
          <p class="text-text-muted max-w-2xl mx-auto">Philosophical reflections on Bitcoin and its impact on humanity</p>
        </div>
        
        <div class="max-w-3xl mx-auto">
          <div class="card p-8 border-secondary/30">
            <div v-if="insightLoading || !randomInsight" class="animate-pulse">
              <div class="h-6 bg-border-dark rounded w-1/3 mb-4"></div>
              <div class="h-4 bg-border-dark rounded w-full mb-2"></div>
              <div class="h-4 bg-border-dark rounded w-5/6 mb-2"></div>
              <div class="h-4 bg-border-dark rounded w-4/6"></div>
            </div>
            
            <div v-else class="transition-opacity duration-500">
              <h3 class="font-display text-xl font-medium text-secondary mb-4">{{ randomInsight.heading }}</h3>
              <p class="text-text-light italic">{{ randomInsight.insight }}</p>
              <div class="text-xs text-text-muted mt-4 text-right">~ From satoshinotebook.com</div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Stats Section -->
    <section class="section bg-bg-card">
      <div class="container py-16">
        <div class="text-center mb-12">
          <h2 class="font-display text-3xl font-medium text-text-light mb-4">Platform Statistics</h2>
          <p class="text-text-muted max-w-2xl mx-auto">Real-time data and your personal statistics</p>
        </div>
        
        <div class="max-w-4xl mx-auto mb-8">
          <div class="flex justify-center">
            <div class="bg-secondary/10 border border-secondary/30 rounded-lg px-8 py-4 flex items-center space-x-4">
              <div class="text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 class="font-display text-xl font-medium text-text-light">Currently <span class="text-secondary">{{ activeEarnerCount }}</span> Earners Online</h3>
                <p class="text-text-muted">Ready to process your UPI payments in real-time</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- Platform Stats -->
          <StatsDisplay view="platform" />
          
          <!-- User Stats -->
          <StatsDisplay view="user" />
        </div>
      </div>
    </section>
    
    <!-- CTA Section -->
    <section class="section bg-primary/10">
      <div class="container py-16">
        <div class="text-center max-w-3xl mx-auto">
          <h2 class="font-display text-3xl font-medium text-text-light mb-6">Ready to Exchange?</h2>
          <p class="text-text-muted mb-8">
            Start using LN2UPI today and experience the fastest, simplest way to exchange Bitcoin and UPI.
          </p>
          
          <div class="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button @click="navigateTo('/send')" class="btn-primary">
              Send to UPI
            </button>
            <button @click="navigateTo('/receive')" class="btn-secondary">
              Receive Sats
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>