# Lightning API Structure

This directory contains API endpoints for Lightning Network functionality in the LN2UPI platform.

## Endpoints

- `GET /api/lightning?action=status` - Check Lightning connection status
- `GET /api/lightning?action=check&paymentHash=xyz` - Check payment status
- `POST /api/lightning` with action=invoice - Create an invoice
- `POST /api/lightning` with action=withdraw - Create a withdraw link
- `POST /api/lightning` with action=callback - Handle webhook callbacks

### Dedicated Endpoints

For improved RESTful design, these dedicated endpoints are also available:

- `POST /api/lightning/invoice` - Create a new Lightning invoice
- `GET /api/lightning/payment/:hash` - Check payment status by hash
- `POST /api/lightning/payment` - Check payment status
- `POST /api/lightning/withdraw` - Create a Lightning withdraw link
- `POST /api/lightning/callback` - Handle Lightning Network webhooks

## Implementation Status

- [x] `/api/lightning/index.ts` - Main Lightning API endpoint
- [x] `/api/lightning/invoice.ts` - Invoice generation endpoint
- [x] `/api/lightning/callback.ts` - Webhook handling endpoint
- [x] `/api/lightning/payment/index.ts` - Payment status endpoint
- [x] `/api/lightning/withdraw.ts` - Withdraw link generation endpoint