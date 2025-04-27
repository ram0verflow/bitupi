# API Restructuring Plan

This document outlines the API restructuring plan for the LN2UPI server API.

## New Directory Structure

```
server/
  api/
    orders/
      index.ts              # GET /api/orders (list) & POST /api/orders (create)
      [id]/
        index.ts            # GET /api/orders/:id (get) & DELETE /api/orders/:id (cancel)
        claim.ts            # POST /api/orders/:id/claim
        receipt.ts          # POST /api/orders/:id/receipt
        refund.ts           # POST /api/orders/:id/refund
        approve.ts          # POST /api/orders/:id/approve
        status.ts           # GET /api/orders/:id/status
    lightning/
      index.ts              # GET/POST /api/lightning (main lightning functions)
      invoice.ts            # POST /api/lightning/invoice (create invoice)
      payment.ts            # GET /api/lightning/payment/:hash (check payment)
      withdraw.ts           # POST /api/lightning/withdraw (create withdraw link)
      callback.ts           # POST /api/lightning/callback (handle payment notifications)
    utils/
      process-qr.ts         # POST /api/utils/process-qr
      exchange-rate.ts      # GET /api/utils/exchange-rate
      random-insight.ts     # GET /api/utils/random-insight 
    stats/
      index.ts              # GET /api/stats (current stats)
    sse/
      index.ts              # Base SSE handling
      stats.ts              # GET /api/sse/stats (stats updates)
      exchange-rate.ts      # GET /api/sse/exchange-rate (rate updates)
      orders.ts             # GET /api/sse/orders (order updates)
      order/
        [id].ts             # GET /api/sse/order/:id (specific order updates)
```

## Implementation Steps

1. Create missing directories and consolidate existing functionality
2. Implement a more RESTful API structure
3. Reduce code duplication
4. Standardize error handling and response formats
5. Improve API documentation

## Restructuring Progress

- [x] Lightning endpoints (partially completed)
  - Lightning endpoint restructuring in progress
  - Need to complete payment.ts and withdraw.ts
- [ ] Order endpoints
  - Need to refactor orders.ts to be more RESTful
  - Need to add proper status.ts and approve.ts endpoints
- [ ] Utility endpoints
  - Need to create utils directory and move relevant endpoints
- [ ] Stats endpoints
  - Need to consolidate
- [ ] SSE endpoints
  - Currently well-structured, minor improvements needed

## Standardized Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}
```