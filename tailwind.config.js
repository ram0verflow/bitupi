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
        // Lightning colors - brighter and more vibrant
        'lightning-blue': '#0072FF',
        'lightning-purple': '#6E44FF',
        // UPI colors - more saturated
        'upi-green': '#10A155', 
        'upi-purple': '#8A56B8',
        // Core UI colors - higher contrast
        'dark-bg': '#0A0A1A',
        'dark-surface': '#121225',
        'dark-border': '#2A2A40',
        'dark-text': '#F5F5FF',
        'dark-text-secondary': '#B6B6CC',
        // Bitcoin colors - more vivid
        'bitcoin-orange': '#FF9900',
        // Additional accent colors
        'success-green': '#00E676',
        'error-red': '#FF5252',
        'warning-yellow': '#FFD740',
        'info-blue': '#40C4FF',
      },
      fontFamily: {
        'sans': ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'card-dark': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'button': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glow-blue': '0 0 15px rgba(0, 114, 255, 0.6)',
        'glow-purple': '0 0 15px rgba(110, 68, 255, 0.6)',
        'glow-green': '0 0 15px rgba(16, 161, 85, 0.6)',
        'glow-orange': '0 0 15px rgba(255, 153, 0, 0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}