# P2P Bitcoin to UPI Exchange Platform

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
- **Frontend**: Vue 3, Vite, TailwindCSS
- **Backend**: Serverless functions
- **Real-time**: WebSockets or Server-Sent Events
- **Bitcoin**: Lightning Network API integration
- **QR Code**: Client-side QR parsing library

### Project Structure
```
bitcoin-upi-exchange/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── BuyForm.vue
│   │   ├── EarnList.vue
│   │   ├── QrCodeUploader.vue
│   │   └── ReceiptUploader.vue
│   ├── composables/
│   │   ├── useWebsocket.js
│   │   ├── useLightning.js
│   │   ├── useExchangeRate.js
│   │   └── useQrParser.js
│   ├── pages/
│   │   ├── HomePage.vue
│   │   ├── BuyPage.vue
│   │   └── EarnPage.vue
│   ├── App.vue
│   └── main.js
├── functions/  # Serverless functions
│   ├── exchange-rate.js
│   ├── lightning-invoice.js
│   └── lightning-payment.js
├── package.json
└── vite.config.js
```

### API Integrations
1. **Lightning Network** - Use LND REST API or similar service
2. **Exchange Rate** - Connect to a reliable crypto exchange API
3. **UPI QR Code** - Use a QR code parser library to extract UPI details

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

- **No Database**: This design intentionally avoids persistent storage. All state must be handled via client-side caching and real-time communication.
- **Exchange Rate Handling**: Implement a mechanism to fetch real-time exchange rates for BTC/INR.
- **Timeout Mechanism**: Create robust timeout handling for the Earn process to ensure orders return to the marketplace if not completed.
- **Error Handling**: Build comprehensive error handling, especially for network failures during payment processing.
- **Scaling Considerations**: While starting simple, design the system to potentially handle increased load in the future.
- **Testing Real Payments**: Start with very small test amounts during development and QA.
- **Lightning Network Complexity**: Allow sufficient time to properly implement and test Lightning Network integration.

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
