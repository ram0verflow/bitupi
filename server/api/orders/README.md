# Orders API Structure

The Orders API handles creating, fetching, and manipulating order data in the LN2UPI platform.

## Endpoints

- `GET /api/orders` - List all available orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get details of a specific order
- `POST /api/orders/:id/claim` - Claim an order for processing
- `POST /api/orders/:id/receipt` - Upload receipt for an order
- `POST /api/orders/:id/refund` - Process a refund for an order
- `GET /api/orders/:id/status` - Get the status of an order using a tracking token

## Refactoring Goals

1. Consolidate functionality from `create-order.ts` into the RESTful `/api/orders` endpoint
2. Make authentication patterns consistent across all order operations
3. Improve error handling with standardized formats
4. Add comprehensive documentation to each endpoint
5. Simplify complex operations by breaking them into smaller functions

## Implementation Status

- [x] `/api/orders/:id` - Basic order detail endpoint
- [x] `/api/orders/:id/claim` - Claim endpoint
- [x] `/api/orders/:id/receipt` - Receipt upload endpoint
- [x] `/api/orders/:id/refund` - Refund processing endpoint
- [ ] `/api/orders/index.ts` - Consolidated endpoint for listing and creating orders
- [ ] `/api/orders/:id/status.ts` - Order status endpoint
