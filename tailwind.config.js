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
  theme: {
    extend: {
      colors: {
        // Colors inspired by Indian flag and cultural elements
        'india-saffron': '#FF9933', // Saffron from Indian flag
        'india-green': '#138808', // Green from Indian flag
        'india-blue': '#000080', // Navy blue from the Ashoka Chakra
        'upi-green': '#097140', // UPI brand color
        'upi-purple': '#734999', // Secondary UPI brand color
        // Bitcoin colors
        'bitcoin-orange': '#F7931A',
        'bitcoin-blue': '#0D3578',
      },
      fontFamily: {
        'hindi': ['Poppins', 'system-ui', 'sans-serif'], // Font that supports Hindi characters well
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'button': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}