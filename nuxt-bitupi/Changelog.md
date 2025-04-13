# LN2UPI Changelog

This document tracks all significant changes to the LN2UPI project, a tool for sending Lightning Network payments to UPI accounts in India.

## [2.1.0] - 2025-04-15 - Phase 2: Backend Enhancement (Completed)

### Added
- Redis integration for robust caching and data persistence
- Real-time PubSub system with Socket.io for order notifications
- WebSocket server with Redis adapter for horizontal scaling
- Live exchange rate API with multiple provider fallback
- Rate limiting middleware for API protection
- Client-side Socket.io plugin for real-time updates
- Enhanced Lightning Network invoice and payment APIs
- Order status tracking and notification system
- Proper error handling and logging throughout the application
- Environment variable configuration system
- Server initialization with graceful shutdown

### Technical Details
- Redis client implementation with:
  - Automatic reconnection handling
  - Caching utilities with TTL support
  - PubSub functionality for real-time events
  - Data persistence for orders and invoices
- Socket.io server with:
  - Room-based subscriptions for orders
  - Exchange rate broadcast channels
  - Redis adapter for scalability
  - Client reconnection handling
- Exchange rate API enhanced with:
  - CoinGecko integration as primary source
  - Binance API as fallback source
  - Intelligent caching to reduce API calls
  - Real-time updates via WebSockets
- Server middleware:
  - Rate limiting based on client IP and path
  - Redis-backed rate limit counters
  - Path-specific rate limits
  - Proper rate limit headers
- Lightning Network APIs:
  - Improved invoice creation with proper validation
  - Enhanced payment processing with order tracking
  - Notifications for payment status changes
  - Invoice and order correlation
- Configuration:
  - Runtime environment variable support
  - Feature flags for optional functionality
  - Development environment template

## [2.0.0] - 2025-04-14 - Phase 1: Dark Mode & Pleb Focus (Completed)

### Added
- Complete dark mode implementation with system preference detection
- Revamped project concept: "Lightning to UPI" direct payment tool
- New Lightning Network inspired color scheme and branding
- "For plebs, by plebs" identity throughout the application
- Dark mode optimized components and UI elements
- Lightning-themed gradients and design elements
- Educational content from satoshinotebook.com
- Improved SVG components:
  - UpiLogo.vue with more accurate design
  - BhimLogo.vue component with proper branding
  - Lightning-themed icons and visuals

### Changed
- Renamed from BitUPI to LN2UPI to reflect true purpose
- Changed core concept from "P2P exchange" to "direct payments"
- Removed internationalization to focus on simplicity
- Simplified UI with more direct, clearer language
- Renamed page routes and core functionality:
  - "/buy" to "/send" for sending to UPI
  - "/earn" to "/receive" for receiving sats
- Updated color scheme to focus on Lightning Network blues and purples
- Removed India-specific cultural elements in favor of Bitcoin pleb focus
- Enhanced documentation to reflect the project's new direction

### Technical Details
- TailwindCSS dark mode implementation with class strategy
- Custom dark theme color palette:
  - dark-bg: #121212
  - dark-surface: #1E1E1E 
  - dark-border: #333333
  - dark-text: #E1E1E1
  - dark-text-secondary: #A1A1A1
- Added Lightning Network colors:
  - lightning-blue: #0050FF
  - lightning-purple: #5638E4
- Local storage for user dark mode preference
- System preference detection for automatic theme selection
- Transition animations between light and dark modes

## [1.0.0] - 2025-04-14 - Nuxt.js Implementation

### Added
- Complete Nuxt.js implementation with server API endpoints
- Server API endpoints for exchange rates and Lightning Network operations
- Enhanced UI components with Indian cultural context
- Custom SVG components for Bitcoin and UPI logos
- India-specific educational tips
- Full page implementations for buying and earning Bitcoin
- Mobile-responsive design with TailwindCSS
- Comprehensive documentation

### Changed
- Migrated from Vue 3 + Vite to Nuxt.js architecture
- Restructured application to follow Nuxt.js conventions
- Implemented server-side rendering capabilities
- Enhanced API endpoints with simulation features
- Improved error handling and form validation

## [0.5.0] - 2025-04-13 - Initial Implementation

### Added
- Basic project setup with Vue 3 and Vite
- Initial component structure and page layouts
- Rudimentary styling with TailwindCSS
- Mock data for demonstration purposes

### Technical
- Vue 3 with Composition API structure
- Vue Router implementation for navigation
- Basic state management setup
- Initial UI component design