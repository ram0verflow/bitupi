# Changelog

All notable changes to the LN2UPI project are documented in this file.

## [1.1.0] - 2025-04-14

### Added
- Real-time platform stats dashboard with animated counters
- Live exchange rate display with trend indicators
- Connection status indicator with transport information
- Animated UI elements throughout the application
- Server-Sent Events (SSE) fallback for socket connections
- Redis integration for caching and PubSub functionality

### Changed
- Removed all dummy data in favor of real-time API connections
- Enhanced UI with modern animations and visual feedback
- Improved socket connection with robust error handling
- Added dark mode visual enhancements with contrasting colors
- Implemented floating animations for key statistics
- Connected socket endpoints for real-time order updates
- Converted both buyer and earner flows to use real socket connections

### Technical
- Used RequestAnimationFrame for smooth animations
- Implemented CSS animations for UI elements
- Added connection resilience with fallback mechanisms
- Enhanced WebSocket implementation with Socket.io
- Set up real-time stats tracking via Redis
- Improved error handling across the platform

## [1.0.0] - 2025-04-14

### Added
- Complete Nuxt.js implementation with server API endpoints
- Home page with India-specific content and statistics
- Buy Bitcoin flow with step-by-step process
- Earn Bitcoin flow with order listing and processing
- Server endpoints for exchange rates and Lightning Network operations
- Bitcoin and UPI logo components
- Indian-context educational tips
- Mobile-responsive layout with tailored UI for smaller screens
- TailwindCSS configuration with Indian-inspired color palette

### Changed
- Migrated from Vue 3 + Vite to Nuxt.js for server-side functionality
- Restructured the project to follow Nuxt.js conventions
- Enhanced UI with Indian cultural context and design elements
- Implemented proper server API routes for backend operations

## [0.5.0] - 2025-04-13

### Added
- Initial Vue 3 + Vite implementation
- Basic project structure following Vue.js conventions
- Preliminary UI components without proper styling
- Mock data for demonstration purposes

### Technical
- Set up Vue 3 with Composition API
- Implemented Vue Router for navigation
- Added TailwindCSS for styling (incomplete configuration)
- Created component structure based on project specifications