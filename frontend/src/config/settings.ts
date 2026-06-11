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
  // The active chain is multichain and resolved at runtime from the connected
  // wallet (Web3Auth dashboard chains). These are only fallback defaults.
  blockchain: {
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1'),
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://eth.merkle.io',
    chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Ethereum',
    explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://etherscan.io',
  },

  // Contract Addresses
  contracts: {
    usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x2CeF50c5C6059F43180b1d91EFA354A9A837AdE1',
    escrowFactory: process.env.NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS || '0x58B92620Ce2Fa3dD61f0143Ea4f1bbF961130856',
  },

  // Token Configuration
  tokens: {
    usdc: {
      decimals: 6,
      symbol: 'USDC',
    },
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
