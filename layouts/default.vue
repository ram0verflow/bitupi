<script setup>
import { ref } from 'vue';

const language = ref('english'); // Default to English

function toggleLanguage() {
  language.value = language.value === 'english' ? 'hindi' : 'english';
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
    <header class="bg-white shadow-md border-t-4 border-india-saffron">
      <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <NuxtLink to="/" class="flex items-center">
            <span class="font-bold text-xl text-gray-800">BitUPI</span>
            <span class="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200 ml-2">Beta</span>
          </NuxtLink>
        </div>
        
        <div class="hidden md:flex items-center space-x-1">
          <NuxtLink to="/" class="px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium transition-colors" 
                   :class="{ 'bg-gray-100': $route.path === '/' }">
            Home
          </NuxtLink>
          <NuxtLink to="/buy" class="px-3 py-2 rounded-md hover:bg-bitcoin-orange/10 text-bitcoin-orange font-medium transition-colors"
                    :class="{ 'bg-bitcoin-orange/10': $route.path === '/buy' }">
            Buy Bitcoin
          </NuxtLink>
          <NuxtLink to="/earn" class="px-3 py-2 rounded-md hover:bg-upi-green/10 text-upi-green font-medium transition-colors"
                    :class="{ 'bg-upi-green/10': $route.path === '/earn' }">
            Earn Bitcoin
          </NuxtLink>
          <div class="ml-2 border-l border-gray-200 pl-2">
            <!-- Language toggle -->
            <button 
              @click="toggleLanguage" 
              class="inline-flex items-center px-2 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
              :title="language === 'english' ? 'Switch to Hindi' : 'Switch to English'"
            >
              <span v-if="language === 'english'" class="flex items-center">
                <img src="https://flagcdn.com/w20/in.png" alt="India" class="mr-1.5 w-4 h-auto" />
                <span class="mr-1">English</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <span v-else class="flex items-center">
                <img src="https://flagcdn.com/w20/in.png" alt="India" class="mr-1.5 w-4 h-auto" />
                <span class="mr-1">हिंदी</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
          </div>
        </div>
        
        <!-- Mobile menu -->
        <div class="flex md:hidden space-x-2">
          <NuxtLink to="/buy" class="px-3 py-1.5 rounded-md bg-bitcoin-orange text-white text-sm font-medium">
            Buy
          </NuxtLink>
          <NuxtLink to="/earn" class="px-3 py-1.5 rounded-md bg-upi-green text-white text-sm font-medium">
            Earn
          </NuxtLink>
        </div>
      </nav>
    </header>
    
    <main class="flex-grow">
      <slot />
    </main>
    
    <footer class="bg-white border-t mt-auto">
      <div class="container mx-auto px-4 py-6">
        <!-- Top footer with info -->
        <div class="flex flex-col md:flex-row justify-between pb-6 border-b border-gray-200">
          <div class="mb-6 md:mb-0">
            <h2 class="font-bold text-lg text-gray-800 mb-3">BitUPI</h2>
            <p class="text-sm text-gray-600 max-w-xs">
              An anonymous P2P platform for exchanging Bitcoin via Lightning Network with UPI transfers in India.
            </p>
          </div>
          
          <div class="grid grid-cols-2 gap-8">
            <div>
              <h3 class="font-medium text-gray-900 mb-2">Features</h3>
              <ul class="text-sm text-gray-600 space-y-2">
                <li>Anonymous Exchange</li>
                <li>No KYC Required</li>
                <li>Lightning Fast</li>
                <li>Secure Transactions</li>
              </ul>
            </div>
            
            <div>
              <h3 class="font-medium text-gray-900 mb-2">Support</h3>
              <ul class="text-sm text-gray-600 space-y-2">
                <li>FAQs</li>
                <li>How It Works</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Bottom footer with copyright -->
        <div class="pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© 2025 BitUPI. All rights reserved.</p>
          <p class="mt-2 md:mt-0">No accounts. No KYC. No data storage.</p>
        </div>
      </div>
    </footer>
  </div>
</template>