<script setup>
import { ref, onMounted } from 'vue';
import OrderTracker from '~/components/OrderTracker.vue';

const pageTitle = 'Track Your Order';
const pageDescription = 'Monitor the status of your current transaction';
</script>

<template>
  <div class="container py-12 px-6">
    <div class="text-center mb-12">
      <h1 class="font-display text-3xl font-medium text-text-light mb-4">{{ pageTitle }}</h1>
      <p class="text-text-muted max-w-2xl mx-auto">
        {{ pageDescription }}
      </p>
    </div>
    
    <div class="max-w-2xl mx-auto">
      <OrderTracker />
    </div>
  </div>
</template>