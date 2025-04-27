# LN2UPI - Lightning Network to UPI Exchange Platform

## Project Overview

Build a serverless, anonymous P2P platform that facilitates Bitcoin Lightning Network payments to UPI transfers in India. The platform should operate without user accounts, persistent data storage, or any KYC requirements.

## Core Features

### Landing Page
- Simple, clean interface with two primary options: "Buy" and "Earn"
- Brief explanation of the service
- No login/signup required

### Buy Bitcoin Flow
1. User specifies INR amount
2. User uploads UPI QR code (parse and sanitize to avoid privacy leaks)
3. System calculates equivalent Lightning Network sats + exchange fee + service fee
4. Order is created and published to the Earn marketplace
5. Buyer waits for an Earner to process payment
6. Buyer approves receipt after payment confirmation
7. Lightning Network payment is released

### Earn Bitcoin Flow
1. User sees list of incoming payment requests
2. First-click-first-serve basis for claiming orders
3. Earner has limited time window to complete UPI payment
4. Earner uploads payment receipt
5. If time expires, order returns to the marketplace
6. When buyer approves, Earner receives Bitcoin payment + 50% profit share

### Real-Time Communication
- Implement with SSE/WebSockets
- No database persistence
- Use client-side caching for temporary state

## Technical Requirements

### Frontend
- Use Vue.js 3 with Composition API
- Single-page application architecture
- Responsive design for mobile and desktop
- Handle file uploads for QR codes and receipts
- Implement WebSocket/SSE for real-time updates

### Backend
- Serverless functions (e.g., Vercel, Netlify, AWS Lambda)
- QR code processing and validation
- Lightning Network integration
- Exchange rate calculation with real market data
- No persistent database

### Data Flow
- All images transferred as base64
- No permanent storage of user data
- Client-side caching for temporary state management
- Secure, ephemeral communication channels

## Implementation Guidelines

### Tech Stack
- **Frontend/Backend**: Nuxt.js 3 (Vue 3 framework with integrated server capabilities)
- **Styling**: TailwindCSS
- **Real-time**: Server-Sent Events (SSE) with EventSource
- **Bitcoin**: Lightning Network via OpenLN API
- **QR Code**: Client-side QR parsing library
- **Caching**: Redis (ephemeral storage with TTL for pending transactions only)

### Project Structure
```
ln2upi/
├── assets/
│   └── css/
│       └── main.css
├── components/
│   ├── AnimatedRateCounter.vue
│   ├── ConnectionStatus.vue
│   ├── OrderCard.vue
│   ├── OrderTracker.vue
│   ├── QRCodeUploader.vue
│   ├── ReceiptUploader.vue
│   └── StatsDisplay.vue
├── composables/
│   ├── usePlatformStats.ts
│   └── useUserStats.ts
├── layouts/
│   └── default.vue
├── pages/
│   ├── index.vue  # Landing page
│   ├── buy.vue    # Buy Bitcoin flow
│   └── earn.vue   # Earn Bitcoin flow
├── plugins/
│   └── socket.client.ts
├── server/
│   ├── api/
│   │   ├── lightning/
│   │   │   ├── index.ts        # Main Lightning functions
│   │   │   ├── invoice.ts      # Create Lightning invoice
│   │   │   ├── payment/        # Payment status checking
│   │   │   │   └── index.ts
│   │   │   ├── withdraw.ts     # Create withdrawal links
│   │   │   └── callback.ts     # Handle payment notifications
│   │   ├── orders/
│   │   │   ├── index.ts        # List & create orders
│   │   │   └── [id]/
│   │   │       ├── index.ts    # Get order details
│   │   │       ├── claim.ts    # Claim order for processing
│   │   │       ├── receipt.ts  # Upload receipt
│   │   │       ├── refund.ts   # Process refund
│   │   │       ├── approve.ts  # Approve order
│   │   │       └── status.ts   # Check order status
│   │   ├── stats/
│   │   │   └── index.ts        # Platform statistics
│   │   ├── utils/
│   │   │   ├── exchange-rate.ts # Exchange rate utility
│   │   │   ├── process-qr.ts    # QR code processing
│   │   │   └── random-insight.ts # Bitcoin insights
│   │   ├── sse/
│   │   │   ├── exchange-rate.ts
│   │   │   ├── order/
│   │   │   │   └── [id].ts
│   │   │   ├── orders.ts
│   │   │   └── stats.ts
│   │   └── ping.ts
│   ├── utils/
│   │   ├── clientTracker.ts
│   │   ├── internal-payment.ts
│   │   ├── orderUtils.ts
│   │   └── stats.ts
│   └── index.ts
├── app.vue
├── nuxt.config.ts
├── package.json
└── tailwind.config.js
```

