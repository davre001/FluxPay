// Configuration for FluxPay Frontend
// This file centralizes all environment-based configuration

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
    timeout: 30000, // 30 seconds
  },

  // Blockchain Configuration
  blockchain: {
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '2710'),
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://hoodi-sandbox.morphl2.io',
    chainName: 'Morph Hoodi Testnet',
  },

  // Contract Addresses
  contracts: {
    escrow: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || '',
    usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
  },

  // App Configuration
  app: {
    name: 'FluxPay',
    version: '0.1.0',
  },

  // Feature Flags
  features: {
    walletConnection: true,
    dataExport: true,
    advancedFiltering: true,
    realtimeUpdates: true,
  },

  // UI Configuration
  ui: {
    itemsPerPage: 10,
    animationDuration: 300, // ms
    toastDuration: 3000, // ms
  },

  // Pagination
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
  },

  // Form Validation
  validation: {
    minPasswordLength: 8,
    maxDescriptionLength: 5000,
    maxBudget: 1000000,
  },
}

export default config
