# LN2UPI - Lightning Network to UPI Payment Tool

A tool for plebs, made by plebs. Send Lightning Network payments directly to UPI accounts in India with no KYC, no accounts, and no middlemen.

## Project Overview

LN2UPI is a bridge between Bitcoin's Lightning Network and India's Unified Payments Interface (UPI), focused on simplicity and privacy:

1. **Send to UPI**: Pay any UPI ID directly with Bitcoin via Lightning Network
2. **Receive Sats**: Process UPI payments and receive payments via Lightning Network

All of this happens without requiring user accounts, KYC verification, or persistent data storage - just a simple tool that works.

## Key Features

- **No Accounts Needed**: No signups, no logins, just direct payments
- **Zero KYC**: Complete privacy by design
- **Dark Mode**: Comfortable UI for night owls and privacy-conscious users
- **Built for Plebs**: Simple, no-nonsense interface that just works
- **Lightning Fast**: Instant payments using Lightning Network and UPI
- **Mobile Optimized**: Works great on any device
- **Real-time Updates**: Live order status with WebSockets and Redis PubSub
- **Robust Caching**: Fast response times with Redis backend
- **Live Exchange Rates**: Accurate pricing with real market data

## Technology Stack

- **Frontend**: 
  - Nuxt.js 3 with Composition API
  - TailwindCSS with dark mode support
  - WebSocket client for real-time updates

- **Backend**:
  - Nuxt server routes and middleware
  - Redis for caching and PubSub
  - WebSocket server for real-time communication
  - Real exchange rate API integration
  - Lightning Network payment processor interfaces

## Development Roadmap

### Phase 1: Core UI & Concept ✅
- Dark/light mode with system preference detection
- Mobile-responsive, clean interface
- Complete user flows for sending and receiving
- "For plebs, by plebs" identity throughout
- Simple, grounded UI for a pleb-focused tool

### Phase 2: Backend Enhancement 🚧
- Redis integration for caching and PubSub
- Real-time order tracking with WebSockets
- Live exchange rate API integration
- Robust error handling and logging
- Placeholder architecture for Lightning Network integration

### Phase 3: Lightning Integration (Planned)
- Connect to real Lightning Network payment processors
- Implement LNURL and other Lightning standards
- Complete security and penetration testing
- Performance optimization for high throughput

## Getting Started

To run the project:

```bash
npm install
npm run dev
```

This will start the development server at http://localhost:3000.

## Contributing

This is a tool for plebs, by plebs. Contributions that keep it simple, focused, and privacy-oriented are welcome.

## License

This project is MIT licensed.

## Changelog

See [Changelog.md](./Changelog.md) for a detailed history of changes.