### API Structure

The API follows RESTful principles with a resource-based organization:

#### Lightning Endpoints
- `GET/POST /api/lightning` - Main Lightning functions
- `POST /api/lightning/invoice` - Create Lightning invoice
- `GET /api/lightning/payment/:hash` - Check payment status
- `POST /api/lightning/withdraw` - Create withdraw link
- `POST /api/lightning/callback` - Handle payment notifications

#### Order Endpoints
- `GET /api/orders` - List all available orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/claim` - Claim an order
- `POST /api/orders/:id/receipt` - Upload receipt
- `POST /api/orders/:id/refund` - Process refund
- `POST /api/orders/:id/approve` - Approve receipt and complete order
- `GET /api/orders/:id/status` - Check order status with tracking token

#### Utility Endpoints
- `GET /api/utils/exchange-rate` - Get current exchange rate
- `POST /api/utils/process-qr` - Process QR code image
- `GET /api/utils/random-insight` - Get random Bitcoin insight

#### SSE Endpoints
- `GET /api/sse/stats` - Stats updates stream
- `GET /api/sse/exchange-rate` - Exchange rate updates
- `GET /api/sse/orders` - Order marketplace updates
- `GET /api/sse/order/:id` - Specific order updates

### API Integrations
1. **Lightning Network** - Use OpenLN API (LNbits integration)
2. **Exchange Rate** - Connect to a reliable crypto exchange API
3. **UPI QR Code** - Use a QR code parser library to extract UPI details

The Lightning Network implementation uses the OpenLN API standard. The specification can be found in the openln.json file. This provides a consistent interface for Lightning Network functionality including invoice creation, payment processing, and callback handling.

### Security Measures
- Implement CSRF protection
- Sanitize all user uploads
- Validate QR codes and payment receipts
- Use secure WebSocket connections
- Apply rate limiting for API endpoints

## Development Process

### Phase 1: Setup & Basic Structure
- Initialize Vue 3 project with Vite
- Setup TailwindCSS
- Create component structure
- Implement routing

### Phase 2: Core Functionality
- Build QR code upload and parsing
- Implement real-time communication
- Create Buy and Earn workflows
- Build timer functionality for Earn process

### Phase 3: Bitcoin Integration
- Connect to Lightning Network API
- Implement exchange rate calculation
- Build payment verification system

### Phase 4: Testing & Refinement
- End-to-end testing of user flows
- Performance optimization
- Security review
- UI/UX improvements

## Git Workflow

Initialize the project with:

```bash
git init
git add .
git commit -m "Initial commit: Project structure setup"
```

Ask the developer to:
1. Create a remote repository
2. Set the remote URL:
   ```bash
   git remote add origin [REPOSITORY_URL]
   ```
3. Push the initial commit:
   ```bash
   git push -u origin main
   ```

Follow these best practices:
- Commit regularly with descriptive messages
- Create feature branches for major features
- Use conventional commit format
- Never commit sensitive information

## Developer Notes

- **Ephemeral Storage**: While the application avoids permanent storage, Redis is used for temporary caching with TTL to maintain order state only for the duration of active transactions. Once a transaction is completed or expires, data is automatically purged.
- **Exchange Rate Handling**: Implement a mechanism to fetch real-time exchange rates for BTC/INR.
- **Timeout Mechanism**: Create robust timeout handling for the Earn process to ensure orders return to the marketplace if not completed.
- **Error Handling**: Build comprehensive error handling, especially for network failures during payment processing.
- **Scaling Considerations**: While starting simple, design the system to potentially handle increased load in the future.
- **Testing Real Payments**: Start with very small test amounts during development and QA.
- **Lightning Network Complexity**: Implemented using the OpenLN standard to ensure compatibility with common Lightning Network providers.

## Recommended Libraries

- **Vue 3**: Core framework
- **TailwindCSS**: Styling
- **socket.io-client**: WebSocket communication
- **qrcode-parser**: QR code processing
- **lightning-js**: Lightning Network integration
- **vueuse**: Composition API utilities
- **pinia**: State management (if needed)

## Performance Targets

- Page load time: < 2 seconds
- QR code processing: < 1 second
- Real-time updates: < 500ms latency
- Mobile-friendly interface
- Works on low-bandwidth connections

## Minimizing Complexity

- Avoid over-engineering
- Start with minimal viable features
- Use composition API for reusable logic
- Leverage browser APIs where possible
- Minimize external dependencies

# imp guidelines
- NO MOCK DATA unless its tests there must be ZERO Mock DATA in PRODUCTION CODE
-  i don't want to see api data coming from mock sources if something is not there STOP AND ASK
- Typescript must be fully adhered to Always follow good practices for typing 
- I don't want 'any' in ts files