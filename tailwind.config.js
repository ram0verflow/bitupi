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
        // Primary color scheme - Orange
        'primary': '#FF5F00',       // Bitcoin orange
        'primary-dark': '#CC4D00',  // Darker orange for hover states
        'primary-light': '#FF8533', // Lighter orange for accents
        
        // Secondary color - Green
        'secondary': '#00C853',     // UPI green
        'secondary-dark': '#00A243', // Darker green for hover states
        'secondary-light': '#5EFF8B', // Lighter green for accents
        
        // Background colors
        'bg-dark': '#121212',      // Dark background
        'bg-card': '#1E1E1E',      // Card background
        'bg-input': '#2A2A2A',     // Input background
        'bg-light': '#FFFFFF',     // Light background
        
        // Border colors
        'border-dark': '#333333',  // Dark border
        'border-light': '#E0E0E0', // Light border
        
        // Text colors
        'text-dark': '#121212',    // Dark text
        'text-light': '#FFFFFF',   // Light text
        'text-muted': '#9E9E9E',   // Muted text
        
        // Bitcoin & UPI specific colors
        'bitcoin': '#FF9900',      // Bitcoin color
        'lightning': '#FC5C04',    // Lightning network
        'upi': '#00C853',          // UPI green
        
        // Status colors
        'success': '#00C853',      // Success
        'warning': '#FFC107',      // Warning
        'error': '#FF5252',        // Error
        'info': '#2196F3'          // Info
      },
      fontFamily: {
        'sans': ['Poppins', 'system-ui', 'sans-serif'],
        'display': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'mono': ['Space Mono', 'monospace'],
      },
      boxShadow: {
        // Simple, clean shadows for high contrast
        'sm': '0 1px 2px rgba(0, 0, 0, 0.1)',
        'DEFAULT': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.12)',
        'lg': '0 8px 16px rgba(0, 0, 0, 0.14)',
        'xl': '0 16px 24px rgba(0, 0, 0, 0.16)',
        '2xl': '0 24px 32px rgba(0, 0, 0, 0.18)',
        
        // Colored shadows for accents
        'primary': '0 4px 12px rgba(255, 95, 0, 0.4)',
        'secondary': '0 4px 12px rgba(0, 200, 83, 0.4)',
        
        // Inner shadows
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
        'inner-lg': 'inset 0 4px 8px rgba(0, 0, 0, 0.2)',
        
        // Glows for notifications and active states
        'glow-primary': '0 0 15px rgba(255, 95, 0, 0.6)',
        'glow-secondary': '0 0 15px rgba(0, 200, 83, 0.6)',
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