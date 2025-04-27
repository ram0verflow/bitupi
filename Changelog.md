# Changelog

All notable changes to the LN2UPI project are documented in this file.

## [1.2.0] - 2025-04-27

### Added
- Added comprehensive documentation for API endpoints
- Created README files for each API domain with clear descriptions
- Implemented standardized error response formats across endpoints

### Changed
- Restructured server/api directory to follow RESTful principles
- Consolidated duplicate code across related endpoints
- Reorganized API endpoints into logical resource-based directories
- Improved import paths throughout the codebase
- Renamed routes for better consistency with LN2UPI branding
- Migrated from flat structure to nested RESTful resources

### Improved
- Enhanced API organization with separate directories for each resource
- Better separation of concerns between different API domains
- More intuitive URL structure for API consumers
- Reduced code duplication through consolidation
- Clearer file naming that reflects endpoint purpose

## [1.1.0] - 2025-04-14

### Added
- Real-time platform stats dashboard with animated counters
- Live exchange rate display with trend indicators
- Connection status indicator with transport information
- Server-Sent Events (SSE) fallback for socket connections
- Redis integration for caching and PubSub functionality

### Changed
- Revamped color scheme with vibrant, high-contrast colors
- Enhanced UI with vivid gradients and glow effects
- Removed all dummy data in favor of real-time API connections
- Improved socket connection with robust error handling
- Upgraded animations with smoother physics-based transitions
- Connected socket endpoints for real-time order updates

### Fixed
- Resolved multiple WebSocket connection issues
- Fixed race conditions in order state updates
- Corrected exchange rate calculation discrepancies
- Addressed UI flickering on slow connections