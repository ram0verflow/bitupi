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
  <div class="min-h-screen flex flex-col bg-bg-dark">
    <header class="bg-bg-card shadow-md border-t-4 border-primary">
      <nav class="container mx-auto px-6 py-5 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <NuxtLink to="/" class="flex items-center">
            <div class="bg-bg-card rounded-xl px-3 py-2 border border-primary shadow-sm">
              <span class="font-display font-bold text-xl text-primary">LN2UPI</span>
            </div>
            <span class="text-xs bg-primary text-text-light px-3 py-1 rounded-full ml-2">Beta</span>
          </NuxtLink>
        </div>
        
        <div class="hidden md:flex items-center space-x-4">
          <NuxtLink to="/" class="px-4 py-2 rounded-lg text-text-light font-medium transition-all hover:text-primary" 
                   :class="{ 'text-primary': $route.path === '/' }">
            Home
          </NuxtLink>
          <NuxtLink to="/send" class="px-4 py-2 rounded-lg text-text-light font-medium transition-all hover:text-primary" 
                   :class="{ 'text-primary': $route.path === '/send' }">
            Send to UPI
          </NuxtLink>
          <NuxtLink to="/receive" class="px-4 py-2 rounded-lg text-text-light font-medium transition-all hover:text-secondary" 
                   :class="{ 'text-secondary': $route.path === '/receive' }">
            Receive Sats
          </NuxtLink>
          
          <!-- Dark Mode Toggle -->
          <button @click="toggleDarkMode" class="p-2 rounded-lg hover:bg-bg-input transition-all">
            <svg v-if="!darkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        </div>
        
        <!-- Mobile menu -->
        <div class="flex md:hidden space-x-3 items-center">
          <NuxtLink to="/send" class="btn-primary py-2 px-3 text-sm">
            <span class="relative z-10">Send</span>
          </NuxtLink>
          <NuxtLink to="/receive" class="btn-secondary py-2 px-3 text-sm">
            <span class="relative z-10">Receive</span>
          </NuxtLink>
          
          <!-- Mobile Dark Mode Toggle -->
          <button @click="toggleDarkMode" class="p-2 rounded-lg hover:bg-bg-input transition-all">
            <svg v-if="!darkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
    
    <main class="flex-grow">
      <slot />
    </main>
    
    <footer class="bg-bg-card mt-auto border-t border-border-dark">
      <div class="container mx-auto px-6 py-8">
        <!-- Top footer with info -->
        <div class="flex flex-col md:flex-row justify-between pb-8 border-b border-border-dark">
          <div class="mb-8 md:mb-0">
            <div class="inline-block border border-primary rounded-xl px-4 py-2 mb-4 shadow-sm">
              <h2 class="font-display font-bold text-xl text-primary">LN2UPI</h2>
            </div>
            <p class="text-text-muted max-w-xs">
              A tool for plebs, made by plebs. Send Lightning payments directly to UPI accounts in India.
            </p>
          </div>
          
          <div class="grid grid-cols-2 gap-12">
            <div>
              <h3 class="font-display font-medium text-primary mb-4">Features</h3>
              <ul class="text-text-muted space-y-3">
                <li class="hover:text-primary transition-colors">No Accounts Needed</li>
                <li class="hover:text-primary transition-colors">Zero KYC</li>
                <li class="hover:text-primary transition-colors">Lightning Fast</li>
                <li class="hover:text-primary transition-colors">Privacy Focused</li>
              </ul>
            </div>
            
            <div>
              <h3 class="font-display font-medium text-secondary mb-4">Resources</h3>
              <ul class="text-text-muted space-y-3">
                <li class="hover:text-secondary transition-colors">How It Works</li>
                <li class="hover:text-secondary transition-colors">FAQ</li>
                <li class="hover:text-secondary transition-colors">GitHub</li>
                <li class="hover:text-secondary transition-colors">satoshinotebook.com</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- Bottom footer with copyright -->
        <div class="pt-8 flex flex-col md:flex-row justify-between items-center text-text-muted text-sm">
          <p>From plebs, for plebs. Just stack sats.</p>
          <p class="mt-3 md:mt-0">No accounts. No KYC. No data storage.</p>
        </div>
      </div>
    </footer>
    
    <!-- Connection Status Indicator -->
    <ConnectionStatus />
  </div>
</template>