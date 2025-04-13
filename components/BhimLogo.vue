<template>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    :width="width" 
    :height="height"
    viewBox="0 0 512 139"
    fill="none"
  >
    <!-- BHIM logo -->
    <path d="M63.5,0h85v139h-85C28.43,139,0,110.57,0,75.5v-12C0,28.43,28.43,0,63.5,0z" fill="#2F348B"/>
    <path d="M63.5,0h85c35.07,0,63.5,28.43,63.5,63.5v12c0,35.07-28.43,63.5-63.5,63.5h-85V0z" fill="#ED232A"/>
    <path d="M148.5,0V139" stroke="#fff" stroke-width="20"/>
    <g fill="#fff">
      <path d="M47.5,43.5h26c6.6,0,12,5.4,12,12v0c0,6.6-5.4,12-12,12h-26v-24z M47.5,83.5h29c6.6,0,12,5.4,12,12v0c0,6.6-5.4,12-12,12h-29v-24z M47.5,31.5v76"/>
      <path d="M208,43.5h-26c-6.6,0-12,5.4-12,12v0c0,6.6,5.4,12,12,12h26v-24z M208,83.5h-26c-6.6,0-12,5.4-12,12v0c0,6.6,5.4,12,12,12h26v-24z M208,31.5v76"/>
      <path d="M245,31.5h20v76h-20z"/>
      <path d="M296,31.5h48v20h-28v18h24v20h-24v18h28v20h-48z"/>
    </g>
  </svg>
</template>

<script setup>
defineProps({
  width: {
    type: [Number, String],
    default: 100
  },
  height: {
    type: [Number, String],
    default: 27
  }
})
</script>