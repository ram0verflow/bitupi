/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    './app.vue',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Lightning colors
        'lightning-blue': '#0050FF',
        'lightning-purple': '#5638E4',
        // UPI colors
        'upi-green': '#097140', 
        'upi-purple': '#734999',
        // Core UI colors
        'dark-bg': '#121212',
        'dark-surface': '#1E1E1E',
        'dark-border': '#333333',
        'dark-text': '#E1E1E1',
        'dark-text-secondary': '#A1A1A1',
        // Bitcoin colors
        'bitcoin-orange': '#F7931A',
      },
      fontFamily: {
        'sans': ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'button': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}