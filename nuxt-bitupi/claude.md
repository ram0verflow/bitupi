# P2P Bitcoin to UPI Exchange Platform - Technical Specification

## Project Overview

BitUPI is a serverless, anonymous P2P platform that facilitates Bitcoin Lightning Network payments to UPI transfers in India. The platform operates without user accounts, persistent data storage, or any KYC requirements, providing a privacy-focused and efficient exchange mechanism.

## Core Features

### Landing Page
- Simple, clean interface with two primary options: "Buy" and "Earn"
- Brief explanation of the service with India-specific context
- No login/signup required
- Indian design elements (colors, fonts, visual cues)
- Responsive design for mobile-first approach (critical for Indian market)
- Statistics display showing current exchange rates and platform metrics

### Buy Bitcoin Flow
1. User specifies INR amount (with min/max limits appropriate for Indian market)
2. User uploads UPI QR code (parse and sanitize to avoid privacy leaks)
3. System calculates equivalent Lightning Network sats + exchange fee + service fee
4. Order is created and published to the Earn marketplace
5. Buyer waits for an Earner to process payment
6. Buyer approves receipt after payment confirmation
7. Lightning Network payment is released

### Earn Bitcoin Flow
1. User sees list of incoming payment requests with INR amounts and profit potential
2. First-click-first-serve basis for claiming orders
3. Earner has limited time window to complete UPI payment (15-minute countdown)
4. Earner uploads payment receipt as proof
5. If time expires, order returns to the marketplace
6. When buyer approves, Earner receives Bitcoin payment + 50% profit share

### Real-Time Communication
- Implement with SSE/WebSockets for instantaneous updates
- No database persistence to maintain anonymity
- Use client-side caching for temporary state
- Secure communication channels
- Timeout mechanisms for orphaned transactions

## Technical Implementation

### Frontend Architecture
- Nuxt.js 3 framework with SSR capabilities
- Composition API for state management and reusable logic
- TailwindCSS with custom India-inspired theme
- SVG components for Bitcoin and UPI branding
- Hindi language support with appropriate font selection
- Custom components for educational content and India-specific context

### Server API Endpoints
- `/api/exchange-rate`: Provides real-time BTC/INR exchange rates
- `/api/lightning-invoice`: Generates Lightning Network invoices
- `/api/lightning-payment`: Processes Lightning Network payments
- Serverless function approach for scalability
- No persistent database connections

### Data Flow
- All images transferred as base64 to avoid storage requirements
- No permanent storage of user data
- Client-side caching for temporary state management
- Secure, ephemeral communication channels
- QR code processing with privacy safeguards

## Implementation Details

### Tech Stack
- **Framework**: Nuxt.js 3
- **UI Library**: TailwindCSS with custom theme
- **State Management**: Pinia + Nuxt composables
- **Real-time**: Socket.io client
- **Bitcoin**: Lightning Network API integration (simulated for demo)
- **QR Code**: Client-side QR parsing library

### Project Structure
```
bitupi/
├── assets/
│   └── css/
│       └── main.css         # TailwindCSS configuration
├── components/
│   ├── BitcoinLogo.vue      # SVG logo for Bitcoin
│   ├── UpiLogo.vue          # SVG logo for UPI
│   └── IndianContextTip.vue # Educational component
├── layouts/
│   └── default.vue          # Main layout with header/footer
├── pages/
│   ├── index.vue            # Landing page
│   ├── buy.vue              # Buy Bitcoin flow
│   └── earn.vue             # Earn Bitcoin flow
├── server/
│   └── api/
│       ├── exchange-rate.ts      # Exchange rate API
│       ├── lightning-invoice.ts  # Lightning invoice generation
│       └── lightning-payment.ts  # Lightning payment processing
├── app.vue                  # Root app component
├── nuxt.config.ts           # Nuxt configuration
└── tailwind.config.js       # TailwindCSS theme
```

### Color Scheme
The application uses a color scheme inspired by Indian cultural elements:
- `india-saffron`: #FF9933 (From Indian flag)
- `india-green`: #138808 (From Indian flag)
- `india-blue`: #000080 (Navy blue from the Ashoka Chakra)
- `upi-green`: #097140 (UPI brand color)
- `upi-purple`: #734999 (Secondary UPI brand color)
- `bitcoin-orange`: #F7931A (Bitcoin brand color)
- `bitcoin-blue`: #0D3578 (Secondary Bitcoin color)

### User Flows

#### Buy Bitcoin Flow:
1. Enter INR amount (with validation for min/max limits)
2. Upload UPI QR code (with preview and validation)
3. Review order details (amount, fees, exchange rate)
4. Create order and wait for processing
5. Confirm receipt and release Bitcoin payment

#### Earn Bitcoin Flow:
1. Browse available orders (showing amounts, profit potential)
2. Select an order to process
3. Complete UPI payment within time limit (countdown timer)
4. Upload payment receipt for verification
5. Receive Bitcoin payment when buyer confirms

## Security Considerations

- **No KYC**: The platform operates without collecting personal information
- **No Data Storage**: All state is ephemeral and client-side
- **QR Code Security**: Sanitization of uploaded QR codes to prevent data leakage
- **Payment Verification**: Robust receipt verification system
- **Timeout Mechanism**: Orders expire if not processed within time limit
- **Secure Communication**: Encrypted channels for all data transfer

## Indian Market Adaptation

- **UPI Integration**: Seamless connection to India's primary digital payment system
- **Hindi Language Support**: Toggle between English and Hindi
- **Cultural Design Elements**: Colors and visuals familiar to Indian users
- **Popular Payment Apps**: Recognition of common Indian payment solutions
- **Educational Content**: India-specific facts about Bitcoin and UPI
- **Mobile Optimization**: Designed for India's mobile-first internet landscape

## Development Process

### Phase 1: Basic Setup & Structure ✓
- Initialize Nuxt.js project
- Configure TailwindCSS with custom theme
- Create component structure
- Implement basic routing

### Phase 2: Core Functionality ✓
- Build QR code upload and parsing simulation
- Implement buy and earn workflows
- Create UI components with Indian context
- Build timer functionality for Earn process

### Phase 3: API Integration ✓
- Develop exchange rate API endpoint
- Implement Lightning Network simulation
- Build payment verification system
- Connect client and server functionality

### Phase 4: Testing & Refinement
- End-to-end testing of user flows
- Performance optimization
- Security review
- UI/UX improvements

## Performance Targets

- Page load time: < 2 seconds
- QR code processing: < 1 second
- Real-time updates: < 500ms latency
- Mobile-friendly interface
- Works on low-bandwidth connections (common in parts of India)

## Challenges & Solutions

- **Lightning Network Complexity**: Simplified API approach with future expansion capability
- **Exchange Rate Fluctuations**: Real-time tracking with market data
- **Order Expiration**: Robust timeout system to prevent orphaned transactions
- **Receipt Verification**: Two-step verification process with buyer confirmation
- **UPI Security**: QR code sanitization to prevent data leakage

## Future Enhancements

- Real Lightning Network integration (currently simulated)
- Additional Indian payment methods beyond UPI
- Enhanced localization for regional Indian languages
- Mobile app conversion with Progressive Web App features
- Advanced marketplace features (reputation system, order categorization)
- Integration with popular Indian Bitcoin wallets