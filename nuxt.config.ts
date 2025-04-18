// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],
  
  router: {
    options: {
      strict: false
    },
  },
  

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
    exposeConfig: false,
    injectPosition: 0,
    viewer: true,
  },

  app: {
    head: {
      title: 'LN2UPI - Lightning Payments to UPI',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Send Lightning Network payments directly to UPI accounts in India. No KYC, no accounts, just payments.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono&display=swap' }
      ]
    }
  },

  components: true,

  // Server side
  nitro: {
    plugins: ['~/server/index.ts'],
    middleware: ['~/server/middleware/route-middleware']
  },

  // API routes
  serverHandlers: [
    {
      route: '/api/exchange-rate',
      handler: '~/server/api/exchange-rate.ts'
    },
    {
      route: '/api/lightning-invoice',
      handler: '~/server/api/lightning-invoice.ts'
    },
    {
      route: '/api/lightning-payment',
      handler: '~/server/api/lightning-payment.ts'
    },
    {
      route: '/api/process-qr',
      handler: '~/server/api/process-qr.ts'
    },
    {
      route: '/api/create-order',
      handler: '~/server/api/create-order.ts'
    },
    {
      route: '/api/orders',
      handler: '~/server/api/orders.ts'
    },
    {
      route: '/api/orders/:id/claim',
      handler: '~/server/api/orders/[id]/claim.ts'
    },
    {
      route: '/api/orders/:id/receipt',
      handler: '~/server/api/orders/[id]/receipt.ts'
    },
    {
      route: '/api/random-insight',
      handler: '~/server/api/random-insight.ts'
    },
    {
      route: '/api/ping',
      handler: '~/server/api/ping.ts'
    },
    {
      route: '/api/sse/exchange-rate',
      handler: '~/server/api/sse/exchange-rate.ts'
    },
    {
      route: '/api/sse/stats',
      handler: '~/server/api/sse/stats.ts'
    },
    {
      route: '/api/sse/orders',
      handler: '~/server/api/sse/orders.ts'
    },
    {
      route: '/api/sse/order/:id',
      handler: '~/server/api/sse/order/[id].ts'
    }
  ],

  // Runtime config (environment variables)
  runtimeConfig: {
    // Server-only variables
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: process.env.REDIS_PORT || 6379,
    redisPassword: process.env.REDIS_PASSWORD || '',

    // Variables also exposed to the client
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',

      // Feature flags
      enableRealExchangeRates: process.env.ENABLE_REAL_EXCHANGE_RATES === 'true' || false,
      enablePubSub: process.env.ENABLE_PUBSUB === 'true' || true,
    }
  },

  compatibilityDate: '2025-04-14'
})