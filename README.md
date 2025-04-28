# LN2UPI - Bitcoin to UPI Exchange Platform

A serverless, anonymous P2P platform that facilitates Bitcoin Lightning Network payments to UPI transfers in India. The platform operates without user accounts, persistent data storage, or any KYC requirements.

## Features

- **Pay with Bitcoin to UPI**: Upload your UPI QR code and send Bitcoin via Lightning Network
- **Earn Bitcoin by Processing UPI Payments**: Help others pay with Bitcoin and earn a profit share
- **No Accounts or KYC**: Completely anonymous platform with no persistent data storage
- **Real-time Updates**: Live order status and marketplace updates
- **India-centric Design**: Built specifically for Indian users with UPI integration

## Tech Stack

- **Framework**: [Nuxt.js 3](https://nuxt.com/)
- **UI**: [TailwindCSS](https://tailwindcss.com/) with Indian-inspired color palette
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Real-time Communication**: WebSockets via [Socket.io](https://socket.io/)

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nuxt-bitupi
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
nuxt-bitupi/
├── assets/                # Static assets and CSS
│   └── css/
│       └── main.css      # TailwindCSS configuration
├── components/           # Vue components
│   ├── BitcoinLogo.vue   # Bitcoin logo SVG component
│   ├── UpiLogo.vue       # UPI logo SVG component
│   └── IndianContextTip.vue # India-specific educational tips
├── layouts/              # Page layouts
│   └── default.vue       # Default page layout with header and footer
├── pages/                # Application pages
│   ├── index.vue         # Home page
│   ├── buy.vue           # Buy Bitcoin flow
│   └── earn.vue          # Earn Bitcoin flow
├── server/               # Server API endpoints
│   └── api/
│       ├── exchange-rate.ts      # Bitcoin/INR exchange rate API
│       ├── lightning-invoice.ts  # Lightning Network invoice creation
│       └── lightning-payment.ts  # Lightning Network payment processing
├── app.vue               # Main application component
├── nuxt.config.ts        # Nuxt configuration
└── tailwind.config.js    # TailwindCSS configuration
```

## Key Workflows

### Buy Bitcoin Flow
1. User specifies INR amount
2. User uploads UPI QR code
3. System calculates equivalent Lightning Network sats + fees
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
6. When buyer approves, Earner receives Bitcoin payment + profit share

## India-Specific Design Elements

- Color scheme inspired by the Indian flag (saffron, white, green)
- Support for Hindi language toggle
- Integration with popular Indian UPI payment apps
- Educational content about Bitcoin and UPI in India

## Development

### Build for production

```bash
npm run build
# or
yarn build
```

### Preview production build

```bash
npm run preview
# or
yarn preview
```

## Security Considerations

- No persistent data storage
- All images transferred as base64
- Client-side caching for temporary state management
- Secure, ephemeral communication channels
- QR code sanitization to avoid privacy leaks
- No user accounts or KYC requirements

## License

This project is MIT licensed.