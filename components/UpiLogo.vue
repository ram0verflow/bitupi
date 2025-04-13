<template>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    :width="width" 
    :height="height" 
    viewBox="0 0 1024 406" 
    fill="none"
  >
    <!-- UPI Logo with more accurate styling -->
    <path d="M53.467 8.085h233.739L150.07 399.593H0L53.467 8.085z" fill="#097140"/>
    <path d="M346.533 8.085h232.201L436.02 399.593H205.357L346.533 8.085z" fill="#734999"/>
    <path d="M799.851 207.07L664.094 8.085H523.196L733.296 334.477c3.841 5.69 8.66 10.66 14.296 14.773c5.636 4.114 11.838 7.066 18.478 8.697c6.64 1.63 13.478 1.883 20.186 0.742c6.708-1.142 13.128-3.637 19.059-7.342L1024 80.85l-54.15-72.765H904.593L799.851 207.07z" fill="#097140"/>
  </svg>
</template>

<script setup>
defineProps({
  width: {
    type: [Number, String],
    default: 83
  },
  height: {
    type: [Number, String],
    default: 30
  }
})
</script>