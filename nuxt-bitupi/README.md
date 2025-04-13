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

## Technology Stack

- **Framework**: Nuxt.js 3 with Composition API
- **Styling**: TailwindCSS with dark mode support
- **State Management**: Nuxt composables
- **Server API**: Lightning Network and exchange rate endpoints

## Current Status

The project has been fully implemented with:

- Dark/light mode toggle with system preference detection
- Mobile-responsive, clean interface
- Server API endpoints for Lightning Network and exchange rates
- Complete Send and Receive payment flows
- Bitcoin and UPI educational content from satoshinotebook.com
- Simple, grounded UI for a pleb-focused tool

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