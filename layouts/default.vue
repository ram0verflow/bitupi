<script setup>
import { ref, onMounted } from 'vue';
import ConnectionStatus from '~/components/ConnectionStatus.vue';

const darkMode = ref(false);

function toggleDarkMode() {
  darkMode.value = !darkMode.value;
  if (darkMode.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('darkMode', 'false');
  }
}

onMounted(() => {
  // Check for saved dark mode preference
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode === 'true') {
    darkMode.value = true;
    document.documentElement.classList.add('dark');
  } else if (savedDarkMode === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // If no saved preference but system is dark mode
    darkMode.value = true;
    document.documentElement.classList.add('dark');
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg dark-transition">
    <header class="bg-white dark:bg-dark-surface shadow-md border-t-4 border-lightning-blue dark:border-lightning-purple dark-transition">
      <nav class="container mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <NuxtLink to="/" class="flex items-center">
            <span class="font-bold text-xl text-gray-800 dark:text-dark-text lightning-text">LN2UPI</span>
            <span class="text-xs bg-blue-100 dark:bg-lightning-blue/20 text-lightning-blue dark:text-lightning-blue px-2 py-0.5 rounded-full border border-blue-200 dark:border-lightning-blue/30 ml-2 animate-pulse">Beta</span>
          </NuxtLink>
        </div>
        
        <div class="hidden md:flex items-center space-x-1">
          <NuxtLink to="/" class="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-border text-gray-700 dark:text-dark-text font-medium transition-colors" 
                   :class="{ 'bg-gray-100 dark:bg-dark-border': $route.path === '/' }">
            Home
          </NuxtLink>
          <NuxtLink to="/send" class="px-3 py-2 rounded-md hover:bg-lightning-blue/10 text-lightning-blue font-medium transition-colors"
                    :class="{ 'bg-lightning-blue/10': $route.path === '/send' }">
            Send to UPI
          </NuxtLink>
          <NuxtLink to="/receive" class="px-3 py-2 rounded-md hover:bg-upi-green/10 text-upi-green font-medium transition-colors"
                    :class="{ 'bg-upi-green/10': $route.path === '/receive' }">
            Receive Sats
          </NuxtLink>
          <div class="ml-2 border-l border-gray-200 dark:border-dark-border pl-2">
            <!-- Dark mode toggle -->
            <button 
              @click="toggleDarkMode" 
              class="inline-flex items-center px-2 py-1 rounded text-sm font-medium hover:bg-gray-100 dark:hover:bg-dark-border transition-colors transform hover:scale-105"
              :title="darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
            >
              <span v-if="!darkMode" class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </span>
              <span v-else class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
            </button>
          </div>
        </div>
        
        <!-- Mobile menu -->
        <div class="flex md:hidden space-x-2 items-center">
          <NuxtLink to="/send" class="btn-glow px-3 py-1.5 rounded-md bg-lightning-blue text-white text-sm font-medium">
            <span class="relative z-10">Send</span>
          </NuxtLink>
          <NuxtLink to="/receive" class="btn-glow px-3 py-1.5 rounded-md bg-upi-green text-white text-sm font-medium">
            <span class="relative z-10">Receive</span>
          </NuxtLink>
          <button 
            @click="toggleDarkMode" 
            class="p-1.5 rounded-full text-sm ml-2 bg-gray-100 dark:bg-dark-border transform hover:scale-105"
          >
            <svg v-if="!darkMode" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
    
    <main class="flex-grow">
      <slot />
    </main>
    
    <footer class="bg-white dark:bg-dark-surface border-t dark:border-dark-border mt-auto dark-transition">
      <div class="container mx-auto px-4 py-6">
        <!-- Top footer with info -->
        <div class="flex flex-col md:flex-row justify-between pb-6 border-b border-gray-200 dark:border-dark-border">
          <div class="mb-6 md:mb-0">
            <h2 class="font-bold text-lg text-gray-800 dark:text-dark-text lightning-text mb-3">LN2UPI</h2>
            <p class="text-sm text-gray-600 dark:text-dark-text-secondary max-w-xs">
              A tool for plebs, made by plebs. Send Lightning payments directly to UPI accounts in India.
            </p>
          </div>
          
          <div class="grid grid-cols-2 gap-8">
            <div>
              <h3 class="font-medium text-gray-900 dark:text-dark-text mb-2">Features</h3>
              <ul class="text-sm text-gray-600 dark:text-dark-text-secondary space-y-2">
                <li class="hover:text-lightning-blue dark:hover:text-lightning-blue transition-colors">No Accounts Needed</li>
                <li class="hover:text-lightning-blue dark:hover:text-lightning-blue transition-colors">Zero KYC</li>
                <li class="hover:text-lightning-blue dark:hover:text-lightning-blue transition-colors">Lightning Fast</li>
                <li class="hover:text-lightning-blue dark:hover:text-lightning-blue transition-colors">Privacy Focused</li>
              </ul>
            </div>
            
            <div>
              <h3 class="font-medium text-gray-900 dark:text-dark-text mb-2">Resources</h3>
              <ul class="text-sm text-gray-600 dark:text-dark-text-secondary space-y-2">
                <li class="hover:text-upi-green dark:hover:text-upi-green transition-colors">How It Works</li>
                <li class="hover:text-upi-green dark:hover:text-upi-green transition-colors">FAQ</li>
                <li class="hover:text-upi-green dark:hover:text-upi-green transition-colors">GitHub</li>
                <li class="hover:text-upi-green dark:hover:text-upi-green transition-colors">satoshinotebook.com</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Bottom footer with copyright -->
        <div class="pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-dark-text-secondary">
          <p>From plebs, for plebs. Just stack sats.</p>
          <p class="mt-2 md:mt-0">No accounts. No KYC. No data storage.</p>
        </div>
      </div>
    </footer>
    
    <!-- Connection Status Indicator -->
    <ConnectionStatus />
  </div>
</template>