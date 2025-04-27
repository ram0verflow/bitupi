# API Restructuring Progress

This document details the progress of restructuring the server/api directory to improve organization, reduce redundancy, and create a more consistent API structure.

## Completed Changes

### Directory Structure Creation
- Created `/api/utils/` directory for utility endpoints
- Created `/api/stats/` directory for statistics endpoints
- Created `/api/lightning/` directory structure

### File Moves and Consolidation
- Moved `process-qr.ts` → `/api/utils/process-qr.ts`
- Moved `exchange-rate.ts` → `/api/utils/exchange-rate.ts`
- Moved `random-insight.ts` → `/api/utils/random-insight.ts`
- Moved `stats.ts` → `/api/stats/index.ts`
- Consolidated payment status endpoints in `/api/lightning/payment/index.ts`
- Added `lightning/withdraw.ts` for LNURL withdrawal functionality

### Documentation
- Added README.md files in several directories to explain purpose and structure
- Added JSDoc comments to several endpoints

## Pending Changes

### Orders API Restructuring
- Consolidate `create-order.ts` and `orders.ts` into a RESTful structure
- Move `order-status.ts` to `/api/orders/[id]/status.ts`
- Ensure consistent error handling across all order endpoints

### Lightning API Completion
- Complete migration to the new API structure
- Ensure backward compatibility during transition
- Expand documentation with examples

### SSE Endpoints
- Organize SSE endpoints consistently
- Add proper documentation

## Benefits of Restructuring

### Improved Organization
- Related functionality is now grouped together
- Directory structure follows RESTful conventions
- Easier to understand the API structure at a glance

### Reduced Redundancy
- Consolidated similar functionality
- Removed duplicate code
- Created more focused endpoints

### Better Documentation
- Added README.md files to explain directory structure
- Added JSDoc comments to describe endpoint functionality
- Consistent API response formats

## Next Steps

1. Complete orders API restructuring
2. Update import paths throughout the codebase
3. Add tests for new endpoint structure
4. Update client-side code to use the new endpoints
5. Gradually deprecate older non-RESTful endpoints