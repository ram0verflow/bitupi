# LN2UPI Functionality Overview

## Core Components

LN2UPI is a platform that facilitates Bitcoin Lightning Network payments to UPI accounts in India. The system operates without user accounts, persistent data storage, or KYC requirements.

## Exchange Rate Mechanism

- The platform fetches real-time BTC to INR exchange rates via `/api/exchange-rate`
- Satoshi conversion rates are automatically calculated (1 BTC = 100,000,000 sats)
- Exchange rates are displayed using an animated counter that shows changes in real-time
- The current implementation has a fallback value of 5,600,000 INR per BTC if the API fails

## Send Flow (Buy Bitcoin)

The send flow allows users to pay UPI and receive Bitcoin in return:

1. **Amount Entry** (Step 1)
   - User specifies INR amount they want to spend (between ₹500 and ₹50,000)
   - System calculates equivalent sats based on current exchange rate
   - A 3% service fee is added to the total

2. **UPI QR Code Upload** (Step 2)
   - User uploads a QR code image
   - The system processes the QR via `/api/process-qr` endpoint
   - QR data is parsed to extract UPI ID, name, merchant code, and other details
   - Fallback to default values if QR processing fails

3. **Confirmation** (Step 3)
   - User reviews order details including:
     - INR amount
     - UPI ID
     - Bitcoin amount in satoshis
     - Service fees
     - Total to pay

4. **Order Creation** (Step 4)
   - System creates an order via `/api/create-order` endpoint with:
     - INR amount
     - UPI ID
     - Satoshi amount
     - Service fee
   - Order is assigned a unique ID and published to marketplace
   - User is connected to socket for real-time updates on their order
   - User waits for an earner to process payment

## Receive Flow (Earn Bitcoin)

The receive flow allows users to earn Bitcoin by processing UPI payments:

1. **Browse Available Orders** (Step 1)
   - User connects as an "earner" via socket connection (`register:earner` event)
   - System displays list of pending orders with:
     - Order ID
     - INR amount
     - UPI ID
     - Satoshi reward (including profit margin)
     - Time since order creation
   - Orders are received in real-time through WebSockets or SSE fallback

2. **Process Payment** (Step 2)
   - User selects an order to process
   - 15-minute timer starts for payment completion
   - User makes the UPI payment to the specified UPI ID
   - User uploads payment receipt as proof

3. **Wait for Confirmation** (Step 3)
   - System verifies the payment receipt
   - Buyer confirms receipt of UPI payment
   - Bitcoin payment is automatically released to earner

## Real-time Communication

- WebSockets primary connection using Socket.io
  - Fallback to long polling if WebSockets unavailable
  - Further fallback to Server-Sent Events (SSE) if Socket.io fails completely
- Multiple event channels:
  - `orders-update`: Real-time updates of available orders for earners
  - `order:created`: Notification when new orders are published
  - `order:updated`: Status updates for specific orders
  - Connection status monitoring with transport type detection

## Error Handling & Fallbacks

- Multiple fallback mechanisms for WebSocket failures
- Timeout handling for various operations (order processing, QR reading)
- Graceful error handling with meaningful user feedback
- Redis connection management with automatic reconnection

## Platform Stats

- Real-time statistics including:
  - Active sessions count
  - Active earners count
  - Pending orders
  - Successful/failed transactions
  - Current exchange rate
  - Server uptime

## Security Considerations

- No persistent storage of user data
- No account creation or KYC
- Ephemeral order storage in Redis (1 hour TTL)
- Client-side processing where possible