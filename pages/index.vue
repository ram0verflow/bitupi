<script setup>
import { ref } from 'vue';
import UpiLogo from '~/components/UpiLogo.vue';
import BhimLogo from '~/components/BhimLogo.vue';
import IndianContextTip from '~/components/IndianContextTip.vue';

// Fetch the exchange rate
const { data: exchangeRate } = await useFetch('/api/exchange-rate');
const currentRate = ref(exchangeRate.value?.rates?.BTC_INR || 5600000);

// Calculate satoshi rate
const satoshiRate = ref(Math.round((currentRate.value / 100000000) * 1000) / 1000);
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="py-10 md:py-16">
      <div class="container text-center max-w-4xl mx-auto">
        <div class="inline-flex items-center bg-gray-100 dark:bg-dark-surface px-4 py-2 rounded-full mb-6">
          <span class="text-sm font-medium text-gray-800 dark:text-dark-text">For Plebs</span>
          <span class="mx-2 text-gray-400">•</span>
          <span class="text-sm font-medium text-gray-800 dark:text-dark-text">No KYC</span>
          <span class="mx-2 text-gray-400">•</span>
          <span class="text-sm font-medium text-gray-800 dark:text-dark-text">Just Works</span>
        </div>
        
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-dark-text mb-6 leading-tight">
          <span class="lightning-text">Lightning</span>
          <span class="mx-2">to</span>
          <span class="inline-flex items-center">
            <UpiLogo :width="83" :height="30" class="mx-2" />
          </span>
          <br>Direct Payments
        </h1>
        
        <p class="text-xl text-gray-600 dark:text-dark-text-secondary max-w-2xl mx-auto mb-10">
          A simple tool that lets you send sats directly to UPI accounts in India. 
          No middlemen, no accounts, no KYC. Made by plebs, for plebs.
        </p>
        
        <div class="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <NuxtLink to="/send" class="bg-lightning-blue hover:bg-lightning-blue/90 text-white font-bold py-4 px-8 rounded-lg shadow-lg text-xl transition-colors inline-flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
            </svg>
            Send to UPI
          </NuxtLink>
          <NuxtLink to="/receive" class="bg-upi-green hover:bg-upi-green/90 text-white font-bold py-4 px-8 rounded-lg shadow-lg text-xl transition-colors inline-flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Receive Sats
          </NuxtLink>
        </div>
        
        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div class="bg-white dark:bg-dark-surface rounded-lg shadow-card dark:shadow-card-dark p-4 dark:border dark:border-dark-border">
            <div class="text-3xl font-bold text-lightning-blue">₹{{ satoshiRate }}</div>
            <div class="text-sm text-gray-600 dark:text-dark-text-secondary">per 1000 sats</div>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-lg shadow-card dark:shadow-card-dark p-4 dark:border dark:border-dark-border">
            <div class="text-3xl font-bold text-upi-green">0%</div>
            <div class="text-sm text-gray-600 dark:text-dark-text-secondary">KYC Required</div>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-lg shadow-card dark:shadow-card-dark p-4 dark:border dark:border-dark-border">
            <div class="text-3xl font-bold text-lightning-purple">1%</div>
            <div class="text-sm text-gray-600 dark:text-dark-text-secondary">Service Fee</div>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-lg shadow-card dark:shadow-card-dark p-4 dark:border dark:border-dark-border">
            <div class="text-3xl font-bold text-bitcoin-orange">24/7</div>
            <div class="text-sm text-gray-600 dark:text-dark-text-secondary">Availability</div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Features Section -->
    <section class="py-16 bg-white dark:bg-dark-surface">
      <div class="container mx-auto">
        <h2 class="text-3xl font-bold text-center mb-12 dark:text-dark-text">Why Use LN2UPI?</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-dark-surface p-6 rounded-lg shadow-card dark:shadow-card-dark border border-gray-200 dark:border-dark-border">
            <div class="w-12 h-12 bg-lightning-blue/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-lightning-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3 dark:text-dark-text">No Accounts</h3>
            <p class="text-gray-600 dark:text-dark-text-secondary">No signups, no logins, no KYC. Just direct payments between Lightning Network and UPI.</p>
          </div>
          
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-dark-surface p-6 rounded-lg shadow-card dark:shadow-card-dark border border-gray-200 dark:border-dark-border">
            <div class="w-12 h-12 bg-lightning-blue/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-lightning-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3 dark:text-dark-text">Ultra Fast</h3>
            <p class="text-gray-600 dark:text-dark-text-secondary">Lightning Network's instant settlements with India's fastest payment system, UPI.</p>
          </div>
          
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-dark-surface p-6 rounded-lg shadow-card dark:shadow-card-dark border border-gray-200 dark:border-dark-border">
            <div class="w-12 h-12 bg-lightning-blue/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-lightning-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3 dark:text-dark-text">From Plebs, For Plebs</h3>
            <p class="text-gray-600 dark:text-dark-text-secondary">Built by Bitcoin plebs for the community. Simple tool that just works, with no extra fluff.</p>
          </div>
        </div>
        
        <IndianContextTip class="max-w-3xl mx-auto mt-12" />
      </div>
    </section>
    
    <!-- How It Works Section -->
    <section class="py-16 bg-gray-50 dark:bg-dark-bg">
      <div class="container mx-auto">
        <h2 class="text-3xl font-bold text-center mb-4 dark:text-dark-text">How It Works</h2>
        <p class="text-center text-gray-600 dark:text-dark-text-secondary max-w-2xl mx-auto mb-12">Simple, direct payments between Lightning Network and UPI in just a few steps</p>
        
        <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- Send to UPI Flow -->
          <div class="bg-white dark:bg-dark-surface rounded-lg shadow-card dark:shadow-card-dark overflow-hidden border border-gray-200 dark:border-dark-border">
            <div class="lightning-gradient text-white p-4">
              <h3 class="text-xl font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Send to UPI
              </h3>
            </div>
            <div class="p-6">
              <ol class="space-y-4">
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-lightning-blue/10 text-lightning-blue flex items-center justify-center font-bold mr-3">1</span>
                  <div>
                    <p class="font-medium dark:text-dark-text">Enter INR amount</p>
                    <p class="text-sm text-gray-600 dark:text-dark-text-secondary">Specify how much INR you want to send</p>
                  </div>
                </li>
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-lightning-blue/10 text-lightning-blue flex items-center justify-center font-bold mr-3">2</span>
                  <div>
                    <p class="font-medium dark:text-dark-text">Enter UPI ID</p>
                    <p class="text-sm text-gray-600 dark:text-dark-text-secondary">Provide the recipient's UPI address</p>
                  </div>
                </li>
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-lightning-blue/10 text-lightning-blue flex items-center justify-center font-bold mr-3">3</span>
                  <div>
                    <p class="font-medium dark:text-dark-text">Pay Lightning Invoice</p>
                    <p class="text-sm text-gray-600 dark:text-dark-text-secondary">Pay with your Lightning wallet</p>
                  </div>
                </li>
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-lightning-blue/10 text-lightning-blue flex items-center justify-center font-bold mr-3">4</span>
                  <div>
                    <p class="font-medium dark:text-dark-text">Done!</p>
                    <p class="text-sm text-gray-600 dark:text-dark-text-secondary">UPI payment is sent automatically</p>
                  </div>
                </li>
              </ol>
              <NuxtLink to="/send" class="mt-6 block text-center bg-lightning-blue/10 hover:bg-lightning-blue/20 text-lightning-blue px-4 py-2 rounded-md font-medium transition-colors">
                Send to UPI Now
              </NuxtLink>
            </div>
          </div>
          
          <!-- Receive Sats Flow -->
          <div class="bg-white dark:bg-dark-surface rounded-lg shadow-card dark:shadow-card-dark overflow-hidden border border-gray-200 dark:border-dark-border">
            <div class="bg-upi-green text-white p-4">
              <h3 class="text-xl font-bold flex items-center">
                <UpiLogo :width="50" :height="18" class="mr-2" />
                Receive Sats
              </h3>
            </div>
            <div class="p-6">
              <ol class="space-y-4">
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-upi-green/10 text-upi-green flex items-center justify-center font-bold mr-3">1</span>
                  <div>
                    <p class="font-medium dark:text-dark-text">Check available orders</p>
                    <p class="text-sm text-gray-600 dark:text-dark-text-secondary">Browse incoming payment requests</p>
                  </div>
                </li>
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-upi-green/10 text-upi-green flex items-center justify-center font-bold mr-3">2</span>
                  <div>
                    <p class="font-medium dark:text-dark-text">Accept a payment</p>
                    <p class="text-sm text-gray-600 dark:text-dark-text-secondary">Choose which payment to process</p>
                  </div>
                </li>
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-upi-green/10 text-upi-green flex items-center justify-center font-bold mr-3">3</span>
                  <div>
                    <p class="font-medium dark:text-dark-text">Confirm UPI receipt</p>
                    <p class="text-sm text-gray-600 dark:text-dark-text-secondary">Verify the payment reached your UPI</p>
                  </div>
                </li>
                <li class="flex">
                  <span class="flex-shrink-0 w-8 h-8 rounded-full bg-upi-green/10 text-upi-green flex items-center justify-center font-bold mr-3">4</span>
                  <div>
                    <p class="font-medium dark:text-dark-text">Get Paid in Sats</p>
                    <p class="text-sm text-gray-600 dark:text-dark-text-secondary">Receive Lightning Network payment</p>
                  </div>
                </li>
              </ol>
              <NuxtLink to="/receive" class="mt-6 block text-center bg-upi-green/10 hover:bg-upi-green/20 text-upi-green px-4 py-2 rounded-md font-medium transition-colors">
                Start Receiving Sats
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- UPI Apps Section -->
    <section class="py-16 bg-white dark:bg-dark-surface border-t border-b border-gray-200 dark:border-dark-border">
      <div class="container mx-auto text-center">
        <h2 class="text-3xl font-bold mb-6 dark:text-dark-text">Works With All UPI Apps</h2>
        <p class="text-xl text-gray-600 dark:text-dark-text-secondary max-w-3xl mx-auto mb-8">
          LN2UPI connects Lightning Network directly with India's UPI ecosystem.
        </p>
        <div class="flex flex-wrap justify-center gap-8 mb-10">
          <UpiLogo :width="100" :height="30" class="h-8 object-contain my-1" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/1200px-Google_Pay_Logo.svg.png" alt="Google Pay" class="h-8 object-contain" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/1200px-Paytm_Logo_%28standalone%29.svg.png" alt="Paytm" class="h-8 object-contain" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png" alt="PhonePe" class="h-8 object-contain" />
          <BhimLogo :width="80" :height="24" class="h-8 object-contain my-1" />
        </div>
        <NuxtLink to="/send" class="inline-flex items-center bg-lightning-blue hover:bg-lightning-blue/90 text-white font-medium py-3 px-6 rounded-lg transition-colors">
          <span>Get Started Now</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>