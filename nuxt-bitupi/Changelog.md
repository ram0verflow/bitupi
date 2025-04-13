# BitUPI Changelog

This document tracks all significant changes to the BitUPI project, a P2P Bitcoin to UPI exchange platform for the Indian market.

## [1.0.0] - 2025-04-14 - Nuxt.js Implementation

### Added
- Complete Nuxt.js implementation with server API endpoints
- Proper project structure following Nuxt.js conventions
- Server API endpoints for:
  - Exchange rate calculations
  - Lightning Network invoice creation
  - Lightning Network payment processing
- Enhanced UI components with Indian cultural context:
  - Color scheme inspired by Indian flag (saffron, green, navy blue)
  - UPI payment app logos for popular Indian services
  - Hindi language toggle functionality
  - Support for Hindi characters via appropriate font selection
  - India-specific educational tips and facts
- Custom SVG components:
  - BitcoinLogo.vue for Bitcoin branding
  - UpiLogo.vue for UPI integration
  - IndianContextTip.vue for educational content
- Comprehensive page implementations:
  - Home page with feature overview and Indian context
  - Buy Bitcoin flow with step-by-step form process
  - Earn Bitcoin flow with marketplace and timer functionality
- Proper TailwindCSS configuration with:
  - Custom color palette inspired by Indian cultural elements
  - Responsive design components
  - Mobile-first approach
- Documentation:
  - Detailed README.md with project overview
  - This Changelog.md file

### Changed
- Migrated from Vue 3 + Vite to Nuxt.js architecture
- Restructured the entire application to follow Nuxt.js conventions
- Implemented server-side rendering capabilities
- Enhanced API endpoints with simulation features
- Improved error handling and form validation
- Optimized mobile responsiveness for Indian market (high mobile usage)

### Technical Details
- Server API endpoints now provide:
  - Real-time Bitcoin/INR exchange rates with simulated fluctuations
  - Lightning Network invoice generation with proper BOLT11 format
  - Payment processing with appropriate status handling
- State management via Nuxt's built-in capabilities and composables
- Client-side form validation for better user experience
- QR code upload and processing simulation
- Countdown timer implementation for order processing
- Color system based on Indian flag colors:
  - india-saffron: #FF9933
  - india-green: #138808
  - india-blue: #000080 (from Ashoka Chakra)
  - Plus UPI brand colors for brand recognition

## [0.5.0] - 2025-04-13 - Initial Vue.js Implementation

### Added
- Basic Vue 3 + Vite project setup
- Initial component structure:
  - Basic page layouts
  - Form components for Buy and Earn flows
  - Placeholder components for QR code uploads
- Rudimentary styling with initial TailwindCSS setup
- Mock data for demonstration purposes

### Technical
- Vue 3 with Composition API structure
- Vue Router implementation for navigation
- Basic Pinia store setup for state management
- Initial TailwindCSS configuration (incomplete)

### Issues
- CSS styling not properly applied due to configuration issues
- No server-side functionality
- Limited responsiveness
- No cultural context for Indian market
- Incomplete user flows

## [0.1.0] - 2025-04-12 - Project Planning

### Added
- Initial project specifications
- Core feature requirements:
  - Anonymous P2P exchange between Bitcoin and UPI
  - No user accounts, KYC or data persistence
  - Real-time communication requirements
- Technical requirements:
  - Frontend framework selection (Vue.js)
  - API integration plans (Lightning Network, Exchange rates)
  - UI/UX considerations for Indian market
- Project structure planning
- Implementation timeline and phases