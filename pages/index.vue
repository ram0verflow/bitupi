<script setup>
import { ref } from 'vue';
import BitcoinLogo from '~/components/BitcoinLogo.vue';
import UpiLogo from '~/components/UpiLogo.vue';
import IndianContextTip from '~/components/IndianContextTip.vue';

// Fetch the exchange rate
const { data: exchangeRate } = await useFetch('/api/exchange-rate');
const currentRate = ref(exchangeRate.value?.rates?.BTC_INR || 5600000);
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="py-10 md:py-16">
      <div class="container text-center max-w-4xl mx-auto">
        <div class="inline-flex items-center bg-gray-100 px-4 py-2 rounded-full mb-6">
          <span class="text-sm font-medium text-gray-800">100% Anonymous</span>
          <span class="mx-2 text-gray-400">•</span>
          <span class="text-sm font-medium text-gray-800">No KYC</span>
          <span class="mx-2 text-gray-400">•</span>
          <span class="text-sm font-medium text-gray-800">No Accounts</span>
        </div>
        
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          <span class="inline-flex items-center">
            <BitcoinLogo :width="40" :height="40" class="mr-2" />
            Bitcoin
          </span>
          to
          <span class="inline-flex items-center">
            <UpiLogo :width="83" :height="30" class="ml-2" />
          </span>
          <br>P2P Exchange in India
        </h1>
        
        <p class="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          A serverless, anonymous platform for exchanging Bitcoin via Lightning Network with UPI transfers in India. No accounts, no KYC, no data storage.
        </p>
        
        <div class="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <NuxtLink to="/buy" class="bg-bitcoin-orange hover:bg-bitcoin-orange/90 text-white font-bold py-4 px-8 rounded-lg shadow-lg text-xl transition-colors inline-flex items-center justify-center">
            <BitcoinLogo :width="24" :height="24" class="mr-2" />
            Buy Bitcoin
          </NuxtLink>
          <NuxtLink to="/earn" class="bg-upi-green hover:bg-upi-green/90 text-white font-bold py-4 px-8 rounded-lg shadow-lg text-xl transition-colors inline-flex items-center justify-center">
            <UpiLogo :width="50" :height="18" class="mr-2" />
            Earn Bitcoin
          </NuxtLink>
        </div>
        
        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div class="bg-white rounded-lg shadow-card p-4">
            <div class="text-3xl font-bold text-bitcoin-orange">₹{{ (currentRate / 100000).toFixed(1) }}L+</div>
            <div class="text-sm text-gray-600">BTC/INR Rate</div>
          </div>
          <div class="bg-white rounded-lg shadow-card p-4">
            <div class="text-3xl font-bold text-upi-green">0%</div>
            <div class="text-sm text-gray-600">KYC Required</div>
          </div>
          <div class="bg-white rounded-lg shadow-card p-4">
            <div class="text-3xl font-bold text-bitcoin-blue">1-2%</div>
            <div class="text-sm text-gray-600">Exchange Fee</div>
          </div>
          <div class="bg-white rounded-lg shadow-card p-4">
            <div class="text-3xl font-bold text-india-saffron">24/7</div>
            <div class="text-sm text-gray-600">Availability</div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Features Section -->
    <section class="py-16 bg-white">
      <div class="container mx-auto">
        <h2 class="text-3xl font-bold text-center mb-12">Why Choose BitUPI?</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg shadow-card border border-gray-200">
            <div class="w-12 h-12 bg-india-saffron/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-india-saffron" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3">100% Anonymous</h3>
            <p class="text-gray-600">No accounts, no KYC, no personal data stored. Complete privacy by design.</p>
          </div>
          
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg shadow-card border border-gray-200">
            <div class="w-12 h-12 bg-bitcoin-orange/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-bitcoin-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3">Lightning Fast</h3>
            <p class="text-gray-600">Lightning Network Bitcoin transactions with secure UPI payments in India.</p>
          </div>
          
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg shadow-card border border-gray-200">
            <div class="w-12 h-12 bg-upi-green/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-upi-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3">Peer-to-Peer</h3>
            <p class="text-gray-600">Direct exchange between users with no intermediary holding funds.</p>
          </div>
        </div>
        
        <IndianContextTip class="max-w-3xl mx-auto mt-12" />
      </div>
    </section>
    
    <!-- How It Works Section -->
    <section class="py-16 bg-gray-50">
      <div class="container mx-auto">
        <h2 class="text-3xl font-bold text-center mb-4">How It Works</h2>
        <p class="text-center text-gray-600 max-w-2xl mx-auto mb-12">Simple, secure, and anonymous Bitcoin to UPI exchange in just a few steps</p>
        
        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- Buy Bitcoin Flow -->
          <div class="bg-white rounded-lg shadow-card overflow-hidden border border-gray-200">
            <div class="bg-bitcoin-orange text-white p-4">
              <h3 class="text-xl font-bold flex items-center">
                <BitcoinLogo :width="24" :height="24" class="mr-2" />
                Buy Bitcoin with UPI
              </h3>
            </div>
            <div class="p-6">
              <ol class="space-y-4">
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-bitcoin-orange/10 text-bitcoin-orange flex items-center justify-center font-bold mr-3">1</span>
                  <div>
                    <p class="font-medium">Enter INR amount</p>
                    <p class="text-sm text-gray-600">Specify how much INR you want to exchange</p>
                  </div>
                </li>
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-bitcoin-orange/10 text-bitcoin-orange flex items-center justify-center font-bold mr-3">2</span>
                  <div>
                    <p class="font-medium">Upload UPI QR</p>
                    <p class="text-sm text-gray-600">Scan and upload your UPI payment QR code</p>
                  </div>
                </li>
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-bitcoin-orange/10 text-bitcoin-orange flex items-center justify-center font-bold mr-3">3</span>
                  <div>
                    <p class="font-medium">Wait for payment</p>
                    <p class="text-sm text-gray-600">An Earner will process your UPI payment</p>
                  </div>
                </li>
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-bitcoin-orange/10 text-bitcoin-orange flex items-center justify-center font-bold mr-3">4</span>
                  <div>
                    <p class="font-medium">Receive Bitcoin</p>
                    <p class="text-sm text-gray-600">Bitcoin is sent to your Lightning wallet</p>
                  </div>
                </li>
              </ol>
              <NuxtLink to="/buy" class="mt-6 block text-center bg-bitcoin-orange/10 hover:bg-bitcoin-orange/20 text-bitcoin-orange px-4 py-2 rounded-md font-medium transition-colors">
                Start Buying Bitcoin
              </NuxtLink>
            </div>
          </div>
          
          <!-- Earn Bitcoin Flow -->
          <div class="bg-white rounded-lg shadow-card overflow-hidden border border-gray-200">
            <div class="bg-upi-green text-white p-4">
              <h3 class="text-xl font-bold flex items-center">
                <UpiLogo :width="50" :height="18" class="mr-2" />
                Earn Bitcoin with UPI
              </h3>
            </div>
            <div class="p-6">
              <ol class="space-y-4">
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-upi-green/10 text-upi-green flex items-center justify-center font-bold mr-3">1</span>
                  <div>
                    <p class="font-medium">Browse open orders</p>
                    <p class="text-sm text-gray-600">See available Bitcoin buy requests</p>
                  </div>
                </li>
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-upi-green/10 text-upi-green flex items-center justify-center font-bold mr-3">2</span>
                  <div>
                    <p class="font-medium">Select an order</p>
                    <p class="text-sm text-gray-600">First-come-first-serve basis</p>
                  </div>
                </li>
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-upi-green/10 text-upi-green flex items-center justify-center font-bold mr-3">3</span>
                  <div>
                    <p class="font-medium">Make UPI payment</p>
                    <p class="text-sm text-gray-600">Send the INR payment via UPI</p>
                  </div>
                </li>
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-upi-green/10 text-upi-green flex items-center justify-center font-bold mr-3">4</span>
                  <div>
                    <p class="font-medium">Earn Bitcoin</p>
                    <p class="text-sm text-gray-600">Get Bitcoin + profit share</p>
                  </div>
                </li>
              </ol>
              <NuxtLink to="/earn" class="mt-6 block text-center bg-upi-green/10 hover:bg-upi-green/20 text-upi-green px-4 py-2 rounded-md font-medium transition-colors">
                Start Earning Bitcoin
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- India-specific CTA Section -->
    <section class="py-16 bg-gradient-to-r from-india-saffron/5 via-white to-india-green/5 border-t border-b border-gray-200">
      <div class="container mx-auto text-center">
        <h2 class="text-3xl font-bold mb-6">For Indians, By Indians</h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          BitUPI is designed specifically for the Indian market, making it easy to exchange Bitcoin using India's popular UPI payment system.
        </p>
        <div class="flex flex-wrap justify-center gap-6 mb-10">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" alt="UPI" class="h-8 object-contain" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/1200px-Google_Pay_Logo.svg.png" alt="Google Pay" class="h-8 object-contain" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/1200px-Paytm_Logo_%28standalone%29.svg.png" alt="Paytm" class="h-8 object-contain" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png" alt="PhonePe" class="h-8 object-contain" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/BHIM_logo.svg/1200px-BHIM_logo.svg.png" alt="BHIM" class="h-8 object-contain" />
        </div>
        <NuxtLink to="/buy" class="inline-flex items-center bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
          <span>Get Started Now</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>